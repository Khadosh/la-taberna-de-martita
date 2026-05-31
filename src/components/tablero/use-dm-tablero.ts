import { useMemo, useRef, useState, useCallback } from 'react'
import { dndApi } from '../../lib/dnd-api'
import type { MonsterSummary } from '../../lib/dnd-api'
import { supabase } from '../../lib/supabase'
import {
  type Npc, type Combatant, type LogEntry,
  maxHpFor, currentHpFor, getInitiative,
} from './tablero-types'
import { useNpcForm } from './use-npc-form'
import { useBoardMaps } from './use-board-maps'
import { getMonsterSpells } from '../../data/monster-spells'
import {
  upsertTokenToBoard, removeTokenFromBoard, syncTokenPosition,
  syncNpcHp, syncTokenVisibility,
} from './tablero-board-utils'
import { useTableroData } from './use-tablero-data'
import { useCombatBroadcast } from './use-combat-broadcast'

export function useDmTablero(campaignId: string) {
  const npcInputRef = useRef<HTMLInputElement>(null)
  const npcForm = useNpcForm()
  const boardMaps = useBoardMaps(campaignId)

  const {
    queryClient, characters, monsterList, campaignNpcs,
    boardTokens, setBoardTokens, externalPositions,
    localHp, patchCharacter, adjustCharacterHp, adjustBoardNpcHp,
  } = useTableroData(campaignId)

  // ── Combat state ──────────────────────────────────────────────────────────

  const [combatActive, setCombatActive] = useState(false)
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [npcInput, setNpcInput] = useState('')

  // ── UI state ──────────────────────────────────────────────────────────────

  const [showBestiary, setShowBestiary] = useState(false)
  const [bestiarySearch, setBestiarySearch] = useState('')
  const [bestiaryQty, setBestiaryQty] = useState(1)
  const [addingMonster, setAddingMonster] = useState(false)
  const [showCampaignNpcs, setShowCampaignNpcs] = useState(false)
  const [campaignNpcSearch, setCampaignNpcSearch] = useState('')
  const [editingHp, setEditingHp] = useState<string | null>(null)
  const [conditionPickerFor, setConditionPickerFor] = useState<string | null>(null)
  const [showLongRestConfirm, setShowLongRestConfirm] = useState(false)
  const [showNpcBar, setShowNpcBar] = useState(false)
  const [combatLog, setCombatLog] = useState<LogEntry[]>([])
  const [showLog, setShowLog] = useState(true)
  const [externalTargeting, setExternalTargeting] = useState<any>(null)

  // ── Filtered lists (depend on local UI state) ─────────────────────────────

  const filteredMonsters = useMemo(() => {
    const q = bestiarySearch.trim().toLowerCase()
    if (!q) return []
    return monsterList.filter(m => m.name.toLowerCase().includes(q)).slice(0, 10)
  }, [monsterList, bestiarySearch])

  const filteredCampaignNpcs = useMemo(() => {
    const q = campaignNpcSearch.trim().toLowerCase()
    if (!q) return campaignNpcs
    return campaignNpcs.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.role.toLowerCase().includes(q) ||
      (n.race ?? '').toLowerCase().includes(q)
    )
  }, [campaignNpcs, campaignNpcSearch])

  // ── Token board helpers ───────────────────────────────────────────────────

  const onTokenMoved = (entityId: string, x: number, y: number) =>
    syncTokenPosition(campaignId, entityId, x, y)

  const setNpcHidden = (id: string, hidden: boolean) => {
    setCombatants(prev =>
      prev.map(c => c.kind === 'npc' && c.npc.id === id ? { ...c, npc: { ...c.npc, isHidden: hidden } } : c)
    )
    setBoardTokens(prev => prev.map(bt => bt.entity_id === id ? { ...bt, hidden } : bt))
    syncTokenVisibility(campaignId, id, hidden)
  }

  const toggleNpcHidden = (id: string) => {
    const npcCombatant = combatants.find(c => c.kind === 'npc' && (c as any).npc.id === id) as { kind: 'npc'; npc: Npc } | undefined
    const boardToken = boardTokens.find(bt => bt.entity_id === id)
    setNpcHidden(id, !(npcCombatant?.npc.isHidden ?? boardToken?.hidden ?? false))
  }

  // ── Combat ───────────────────────────────────────────────────────────────

  const startCombat = async () => {
    const list: Combatant[] = []
    for (const c of characters) {
      const dexMod = Math.floor(((c.stats.dex ?? 10) - 10) / 2)
      list.push({ kind: 'player', characterId: c.id, initiative: Math.ceil(Math.random() * 20) + dexMod })
      await upsertTokenToBoard(campaignId, {
        id: c.id, name: c.name, kind: 'player',
        currentHp: localHp[c.id] ?? currentHpFor(c),
        maxHp: maxHpFor(c), portraitUrl: c.portrait_url ?? null, isActive: false,
      })
    }
    for (const bt of boardTokens.filter(bt => bt.kind === 'npc')) {
      const existing = combatants.find(c => c.kind === 'npc' && (c as { kind: 'npc'; npc: Npc }).npc.id === bt.entity_id) as { kind: 'npc'; npc: Npc } | undefined
      list.push({
        kind: 'npc',
        npc: {
          id: bt.entity_id, name: bt.label,
          currentHp: bt.current_hp ?? 10, maxHp: bt.max_hp ?? 10,
          initiative: Math.ceil(Math.random() * 20),
          portraitUrl: bt.portrait_url ?? existing?.npc.portraitUrl,
          role: existing?.npc.role,
          level: (bt as any).npc_level ?? existing?.npc.level,
        }
      })
    }
    list.sort((a, b) => getInitiative(b) - getInitiative(a))
    setCombatants(list)
    setCurrentTurn(0)
    setCombatActive(true)
    setTimeout(() => npcInputRef.current?.focus(), 100)
  }

  const endCombat = async () => {
    setCombatActive(false)
    setCombatants([])
    setCurrentTurn(0)
  }

  const nextTurn = () => setCombatants(prev => {
    if (prev.length > 0) setCurrentTurn(t => (t + 1) % prev.length)
    return prev
  })

  const addNpc = async () => {
    const raw = npcInput.trim()
    if (!raw) return
    const match = raw.match(/^(.+?)\s+(\d+)$/)
    const name = match ? match[1] : raw
    const hp = match ? parseInt(match[2]) : 10
    const npc: Npc = { id: crypto.randomUUID(), name, currentHp: hp, maxHp: hp, initiative: Math.ceil(Math.random() * 20) }
    if (combatActive) {
      setCombatants(prev => {
        const list = [...prev, { kind: 'npc' as const, npc }]
        list.sort((a, b) => getInitiative(b) - getInitiative(a))
        return list
      })
    }
    setNpcInput('')
    npcInputRef.current?.focus()
    await upsertTokenToBoard(campaignId, { id: npc.id, name: npc.name, kind: 'npc', currentHp: npc.currentHp, maxHp: npc.maxHp, portraitUrl: null, isActive: false })
  }

  const updateNpc = (id: string, patch: Partial<Npc>) => {
    setCombatants(prev =>
      prev.map(c => c.kind === 'npc' && c.npc.id === id ? { ...c, npc: { ...c.npc, ...patch } } : c)
    )
    if (patch.currentHp !== undefined) syncNpcHp(campaignId, id, patch.currentHp)
  }

  const removeNpc = async (id: string) => {
    setCombatants(prev => {
      const next = prev.filter(c => !(c.kind === 'npc' && c.npc.id === id))
      setCurrentTurn(t => Math.min(t, Math.max(0, next.length - 1)))
      return next
    })
    await removeTokenFromBoard(campaignId, id)
  }

  const addNpcFromMonster = async (summary: MonsterSummary, count: number, opts?: { role?: string; portraitUrl?: string; level?: number; customSpells?: string[]; spawnGroup?: string; archetypeLabel?: string }) => {
    setAddingMonster(true)
    try {
      const monster = await dndApi.monster(summary.index)
      const dexMod = Math.floor(((monster.dexterity ?? 10) - 10) / 2)
      const ac = monster.armor_class[0]?.value
      const scaledHp = Math.floor(monster.hit_points * Math.max(1, opts?.level ?? 1))
      const defaultSpells = opts?.customSpells ?? getMonsterSpells(summary.index)
      const newCombatants: Combatant[] = Array.from({ length: count }, (_, i) => {
        const npc: Npc = {
          id: crypto.randomUUID(),
          name: count > 1 ? `${monster.name} ${i + 1}` : monster.name,
          currentHp: scaledHp, maxHp: scaledHp,
          initiative: Math.ceil(Math.random() * 20) + dexMod,
          ac, cr: monster.challenge_rating,
          role: opts?.role, portraitUrl: opts?.portraitUrl, level: opts?.level,
          spells: defaultSpells.length > 0 ? defaultSpells : undefined,
        }
        return { kind: 'npc' as const, npc }
      })
      if (combatActive) {
        setCombatants(prev => {
          const list = [...prev, ...newCombatants]
          list.sort((a, b) => getInitiative(b) - getInitiative(a))
          return list
        })
      }
      for (const c of newCombatants) {
        if (c.kind === 'npc') {
          await upsertTokenToBoard(campaignId, { id: c.npc.id, name: c.npc.name, kind: 'npc', currentHp: c.npc.currentHp, maxHp: c.npc.maxHp, portraitUrl: c.npc.portraitUrl ?? null, npcLevel: c.npc.level, isActive: false, spawnGroup: opts?.spawnGroup, archetypeLabel: opts?.archetypeLabel })
        }
      }
      setShowBestiary(false)
      setBestiarySearch('')
      setBestiaryQty(1)
    } finally {
      setAddingMonster(false)
    }
  }

  const addNpcFromCampaign = async (cn: typeof campaignNpcs[number]) => {
    const stats = (cn.stats as Record<string, number> | null) ?? { dex: 10 }
    const dexMod = Math.floor(((stats.dex ?? 10) - 10) / 2)
    const hp = cn.current_hp ?? cn.max_hp ?? 10
    const maxHp = cn.max_hp ?? hp
    const existing = boardTokens.filter(bt => bt.kind === 'npc' && bt.label.replace(/ \d+$/, '') === cn.name).length
    const suffix = existing > 0 ? ` ${existing + 1}` : ''
    const loot = ((cn.sheet_json as { loot?: any[] } | null)?.loot) ?? []
    const spells = ((cn.sheet_json as { spells?: string[] } | null)?.spells) ?? []
    const weapons = ((cn.sheet_json as { weapons?: { name: string; damage: string }[] } | null)?.weapons) ?? []
    const equipmentNotes = ((cn.sheet_json as { equipment_notes?: string } | null)?.equipment_notes) ?? ''
    const npc: Npc = {
      id: crypto.randomUUID(), name: `${cn.name}${suffix}`,
      currentHp: hp, maxHp,
      initiative: Math.ceil(Math.random() * 20) + dexMod,
      ac: cn.armor_class ?? undefined, attackBonus: cn.attack_bonus ?? undefined,
      damage: cn.damage ?? undefined, npcType: cn.race ?? undefined,
      loot, spells, weapons, equipmentNotes,
    }
    if (combatActive) {
      setCombatants(prev => {
        const list = [...prev, { kind: 'npc' as const, npc }]
        list.sort((a, b) => getInitiative(b) - getInitiative(a))
        return list
      })
    }
    await upsertTokenToBoard(campaignId, { id: npc.id, name: npc.name, kind: 'npc', currentHp: npc.currentHp, maxHp: npc.maxHp, portraitUrl: null, isActive: false })
  }

  const createCustomNpc = async () => {
    const { npcFormName, npcFormHp, npcFormAc, npcFormAttack, npcFormDamage, npcFormType, npcFormItems, npcFormSpells, npcFormWeapons, npcFormEquipment, resetNpcForm } = npcForm
    if (!npcFormName.trim() || npcFormHp < 1) return
    const npc: Npc = {
      id: crypto.randomUUID(), name: npcFormName.trim(),
      currentHp: npcFormHp, maxHp: npcFormHp,
      initiative: Math.ceil(Math.random() * 20),
      ac: npcFormAc, attackBonus: npcFormAttack,
      damage: npcFormDamage.trim() || undefined,
      npcType: npcFormType,
      loot: npcFormItems.filter(i => i.name.trim()),
      spells: npcFormSpells,
      weapons: npcFormWeapons.filter(w => w.name.trim()),
      equipmentNotes: npcFormEquipment,
    }
    if (combatActive) {
      setCombatants(prev => {
        const list = [...prev, { kind: 'npc' as const, npc }]
        list.sort((a, b) => getInitiative(b) - getInitiative(a))
        return list
      })
    }
    await upsertTokenToBoard(campaignId, { id: npc.id, name: npc.name, kind: 'npc', currentHp: npc.currentHp, maxHp: npc.maxHp, portraitUrl: null, isActive: false })
    resetNpcForm()
  }

  // ── Party long rest ───────────────────────────────────────────────────────

  const partyLongRest = async () => {
    await Promise.all(
      characters.map(c => {
        const maxHp = maxHpFor(c)
        return supabase.from('characters').update({
          current_hp: maxHp,
          sheet_json: { ...c.sheet_json, spell_slots_used: {}, death_saves: undefined, hit_dice_used: 0 } as never,
        }).eq('id', c.id)
      })
    )
    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    setShowLongRestConfirm(false)
  }

  // ── Derived tokens & combat entities ─────────────────────────────────────

  const tokens = useMemo((): any[] => {
    if (combatActive) {
      return combatants.flatMap((c, idx): any[] => {
        if (c.kind === 'player') {
          const ch = characters.find(x => x.id === c.characterId)
          if (!ch) return []
          return [{ id: ch.id, name: ch.name, kind: 'player', currentHp: localHp[ch.id] ?? currentHpFor(ch), maxHp: maxHpFor(ch), portraitUrl: ch.portrait_url, isActive: idx === currentTurn }]
        }
        return [{ id: c.npc.id, name: c.npc.name, kind: 'npc', currentHp: c.npc.currentHp, maxHp: c.npc.maxHp, portraitUrl: c.npc.portraitUrl ?? null, role: c.npc.role, level: c.npc.level, spells: c.npc.spells, weapons: c.npc.weapons, equipmentNotes: c.npc.equipmentNotes, damage: c.npc.damage, isActive: idx === currentTurn, isHidden: c.npc.isHidden ?? false }]
      })
    }
    return boardTokens.map(bt => {
      const char = bt.kind === 'player' ? characters.find(c => c.id === bt.entity_id) : null
      const maxHp = char ? maxHpFor(char) : bt.max_hp ?? 10
      const currentHp = char ? (localHp[char.id] ?? currentHpFor(char)) : bt.current_hp ?? maxHp
      return { id: bt.entity_id, name: bt.label, kind: bt.kind, currentHp, maxHp, portraitUrl: char?.portrait_url ?? bt.portrait_url ?? null, isActive: false, spawnGroup: bt.spawn_group ?? undefined, isHidden: bt.hidden ?? false }
    })
  }, [combatActive, combatants, boardTokens, characters, currentTurn, localHp])

  const allCombatEntities = useMemo((): { id: string; name: string; ac: number; attackBonus: number }[] => {
    const result: { id: string; name: string; ac: number; attackBonus: number }[] = []
    for (const t of tokens) {
      if (t.kind === 'player') {
        const ch = characters.find(x => x.id === t.id)
        if (!ch) continue
        const strMod = Math.floor(((ch.stats.str ?? 10) - 10) / 2)
        const dexMod = Math.floor(((ch.stats.dex ?? 10) - 10) / 2)
        const prof = Math.ceil(ch.level / 4) + 1
        result.push({ id: ch.id, name: ch.name, ac: ch.armor_class ?? (10 + dexMod), attackBonus: prof + Math.max(strMod, dexMod) })
      } else {
        const npcCombatant = combatants.find(c => c.kind === 'npc' && (c as any).npc.id === t.id) as { kind: 'npc'; npc: Npc } | undefined
        result.push({ id: t.id, name: t.name, ac: npcCombatant?.npc.ac ?? 10, attackBonus: npcCombatant?.npc.attackBonus ?? 0 })
      }
    }
    return result
  }, [tokens, characters, combatants])

  // ── Attack resolution ─────────────────────────────────────────────────────

  const handleAttackConfirm = useCallback(async (
    attackerId: string, targetId: string, hit: boolean,
    damage?: number, isHealing?: boolean, spellLevel?: number,
  ) => {
    if (hit && damage && damage > 0) {
      const playerChar = characters.find(c => c.id === targetId)
      if (playerChar) {
        const maxHp = maxHpFor(playerChar)
        const curHp = localHp[playerChar.id] ?? currentHpFor(playerChar)
        adjustCharacterHp(playerChar.id, curHp, maxHp, isHealing ? Math.min(maxHp, curHp + damage) : Math.max(0, curHp - damage))
      } else {
        const npcCombatant = combatants.find(c => c.kind === 'npc' && (c as any).npc.id === targetId) as { kind: 'npc'; npc: Npc } | undefined
        if (npcCombatant) {
          updateNpc(npcCombatant.npc.id, {
            currentHp: isHealing
              ? Math.min(npcCombatant.npc.maxHp ?? 100, npcCombatant.npc.currentHp + damage)
              : Math.max(0, npcCombatant.npc.currentHp - damage),
          })
        }
      }
    }
    const attacker = allCombatEntities.find(e => e.id === attackerId)
    const target = targetId === 'ground' ? { id: 'ground', name: 'Terreno' } : allCombatEntities.find(e => e.id === targetId)
    if (attacker && target) {
      setCombatLog(prev => [{ id: crypto.randomUUID(), attackerName: attacker.name, targetName: target.name, hit, damage, isHealing }, ...prev].slice(0, 30))
    }
    if (spellLevel && spellLevel > 0) {
      const attackerChar = characters.find(c => c.id === attackerId)
      if (attackerChar) {
        const slotsUsed = attackerChar.sheet_json.spell_slots_used ?? {}
        const newSheet = { ...attackerChar.sheet_json, spell_slots_used: { ...slotsUsed, [String(spellLevel)]: (slotsUsed[String(spellLevel)] ?? 0) + 1 } }
        queryClient.setQueryData(['campaign-characters', campaignId], (old: any) => {
          if (!Array.isArray(old)) return old
          return old.map(c => c.id === attackerId ? { ...c, sheet_json: newSheet } : c)
        })
        await supabase.from('characters').update({ sheet_json: newSheet as any }).eq('id', attackerId)
      }
    }
  }, [characters, localHp, combatants, allCombatEntities, campaignId, queryClient, adjustCharacterHp])

  // ── Broadcast channel ─────────────────────────────────────────────────────

  const { handleSelectionChange, broadcastTokenDrag } = useCombatBroadcast(
    campaignId, tokens, combatActive, combatants, currentTurn,
    handleAttackConfirm, setExternalTargeting,
  )

  const onTokenDragging = (entityId: string, x: number, y: number) =>
    broadcastTokenDrag(entityId, x, y)

  return {
    queryClient, npcInputRef, localHp,
    combatActive, combatants, currentTurn,
    npcInput, setNpcInput,
    boardTokens, externalPositions,
    showBestiary, setShowBestiary,
    bestiarySearch, setBestiarySearch,
    bestiaryQty, setBestiaryQty,
    addingMonster,
    showCampaignNpcs, setShowCampaignNpcs,
    campaignNpcSearch, setCampaignNpcSearch,
    editingHp, setEditingHp,
    conditionPickerFor, setConditionPickerFor,
    showLongRestConfirm, setShowLongRestConfirm,
    showNpcBar, setShowNpcBar,
    combatLog, showLog, setShowLog,
    externalTargeting,
    characters, filteredMonsters, filteredCampaignNpcs,
    patchCharacter, adjustCharacterHp, onTokenMoved, onTokenDragging,
    startCombat, endCombat, nextTurn,
    addNpc, updateNpc, removeNpc, toggleNpcHidden, setNpcHidden, adjustBoardNpcHp,
    addNpcFromMonster, addNpcFromCampaign, createCustomNpc,
    partyLongRest, handleAttackConfirm,
    tokens, allCombatEntities, handleSelectionChange,
    ...npcForm,
    ...boardMaps,
  }
}
