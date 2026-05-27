import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { dndApi, dndKeys, type MonsterSummary } from '../../lib/dnd-api'
import {
  type Character,
  type BoardToken,
  type Npc,
  type Combatant,
  maxHpFor,
  currentHpFor,
  getInitiative,
} from './tablero-types'
import { useNpcForm } from './use-npc-form'
import { useBoardMaps } from './use-board-maps'
import { getMonsterSpells } from '../../data/monster-spells'

const db = supabase as any

export type LogEntry = {
  id: string
  attackerName: string
  targetName: string
  hit: boolean
  damage?: number
  isHealing?: boolean
}

export function useDmTablero(campaignId: string) {
  const queryClient = useQueryClient()
  const npcInputRef = useRef<HTMLInputElement>(null)
  const npcForm = useNpcForm()
  const boardMaps = useBoardMaps(campaignId)

  const [localHp, setLocalHp] = useState<Record<string, number>>({})
  const hpTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [combatActive, setCombatActive] = useState(false)
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [npcInput, setNpcInput] = useState('')

  // Board tokens state
  const [boardTokens, setBoardTokens] = useState<BoardToken[]>([])
  const [externalPositions, setExternalPositions] = useState<Record<string, { x: number; y: number }>>({})

  // Bestiary picker
  const [showBestiary, setShowBestiary] = useState(false)
  const [bestiarySearch, setBestiarySearch] = useState('')
  const [bestiaryQty, setBestiaryQty] = useState(1)
  const [addingMonster, setAddingMonster] = useState(false)

  // Campaign NPCs picker
  const [showCampaignNpcs, setShowCampaignNpcs] = useState(false)
  const [campaignNpcSearch, setCampaignNpcSearch] = useState('')

  // Inline editing
  const [editingHp, setEditingHp] = useState<string | null>(null)
  const [conditionPickerFor, setConditionPickerFor] = useState<string | null>(null)
  const [showLongRestConfirm, setShowLongRestConfirm] = useState(false)
  const [showNpcBar, setShowNpcBar] = useState(false)

  // Combat log
  const [combatLog, setCombatLog] = useState<LogEntry[]>([])
  const [showLog, setShowLog] = useState(true)

  // Realtime target sync
  const [externalTargeting, setExternalTargeting] = useState<any>(null)
  const channelRef = useRef<any>(null)

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
  })

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

  // ── Realtime: characters ──────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`session-characters-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `campaign_id=eq.${campaignId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [campaignId, queryClient])

  // ── Realtime: board_tokens ────────────────────────────────────────────────

  useEffect(() => {
    db.from('board_tokens').select('*').eq('campaign_id', campaignId)
      .then(({ data }: { data: BoardToken[] | null }) => { if (data) setBoardTokens(data) })
  }, [campaignId])

  useEffect(() => {
    const channel = supabase.channel(`dm-board-${campaignId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board_tokens', filter: `campaign_id=eq.${campaignId}` },
        (payload) => {
          const bt = payload.new as BoardToken
          setBoardTokens(prev => {
            if (prev.find(t => t.entity_id === bt.entity_id)) return prev
            return [...prev, bt]
          })
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'board_tokens', filter: `campaign_id=eq.${campaignId}` },
        (payload) => {
          const bt = payload.new as BoardToken
          setBoardTokens(prev => prev.map(t => t.entity_id === bt.entity_id ? bt : t))
          setExternalPositions(prev => ({ ...prev, [bt.entity_id]: { x: bt.x, y: bt.y } }))
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'board_tokens', filter: `campaign_id=eq.${campaignId}` },
        (payload) => {
          const old = payload.old as { entity_id: string }
          setBoardTokens(prev => prev.filter(t => t.entity_id !== old.entity_id))
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  // ── Helpers ──────────────────────────────────────────────────────────────

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
      await queryClient.refetchQueries({ queryKey: ['campaign-characters', campaignId] })
      setLocalHp(prev => { const n = { ...prev }; delete n[id]; return n })
      await db.from('board_tokens')
        .update({ current_hp: clamped, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId).eq('entity_id', id)
    }, 600)
  }

  // ── Board token sync helpers ──────────────────────────────────────────────

  const upsertTokenToBoard = async (token: { id: string; name: string; kind: 'player' | 'npc'; currentHp: number; maxHp: number; portraitUrl: string | null; isActive: boolean; npcLevel?: number }) => {
    await db.from('board_tokens').upsert({
      campaign_id: campaignId,
      entity_id: token.id,
      kind: token.kind,
      label: token.name,
      current_hp: token.currentHp,
      max_hp: token.maxHp,
      portrait_url: token.portraitUrl ?? null,
      npc_level: token.npcLevel ?? null,
      x: 5, y: 5,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'campaign_id,entity_id', ignoreDuplicates: true })
  }

  const removeTokenFromBoard = async (entityId: string) => {
    await db.from('board_tokens').delete().eq('campaign_id', campaignId).eq('entity_id', entityId)
  }

  const onTokenMoved = async (entityId: string, x: number, y: number) => {
    await db.from('board_tokens')
      .update({ x, y, updated_at: new Date().toISOString() })
      .eq('campaign_id', campaignId).eq('entity_id', entityId)
  }

  // ── Combat ───────────────────────────────────────────────────────────────

  const startCombat = async () => {
    const list: Combatant[] = []

    for (const c of characters) {
      const dexMod = Math.floor(((c.stats.dex ?? 10) - 10) / 2)
      const init = Math.ceil(Math.random() * 20) + dexMod
      list.push({ kind: 'player', characterId: c.id, initiative: init })

      const maxHp = maxHpFor(c)
      await upsertTokenToBoard({
        id: c.id, name: c.name, kind: 'player',
        currentHp: localHp[c.id] ?? currentHpFor(c),
        maxHp, portraitUrl: c.portrait_url ?? null, isActive: false,
      })
    }

    const npcTokens = boardTokens.filter(bt => bt.kind === 'npc')
    for (const bt of npcTokens) {
      const init = Math.ceil(Math.random() * 20)
      const existing = combatants.find(c => c.kind === 'npc' && (c as { kind: 'npc'; npc: Npc }).npc.id === bt.entity_id) as { kind: 'npc'; npc: Npc } | undefined
      list.push({
        kind: 'npc',
        npc: {
          id: bt.entity_id,
          name: bt.label,
          currentHp: bt.current_hp ?? 10,
          maxHp: bt.max_hp ?? 10,
          initiative: init,
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
    const init = Math.ceil(Math.random() * 20)
    const npc: Npc = { id: crypto.randomUUID(), name, currentHp: hp, maxHp: hp, initiative: init }
    const newCombatant: Combatant = { kind: 'npc', npc }
    if (combatActive) {
      setCombatants(prev => {
        const list = [...prev, newCombatant]
        list.sort((a, b) => getInitiative(b) - getInitiative(a))
        return list
      })
    }
    setNpcInput('')
    npcInputRef.current?.focus()
    await upsertTokenToBoard({ id: npc.id, name: npc.name, kind: 'npc', currentHp: npc.currentHp, maxHp: npc.maxHp, portraitUrl: null, isActive: false })
  }

  const updateNpc = (id: string, patch: Partial<Npc>) => {
    setCombatants(prev =>
      prev.map(c => c.kind === 'npc' && c.npc.id === id ? { ...c, npc: { ...c.npc, ...patch } } : c)
    )
    if (patch.currentHp !== undefined) {
      db.from('board_tokens')
        .update({ current_hp: patch.currentHp, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId).eq('entity_id', id)
        .then(() => {})
    }
  }

  const removeNpc = async (id: string) => {
    setCombatants(prev => {
      const next = prev.filter(c => !(c.kind === 'npc' && c.npc.id === id))
      setCurrentTurn(t => Math.min(t, Math.max(0, next.length - 1)))
      return next
    })
    await removeTokenFromBoard(id)
  }

  const addNpcFromMonster = async (summary: MonsterSummary, count: number, opts?: { role?: string; portraitUrl?: string; level?: number; customSpells?: string[] }) => {
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
          await upsertTokenToBoard({ id: c.npc.id, name: c.npc.name, kind: 'npc', currentHp: c.npc.currentHp, maxHp: c.npc.maxHp, portraitUrl: c.npc.portraitUrl ?? null, npcLevel: c.npc.level, isActive: false })
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
    const npc: Npc = {
      id: crypto.randomUUID(),
      name: `${cn.name}${suffix}`,
      currentHp: hp, maxHp,
      initiative: Math.ceil(Math.random() * 20) + dexMod,
      ac: cn.armor_class ?? undefined,
      attackBonus: cn.attack_bonus ?? undefined,
      damage: cn.damage ?? undefined,
      npcType: cn.race ?? undefined,
      loot,
    }
    if (combatActive) {
      setCombatants(prev => {
        const list = [...prev, { kind: 'npc' as const, npc }]
        list.sort((a, b) => getInitiative(b) - getInitiative(a))
        return list
      })
    }
    await upsertTokenToBoard({ id: npc.id, name: npc.name, kind: 'npc', currentHp: npc.currentHp, maxHp: npc.maxHp, portraitUrl: null, isActive: false })
  }

  const createCustomNpc = async () => {
    const { npcFormName, npcFormHp, npcFormAc, npcFormAttack, npcFormDamage, npcFormType, npcFormItems, resetNpcForm } = npcForm
    if (!npcFormName.trim() || npcFormHp < 1) return
    const npc: Npc = {
      id: crypto.randomUUID(),
      name: npcFormName.trim(),
      currentHp: npcFormHp, maxHp: npcFormHp,
      initiative: Math.ceil(Math.random() * 20),
      ac: npcFormAc, attackBonus: npcFormAttack,
      damage: npcFormDamage.trim() || undefined,
      npcType: npcFormType,
      loot: npcFormItems.filter(i => i.name.trim()),
    }
    if (combatActive) {
      setCombatants(prev => {
        const list = [...prev, { kind: 'npc' as const, npc }]
        list.sort((a, b) => getInitiative(b) - getInitiative(a))
        return list
      })
    }
    await upsertTokenToBoard({ id: npc.id, name: npc.name, kind: 'npc', currentHp: npc.currentHp, maxHp: npc.maxHp, portraitUrl: null, isActive: false })
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
          const maxHp = maxHpFor(ch)
          const curHp = localHp[ch.id] ?? currentHpFor(ch)
          return [{ id: ch.id, name: ch.name, kind: 'player', currentHp: curHp, maxHp, portraitUrl: ch.portrait_url, isActive: idx === currentTurn }]
        }
        return [{ id: c.npc.id, name: c.npc.name, kind: 'npc', currentHp: c.npc.currentHp, maxHp: c.npc.maxHp, portraitUrl: c.npc.portraitUrl ?? null, role: c.npc.role, level: c.npc.level, spells: c.npc.spells, isActive: idx === currentTurn }]
      })
    } else {
      return boardTokens.map(bt => {
        const char = bt.kind === 'player' ? characters.find(c => c.id === bt.entity_id) : null
        const maxHp = char ? maxHpFor(char) : bt.max_hp ?? 10
        const currentHp = char ? (localHp[char.id] ?? currentHpFor(char)) : bt.current_hp ?? maxHp
        return { id: bt.entity_id, name: bt.label, kind: bt.kind, currentHp, maxHp, portraitUrl: char?.portrait_url ?? bt.portrait_url ?? null, isActive: false }
      })
    }
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

  // ── Realtime broadcast ────────────────────────────────────────────────────

  const handleSelectionChange = (state: any) => {
    if (channelRef.current) {
      const attackerName = tokens.find(t => t.id === state.attackFrom)?.name || 'GM'
      channelRef.current.send({ type: 'broadcast', event: 'dm-targeting-updated', payload: { ...state, attackerName } })
    }
  }

  const handleAttackConfirm = useCallback(async (
    attackerId: string,
    targetId: string,
    hit: boolean,
    damage?: number,
    isHealing?: boolean,
    spellLevel?: number
  ) => {
    if (hit && damage && damage > 0) {
      const playerChar = characters.find(c => c.id === targetId)
      if (playerChar) {
        const maxHp = maxHpFor(playerChar)
        const curHp = localHp[playerChar.id] ?? currentHpFor(playerChar)
        const nextHp = isHealing ? Math.min(maxHp, curHp + damage) : Math.max(0, curHp - damage)
        adjustCharacterHp(playerChar.id, curHp, maxHp, nextHp)
      } else {
        const npcCombatant = combatants.find(c => c.kind === 'npc' && (c as any).npc.id === targetId) as { kind: 'npc'; npc: Npc } | undefined
        if (npcCombatant) {
          const nextHp = isHealing
            ? Math.min(npcCombatant.npc.maxHp ?? 100, npcCombatant.npc.currentHp + damage)
            : Math.max(0, npcCombatant.npc.currentHp - damage)
          updateNpc(npcCombatant.npc.id, { currentHp: nextHp })
        }
      }
    }
    const attacker = allCombatEntities.find(e => e.id === attackerId)
    const target = targetId === 'ground'
      ? { id: 'ground', name: 'Terreno' }
      : allCombatEntities.find(e => e.id === targetId)
    if (attacker && target) {
      setCombatLog(prev => [{
        id: crypto.randomUUID(), attackerName: attacker.name, targetName: target.name, hit, damage, isHealing,
      }, ...prev].slice(0, 30))
    }

    if (spellLevel && spellLevel > 0) {
      const attackerChar = characters.find(c => c.id === attackerId)
      if (attackerChar) {
        const slotsUsed = attackerChar.sheet_json.spell_slots_used ?? {}
        const currentUsed = slotsUsed[String(spellLevel)] ?? 0
        const newSheet = { ...attackerChar.sheet_json, spell_slots_used: { ...slotsUsed, [String(spellLevel)]: currentUsed + 1 } }
        queryClient.setQueryData(['campaign-characters', campaignId], (old: any) => {
          if (!Array.isArray(old)) return old
          return old.map(c => c.id === attackerId ? { ...c, sheet_json: newSheet } : c)
        })
        await supabase.from('characters').update({ sheet_json: newSheet as any }).eq('id', attackerId)
      }
    }
  }, [characters, localHp, combatants, allCombatEntities, campaignId, queryClient])

  const onAttackConfirmRef = useRef<any>(null)
  useEffect(() => { onAttackConfirmRef.current = handleAttackConfirm }, [handleAttackConfirm])

  const combatActiveRef = useRef(combatActive)
  const combatantsRef = useRef(combatants)
  const currentTurnRef = useRef(currentTurn)

  const broadcastCombatState = useCallback((active: boolean, list: Combatant[], turn: number) => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'combat-state-sync', payload: { combatActive: active, combatants: list, currentTurn: turn } })
    }
  }, [])

  useEffect(() => {
    combatActiveRef.current = combatActive
    combatantsRef.current = combatants
    currentTurnRef.current = currentTurn
    broadcastCombatState(combatActive, combatants, currentTurn)
  }, [combatActive, combatants, currentTurn, broadcastCombatState])

  useEffect(() => {
    const channel = supabase.channel(`campaign-board-${campaignId}`)
      .on('broadcast', { event: 'player-targeting-updated' }, (payload) => {
        setExternalTargeting(payload.payload)
      })
      .on('broadcast', { event: 'player-attack-applied' }, (payload) => {
        const { attackerId, targetId, hit, damage, isHealing, spellLevel } = payload.payload
        if (onAttackConfirmRef.current) {
          onAttackConfirmRef.current(attackerId, targetId, hit, damage, isHealing, spellLevel)
        }
      })
      .on('broadcast', { event: 'request-combat-state' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'combat-state-sync',
          payload: { combatActive: combatActiveRef.current, combatants: combatantsRef.current, currentTurn: currentTurnRef.current }
        })
      })
      .subscribe()
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  return {
    queryClient,
    npcInputRef,
    localHp,
    combatActive,
    combatants,
    currentTurn,
    npcInput, setNpcInput,
    boardTokens,
    externalPositions,
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
    combatLog,
    showLog, setShowLog,
    externalTargeting,
    characters,
    filteredMonsters,
    filteredCampaignNpcs,
    patchCharacter,
    adjustCharacterHp,
    onTokenMoved,
    startCombat, endCombat, nextTurn,
    addNpc, updateNpc, removeNpc,
    addNpcFromMonster, addNpcFromCampaign, createCustomNpc,
    partyLongRest,
    handleAttackConfirm,
    tokens,
    allCombatEntities,
    handleSelectionChange,
    ...npcForm,
    ...boardMaps,
  }
}
