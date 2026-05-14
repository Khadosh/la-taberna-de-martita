import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { CLASS_ICONS } from '../../../lib/class-meta'
import { CONDITIONS, getSpellSlots } from '../../../lib/dnd-constants'
import { dndApi, dndKeys, type MonsterSummary } from '../../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/lucha')({
  component: DmSession,
})

// ── Types ────────────────────────────────────────────────────────────────────

type Character = {
  id: string
  name: string
  class: string
  race: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  armor_class: number | null
  conditions: string[]
  sheet_json: {
    hit_die?: number
    saving_throws?: string[]
    spell_slots_used?: Record<string, number>
    death_saves?: { successes: number; failures: number }
    currency?: { gold: number; silver: number; copper: number }
  }
}

type NpcItem = { id: string; name: string; qty: number }

type Npc = {
  id: string
  name: string
  currentHp: number
  maxHp: number
  initiative: number
  ac?: number
  cr?: number
  attackBonus?: number
  damage?: string
  npcType?: string
  loot?: NpcItem[]
}

type Combatant =
  | { kind: 'player'; characterId: string; initiative: number }
  | { kind: 'npc'; npc: Npc }

const getInitiative = (c: Combatant) => c.kind === 'player' ? c.initiative : c.npc.initiative

const formatModInline = (mod: number) => mod >= 0 ? `+${mod}` : `${mod}`

// ── Component ────────────────────────────────────────────────────────────────

function DmSession() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()
  const npcInputRef = useRef<HTMLInputElement>(null)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Optimistic HP: local overrides server value, synced after debounce
  const [localHp, setLocalHp] = useState<Record<string, number>>({})
  const hpTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Combat state (local — ephemeral per session)
  const [combatActive, setCombatActive] = useState(false)
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [npcInput, setNpcInput] = useState('')

  // Bestiary picker
  const [showBestiary, setShowBestiary] = useState(false)
  const [bestiarySearch, setBestiarySearch] = useState('')
  const [bestiaryQty, setBestiaryQty] = useState(1)
  const [addingMonster, setAddingMonster] = useState(false)

  // Campaign NPCs picker
  const [showCampaignNpcs, setShowCampaignNpcs] = useState(false)
  const [campaignNpcSearch, setCampaignNpcSearch] = useState('')

  // Custom NPC form
  const [showNpcForm, setShowNpcForm] = useState(false)
  const [npcFormName, setNpcFormName] = useState('')
  const [npcFormHp, setNpcFormHp] = useState(10)
  const [npcFormAc, setNpcFormAc] = useState(10)
  const [npcFormAttack, setNpcFormAttack] = useState(0)
  const [npcFormDamage, setNpcFormDamage] = useState('')
  const [npcFormType, setNpcFormType] = useState('humanoide')
  const [npcFormItems, setNpcFormItems] = useState<NpcItem[]>([])

  // Loot display
  const [lootOpenFor, setLootOpenFor] = useState<string | null>(null)

  // Notes state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [noteSaving, setNoteSaving] = useState(false)

  // Inline editing
  const [editingHp, setEditingHp] = useState<string | null>(null)
  const [editingNpcHp, setEditingNpcHp] = useState<string | null>(null)
  const [editingNpcInit, setEditingNpcInit] = useState<string | null>(null)
  const [conditionPickerFor, setConditionPickerFor] = useState<string | null>(null)
  const [showLongRestConfirm, setShowLongRestConfirm] = useState(false)

  // Attack calculator
  const [showAttackCalc, setShowAttackCalc] = useState(false)
  const [attackerId, setAttackerId] = useState('')
  const [defenderId, setDefenderId] = useState('')

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
  })

  const { data: latestNote } = useQuery({
    queryKey: ['session-note', campaignId],
    queryFn: async () => {
      const { data } = await supabase
        .from('session_notes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      return data
    },
  })

  useEffect(() => {
    if (latestNote) {
      setNoteId(latestNote.id)
      setNoteTitle(latestNote.title)
      setNoteBody(latestNote.body)
    }
  }, [latestNote])

  const { data: monsterList = [] } = useQuery({
    queryKey: dndKeys.monsters,
    queryFn: async () => (await dndApi.monsters()).results,
    staleTime: Infinity,
  })

  const filteredMonsters = useMemo(() => {
    const q = bestiarySearch.trim().toLowerCase()
    if (!q) return []
    return monsterList.filter(m => m.name.toLowerCase().includes(q)).slice(0, 10)
  }, [monsterList, bestiarySearch])

  const { data: campaignNpcs = [] } = useQuery({
    queryKey: ['campaign-npcs', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const filteredCampaignNpcs = useMemo(() => {
    const q = campaignNpcSearch.trim().toLowerCase()
    if (!q) return campaignNpcs
    return campaignNpcs.filter(n =>
      n.name.toLowerCase().includes(q) ||
      n.role.toLowerCase().includes(q) ||
      (n.race ?? '').toLowerCase().includes(q)
    )
  }, [campaignNpcs, campaignNpcSearch])

  // ── Realtime ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`session-characters-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `campaign_id=eq.${campaignId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [campaignId, queryClient])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const maxHpFor = (c: Character) => {
    const sheet = c.sheet_json as { hit_die?: number }
    const hitDie = sheet.hit_die ?? 8
    const conMod = Math.floor(((c.stats.con ?? 10) - 10) / 2)
    return hitDie + conMod
  }

  const currentHpFor = (c: Character) => c.current_hp ?? maxHpFor(c)
  const acFor = (c: Character) => c.armor_class ?? (10 + Math.floor(((c.stats.dex ?? 10) - 10) / 2))

  const patchCharacter = async (id: string, patch: Record<string, unknown>) => {
    await supabase.from('characters').update(patch as never).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
  }

  const adjustCharacterHp = (id: string, _serverHp: number, maxHp: number, newHp: number) => {
    const clamped = Math.max(0, Math.min(maxHp, newHp))
    setLocalHp(prev => ({ ...prev, [id]: clamped }))
    if (hpTimers.current[id]) clearTimeout(hpTimers.current[id])
    hpTimers.current[id] = setTimeout(async () => {
      await supabase.from('characters').update({ current_hp: clamped } as never).eq('id', id)
      queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
      setLocalHp(prev => { const n = { ...prev }; delete n[id]; return n })
    }, 600)
  }

  // ── Combat ───────────────────────────────────────────────────────────────

  const startCombat = () => {
    const list: Combatant[] = characters.map(c => {
      const dexMod = Math.floor(((c.stats.dex ?? 10) - 10) / 2)
      const init = Math.ceil(Math.random() * 20) + dexMod
      return { kind: 'player', characterId: c.id, initiative: init }
    })
    list.sort((a, b) => getInitiative(b) - getInitiative(a))
    setCombatants(list)
    setCurrentTurn(0)
    setCombatActive(true)
    setTimeout(() => npcInputRef.current?.focus(), 100)
  }

  const endCombat = () => {
    setCombatActive(false)
    setCombatants([])
    setCurrentTurn(0)
  }

  const nextTurn = () => setCurrentTurn(t => (t + 1) % combatants.length)

  const addNpc = () => {
    const raw = npcInput.trim()
    if (!raw) return
    const match = raw.match(/^(.+?)\s+(\d+)$/)
    const name = match ? match[1] : raw
    const hp = match ? parseInt(match[2]) : 10
    const init = Math.ceil(Math.random() * 20)
    const npc: Npc = { id: crypto.randomUUID(), name, currentHp: hp, maxHp: hp, initiative: init }
    const newCombatant: Combatant = { kind: 'npc', npc }
    setCombatants(prev => {
      const list = [...prev, newCombatant]
      list.sort((a, b) => getInitiative(b) - getInitiative(a))
      return list
    })
    setNpcInput('')
    npcInputRef.current?.focus()
  }

  const updateNpc = (id: string, patch: Partial<Npc>) => {
    setCombatants(prev =>
      prev.map(c => c.kind === 'npc' && c.npc.id === id ? { ...c, npc: { ...c.npc, ...patch } } : c)
    )
  }

  const removeNpc = (id: string) => {
    setCombatants(prev => {
      const next = prev.filter(c => !(c.kind === 'npc' && c.npc.id === id))
      const newLen = next.length
      setCurrentTurn(t => Math.min(t, Math.max(0, newLen - 1)))
      return next
    })
  }

  const addNpcFromMonster = async (summary: MonsterSummary, count: number) => {
    setAddingMonster(true)
    try {
      const monster = await dndApi.monster(summary.index)
      const dexMod = Math.floor(((monster.dexterity ?? 10) - 10) / 2)
      const ac = monster.armor_class[0]?.value
      const newCombatants: Combatant[] = Array.from({ length: count }, (_, i) => {
        const npc: Npc = {
          id: crypto.randomUUID(),
          name: count > 1 ? `${monster.name} ${i + 1}` : monster.name,
          currentHp: monster.hit_points,
          maxHp: monster.hit_points,
          initiative: Math.ceil(Math.random() * 20) + dexMod,
          ac,
          cr: monster.challenge_rating,
        }
        return { kind: 'npc' as const, npc }
      })
      setCombatants(prev => {
        const list = [...prev, ...newCombatants]
        list.sort((a, b) => getInitiative(b) - getInitiative(a))
        return list
      })
      setShowBestiary(false)
      setBestiarySearch('')
      setBestiaryQty(1)
    } finally {
      setAddingMonster(false)
    }
  }

  const addNpcFromCampaign = (cn: typeof campaignNpcs[number]) => {
    const stats = (cn.stats as Record<string, number> | null) ?? { dex: 10 }
    const dexMod = Math.floor(((stats.dex ?? 10) - 10) / 2)
    const hp = cn.current_hp ?? cn.max_hp ?? 10
    const maxHp = cn.max_hp ?? hp
    // Suffix when same NPC is added multiple times
    const existing = combatants.filter(c => c.kind === 'npc' && c.npc.name.replace(/ \d+$/, '') === cn.name).length
    const suffix = existing > 0 ? ` ${existing + 1}` : ''
    const loot = ((cn.sheet_json as { loot?: NpcItem[] } | null)?.loot) ?? []
    const npc: Npc = {
      id: crypto.randomUUID(),
      name: `${cn.name}${suffix}`,
      currentHp: hp,
      maxHp,
      initiative: Math.ceil(Math.random() * 20) + dexMod,
      ac: cn.armor_class ?? undefined,
      attackBonus: cn.attack_bonus ?? undefined,
      damage: cn.damage ?? undefined,
      npcType: cn.race ?? undefined,
      loot,
    }
    setCombatants(prev => {
      const list = [...prev, { kind: 'npc' as const, npc }]
      list.sort((a, b) => getInitiative(b) - getInitiative(a))
      return list
    })
  }

  const createCustomNpc = () => {
    if (!npcFormName.trim() || npcFormHp < 1) return
    const npc: Npc = {
      id: crypto.randomUUID(),
      name: npcFormName.trim(),
      currentHp: npcFormHp,
      maxHp: npcFormHp,
      initiative: Math.ceil(Math.random() * 20),
      ac: npcFormAc,
      attackBonus: npcFormAttack,
      damage: npcFormDamage.trim() || undefined,
      npcType: npcFormType,
      loot: npcFormItems.filter(i => i.name.trim()),
    }
    setCombatants(prev => {
      const list = [...prev, { kind: 'npc' as const, npc }]
      list.sort((a, b) => getInitiative(b) - getInitiative(a))
      return list
    })
    setShowNpcForm(false)
    setNpcFormName(''); setNpcFormHp(10); setNpcFormAc(10)
    setNpcFormAttack(0); setNpcFormDamage(''); setNpcFormType('humanoide'); setNpcFormItems([])
  }

  const addLootItem = () =>
    setNpcFormItems(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: 1 }])

  const updateLootItem = (id: string, patch: Partial<NpcItem>) =>
    setNpcFormItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))

  const removeLootItem = (id: string) =>
    setNpcFormItems(prev => prev.filter(i => i.id !== id))

  const setPlayerInitiative = (characterId: string, init: number) => {
    setCombatants(prev => {
      const list = prev.map(c =>
        c.kind === 'player' && c.characterId === characterId ? { ...c, initiative: init } : c
      )
      list.sort((a, b) => getInitiative(b) - getInitiative(a))
      return list
    })
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

  // ── Notes auto-save ──────────────────────────────────────────────────────

  const saveNote = useCallback(async (title: string, body: string, id: string | null) => {
    setNoteSaving(true)
    if (id) {
      await supabase.from('session_notes').update({ title: title || 'Sin título', body }).eq('id', id)
    } else {
      const { data } = await supabase.from('session_notes').insert({
        campaign_id: campaignId,
        author_id: session.user.id,
        title: title || 'Sin título',
        body,
        is_private: false,
        session_date: new Date().toISOString(),
      }).select().single()
      if (data) setNoteId(data.id)
    }
    queryClient.invalidateQueries({ queryKey: ['session-note', campaignId] })
    setNoteSaving(false)
  }, [campaignId, session.user.id, queryClient])

  const scheduleNoteSave = (title: string, body: string) => {
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => saveNote(title, body, noteId), 1500)
  }

  // ── Attack calculator ──────────────────────────────────────────────────────

  const allCombatEntities = useMemo(() => {
    const entities: { id: string; name: string; ac: number; attackBonus: number; kind: 'player' | 'npc' }[] = []
    for (const c of combatants) {
      if (c.kind === 'player') {
        const ch = characters.find(x => x.id === c.characterId)
        if (!ch) continue
        const strMod = Math.floor(((ch.stats.str ?? 10) - 10) / 2)
        const dexMod = Math.floor(((ch.stats.dex ?? 10) - 10) / 2)
        const prof = Math.ceil(ch.level / 4) + 1
        // Use the higher of STR/DEX as default attack mod
        const atkMod = Math.max(strMod, dexMod)
        entities.push({
          id: ch.id,
          name: ch.name,
          ac: ch.armor_class ?? (10 + Math.floor(((ch.stats.dex ?? 10) - 10) / 2)),
          attackBonus: prof + atkMod,
          kind: 'player',
        })
      } else {
        entities.push({
          id: c.npc.id,
          name: c.npc.name,
          ac: c.npc.ac ?? 10,
          attackBonus: c.npc.attackBonus ?? 0,
          kind: 'npc',
        })
      }
    }
    return entities
  }, [combatants, characters])

  const attackCalcResult = useMemo(() => {
    if (!attackerId || !defenderId) return null
    const atk = allCombatEntities.find(e => e.id === attackerId)
    const def = allCombatEntities.find(e => e.id === defenderId)
    if (!atk || !def) return null
    const needed = def.ac - atk.attackBonus
    const minRoll = Math.max(2, Math.min(20, needed)) // 1 always misses (nat 1), 20 always hits
    return {
      attacker: atk,
      defender: def,
      minRoll,
      hitChance: Math.max(5, Math.min(100, (21 - minRoll) * 5)), // 5% to 100%
      nat20Always: needed <= 1,
    }
  }, [attackerId, defenderId, allCombatEntities])

  // ── Render ───────────────────────────────────────────────────────────────

  const sortedCombatants = combatActive ? combatants : []

  return (
    <div className="bg-stone-950 text-stone-100 flex flex-col" style={{ minHeight: 'calc(100vh - 100px)' }}>

      {/* Action bar (no nav — that comes from the campaign layout) */}
      <header className="border-b border-stone-800 bg-stone-900 px-6 py-2 flex items-center gap-3 shrink-0">
        <span className="text-stone-400 font-serif text-sm">Pantalla del DM</span>
        <div className="flex-1" />
        {showLongRestConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-serif">¿Descanso largo para todo el grupo?</span>
            <button onClick={partyLongRest} className="text-xs px-3 py-1.5 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors">Confirmar</button>
            <button onClick={() => setShowLongRestConfirm(false)} className="text-xs text-stone-500 hover:text-stone-300">✕</button>
          </div>
        ) : (
          <>
            <button onClick={() => setShowLongRestConfirm(true)} disabled={characters.length === 0}
              className="text-xs px-3 py-1.5 border border-stone-700 text-stone-400 hover:border-amber-700 hover:text-amber-400 disabled:opacity-40 font-serif transition-colors">
              ☀ Descanso largo
            </button>
            {combatActive ? (
              <button onClick={endCombat} className="text-xs px-3 py-1.5 border border-stone-600 text-stone-400 hover:border-red-700 hover:text-red-400 font-serif transition-colors">
                Fin de combate
              </button>
            ) : (
              <button onClick={startCombat} disabled={characters.length === 0}
                className="text-xs px-4 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors">
                ⚔ Iniciar combate
              </button>
            )}
          </>
        )}
      </header>

      {/* Main panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Party */}
        <aside className="w-72 border-r border-stone-800 flex flex-col overflow-y-auto bg-stone-900/50">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Partido · {characters.length}</p>
          </div>
          <div className="flex-1 px-3 pb-4 space-y-2">
            {characters.length === 0 && (
              <p className="text-stone-600 text-xs font-serif italic px-1 pt-2">Ningún personaje asignado a esta campaña.</p>
            )}
            {characters.map(c => {
              const maxHp = maxHpFor(c)
              const serverHp = currentHpFor(c)
              const curHp = localHp[c.id] ?? serverHp
              const ac = acFor(c)
              const hpPct = Math.max(0, Math.min((curHp / maxHp) * 100, 100))
              const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
              const conds: string[] = (c.conditions as string[]) ?? []
              return (
                <div key={c.id} className="bg-stone-900 border border-stone-700 rounded-lg p-3 space-y-2">
                  {/* Name row */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CLASS_ICONS[c.class] ?? '🎲'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-100 truncate">{c.name}</p>
                      <p className="text-xs text-stone-500 capitalize">{c.race} {c.class} · Nv.{c.level}</p>
                    </div>
                    <span className="text-xs text-stone-500 font-mono bg-stone-800 px-1.5 py-0.5 rounded">CA {ac}</span>
                  </div>

                  {/* HP */}
                  <div>
                    <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden mb-1">
                      <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjustCharacterHp(c.id, serverHp, maxHp, curHp - 1)}
                        className="w-5 h-5 text-xs border border-stone-700 text-stone-400 hover:bg-stone-800 rounded leading-none">−</button>
                      {editingHp === c.id ? (
                        <input autoFocus defaultValue={curHp} onBlur={e => { adjustCharacterHp(c.id, serverHp, maxHp, parseInt(e.target.value) || 0); setEditingHp(null) }}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          className="w-10 text-center text-sm font-mono bg-transparent border-b border-stone-500 focus:outline-none text-amber-300" />
                      ) : (
                        <button onClick={() => setEditingHp(c.id)} className="text-sm font-mono text-amber-300 hover:text-amber-100 min-w-[2rem] text-center">
                          {curHp}
                        </button>
                      )}
                      <button onClick={() => adjustCharacterHp(c.id, serverHp, maxHp, curHp + 1)}
                        className="w-5 h-5 text-xs border border-stone-700 text-stone-400 hover:bg-stone-800 rounded leading-none">+</button>
                      <span className="text-xs text-stone-600 ml-1">/ {maxHp}</span>
                      <button onClick={() => adjustCharacterHp(c.id, serverHp, maxHp, maxHp)}
                        className="ml-auto text-xs text-stone-600 hover:text-green-500 transition-colors" title="Curar completo">✦</button>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="flex flex-wrap gap-1">
                    {conds.map(cond => (
                      <span key={cond} className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-red-950 border border-red-800 text-red-300 rounded">
                        {cond}
                        <button onClick={() => patchCharacter(c.id, { conditions: conds.filter(x => x !== cond) })} className="text-red-600 hover:text-red-300 ml-0.5">✕</button>
                      </span>
                    ))}
                    <div className="relative">
                      <button onClick={() => setConditionPickerFor(conditionPickerFor === c.id ? null : c.id)}
                        className="px-1.5 py-0.5 text-xs border border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300 rounded transition-colors">
                        + condición
                      </button>
                      {conditionPickerFor === c.id && (
                        <div className="absolute left-0 top-7 z-30 w-44 bg-stone-900 border border-stone-700 rounded shadow-xl max-h-48 overflow-y-auto">
                          {CONDITIONS.filter(x => !conds.includes(x)).map(cond => (
                            <button key={cond} onClick={() => { patchCharacter(c.id, { conditions: [...conds, cond] }); setConditionPickerFor(null) }}
                              className="block w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-800 transition-colors">
                              {cond}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Death saves when HP = 0 */}
                  {curHp === 0 && (() => {
                    const ds = c.sheet_json.death_saves ?? { successes: 0, failures: 0 }
                    return (
                      <div className="flex items-center gap-3 pt-1 border-t border-stone-800">
                        <span className="text-xs text-stone-600 font-serif">Muerte:</span>
                        <div className="flex gap-1">
                          {[0,1,2].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full border ${i < ds.successes ? 'bg-green-600 border-green-500' : 'border-stone-700'}`} />
                          ))}
                        </div>
                        <span className="text-stone-700 text-xs">/</span>
                        <div className="flex gap-1">
                          {[0,1,2].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full border ${i < ds.failures ? 'bg-red-700 border-red-600' : 'border-stone-700'}`} />
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Spell slots */}
                  {(() => {
                    const slots = getSpellSlots(c.class, c.level)
                    const used = c.sheet_json.spell_slots_used ?? {}
                    if (!slots.some(s => s > 0)) return null
                    return (
                      <div className="pt-1 border-t border-stone-800 space-y-0.5">
                        {slots.map((max, idx) => {
                          if (max === 0) return null
                          const lvl = idx + 1
                          const u = used[String(lvl)] ?? 0
                          const available = max - u
                          return (
                            <div key={lvl} className="flex items-center gap-1.5">
                              <span className="text-xs text-stone-700 w-4">{lvl}</span>
                              <div className="flex gap-0.5">
                                {Array.from({ length: max }, (_, i) => (
                                  <div key={i} className={`w-2 h-2 rounded-full ${i < available ? 'bg-amber-600' : 'bg-stone-800 border border-stone-700'}`} />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </aside>

        {/* RIGHT: Initiative / Combat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {!combatActive ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <p className="text-stone-600 font-serif text-lg">⚔</p>
                <p className="text-stone-500 font-serif text-sm">Cuando empiece el combate, la iniciativa se<br/>tira automáticamente para todos los jugadores.</p>
                <button onClick={startCombat} disabled={characters.length === 0}
                  className="px-6 py-2.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors">
                  ⚔ Iniciar combate
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Turn controls */}
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={nextTurn}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif text-sm transition-colors">
                    Siguiente turno →
                  </button>
                  <span className="text-xs text-stone-500 font-serif">
                    Turno {currentTurn + 1} de {combatants.length}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => setShowAttackCalc(v => !v)}
                    className={`px-3 py-1.5 font-serif text-xs transition-colors border ${showAttackCalc ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
                  >
                    ⚔ Calculadora de ataque
                  </button>
                </div>

                {/* Attack calculator */}
                {showAttackCalc && (
                  <div className="bg-stone-950 border border-stone-700 p-4 mb-4 space-y-3">
                    <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Calculadora de ataque</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-stone-600 font-serif mb-1">Atacante</label>
                        <select value={attackerId} onChange={e => setAttackerId(e.target.value)}
                          className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif focus:outline-none focus:border-stone-500">
                          <option value="">Elegir...</option>
                          {allCombatEntities.map(e => (
                            <option key={e.id} value={e.id}>{e.name} (ataque +{e.attackBonus})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 font-serif mb-1">Defensor</label>
                        <select value={defenderId} onChange={e => setDefenderId(e.target.value)}
                          className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif focus:outline-none focus:border-stone-500">
                          <option value="">Elegir...</option>
                          {allCombatEntities.map(e => (
                            <option key={e.id} value={e.id}>{e.name} (CA {e.ac})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {attackCalcResult && (
                      <div className="border border-stone-700 bg-stone-900/60 p-3 flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold font-mono text-amber-300">
                            {attackCalcResult.nat20Always ? '✔' : attackCalcResult.minRoll}+
                          </p>
                          <p className="text-[10px] text-stone-500 font-serif uppercase tracking-widest mt-0.5">Necesita</p>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm text-stone-300 font-serif">
                            <span className="text-amber-400 font-semibold">{attackCalcResult.attacker.name}</span>
                            {' '}→{' '}
                            <span className="text-stone-200 font-semibold">{attackCalcResult.defender.name}</span>
                          </p>
                          <p className="text-xs text-stone-500 font-serif">
                            Ataque +{attackCalcResult.attacker.attackBonus} vs CA {attackCalcResult.defender.ac}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-amber-700 transition-all" style={{ width: `${attackCalcResult.hitChance}%` }} />
                            </div>
                            <span className="text-xs font-mono text-amber-400">{attackCalcResult.hitChance}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Combatant list */}
                {sortedCombatants.map((combatant, idx) => {
                  const isActive = idx === currentTurn
                  if (combatant.kind === 'player') {
                    const c = characters.find(x => x.id === combatant.characterId)
                    if (!c) return null
                    const maxHp = maxHpFor(c)
                    const serverHp = currentHpFor(c)
                    const curHp = localHp[c.id] ?? serverHp
                    const hpPct = Math.max(0, Math.min((curHp / maxHp) * 100, 100))
                    const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
                    return (
                      <CombatantRow
                        key={c.id}
                        isActive={isActive}
                        icon={CLASS_ICONS[c.class] ?? '🎲'}
                        name={c.name}
                        initiative={combatant.initiative}
                        onInitiativeChange={v => setPlayerInitiative(c.id, v)}
                        hp={curHp} maxHp={maxHp} hpPct={hpPct} hpColor={hpColor}
                        onHpChange={v => adjustCharacterHp(c.id, serverHp, maxHp, v)}
                        tag={<span className="text-xs text-stone-500 font-serif">Jugador</span>}
                      />
                    )
                  } else {
                    const npc = combatant.npc
                    const hpPct = Math.max(0, Math.min((npc.currentHp / npc.maxHp) * 100, 100))
                    const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
                    return (
                      <CombatantRow
                        key={npc.id}
                        isActive={isActive}
                        icon="⚔"
                        name={npc.name}
                        initiative={npc.initiative}
                        onInitiativeChange={v => updateNpc(npc.id, { initiative: v })}
                        hp={npc.currentHp} maxHp={npc.maxHp} hpPct={hpPct} hpColor={hpColor}
                        onHpChange={v => updateNpc(npc.id, { currentHp: v })}
                        onRemove={() => removeNpc(npc.id)}
                        tag={<span className="text-xs text-stone-600 font-serif capitalize">{npc.npcType ?? 'NPC'}{npc.cr != null ? ` · CR ${npc.cr}` : ''}</span>}
                        npcStats={npc.ac != null || npc.attackBonus != null || npc.damage ? { ac: npc.ac, attackBonus: npc.attackBonus, damage: npc.damage } : undefined}
                        loot={npc.loot}
                        lootOpen={lootOpenFor === npc.id}
                        onToggleLoot={() => setLootOpenFor(lootOpenFor === npc.id ? null : npc.id)}
                        editingHpId={editingNpcHp}
                        setEditingHpId={setEditingNpcHp}
                        editingInitId={editingNpcInit}
                        setEditingInitId={setEditingNpcInit}
                        entityId={npc.id}
                      />
                    )
                  }
                })}

                {/* Add NPC */}
                <div className="mt-4 border-t border-stone-800 pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={npcInputRef}
                      value={npcInput}
                      onChange={e => setNpcInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && npcInput.trim() && addNpc()}
                      placeholder='Nombre [hp]  ej: Goblin 7'
                      className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
                    />
                    <button onClick={addNpc} disabled={!npcInput.trim()}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 font-serif text-sm transition-colors">
                      + NPC
                    </button>
                    <button
                      onClick={() => {
                        setShowCampaignNpcs(b => !b)
                        setCampaignNpcSearch('')
                        if (showBestiary) setShowBestiary(false)
                        if (showNpcForm) setShowNpcForm(false)
                      }}
                      className={`px-3 py-2 font-serif text-sm transition-colors border ${showCampaignNpcs ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
                    >
                      🎭 PNJ campaña
                    </button>
                    <button
                      onClick={() => { setShowBestiary(b => !b); setBestiarySearch(''); if (showNpcForm) setShowNpcForm(false); if (showCampaignNpcs) setShowCampaignNpcs(false) }}
                      className={`px-3 py-2 font-serif text-sm transition-colors border ${showBestiary ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
                    >
                      ⚔ Bestiario
                    </button>
                    <button
                      onClick={() => { setShowNpcForm(b => !b); if (showBestiary) setShowBestiary(false); if (showCampaignNpcs) setShowCampaignNpcs(false) }}
                      className={`px-3 py-2 font-serif text-sm transition-colors border ${showNpcForm ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 bg-stone-900 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
                    >
                      ✏ Personalizado
                    </button>
                  </div>

                  {showCampaignNpcs && (
                    <div className="bg-stone-950 border border-stone-700 p-3 space-y-2">
                      <input
                        autoFocus
                        value={campaignNpcSearch}
                        onChange={e => setCampaignNpcSearch(e.target.value)}
                        placeholder="Buscar PNJ de campaña..."
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
                      />
                      {campaignNpcs.length === 0 ? (
                        <p className="text-xs text-stone-600 font-serif italic px-1 py-2">
                          No hay PNJs en esta campaña. <Link to="/campaigns/$campaignId/pnj" params={{ campaignId }} className="text-amber-500 hover:text-amber-400 underline">Crear uno →</Link>
                        </p>
                      ) : filteredCampaignNpcs.length === 0 ? (
                        <p className="text-xs text-stone-600 font-serif italic px-1">Sin resultados.</p>
                      ) : (
                        <ul className="max-h-60 overflow-y-auto divide-y divide-stone-800">
                          {filteredCampaignNpcs.map(n => {
                            const stats = n.stats as Record<string, number> | null
                            const dexMod = Math.floor((((stats?.dex) ?? 10) - 10) / 2)
                            const roleChip =
                              n.role === 'antagonist' ? 'text-red-400' :
                              n.role === 'ally' ? 'text-green-400' : 'text-stone-500'
                            return (
                              <li key={n.id}>
                                <button
                                  onClick={() => addNpcFromCampaign(n)}
                                  className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 font-serif transition-colors flex items-center justify-between gap-3"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="block truncate">{n.name}</span>
                                    <span className={`text-[10px] tracking-wide uppercase ${roleChip}`}>{n.role}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs font-mono text-stone-500 shrink-0">
                                    {n.max_hp != null && <span>{n.max_hp} PG</span>}
                                    {n.armor_class != null && <span>CA {n.armor_class}</span>}
                                    <span>Ini {formatModInline(dexMod)}</span>
                                  </div>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {showBestiary && (
                    <div className="bg-stone-950 border border-stone-700 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={bestiarySearch}
                          onChange={e => setBestiarySearch(e.target.value)}
                          placeholder="Buscar monstruo..."
                          className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-stone-500 font-serif">×</span>
                          <input
                            type="number" min={1} max={10} value={bestiaryQty}
                            onChange={e => setBestiaryQty(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                            className="w-12 px-2 py-1.5 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-mono text-center focus:outline-none focus:border-stone-500"
                          />
                        </div>
                      </div>

                      {bestiarySearch.trim().length === 0 && (
                        <p className="text-xs text-stone-600 font-serif italic px-1">Escribí el nombre del monstruo para buscar.</p>
                      )}

                      {filteredMonsters.length > 0 && (
                        <ul className="max-h-44 overflow-y-auto divide-y divide-stone-800">
                          {filteredMonsters.map(m => (
                            <li key={m.index}>
                              <button
                                disabled={addingMonster}
                                onClick={() => addNpcFromMonster(m, bestiaryQty)}
                                className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 disabled:opacity-40 font-serif transition-colors flex items-center justify-between"
                              >
                                <span>{m.name}{bestiaryQty > 1 ? ` ×${bestiaryQty}` : ''}</span>
                                {addingMonster && <span className="text-xs text-stone-600">...</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {bestiarySearch.trim().length > 0 && filteredMonsters.length === 0 && (
                        <p className="text-xs text-stone-600 font-serif italic px-1">Sin resultados.</p>
                      )}
                    </div>
                  )}

                  {showNpcForm && (
                    <div className="bg-stone-950 border border-stone-700 p-4 space-y-4">
                      <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Crear NPC personalizado</p>

                      {/* Row 1: name */}
                      <div>
                        <label className="block text-xs text-stone-600 font-serif mb-1">Nombre *</label>
                        <input autoFocus value={npcFormName} onChange={e => setNpcFormName(e.target.value)}
                          placeholder="Ej: Capitán Grigor"
                          className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
                      </div>

                      {/* Row 2: HP / CA / Tipo */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-stone-600 font-serif mb-1">HP máx *</label>
                          <input type="number" min={1} value={npcFormHp} onChange={e => setNpcFormHp(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-600 font-serif mb-1">CA</label>
                          <input type="number" min={1} value={npcFormAc} onChange={e => setNpcFormAc(parseInt(e.target.value) || 10)}
                            className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono text-center focus:outline-none focus:border-stone-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-600 font-serif mb-1">Tipo</label>
                          <input list="npc-types" value={npcFormType} onChange={e => setNpcFormType(e.target.value)}
                            className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-serif focus:outline-none focus:border-stone-500" />
                          <datalist id="npc-types">
                            {['humanoide', 'bestia', 'muerto viviente', 'construcción', 'dragón', 'elemental', 'hada', 'engendro', 'gigante', 'infernal', 'planta'].map(t => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Row 3: GACO / Daño */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-stone-600 font-serif mb-1">Bono de ataque (GACO)</label>
                          <div className="flex items-center">
                            <span className="px-2 py-1.5 bg-stone-800 border border-r-0 border-stone-700 text-stone-500 text-sm font-mono">+</span>
                            <input type="number" value={npcFormAttack} onChange={e => setNpcFormAttack(parseInt(e.target.value) || 0)}
                              className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono focus:outline-none focus:border-stone-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-stone-600 font-serif mb-1">Daño</label>
                          <input value={npcFormDamage} onChange={e => setNpcFormDamage(e.target.value)}
                            placeholder="ej: 1d8+3 cortante"
                            className="w-full px-3 py-1.5 bg-stone-900 border border-stone-700 text-stone-200 text-sm font-mono placeholder-stone-700 focus:outline-none focus:border-stone-500" />
                        </div>
                      </div>

                      {/* Loot */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-stone-600 font-serif">Objetos (botín)</label>
                          <button onClick={addLootItem} className="text-xs px-2 py-0.5 border border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300 font-serif transition-colors">
                            + Agregar
                          </button>
                        </div>
                        {npcFormItems.length === 0 && (
                          <p className="text-xs text-stone-700 font-serif italic">Sin objetos. El botín aparece cuando el NPC muere.</p>
                        )}
                        <div className="space-y-1.5">
                          {npcFormItems.map(item => (
                            <NpcLootItemRow
                              key={item.id}
                              item={item}
                              onUpdate={patch => updateLootItem(item.id, patch)}
                              onRemove={() => removeLootItem(item.id)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-800">
                        <button onClick={() => setShowNpcForm(false)} className="text-xs text-stone-600 hover:text-stone-400 font-serif transition-colors">
                          Cancelar
                        </button>
                        <button onClick={createCustomNpc} disabled={!npcFormName.trim() || npcFormHp < 1}
                          className="px-4 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-30 text-amber-100 font-serif text-sm transition-colors">
                          Agregar al combate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Session notes */}
          <div className="border-t border-stone-800 bg-stone-900/50 px-6 py-4 shrink-0 h-52">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Notas de sesión</p>
              {noteSaving && <span className="text-xs text-stone-600 font-serif italic">Guardando...</span>}
              {!noteSaving && noteId && <span className="text-xs text-stone-700 font-serif italic">Guardado</span>}
            </div>
            <input
              value={noteTitle}
              onChange={e => { setNoteTitle(e.target.value); scheduleNoteSave(e.target.value, noteBody) }}
              placeholder="Título de la sesión"
              className="w-full bg-transparent border-b border-stone-800 text-stone-300 font-serif text-sm mb-2 pb-1 focus:outline-none focus:border-stone-600 placeholder-stone-700"
            />
            <textarea
              value={noteBody}
              onChange={e => { setNoteBody(e.target.value); scheduleNoteSave(noteTitle, e.target.value) }}
              placeholder="Anotá lo que pasa en la sesión..."
              className="w-full bg-transparent text-stone-400 font-serif text-sm resize-none focus:outline-none placeholder-stone-700 h-24"
            />
          </div>
        </main>
      </div>
    </div>
  )
}

// ── NpcLootItemRow ────────────────────────────────────────────────────────────

function NpcLootItemRow({ item, onUpdate, onRemove }: {
  item: NpcItem
  onUpdate: (patch: Partial<NpcItem>) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input value={item.name} onChange={e => onUpdate({ name: e.target.value })}
        placeholder="Nombre del objeto"
        className="flex-1 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500" />
      <span className="text-xs text-stone-600 shrink-0">×</span>
      <input type="number" min={1} value={item.qty} onChange={e => onUpdate({ qty: parseInt(e.target.value) || 1 })}
        className="w-14 px-2 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs font-mono text-center focus:outline-none focus:border-stone-500" />
      <button onClick={onRemove} className="text-stone-700 hover:text-red-500 transition-colors text-xs shrink-0">✕</button>
    </div>
  )
}

// ── CombatantRow ─────────────────────────────────────────────────────────────

function CombatantRow({
  isActive, icon, name, initiative, onInitiativeChange,
  hp, maxHp, hpPct, hpColor, onHpChange, onRemove, tag,
  editingHpId, setEditingHpId, editingInitId, setEditingInitId, entityId,
  npcStats, loot, lootOpen, onToggleLoot,
}: {
  isActive: boolean
  icon: string
  name: string
  initiative: number
  onInitiativeChange: (v: number) => void
  hp: number
  maxHp: number
  hpPct: number
  hpColor: string
  onHpChange: (v: number) => void
  onRemove?: () => void
  tag: React.ReactNode
  editingHpId?: string | null
  setEditingHpId?: (id: string | null) => void
  editingInitId?: string | null
  setEditingInitId?: (id: string | null) => void
  entityId?: string
  npcStats?: { ac?: number; attackBonus?: number; damage?: string }
  loot?: NpcItem[]
  lootOpen?: boolean
  onToggleLoot?: () => void
}) {
  const [localEditHp, setLocalEditHp] = useState(false)
  const [localEditInit, setLocalEditInit] = useState(false)
  const isEditingHp = entityId && setEditingHpId ? editingHpId === entityId : localEditHp
  const isEditingInit = entityId && setEditingInitId ? editingInitId === entityId : localEditInit
  const startEditHp = () => entityId && setEditingHpId ? setEditingHpId(entityId) : setLocalEditHp(true)
  const stopEditHp = () => entityId && setEditingHpId ? setEditingHpId(null) : setLocalEditHp(false)
  const startEditInit = () => entityId && setEditingInitId ? setEditingInitId(entityId) : setLocalEditInit(true)
  const stopEditInit = () => entityId && setEditingInitId ? setEditingInitId(null) : setLocalEditInit(false)

  return (
    <div className={`rounded-lg border transition-all overflow-hidden ${
      isActive
        ? 'border-amber-700 shadow-sm shadow-amber-900/30'
        : 'border-stone-800'
    }`}>
      {/* Main row */}
      <div className={`flex items-center gap-3 px-4 py-3 ${isActive ? 'bg-amber-950/40' : 'bg-stone-900/30'}`}>
        {/* Active indicator */}
        <div className="w-3 shrink-0 text-center">
          {isActive && <span className="text-amber-400 text-xs">→</span>}
        </div>

        {/* Initiative */}
        <div className="w-8 shrink-0 text-center">
          {isEditingInit ? (
            <input autoFocus defaultValue={initiative}
              onBlur={e => { onInitiativeChange(parseInt(e.target.value) || 0); stopEditInit() }}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-8 text-center text-sm font-mono bg-transparent border-b border-stone-600 focus:outline-none text-stone-300"
            />
          ) : (
            <button onClick={startEditInit} className="text-sm font-mono text-stone-400 hover:text-stone-200 transition-colors w-full">
              {initiative}
            </button>
          )}
        </div>

        {/* Icon + name */}
        <span className="text-base shrink-0">{icon}</span>
        <div className="w-32 shrink-0">
          <p className="text-sm font-semibold text-stone-200 truncate">{name}</p>
          <div className="mt-0.5">{tag}</div>
        </div>

        {/* HP bar */}
        <div className="flex-1">
          <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onHpChange(Math.max(0, hp - 1))} className="w-5 h-5 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none">−</button>
            <button onClick={() => onHpChange(Math.max(0, hp - 5))} className="w-6 h-4 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none font-mono">-5</button>
            {isEditingHp ? (
              <input autoFocus defaultValue={hp}
                onBlur={e => { onHpChange(parseInt(e.target.value) || 0); stopEditHp() }}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-10 text-center text-sm font-mono bg-transparent border-b border-stone-500 focus:outline-none text-amber-300"
              />
            ) : (
              <button onClick={startEditHp} className="text-sm font-mono text-amber-300 hover:text-amber-100 min-w-[2.5rem] text-center">
                {hp === 0 ? <span className="text-red-500">💀</span> : hp}
              </button>
            )}
            <button onClick={() => onHpChange(Math.min(maxHp, hp + 1))} className="w-5 h-5 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none">+</button>
            <button onClick={() => onHpChange(Math.min(maxHp, hp + 5))} className="w-6 h-4 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none font-mono">+5</button>
            <span className="text-xs text-stone-700 ml-1">/ {maxHp}</span>
          </div>
        </div>

        {/* Remove NPC */}
        {onRemove && (
          <button onClick={onRemove} className="text-stone-700 hover:text-red-500 transition-colors text-sm shrink-0">✕</button>
        )}
      </div>

      {/* NPC stats bar */}
      {npcStats && (
        <div className={`px-4 py-1.5 flex items-center gap-4 text-xs font-mono border-t ${isActive ? 'border-amber-800/40 bg-amber-950/20' : 'border-stone-800 bg-stone-900/20'}`}>
          {npcStats.ac != null && (
            <span className="text-stone-500">CA <span className="text-stone-300">{npcStats.ac}</span></span>
          )}
          {npcStats.attackBonus != null && (
            <span className="text-stone-500">Ataque <span className="text-stone-300">+{npcStats.attackBonus}</span></span>
          )}
          {npcStats.damage && (
            <span className="text-stone-500">Daño <span className="text-amber-400">{npcStats.damage}</span></span>
          )}
          {loot && loot.length > 0 && hp === 0 && (
            <button onClick={onToggleLoot}
              className="ml-auto text-xs px-2 py-0.5 border border-amber-800 text-amber-500 hover:bg-amber-950/40 font-serif transition-colors">
              💰 Botín {lootOpen ? '▲' : '▼'}
            </button>
          )}
        </div>
      )}

      {/* Loot panel */}
      {lootOpen && loot && loot.length > 0 && (
        <div className={`px-4 py-2 border-t ${isActive ? 'border-amber-800/40 bg-amber-950/30' : 'border-stone-800 bg-stone-950/60'}`}>
          <p className="text-[10px] text-stone-500 uppercase tracking-widest font-serif mb-1.5">Botín</p>
          <ul className="space-y-0.5">
            {loot.map(item => (
              <li key={item.id} className="text-xs font-serif text-stone-300 flex items-center gap-2">
                <span className="text-stone-600">·</span>
                {item.name}
                {item.qty > 1 && <span className="text-stone-500">×{item.qty}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
