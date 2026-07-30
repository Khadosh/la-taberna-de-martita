import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { TokenData, AttackEntity, BoardCharacter, Pos } from './combat-types'
import { TOKEN_SIZE, distToSegment, getSpellcastingAbility } from './combat-helpers'
import { useBoardInteraction } from './use-board-interaction'
import { useCombatSpell } from './use-combat-spell'
import { useT } from '../../i18n'

export function useCombatBoard({
  tokens,
  allEntities,
  externalPositions,
  onTokenDragging,
  onTokenMoved,
  canDrag,
  characters = [],
  externalTargeting = null,
  onSelectionChange,
}: {
  tokens: TokenData[]
  allEntities: AttackEntity[]
  mapUrl?: string | null
  externalPositions?: Record<string, Pos>
  onTokenMoved?: (entityId: string, x: number, y: number) => void
  onTokenDragging?: (entityId: string, x: number, y: number) => void
  canDrag?: (tokenId: string) => boolean
  characters?: BoardCharacter[]
  isPlayer?: boolean
  externalTargeting?: {
    attackFrom: string | null
    attackTo: string | null
    selectedMode: 'melee' | 'ranged' | 'thrown' | 'spell'
    selectedSpellIndex: string | null
    aoeActive: boolean
    aoeType: 'circle' | 'cube' | 'cone' | 'line'
    aoeRadius: number
    aoePosition: Pos | null
    groundTargetPos: Pos | null
    attackerName?: string
  } | null
  onSelectionChange?: (state: {
    attackFrom: string | null
    attackTo: string | null
    selectedMode: 'melee' | 'ranged' | 'thrown' | 'spell'
    selectedSpellIndex: string | null
    aoeActive: boolean
    aoeType: 'circle' | 'cube' | 'cone' | 'line'
    aoeRadius: number
    aoePosition: Pos | null
    groundTargetPos: Pos | null
  }) => void
}) {
  const t = useT()
  // Combat targeting state
  const [attackFrom, setAttackFrom] = useState<string | null>(null)
  const [attackTo, setAttackTo] = useState<string | null>(null)
  const [groundTargetPos, setGroundTargetPos] = useState<Pos | null>(null)
  const [selectedMode, setSelectedMode] = useState<'melee' | 'ranged' | 'thrown' | 'spell'>('melee')
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null)
  const [selectedSpellIndex, setSelectedSpellIndex] = useState<string | null>(null)
  const [aoeActive, setAoeActive] = useState(false)
  const [aoeType, setAoeType] = useState<'circle' | 'cube' | 'cone' | 'line'>('circle')
  const [aoeRadius, setAoeRadius] = useState(20)
  const [aoePosition, setAoePosition] = useState<Pos | null>(null)

  // Effective targeting (local takes priority; falls back to externalTargeting when observing)
  const isExternalActive = !attackFrom && !!externalTargeting?.attackFrom

  const effAttackFrom = isExternalActive ? externalTargeting!.attackFrom : attackFrom
  const effAttackTo = isExternalActive ? externalTargeting!.attackTo : attackTo
  const effGroundTargetPos = isExternalActive ? externalTargeting!.groundTargetPos : groundTargetPos
  const effSelectedMode = isExternalActive ? externalTargeting!.selectedMode : selectedMode
  const effSelectedSpellIndex = isExternalActive ? externalTargeting!.selectedSpellIndex : selectedSpellIndex
  const effAoeActive = isExternalActive ? externalTargeting!.aoeActive : aoeActive
  const effAoeType = isExternalActive ? externalTargeting!.aoeType : aoeType
  const effAoeRadius = isExternalActive ? externalTargeting!.aoeRadius : aoeRadius
  const effAoePosition = isExternalActive ? externalTargeting!.aoePosition : aoePosition

  const onTokenTap = (id: string, isOwnToken: boolean) => {
    if (isOwnToken) {
      setAttackFrom(prev => {
        if (prev === null) { setAttackTo(null); return id }
        if (prev === id) { setAttackTo(null); return null }
        setAttackTo(id); return prev
      })
    } else {
      if (attackFrom) {
        setAttackTo(prev => prev === id ? null : id)
      }
    }
  }

  const interaction = useBoardInteraction({
    tokens, externalPositions, onTokenMoved, onTokenDragging, canDrag, onTokenTap,
  })

  const { positions, boardRef, pan, zoom, gridSize } = interaction

  const effFromPos = effAttackFrom ? positions[effAttackFrom] : null
  const effToPos = effAttackTo === 'ground' ? effGroundTargetPos : (effAttackTo ? positions[effAttackTo] : null)
  const fromPos = effFromPos
  const toPos = effToPos

  const spell = useCombatSpell({
    effSelectedSpellIndex,
    toPos,
    aoeActive,
    aoePosition,
    setAoeType,
    setAoeRadius,
    setAoeActive,
    setAoePosition,
  })
  const { spellDetail, parsedSpellConfig } = spell

  // Reset when tokens are emptied (clear targeting)
  useEffect(() => {
    if (tokens.length === 0) {
      setAttackFrom(null)
      setAttackTo(null)
    }
  }, [tokens])

  // Broadcast selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        attackFrom, attackTo, selectedMode, selectedSpellIndex,
        aoeActive, aoeType, aoeRadius, aoePosition, groundTargetPos,
      })
    }
  }, [attackFrom, attackTo, selectedMode, selectedSpellIndex, aoeActive, aoeType, aoeRadius, aoePosition, groundTargetPos, onSelectionChange])

  // Fetch inventory for active attacker (players only)
  const attackerChar = useMemo(() => characters.find(c => c.id === effAttackFrom), [characters, effAttackFrom])

  const attackerNpcSpells = useMemo(() => {
    const attackerToken = tokens.find(t => t.id === effAttackFrom)
    return attackerToken?.kind === 'npc' ? (attackerToken.spells ?? []) : []
  }, [tokens, effAttackFrom])

  const { data: attackerInventory = [] } = useQuery({
    queryKey: ['inventory', effAttackFrom],
    queryFn: async () => {
      if (!effAttackFrom || !attackerChar) return []
      const { data, error } = await supabase
        .from('character_inventory').select('*')
        .eq('character_id', effAttackFrom).order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!effAttackFrom && !!attackerChar,
  })

  // Reset modes when attack selection changes
  useEffect(() => {
    if (attackTo === 'ground') {
      setSelectedMode('spell')
    } else {
      setSelectedMode('melee')
    }
    setSelectedSpellIndex(null)
    setSelectedWeaponId(null)
    setAoeActive(false)
    setAoePosition(null)
  }, [attackFrom, attackTo])

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left - pan.x) / zoom
    const canvasY = (e.clientY - rect.top - pan.y) / zoom

    if (aoeActive) {
      setAoePosition({ x: canvasX, y: canvasY })
    }

    if (attackTo === 'ground') {
      setGroundTargetPos({ x: canvasX - TOKEN_SIZE / 2, y: canvasY - TOKEN_SIZE / 2 })
      if (aoeActive) {
        setAoePosition({ x: canvasX, y: canvasY })
      }
    } else {
      if (!aoeActive && (e.target === boardRef.current || (e.target as HTMLElement).id === 'map-canvas')) {
        setAttackFrom(null)
        setAttackTo(null)
      }
    }
  }

  // Distance calculations
  const dxPx = fromPos && toPos ? Math.abs((fromPos.x + TOKEN_SIZE/2) - (toPos.x + TOKEN_SIZE/2)) : 0
  const dyPx = fromPos && toPos ? Math.abs((fromPos.y + TOKEN_SIZE/2) - (toPos.y + TOKEN_SIZE/2)) : 0
  const distancePx = fromPos && toPos ? Math.hypot(dxPx, dyPx) : 0
  const distanceFtGrid = fromPos && toPos ? Math.max(Math.round(dxPx / gridSize), Math.round(dyPx / gridSize)) * 5 : 0

  const midX = fromPos && toPos ? (fromPos.x + toPos.x) / 2 + TOKEN_SIZE / 2 : 0
  const midY = fromPos && toPos ? (fromPos.y + toPos.y) / 2 + TOKEN_SIZE / 2 : 0

  const rangeConfig = useMemo(() => {
    if (!attackerChar) {
      const attackerToken = tokens.find(t => t.id === effAttackFrom)
      if (attackerToken?.kind === 'npc') {
        const npcWeapons = (attackerToken.weapons as { name: string; damage: string }[]) ?? []
        const weaponIndex = parseInt(selectedWeaponId ?? '')
        const selectedWeapon = isNaN(weaponIndex) ? null : npcWeapons[weaponIndex]
        
        if (selectedWeapon) {
          const wName = selectedWeapon.name.toLowerCase()
          const isRanged = wName.includes('arco') || wName.includes('ballesta') || wName.includes('crossbow') || wName.includes('bow') || wName.includes('honda') || wName.includes('dardo') || wName.includes('daga')
          const hasReach = ['lanza', 'alabarda', 'látigo', 'halberd', 'glaive', 'pike', 'whip', 'reach', 'alcance'].some(w => wName.includes(w))
          
          if (isRanged) {
            let normal = 80, long = 320
            if (wName.includes('largo') || wName.includes('longbow')) { normal = 150; long = 600 }
            else if (wName.includes('mano') || wName.includes('hand')) { normal = 30; long = 120 }
            else if (wName.includes('pesad') || wName.includes('heavy')) { normal = 100; long = 400 }
            else if (wName.includes('honda') || wName.includes('sling')) { normal = 30; long = 120 }
            else if (wName.includes('dardo') || wName.includes('dart') || wName.includes('daga') || wName.includes('dagger')) { normal = 20; long = 60 }
            let status: 'ok' | 'disadvantage_long' | 'too_far' = 'ok'
            if (distanceFtGrid > long) status = 'too_far'
            else if (distanceFtGrid > normal) status = 'disadvantage_long'
            const isThreatened = tokens.some(t => t.id !== effAttackFrom && t.kind === 'npc' && positions[t.id] &&
              Math.max(Math.round(Math.abs(positions[t.id].x - fromPos!.x) / gridSize), Math.round(Math.abs(positions[t.id].y - fromPos!.y) / gridSize)) * 5 <= 5
            )
            return { label: selectedWeapon.name, normal, long, status, disadvantageThreat: isThreatened }
          } else {
            const reach = hasReach ? 10 : 5
            const status = distanceFtGrid <= reach ? 'ok' as const : 'too_far' as const
            return { label: selectedWeapon.name, normal: reach, long: reach, status }
          }
        }
      }
      const token = tokens.find(t => t.id === effAttackFrom)
      return { label: token?.name ? t('combat.attackOf', { name: token.name }) : t('combat.defaultMelee'), normal: 5, long: 5, status: distanceFtGrid <= 5 ? 'ok' as const : 'too_far' as const }
    }

    if (effSelectedMode === 'melee') {
      const mainHandItemId = attackerChar.sheet_json.equipped_slots?.main_hand
      const weapon = attackerInventory.find(i => i.id === mainHandItemId)
      const wName = weapon?.name.toLowerCase() ?? ''
      const hasReach = ['lanza', 'alabarda', 'látigo', 'halberd', 'glaive', 'pike', 'whip', 'reach', 'alcance'].some(w => wName.includes(w))
      const reach = hasReach ? 10 : 5
      const status = distanceFtGrid <= reach ? 'ok' as const : 'too_far' as const
      return { label: weapon?.name ?? t('combat.defaultMelee'), normal: reach, long: reach, status }
    }

    if (effSelectedMode === 'ranged') {
      const rangedItemId = attackerChar.sheet_json.equipped_slots?.ranged
      const weapon = attackerInventory.find(i => i.id === rangedItemId)
      const wName = weapon?.name.toLowerCase() ?? ''
      let normal = 80, long = 320
      if (wName.includes('largo') || wName.includes('longbow')) { normal = 150; long = 600 }
      else if (wName.includes('mano') || wName.includes('hand crossbow')) { normal = 30; long = 120 }
      else if (wName.includes('pesada') || wName.includes('heavy crossbow')) { normal = 100; long = 400 }
      else if (wName.includes('honda') || wName.includes('sling')) { normal = 30; long = 120 }
      else if (wName.includes('dardo') || wName.includes('dart')) { normal = 20; long = 60 }
      let status: 'ok' | 'disadvantage_long' | 'too_far' = 'ok'
      if (distanceFtGrid > long) status = 'too_far'
      else if (distanceFtGrid > normal) status = 'disadvantage_long'
      const isThreatened = tokens.some(t => t.id !== effAttackFrom && t.kind === 'npc' && positions[t.id] &&
        Math.max(Math.round(Math.abs(positions[t.id].x - fromPos!.x) / gridSize), Math.round(Math.abs(positions[t.id].y - fromPos!.y) / gridSize)) * 5 <= 5
      )
      return { label: weapon?.name ?? t('combat.defaultBow'), normal, long, status, disadvantageThreat: isThreatened }
    }

    if (effSelectedMode === 'thrown') {
      const item = attackerInventory.find(i => i.id === selectedWeaponId)
      const iName = item?.name.toLowerCase() ?? ''
      let normal = 20, long = 60
      if (iName.includes('jabalina') || iName.includes('javelin')) { normal = 30; long = 120 }
      else if (iName.includes('lanza') || iName.includes('spear')) { normal = 20; long = 60 }
      let status: 'ok' | 'disadvantage_long' | 'too_far' = 'ok'
      if (distanceFtGrid > long) status = 'too_far'
      else if (distanceFtGrid > normal) status = 'disadvantage_long'
      return { label: item?.name ?? t('combat.defaultThrown'), normal, long, status }
    }

    if (effSelectedMode === 'spell') {
      const spellRangeText = spellDetail?.range.toLowerCase() ?? ''
      let normal = 60
      let status: 'ok' | 'too_far' = 'ok'
      const match = spellRangeText.match(/(\d+)\s*(feet|foot|pie|pies|ft)/)
      if (match) normal = parseInt(match[1])
      else if (spellRangeText.includes('touch') || spellRangeText.includes('toque')) normal = 5
      if (spellRangeText.includes('self') || spellRangeText.includes('sí mismo')) normal = 0
      if (normal > 0 && distanceFtGrid > normal) status = 'too_far'
      return { label: spellDetail?.name ?? t('combat.defaultSpell'), normal, long: normal, status }
    }

    return { label: t('combat.generic'), normal: 0, long: 0, status: 'ok' as const }
  }, [effSelectedMode, attackerChar, attackerInventory, selectedWeaponId, spellDetail, distanceFtGrid, tokens, positions, effAttackFrom, fromPos, gridSize, t])

  const calcResult = useMemo(() => {
    if (!effAttackFrom || !effAttackTo) return null
    const atk = allEntities.find(e => e.id === effAttackFrom)
    const def = effAttackTo === 'ground'
      ? { id: 'ground', name: 'Terreno', ac: 10, attackBonus: 0 }
      : allEntities.find(e => e.id === effAttackTo)
    if (!atk || !def) return null

    let bonus = atk.attackBonus
    let spellSaveDc = 10
    let saveAbility: string | null = null
    let isHealing = false

    if (attackerChar && effSelectedMode === 'spell') {
      const prof = Math.ceil(attackerChar.level / 4) + 1
      const spellAbilityKey = getSpellcastingAbility(attackerChar.class)
      const abilityScore = attackerChar.stats[spellAbilityKey] ?? 10
      const abilityMod = Math.floor((abilityScore - 10) / 2)
      bonus = prof + abilityMod
      spellSaveDc = 8 + prof + abilityMod
      if (parsedSpellConfig) {
        saveAbility = parsedSpellConfig.saveAbility
        isHealing = parsedSpellConfig.isHealing
      }
    }

    const needed = def.ac - bonus
    const minRoll = Math.max(2, Math.min(20, needed))
    return {
      attackerId: atk.id,
      defenderId: def.id,
      attackerName: atk.name,
      defenderName: def.name,
      attackBonus: bonus,
      defAc: def.ac,
      minRoll,
      hitChance: Math.max(5, Math.min(100, (21 - minRoll) * 5)),
      nat20Always: needed <= 1,
      spellSaveDc,
      saveAbility,
      isHealing,
    }
  }, [effAttackFrom, effAttackTo, allEntities, effSelectedMode, attackerChar, parsedSpellConfig])

  const aoeRadiusPixels = (effAoeRadius / 5) * gridSize

  const checkTokenInAoE = (tokenPos: Pos) => {
    if (!effAoeActive || !effAoePosition) return false
    const center = { x: tokenPos.x + TOKEN_SIZE/2, y: tokenPos.y + TOKEN_SIZE/2 }
    const dist = Math.hypot(center.x - effAoePosition.x, center.y - effAoePosition.y)
    if (effAoeType === 'circle' || effAoeType === 'cone') return dist <= aoeRadiusPixels
    if (effAoeType === 'cube') {
      return (
        Math.abs(center.x - effAoePosition.x) <= aoeRadiusPixels &&
        Math.abs(center.y - effAoePosition.y) <= aoeRadiusPixels
      )
    }
    if (effAoeType === 'line') {
      if (!effFromPos) return false
      const attackerCenter = { x: effFromPos.x + TOKEN_SIZE/2, y: effFromPos.y + TOKEN_SIZE/2 }
      return distToSegment(center, attackerCenter, effAoePosition) <= gridSize / 2
    }
    return false
  }

  const targetsInAoE = useMemo(() => {
    if (!effAoeActive || !effAoePosition) return []
    return tokens.filter(t => checkTokenInAoE(positions[t.id])).map(t => t.id)
  }, [effAoeActive, effAoePosition, effAoeType, aoeRadiusPixels, tokens, positions])

  return {
    ...interaction,
    attackFrom,
    setAttackFrom,
    attackTo,
    setAttackTo,
    groundTargetPos,
    setGroundTargetPos,
    selectedMode,
    setSelectedMode,
    selectedWeaponId,
    setSelectedWeaponId,
    selectedSpellIndex,
    setSelectedSpellIndex,
    aoeActive,
    setAoeActive,
    aoeType,
    setAoeType,
    aoeRadius,
    setAoeRadius,
    aoePosition,
    setAoePosition,
    effAttackFrom,
    effAttackTo,
    effGroundTargetPos,
    effFromPos,
    effToPos,
    effSelectedMode,
    effSelectedSpellIndex,
    effAoeActive,
    effAoeType,
    effAoeRadius,
    effAoePosition,
    fromPos,
    toPos,
    midX,
    midY,
    distanceFtGrid,
    distancePx,
    calcResult,
    rangeConfig,
    checkTokenInAoE,
    targetsInAoE,
    handleBoardClick,
    attackerChar,
    attackerInventory,
    attackerNpcSpells,
    isExternalActive,
    aoeRadiusPixels,
    spellDetail,
    parsedSpellConfig,
  }
}
