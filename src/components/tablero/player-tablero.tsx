import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CombatBoard, type TokenData } from '../combat-board'
import {
  type Character,
  type BoardToken,
  maxHpFor,
  currentHpFor,
  acFor,
} from './tablero-types'

const db = supabase as any

export function PlayerTablero({ campaignId, session }: { campaignId: string; session: Session }) {
  const [activeMapUrl, setActiveMapUrl] = useState<string | null>(null)
  const [boardTokens, setBoardTokens] = useState<BoardToken[]>([])
  const [externalPositions, setExternalPositions] = useState<Record<string, { x: number; y: number }>>({})

  // Realtime target sync states
  const [externalTargeting, setExternalTargeting] = useState<any>(null)
  const channelRef = useRef<any>(null)

  // Combat sync states
  const [combatActive, setCombatActive] = useState(false)
  const [combatants, setCombatants] = useState<any[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
  })

  // Load initial data
  useEffect(() => {
    db.from('campaigns').select('active_map_url').eq('id', campaignId).single()
      .then(({ data }: { data: { active_map_url?: string | null } | null }) => { if (data?.active_map_url) setActiveMapUrl(data.active_map_url) })

    db.from('board_tokens').select('*').eq('campaign_id', campaignId)
      .then(({ data }: { data: BoardToken[] | null }) => { if (data) setBoardTokens(data) })
  }, [campaignId])

  // Realtime: board_tokens changes
  useEffect(() => {
    const channel = supabase.channel(`player-board-${campaignId}`)
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

  // Realtime: active map changes
  useEffect(() => {
    const channel = supabase.channel(`player-map-${campaignId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` },
        (payload) => {
          const url = (payload.new as { active_map_url?: string | null }).active_map_url
          setActiveMapUrl(url ?? null)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  // Realtime: custom broadcast channels
  useEffect(() => {
    const channel = supabase.channel(`campaign-board-${campaignId}`)
      .on('broadcast', { event: 'dm-targeting-updated' }, (payload) => {
        setExternalTargeting(payload.payload)
      })
      .on('broadcast', { event: 'combat-state-sync' }, (payload) => {
        const p = payload.payload
        setCombatActive(p.combatActive)
        setCombatants(p.combatants)
        setCurrentTurn(p.currentTurn)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Request current combat state from DM
          channel.send({
            type: 'broadcast',
            event: 'request-combat-state',
            payload: {}
          })
        }
      })
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  const myCharId = characters.find(c => c.user_id === session.user.id)?.id

  // Build TokenData from board_tokens, merging live HP from characters query
  // Hidden NPCs are filtered out so players can't see them
  const tokens: TokenData[] = useMemo(() => boardTokens.filter(bt => !(bt.kind === 'npc' && bt.hidden)).map(bt => {
    const char = bt.kind === 'player' ? characters.find(c => c.id === bt.entity_id) : null
    const maxHp = char ? maxHpFor(char) : bt.max_hp ?? 1
    const currentHp = char ? currentHpFor(char) : bt.current_hp ?? maxHp
    return {
      id: bt.entity_id,
      name: bt.label,
      kind: bt.kind,
      currentHp,
      maxHp,
      portraitUrl: char?.portrait_url ?? bt.portrait_url ?? null,
      isActive: false,
      showHp: bt.kind === 'player',
    }
  }), [boardTokens, characters])

  const allCombatEntities = useMemo((): { id: string; name: string; ac: number; attackBonus: number }[] => {
    const result: { id: string; name: string; ac: number; attackBonus: number }[] = []
    for (const bt of boardTokens) {
      if (bt.kind === 'player') {
        const ch = characters.find(x => x.id === bt.entity_id)
        if (!ch) continue
        const strMod = Math.floor(((ch.stats.str ?? 10) - 10) / 2)
        const dexMod = Math.floor(((ch.stats.dex ?? 10) - 10) / 2)
        const prof = Math.ceil(ch.level / 4) + 1
        result.push({
          id: ch.id,
          name: ch.name,
          ac: acFor(ch),
          attackBonus: prof + Math.max(strMod, dexMod)
        })
      } else {
        result.push({
          id: bt.entity_id,
          name: bt.label,
          ac: bt.max_hp ? 10 : 10,
          attackBonus: 0
        })
      }
    }
    return result
  }, [boardTokens, characters])

  const onTokenMoved = async (entityId: string, x: number, y: number) => {
    await db.from('board_tokens')
      .update({ x, y, updated_at: new Date().toISOString() })
      .eq('campaign_id', campaignId)
      .eq('entity_id', entityId)
  }

  const handleSelectionChange = (state: any) => {
    if (channelRef.current) {
      const attackerName = tokens.find(t => t.id === state.attackFrom)?.name || ''
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-targeting-updated',
        payload: {
          ...state,
          attackerName
        }
      })
    }
  }

  const handleAttackConfirm = (
    attackerId: string,
    targetId: string,
    hit: boolean,
    damage?: number,
    isHealing?: boolean,
    spellLevel?: number
  ) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'player-attack-applied',
        payload: {
          attackerId,
          targetId,
          hit,
          damage,
          isHealing,
          spellLevel,
        }
      })
    }
  }

  if (!activeMapUrl) {
    return (
      <div className="bg-stone-950 flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: 'calc(100vh - 100px)' }}>
        <p className="text-stone-500 font-serif text-sm">Esperando que el DM cargue un mapa...</p>
      </div>
    )
  }

  const hasToken = boardTokens.some(bt => bt.entity_id === myCharId)

  const placeMyCharacter = async () => {
    if (!myCharId) return
    const char = characters.find(c => c.id === myCharId)
    if (!char) return
    const maxHp = maxHpFor(char)
    const currentHp = char.current_hp ?? maxHp
    await db.from('board_tokens').upsert({
      campaign_id: campaignId,
      entity_id: char.id,
      kind: 'player',
      label: char.name,
      current_hp: currentHp,
      max_hp: maxHp,
      portrait_url: char.portrait_url ?? null,
      x: 5,
      y: 5,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'campaign_id,entity_id' })
  }

  const currentCombatant = combatants[currentTurn]
  const currentCombatantName = currentCombatant
    ? (currentCombatant.kind === 'player'
      ? (characters.find(c => c.id === currentCombatant.characterId)?.name || 'Jugador')
      : (currentCombatant.npc?.name || 'Enemigo'))
    : ''

  return (
    <div className="bg-stone-950 flex flex-col overflow-hidden w-full" style={{ height: 'calc(100vh - 100px)' }}>
      {/* Read-only Combat tracker header if combat is active */}
      {combatActive && (
        <div className="border-b border-stone-850 bg-stone-900/90 px-4 py-2.5 flex items-center gap-3 shrink-0">
          <span className="text-xs font-serif text-amber-500 flex items-center gap-1.5">
            <span className="animate-pulse">⚔</span> Modo Combate Activo
          </span>
          <div className="w-px h-4 bg-stone-750" />
          <span className="text-xs text-stone-300 font-serif">
            Turno actual: <strong className="text-amber-200">{currentCombatantName}</strong>
          </span>
          <span className="text-xs text-stone-500 font-mono">
            (Turno {currentTurn + 1}/{combatants.length})
          </span>
        </div>
      )}

      <div className="flex-1 relative flex overflow-hidden">
        {/* Floating badge to place character if not on board */}
        {!hasToken && myCharId && (
          <div className="absolute top-4 left-4 z-30 bg-stone-950/90 border border-amber-900/40 rounded p-3 shadow-lg max-w-[200px]">
            <p className="text-[11px] text-stone-300 font-serif mb-2 leading-snug">
              Tu personaje no está en el tablero.
            </p>
            <button
              onClick={placeMyCharacter}
              className="w-full py-1 bg-amber-900/50 hover:bg-amber-800 text-amber-200 text-xs font-serif rounded border border-amber-700/40 transition-colors"
            >
              📍 Colocar personaje
            </button>
          </div>
        )}

        <CombatBoard
          tokens={tokens}
          allEntities={allCombatEntities}
          mapUrl={activeMapUrl}
          externalPositions={externalPositions}
          onTokenMoved={onTokenMoved}
          canDrag={tokenId => tokenId === myCharId}
          characters={characters as any}
          isPlayer={true}
          externalTargeting={externalTargeting}
          onSelectionChange={handleSelectionChange}
          onAttackConfirm={handleAttackConfirm}
        />
      </div>
    </div>
  )
}
