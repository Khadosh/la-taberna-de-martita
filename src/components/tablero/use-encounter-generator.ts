import { useState, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { dndApi } from '../../lib/dnd-api'
import {
  generateRowsFromArchetype,
  generateLoot,
  calculateXpThresholds,
  calcAdjustedXp,
  xpMultiplier,
  xpAtLevel,
  hpAtLevel,
  unitsFromRows,
  uid,
  LOOT_ITEM_OPTIONS,
  type Difficulty,
  type CreatureRow,
  type Loot,
  type LootItemEntry,
  type MonsterIndexEntry,
} from '../../lib/encounter-generator'
import { ENVIRONMENTS, type Archetype } from '../../data/encounter-archetypes'
import type { Role } from '../../data/encounter-archetypes'
import type { Character } from './tablero-types'
import type { MonsterSummary } from '../../lib/dnd-api'
import { getArchetypesWithLoot } from '../../loot/profiles/index'
import { rollLoot, type LootResult } from '../../loot/roll'

import monsterIndexRaw from '../../data/monster-index.json'

const MONSTER_INDEX = monsterIndexRaw as MonsterIndexEntry[]
const DRAFT_KEY = 'encounter-draft-v4'
const ARCHETYPES = getArchetypesWithLoot()

type Draft = {
  archetypeIds: string[]
  selectedEnv: string | null
  difficulty: Difficulty
  rows: CreatureRow[]
  loot: Loot
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const DEFAULT_LOOT: Loot = { currency: { gp: 0, sp: 0, cp: 0 }, items: [] }

function lootResultsToLoot(results: LootResult[]): Loot {
  const gp = results.reduce((s, r) => s + r.gold, 0)
  const merged: Record<string, number> = {}
  for (const { items } of results) {
    for (const { item, quantity } of items) {
      merged[item.name] = (merged[item.name] ?? 0) + quantity
    }
  }
  return {
    currency: { gp, sp: 0, cp: 0 },
    items: Object.entries(merged).map(([name, qty]) => ({ id: uid(), name, qty })),
  }
}

function rollArchetypeLoot(archetypes: Archetype[], partyLevel: number): Loot {
  const withLoot = archetypes.filter(a => a.loot)
  if (withLoot.length === 0) return generateLoot([])
  return lootResultsToLoot(withLoot.map(a => rollLoot(a, { partyLevel })))
}

export { ARCHETYPES, ENVIRONMENTS, LOOT_ITEM_OPTIONS, MONSTER_INDEX, xpAtLevel, hpAtLevel }
export type { Archetype }

export function useEncounterGenerator(params: {
  characters: Character[]
  campaignId: string
  addNpcFromMonster: (summary: MonsterSummary, count: number, opts?: { role?: string; portraitUrl?: string; level?: number; customSpells?: string[] }) => Promise<void>
}) {
  const { characters, campaignId, addNpcFromMonster } = params

  const saved = loadDraft()
  const defaultEnv = ENVIRONMENTS[0] ?? null

  const [showEncounterGenerator, setShowEncounterGenerator] = useState(false)
  const [selectedEnv, setSelectedEnv] = useState<string>(saved?.selectedEnv ?? defaultEnv ?? '')
  const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<string[]>(
    saved?.archetypeIds ?? (ARCHETYPES[0]?.id ? [ARCHETYPES[0].id] : [])
  )
  const [difficulty, setDifficulty] = useState<Difficulty>(saved?.difficulty ?? 'medium')
  const [rows, setRows] = useState<CreatureRow[]>(saved?.rows ?? [])
  const [loot, setLoot] = useState<Loot>(saved?.loot ?? DEFAULT_LOOT)
  const [noResults, setNoResults] = useState(false)
  const [isSpawning, setIsSpawning] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Ref to avoid stale closure in the details-fetch
  const detailsFetchedRef = useRef<Set<string>>(new Set())

  const saveDraft = useCallback((update: Partial<Draft>) => {
    try {
      const current = loadDraft() ?? {}
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...update }))
    } catch { /* quota exceeded */ }
  }, [])

  const openEncounterGenerator = useCallback(() => {
    setShowEncounterGenerator(true)
    setNoResults(false)
  }, [])

  const closeEncounterGenerator = useCallback(() => {
    setShowEncounterGenerator(false)
  }, [])

  const fetchDetailsForRows = useCallback((newRows: CreatureRow[]) => {
    const missing = newRows
      .map(r => r.monsterIndex)
      .filter((idx, i, arr) => arr.indexOf(idx) === i) // unique
      .filter(idx => !detailsFetchedRef.current.has(idx))

    if (missing.length === 0) return

    missing.forEach(idx => detailsFetchedRef.current.add(idx))
    setLoadingDetails(true)

    Promise.all(missing.map(idx => dndApi.monster(idx)))
      .then(details => {
        setRows(prev => prev.map(row => {
          const d = details.find(x => x.index === row.monsterIndex)
          if (!d) return row
          const mainAction = d.actions?.find(a => a.attack_bonus != null && a.damage?.length)
          const speedStr = Object.entries(d.speed ?? {})
            .map(([k, v]) => k === 'walk' ? v : `${k} ${v}`)
            .join(', ')
          return {
            ...row,
            hp: d.hit_points,
            hitDice: d.hit_points_roll,
            damageStr: mainAction?.damage?.[0]?.damage_dice ?? '—',
            str: d.strength, dex: d.dexterity, con: d.constitution,
            int: d.intelligence, wis: d.wisdom, cha: d.charisma,
            speed: speedStr || undefined,
            specialAbilities: d.special_abilities?.map(sa => ({ name: sa.name, desc: sa.desc })) ?? [],
          }
        }))
      })
      .catch(() => { /* show without API details */ })
      .finally(() => setLoadingDetails(false))
  }, [])

  const generateNew = useCallback(() => {
    setNoResults(false)
    const selectedArchetypes = ARCHETYPES.filter(a => selectedArchetypeIds.includes(a.id))
    if (selectedArchetypes.length === 0) { setNoResults(true); return }

    const combinedPool = selectedArchetypes.flatMap(a => a.pool)
    const levelRanges = selectedArchetypes.map(a => a.levelRange)
    const syntheticArchetype: Archetype = {
      id: 'combined',
      name: selectedArchetypes.map(a => a.name).join(' + '),
      environment: selectedArchetypes[0].environment,
      levelRange: [Math.min(...levelRanges.map(r => r[0])), Math.max(...levelRanges.map(r => r[1]))],
      pool: combinedPool,
    }

    const result = generateRowsFromArchetype({
      archetype: syntheticArchetype,
      monsterIndex: MONSTER_INDEX,
      difficulty,
      characters,
    })

    if (!result) {
      setNoResults(true)
      setRows([])
      setLoot(DEFAULT_LOOT)
      saveDraft({ archetypeIds: selectedArchetypeIds, difficulty, rows: [], loot: DEFAULT_LOOT })
      return
    }

    const avgLevel = characters.length
      ? Math.round(characters.reduce((s, c) => s + c.level, 0) / characters.length)
      : 1
    const rolledLoot = rollArchetypeLoot(selectedArchetypes, avgLevel)

    setRows(result.rows)
    setLoot(rolledLoot)
    saveDraft({ archetypeIds: selectedArchetypeIds, selectedEnv, difficulty, rows: result.rows, loot: rolledLoot })

    // Clear cache for these indices so re-generation always fetches fresh stats
    result.rows.forEach(r => detailsFetchedRef.current.delete(r.monsterIndex))
    fetchDetailsForRows(result.rows)
  }, [selectedArchetypeIds, difficulty, characters, selectedEnv, saveDraft, fetchDetailsForRows])

  const updateRowCount = useCallback((rowId: string, role: Role, delta: number) => {
    setRows(prev => {
      const next = prev.map(row =>
        row.id !== rowId ? row : {
          ...row,
          counts: { ...row.counts, [role]: Math.max(0, row.counts[role] + delta) },
        }
      )
      saveDraft({ rows: next })
      return next
    })
  }, [saveDraft])

  const removeRow = useCallback((rowId: string) => {
    setRows(prev => {
      const next = prev.filter(r => r.id !== rowId)
      saveDraft({ rows: next })
      return next
    })
  }, [saveDraft])

  const updateCurrency = useCallback((patch: Partial<Loot['currency']>) => {
    setLoot(prev => {
      const next = { ...prev, currency: { ...prev.currency, ...patch } }
      saveDraft({ loot: next })
      return next
    })
  }, [saveDraft])

  const updateItemQty = useCallback((id: string, qty: number) => {
    setLoot(prev => {
      const next = { ...prev, items: prev.items.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i) }
      saveDraft({ loot: next })
      return next
    })
  }, [saveDraft])

  const updateItemName = useCallback((id: string, name: string) => {
    setLoot(prev => {
      const next = { ...prev, items: prev.items.map(i => i.id === id ? { ...i, name } : i) }
      saveDraft({ loot: next })
      return next
    })
  }, [saveDraft])

  const removeItem = useCallback((id: string) => {
    setLoot(prev => {
      const next = { ...prev, items: prev.items.filter(i => i.id !== id) }
      saveDraft({ loot: next })
      return next
    })
  }, [saveDraft])

  const addItem = useCallback(() => {
    setLoot(prev => {
      const next: Loot = {
        ...prev,
        items: [...prev.items, { id: uid(), name: LOOT_ITEM_OPTIONS[0], qty: 1 } as LootItemEntry],
      }
      saveDraft({ loot: next })
      return next
    })
  }, [saveDraft])

  const regenerateLoot = useCallback(() => {
    const selectedArchetypes = ARCHETYPES.filter(a => selectedArchetypeIds.includes(a.id))
    const partyLevel = characters.length
      ? Math.round(characters.reduce((s, c) => s + c.level, 0) / characters.length)
      : 1
    const next = rollArchetypeLoot(selectedArchetypes, partyLevel)
    setLoot(next)
    saveDraft({ loot: next })
  }, [rows, selectedArchetypeIds, characters, saveDraft])

  const updateRowLevel = useCallback((rowId: string, delta: number) => {
    setRows(prev => {
      const next = prev.map(row =>
        row.id !== rowId ? row : { ...row, level: Math.max(1, Math.min(20, (row.level ?? 1) + delta)) }
      )
      saveDraft({ rows: next })
      return next
    })
  }, [saveDraft])

  const updateUnitLevel = useCallback((rowId: string, role: string, unitIdx: number, delta: number) => {
    setRows(prev => {
      const next = prev.map(row => {
        if (row.id !== rowId) return row
        const key = `${role}-${unitIdx}`
        const current = row.unitLevels?.[key] ?? row.level ?? 1
        const newLevel = Math.max(1, Math.min(20, current + delta))
        return { ...row, unitLevels: { ...row.unitLevels, [key]: newLevel } }
      })
      saveDraft({ rows: next })
      return next
    })
  }, [saveDraft])

  const updateRowField = useCallback((rowId: string, patch: Partial<CreatureRow>) => {
    setRows(prev => {
      const next = prev.map(row => row.id !== rowId ? row : { ...row, ...patch })
      saveDraft({ rows: next })
      return next
    })
  }, [saveDraft])

  const addManualRow = useCallback((monsterIdx: string) => {
    const m = MONSTER_INDEX.find(x => x.index === monsterIdx)
    if (!m) return
    const newRow: CreatureRow = {
      id: uid(),
      monsterIndex: m.index,
      name: m.name,
      cr: m.cr,
      xp: m.xp,
      ac: m.ac,
      attackBonus: m.attackBonus,
      level: 1,
      counts: { melee: 1, ranged: 0, magic: 0, support: 0 },
    }
    setRows(prev => {
      const next = [...prev, newRow]
      saveDraft({ rows: next })
      return next
    })
    fetchDetailsForRows([newRow])
  }, [saveDraft, fetchDetailsForRows])

  const clearDraft = useCallback(() => {
    setRows([])
    setLoot(DEFAULT_LOOT)
    localStorage.removeItem(DRAFT_KEY)
  }, [])

  const spawnEncounter = useCallback(async () => {
    const units = unitsFromRows(rows)
    if (units.length === 0) return
    setIsSpawning(true)
    try {
      const uniqueIndexes = [...new Set(units.map(u => u.monsterIndex))]
      const details = await Promise.all(uniqueIndexes.map(idx => dndApi.monster(idx)))
      const detailMap = new Map(details.map(d => [d.index, d]))

      for (const unit of units) {
        const detail = detailMap.get(unit.monsterIndex)
        if (!detail) continue
        const summary: MonsterSummary = { index: detail.index, name: detail.name }
        const portraitUrl = `https://www.dnd5eapi.co/api/2014/images/monsters/${unit.monsterIndex}.png`
        await addNpcFromMonster(summary, 1, { role: unit.role, portraitUrl, level: unit.level, customSpells: unit.customSpells })
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const selectedArchetypes = ARCHETYPES.filter(a => selectedArchetypeIds.includes(a.id))
        const archetypeName = selectedArchetypes.length > 0 ? selectedArchetypes.map(a => a.name).join(' + ') : 'Encuentro'
        const diffLabel: Record<Difficulty, string> = {
          easy: 'Fácil', medium: 'Medio', hard: 'Difícil', deadly: 'Mortal',
        }
        const adjustedXp = calcAdjustedXp(units)
        const totalXp = units.reduce((s, u) => s + u.xp, 0)

        const grouped = units.reduce<Record<string, number>>((acc, u) => {
          acc[u.name] = (acc[u.name] ?? 0) + 1
          return acc
        }, {})
        const monsterLines = Object.entries(grouped)
          .map(([name, count]) => `- ${count > 1 ? `${count}× ` : ''}${name}`)
          .join('\n')

        const { gp, sp, cp } = loot.currency
        const currencyStr = [
          gp > 0 ? `${gp} po` : null,
          sp > 0 ? `${sp} pp` : null,
          cp > 0 ? `${cp} pc` : null,
        ].filter(Boolean).join(', ')
        const itemsStr = loot.items.map(i => `${i.qty > 1 ? `${i.qty}× ` : ''}${i.name}`).join(', ')
        const lootStr = [currencyStr, itemsStr].filter(Boolean).join(' · ') || 'ninguno'

        await supabase.from('session_notes').insert({
          campaign_id: campaignId,
          author_id: user.id,
          title: `Encuentro: ${archetypeName} — ${diffLabel[difficulty]}`,
          body: `**Monstruos (${totalXp} XP base, ${adjustedXp} XP ajustado × ${xpMultiplier(units.length)})**\n${monsterLines}\n\n**Botín:** ${lootStr}`,
          is_private: false,
        } as never)
      }

      clearDraft()
      closeEncounterGenerator()
    } finally {
      setIsSpawning(false)
    }
  }, [rows, loot, difficulty, selectedArchetypeIds, addNpcFromMonster, campaignId, clearDraft, closeEncounterGenerator])

  const units = unitsFromRows(rows)
  const thresholds = calculateXpThresholds(characters)
  const adjustedXp = calcAdjustedXp(units)

  const avgLevel = characters.length
    ? Math.round(characters.reduce((s, c) => s + c.level, 0) / characters.length)
    : 1

  const availableArchetypes = ARCHETYPES.filter(a =>
    a.levelRange[0] <= avgLevel + 1 && a.levelRange[1] >= avgLevel - 1
  )

  const archetypesForEnv = availableArchetypes.filter(a => a.environment === selectedEnv)

  const handleSetSelectedEnv = useCallback((env: string) => {
    setSelectedEnv(env)
    const first = ARCHETYPES.find(a => a.environment === env)
    const ids = first ? [first.id] : []
    setSelectedArchetypeIds(ids)
    saveDraft({ selectedEnv: env, archetypeIds: ids })
  }, [saveDraft])

  const handleSetSelectedArchetypeIds = useCallback((ids: string[]) => {
    setSelectedArchetypeIds(ids)
    saveDraft({ archetypeIds: ids })
  }, [saveDraft])

  return {
    showEncounterGenerator,
    selectedEnv,
    setSelectedEnv: handleSetSelectedEnv,
    selectedArchetypeIds,
    setSelectedArchetypeIds: handleSetSelectedArchetypeIds,
    difficulty,
    setDifficulty: (d: Difficulty) => {
      setDifficulty(d)
      saveDraft({ difficulty: d })
    },
    rows,
    loot,
    units,
    noResults,
    isSpawning,
    loadingDetails,
    adjustedXp,
    thresholds,
    availableArchetypes,
    archetypesForEnv,
    openEncounterGenerator,
    closeEncounterGenerator,
    generateNew,
    updateRowCount,
    updateRowLevel,
    updateUnitLevel,
    updateRowField,
    removeRow,
    addManualRow,
    updateCurrency,
    updateItemQty,
    updateItemName,
    removeItem,
    addItem,
    regenerateLoot,
    clearDraft,
    spawnEncounter,
  }
}
