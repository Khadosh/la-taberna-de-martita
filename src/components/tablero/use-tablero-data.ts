import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { type Character, type BoardToken, maxHpFor, currentHpFor } from './tablero-types'
import { syncNpcHp } from './tablero-board-utils'

const db = supabase as any

export function useTableroData(campaignId: string) {
  const queryClient = useQueryClient()

  const [boardTokens, setBoardTokens] = useState<BoardToken[]>([])
  const [externalPositions, setExternalPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [localHp, setLocalHp] = useState<Record<string, number>>({})
  const hpTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

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

  const { data: campaignNpcs = [] } = useQuery({
    queryKey: ['campaign-npcs', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs').select('*').eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

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

  // ── Character HP helpers ──────────────────────────────────────────────────

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

  const adjustBoardNpcHp = (entityId: string, newHp: number) => {
    setBoardTokens(prev => prev.map(bt =>
      bt.entity_id === entityId ? { ...bt, current_hp: newHp } : bt
    ))
    syncNpcHp(campaignId, entityId, newHp)
  }

  return {
    queryClient,
    characters,
    monsterList,
    campaignNpcs,
    boardTokens,
    setBoardTokens,
    externalPositions,
    localHp,
    patchCharacter,
    adjustCharacterHp,
    adjustBoardNpcHp,
    // expose for derived computations in the caller
    maxHpFor,
    currentHpFor,
    localHpRef: localHp,
  }
}
