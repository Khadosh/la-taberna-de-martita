import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import type { Combatant } from './tablero-types'

type AttackAppliedFn = (
  attackerId: string,
  targetId: string,
  hit: boolean,
  damage?: number,
  isHealing?: boolean,
  spellLevel?: number,
) => void

export function useCombatBroadcast(
  campaignId: string,
  tokens: any[],
  combatActive: boolean,
  combatants: Combatant[],
  currentTurn: number,
  onAttackApplied: AttackAppliedFn,
  onTargetingUpdate: (state: any) => void,
) {
  const channelRef = useRef<any>(null)
  const combatActiveRef = useRef(combatActive)
  const combatantsRef = useRef(combatants)
  const currentTurnRef = useRef(currentTurn)
  const onAttackAppliedRef = useRef<AttackAppliedFn>(onAttackApplied)

  const broadcastCombatState = useCallback((active: boolean, list: Combatant[], turn: number) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'combat-state-sync',
        payload: { combatActive: active, combatants: list, currentTurn: turn },
      })
    }
  }, [])

  useEffect(() => { onAttackAppliedRef.current = onAttackApplied }, [onAttackApplied])

  useEffect(() => {
    combatActiveRef.current = combatActive
    combatantsRef.current = combatants
    currentTurnRef.current = currentTurn
    broadcastCombatState(combatActive, combatants, currentTurn)
  }, [combatActive, combatants, currentTurn, broadcastCombatState])

  useEffect(() => {
    const channel = supabase.channel(`campaign-board-${campaignId}`)
      .on('broadcast', { event: 'player-targeting-updated' }, (payload) => {
        onTargetingUpdate(payload.payload)
      })
      .on('broadcast', { event: 'player-attack-applied' }, (payload) => {
        const { attackerId, targetId, hit, damage, isHealing, spellLevel } = payload.payload
        onAttackAppliedRef.current(attackerId, targetId, hit, damage, isHealing, spellLevel)
      })
      .on('broadcast', { event: 'request-combat-state' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'combat-state-sync',
          payload: {
            combatActive: combatActiveRef.current,
            combatants: combatantsRef.current,
            currentTurn: currentTurnRef.current,
          },
        })
      })
      .subscribe()
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [campaignId])

  const handleSelectionChange = (state: any) => {
    if (channelRef.current) {
      const attackerName = tokens.find(t => t.id === state.attackFrom)?.name || 'GM'
      channelRef.current.send({
        type: 'broadcast',
        event: 'dm-targeting-updated',
        payload: { ...state, attackerName },
      })
    }
  }

  return { handleSelectionChange }
}
