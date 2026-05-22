import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { dndApi, dndKeys } from '../lib/dnd-api'
import type { TokenData, AttackEntity, BoardCharacter, Pos } from './combat/combat-types'
import { TOKEN_SIZE, distToSegment, getSpellcastingAbility } from './combat/combat-helpers'
import { CombatToken } from './combat/combat-token'
import { CombatPopup } from './combat/combat-popup'

export type { TokenData, AttackEntity, BoardCharacter }

export function CombatBoard({
  tokens,
  allEntities,
  mapUrl,
  externalPositions,
  onTokenMoved,
  canDrag,
  onAttackConfirm,
  characters = [],
  isPlayer = false,
  externalTargeting = null,
  onSelectionChange,
}: {
  tokens: TokenData[]
  allEntities: AttackEntity[]
  mapUrl?: string | null
  externalPositions?: Record<string, Pos>
  onTokenMoved?: (entityId: string, x: number, y: number) => void
  canDrag?: (tokenId: string) => boolean
  onAttackConfirm?: (
    attackerId: string,
    targetId: string,
    hit: boolean,
    damage?: number,
    isHealing?: boolean,
    spellLevel?: number
  ) => void
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
  const boardRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Record<string, Pos>>({})
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)
  const dragRef = useRef<{ id: string; mx: number; my: number; tx: number; ty: number; moved: boolean; draggable: boolean } | null>(null)
  
  // Track board container size for clamping attack popup positions
  const [boardSize, setBoardSize] = useState({ width: 800, height: 600 })
  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setBoardSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(board)
    return () => observer.disconnect()
  }, [])

  // Pan and Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })
  
  // Grid Overlay
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(60) // size of a cell (5 ft) in pixels
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 })

  // Combat Attack Popup states
  const [attackFrom, setAttackFrom] = useState<string | null>(null)
  const [attackTo, setAttackTo] = useState<string | null>(null)
  const [groundTargetPos, setGroundTargetPos] = useState<Pos | null>(null)

  // 4 Modes: 'melee' | 'ranged' | 'thrown' | 'spell'
  const [selectedMode, setSelectedMode] = useState<'melee' | 'ranged' | 'thrown' | 'spell'>('melee')
  
  // Custom item thrown state
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null)
  
  // Spell state
  const [selectedSpellIndex, setSelectedSpellIndex] = useState<string | null>(null)

  // AoE visual template state
  const [aoeActive, setAoeActive] = useState(false)
  const [aoeType, setAoeType] = useState<'circle' | 'cube' | 'cone' | 'line'>('circle')
  const [aoeRadius, setAoeRadius] = useState(20) // in feet
  const [aoePosition, setAoePosition] = useState<Pos | null>(null)

  // Effective targeting state (uses local state if local attackFrom is set, otherwise falls back to externalTargeting if active)
  const isExternalActive = !attackFrom && !!externalTargeting?.attackFrom
  
  const effAttackFrom = isExternalActive ? externalTargeting!.attackFrom : attackFrom
  const effAttackTo = isExternalActive ? externalTargeting!.attackTo : attackTo
  const effGroundTargetPos = isExternalActive ? externalTargeting!.groundTargetPos : groundTargetPos
  
  const effFromPos = effAttackFrom ? positions[effAttackFrom] : null
  const effToPos = effAttackTo === 'ground' ? effGroundTargetPos : (effAttackTo ? positions[effAttackTo] : null)
  
  const effSelectedMode = isExternalActive ? externalTargeting!.selectedMode : selectedMode
  const effSelectedSpellIndex = isExternalActive ? externalTargeting!.selectedSpellIndex : selectedSpellIndex
  
  const effAoeActive = isExternalActive ? externalTargeting!.aoeActive : aoeActive
  const effAoeType = isExternalActive ? externalTargeting!.aoeType : aoeType
  const effAoeRadius = isExternalActive ? externalTargeting!.aoeRadius : aoeRadius
  const effAoePosition = isExternalActive ? externalTargeting!.aoePosition : aoePosition

  // Map to common local naming to minimize downstream modifications
  const fromPos = effFromPos
  const toPos = effToPos

  // Broadcast selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        attackFrom,
        attackTo,
        selectedMode,
        selectedSpellIndex,
        aoeActive,
        aoeType,
        aoeRadius,
        aoePosition,
        groundTargetPos,
      })
    }
  }, [attackFrom, attackTo, selectedMode, selectedSpellIndex, aoeActive, aoeType, aoeRadius, aoePosition, groundTargetPos, onSelectionChange])

  // Fetch inventory for active attacker (players only)
  const attackerChar = useMemo(() => characters.find(c => c.id === effAttackFrom), [characters, effAttackFrom])
  
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

  // Fetch selected spell details
  const { data: spellDetail } = useQuery({
    queryKey: dndKeys.spell(effSelectedSpellIndex ?? ''),
    queryFn: () => dndApi.spell(effSelectedSpellIndex!),
    enabled: !!effSelectedSpellIndex,
    staleTime: Infinity,
  })

  // Detect AoE and Saving throws dynamically from spell description
  const parsedSpellConfig = useMemo(() => {
    if (!spellDetail) return null
    const descText = spellDetail.desc?.join(' ').toLowerCase() ?? ''
    
    // 1. Detect AoE
    let type: 'circle' | 'cube' | 'cone' | 'line' = 'circle'
    let size = 20
    let hasAoe = false

    if (descText.includes('sphere') || descText.includes('radius') || descText.includes('esfera') || descText.includes('radio')) {
      type = 'circle'
      hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(radius|esfera|radio|sphere)/)
      if (match) size = parseInt(match[1])
    } else if (descText.includes('cone') || descText.includes('cono')) {
      type = 'cone'
      hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(cone|cono)/)
      if (match) size = parseInt(match[1])
    } else if (descText.includes('cube') || descText.includes('cubo')) {
      type = 'cube'
      hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(cube|cubo)/)
      if (match) size = parseInt(match[1])
    } else if (descText.includes('line') || descText.includes('línea')) {
      type = 'line'
      hasAoe = true
      const match = descText.match(/(\d+)-(foot|pie|pies|ft)\s*(line|línea)/)
      if (match) size = parseInt(match[1])
    }

    // 2. Detect Saving Throw
    let saveAbility: string | null = null
    if (descText.includes('saving throw') || descText.includes('salvación') || descText.includes('salva de')) {
      if (descText.includes('dexterity') || descText.includes('destreza')) saveAbility = 'DES'
      else if (descText.includes('constitution') || descText.includes('constitución')) saveAbility = 'CON'
      else if (descText.includes('wisdom') || descText.includes('sabiduría')) saveAbility = 'SAB'
      else if (descText.includes('strength') || descText.includes('fuerza')) saveAbility = 'FUE'
      else if (descText.includes('intelligence') || descText.includes('inteligencia')) saveAbility = 'INT'
      else if (descText.includes('charisma') || descText.includes('carisma')) saveAbility = 'CAR'
    }

    // 3. Detect Healing
    const isHealing = spellDetail.name.toLowerCase().includes('cure') ||
      spellDetail.name.toLowerCase().includes('heal') ||
      spellDetail.name.toLowerCase().includes('curar') ||
      spellDetail.name.toLowerCase().includes('sana') ||
      descText.includes('regains') || descText.includes('recupera')

    return { type, size, hasAoe, saveAbility, isHealing }
  }, [spellDetail])

  // Apply parsed spell configs
  useEffect(() => {
    if (parsedSpellConfig) {
      if (parsedSpellConfig.hasAoe) {
        setAoeType(parsedSpellConfig.type)
        setAoeRadius(parsedSpellConfig.size)
        setAoeActive(true)
      } else {
        setAoeActive(false)
      }
    }
  }, [parsedSpellConfig])

  // Auto-initialize AoE position to target token position
  useEffect(() => {
    if (aoeActive && toPos && !aoePosition) {
      setAoePosition({ x: toPos.x + TOKEN_SIZE / 2, y: toPos.y + TOKEN_SIZE / 2 })
    }
  }, [aoeActive, toPos])

  // Reset hit/damage/modes when attack selection changes
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

  useEffect(() => { draggingRef.current = dragging }, [dragging])

  // Merge external positions (realtime)
  useEffect(() => {
    if (!externalPositions || Object.keys(externalPositions).length === 0) return
    const board = boardRef.current
    if (!board) return
    const { width, height } = board.getBoundingClientRect()
    if (width === 0) return
    setPositions(prev => {
      const next = { ...prev }
      for (const [id, pos] of Object.entries(externalPositions)) {
        if (draggingRef.current === id) continue
        next[id] = { x: pos.x * width, y: pos.y * height }
      }
      return next
    })
  }, [externalPositions])

  // Initialize positions on load
  useEffect(() => {
    if (tokens.length === 0) {
      setPositions({})
      setAttackFrom(null)
      setAttackTo(null)
      return
    }
    const init = () => {
      const board = boardRef.current
      if (!board) return
      const { width, height } = board.getBoundingClientRect()
      if (width === 0) {
        requestAnimationFrame(init)
        return
      }
      setPositions(prev => {
        const next = { ...prev }
        const newlyPlaced: { id: string; nx: number; ny: number }[] = []
        tokens.forEach((t, idx) => {
          if (!next[t.id]) {
            const cols = Math.max(4, Math.ceil(Math.sqrt(tokens.length)))
            const row = Math.floor(idx / cols)
            const col = idx % cols
            const padding = 20
            const nx = padding + col * (TOKEN_SIZE + 15)
            const ny = padding + row * (TOKEN_SIZE + 20)
            next[t.id] = { x: nx, y: ny }
            newlyPlaced.push({ id: t.id, nx: nx / width, ny: ny / height })
          }
        })
        return next
      })
      if (onTokenMoved) {
        // notify newly placed tokens if needed
      }
    }
    requestAnimationFrame(init)
  }, [tokens])

  // Pointer move handler (drag token or pan map)
  useEffect(() => {
    if (!activeDragId) return
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      // Divide offset by current zoom factor so token moves precisely under the pointer
      const dx = (e.clientX - d.mx) / zoom
      const dy = (e.clientY - d.my) / zoom
      if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true
      if (d.moved && d.draggable) {
        const board = boardRef.current
        if (!board) return
        const rect = board.getBoundingClientRect()
        setPositions(prev => ({
          ...prev,
          [activeDragId]: {
            x: Math.max(0, Math.min(rect.width - TOKEN_SIZE, d.tx + dx)),
            y: Math.max(0, Math.min(rect.height - TOKEN_SIZE - 34, d.ty + dy)),
          },
        }))
      }
    }
    const handleUp = (e: PointerEvent) => {
      const d = dragRef.current
      if (d && !d.moved) {
        const id = d.id
        
        // Check if we own this token
        const isOwnToken = !canDrag || canDrag(id)
        
        if (isOwnToken) {
          setAttackFrom(prev => {
            if (prev === null) { setAttackTo(null); return id }
            if (prev === id) { setAttackTo(null); return null }
            setAttackTo(id); return prev
          })
        } else {
          // If they click someone else's token, they can target/select it
          // only if they have an active attacker selected.
          if (attackFrom) {
            setAttackTo(prev => prev === id ? null : id)
          }
        }
      } else if (d && d.moved && d.draggable && onTokenMoved) {
        const board = boardRef.current
        if (board) {
          const rect = board.getBoundingClientRect()
          const dx = (e.clientX - d.mx) / zoom
          const dy = (e.clientY - d.my) / zoom
          const x = Math.max(0, Math.min(rect.width - TOKEN_SIZE, d.tx + dx))
          const y = Math.max(0, Math.min(rect.height - TOKEN_SIZE - 34, d.ty + dy))
          onTokenMoved(d.id, x / rect.width, y / rect.height)
        }
      }
      setActiveDragId(null)
      setDragging(null)
      dragRef.current = null
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [activeDragId, zoom])

  // Zoom wheel handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const nextZoom = e.deltaY < 0 ? Math.min(zoom + 0.1, 4) : Math.max(zoom - 0.1, 0.5)
    
    // Zoom centered on mouse cursor
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const canvasMouseX = (mouseX - pan.x) / zoom
    const canvasMouseY = (mouseY - pan.y) / zoom
    
    setZoom(nextZoom)
    setPan({
      x: mouseX - canvasMouseX * nextZoom,
      y: mouseY - canvasMouseY * nextZoom,
    })
  }

  // Pan Gestures (Left click + Space, or Middle click, or Right click on background)
  const handleBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Check if pointerdown was on map background or canvas
    const isBackground = e.target === boardRef.current || (e.target as HTMLElement).id === 'map-canvas'
    if (!isBackground) return

    // Allow panning if holding space, or using middle/right click
    const isMiddleClick = e.button === 1
    const isRightClick = e.button === 2
    const isSpacePan = e.button === 0 && (e.nativeEvent as any).spaceKey
    
    if (isMiddleClick || isRightClick || isSpacePan || e.button === 0) {
      e.stopPropagation()
      setIsPanning(true)
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const handleBgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      e.stopPropagation()
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      })
    }
  }

  const handleBgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      e.stopPropagation()
      setIsPanning(false)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

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

  // Get coordinates for active tokens
  const midX = fromPos && toPos ? (fromPos.x + toPos.x) / 2 + TOKEN_SIZE / 2 : 0
  const midY = fromPos && toPos ? (fromPos.y + toPos.y) / 2 + TOKEN_SIZE / 2 : 0

  // Calculate distances
  const dxPx = fromPos && toPos ? Math.abs((fromPos.x + TOKEN_SIZE/2) - (toPos.x + TOKEN_SIZE/2)) : 0
  const dyPx = fromPos && toPos ? Math.abs((fromPos.y + TOKEN_SIZE/2) - (toPos.y + TOKEN_SIZE/2)) : 0
  const distancePx = fromPos && toPos ? Math.hypot(dxPx, dyPx) : 0
  
  // D&D 5e Diagonal rule / grid measurement (Chebyshev distance)
  const distanceFtGrid = fromPos && toPos ? Math.max(Math.round(dxPx / gridSize), Math.round(dyPx / gridSize)) * 5 : 0

  // Range checkers based on mode and character inventory
  const rangeConfig = useMemo(() => {
    if (!attackerChar) return { label: 'Melee', normal: 5, long: 5, status: 'ok' as const }

    if (effSelectedMode === 'melee') {
      const mainHandItemId = attackerChar.sheet_json.equipped_slots?.main_hand
      const weapon = attackerInventory.find(i => i.id === mainHandItemId)
      const wName = weapon?.name.toLowerCase() ?? ''
      
      const hasReach = ['lanza', 'alabarda', 'látigo', 'halberd', 'glaive', 'pike', 'whip', 'reach', 'alcance'].some(w => wName.includes(w))
      const reach = hasReach ? 10 : 5
      
      const status = distanceFtGrid <= reach ? 'ok' as const : 'too_far' as const
      return { label: weapon?.name ?? 'Cuerpo a Cuerpo', normal: reach, long: reach, status }
    }

    if (effSelectedMode === 'ranged') {
      const rangedItemId = attackerChar.sheet_json.equipped_slots?.ranged
      const weapon = attackerInventory.find(i => i.id === rangedItemId)
      const wName = weapon?.name.toLowerCase() ?? ''

      let normal = 80
      let long = 320
      if (wName.includes('largo') || wName.includes('longbow')) { normal = 150; long = 600 }
      else if (wName.includes('mano') || wName.includes('hand crossbow')) { normal = 30; long = 120 }
      else if (wName.includes('pesada') || wName.includes('heavy crossbow')) { normal = 100; long = 400 }
      else if (wName.includes('honda') || wName.includes('sling')) { normal = 30; long = 120 }
      else if (wName.includes('dardo') || wName.includes('dart')) { normal = 20; long = 60 }

      let status: 'ok' | 'disadvantage_long' | 'too_far' = 'ok'
      if (distanceFtGrid > long) status = 'too_far'
      else if (distanceFtGrid > normal) status = 'disadvantage_long'

      // Check melee threat (if there is an enemy adjacent within 5 ft)
      const isThreatened = tokens.some(t => t.id !== effAttackFrom && t.kind === 'npc' && positions[t.id] && 
        Math.max(Math.round(Math.abs(positions[t.id].x - fromPos!.x) / gridSize), Math.round(Math.abs(positions[t.id].y - fromPos!.y) / gridSize)) * 5 <= 5
      )

      return {
        label: weapon?.name ?? 'Arco Corto',
        normal,
        long,
        status,
        disadvantageThreat: isThreatened
      }
    }

    if (effSelectedMode === 'thrown') {
      const item = attackerInventory.find(i => i.id === selectedWeaponId)
      const iName = item?.name.toLowerCase() ?? ''

      let normal = 20
      let long = 60
      if (iName.includes('jabalina') || iName.includes('javelin')) { normal = 30; long = 120 }
      else if (iName.includes('lanza') || iName.includes('spear')) { normal = 20; long = 60 }

      let status: 'ok' | 'disadvantage_long' | 'too_far' = 'ok'
      if (distanceFtGrid > long) status = 'too_far'
      else if (distanceFtGrid > normal) status = 'disadvantage_long'

      return { label: item?.name ?? 'Lanzamiento Genérico', normal, long, status }
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

      return { label: spellDetail?.name ?? 'Conjuro', normal, long: normal, status }
    }

    return { label: 'Generic', normal: 0, long: 0, status: 'ok' as const }
  }, [effSelectedMode, attackerChar, attackerInventory, selectedWeaponId, spellDetail, distanceFtGrid, tokens, positions, effAttackFrom, fromPos, gridSize])

  // Calculate attack/spell statistics
  const calcResult = useMemo(() => {
    if (!effAttackFrom || !effAttackTo) return null
    const atk = allEntities.find(e => e.id === effAttackFrom)
    const def = effAttackTo === 'ground'
      ? { id: 'ground', name: 'Terreno', ac: 10, attackBonus: 0 }
      : allEntities.find(e => e.id === effAttackTo)
    if (!atk || !def) return null

    // Fetch attack stats
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

  // AoE Targets checker
  const aoeRadiusPixels = (effAoeRadius / 5) * gridSize
  
  const checkTokenInAoE = (_tokenId: string, tokenPos: Pos) => {
    if (!effAoeActive || !effAoePosition) return false
    const center = { x: tokenPos.x + TOKEN_SIZE/2, y: tokenPos.y + TOKEN_SIZE/2 }
    const dist = Math.hypot(center.x - effAoePosition.x, center.y - effAoePosition.y)

    if (effAoeType === 'circle' || effAoeType === 'cone') {
      return dist <= aoeRadiusPixels
    }
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
    return tokens
      .filter(t => checkTokenInAoE(t.id, positions[t.id]))
      .map(t => t.id)
  }, [effAoeActive, effAoePosition, effAoeType, aoeRadiusPixels, tokens, positions, effFromPos])

  const bgUrl = mapUrl ?? '/assets/images/mapa_combate.png'

  return (
    <div
      ref={boardRef}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        touchAction: 'none', userSelect: 'none',
      }}
      onWheel={handleWheel}
      onPointerDown={handleBgPointerDown}
      onPointerMove={handleBgPointerMove}
      onPointerUp={handleBgPointerUp}
      onClick={handleBoardClick}
    >
      {/* Zoomed Canvas */}
      <div
        id="map-canvas"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          backgroundImage: `url('${bgUrl}')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Grid Pattern overlay */}
        {showGrid && (
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(213, 184, 138, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(213, 184, 138, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`,
              backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* SVGs (arrows, templates) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
          <defs>
            <marker id="cb-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(251,191,36,0.95)" />
            </marker>
          </defs>

          {/* Attack Arrow */}
          {fromPos && toPos && (
            <g>
              <line
                x1={fromPos.x + TOKEN_SIZE / 2} y1={fromPos.y + TOKEN_SIZE / 2}
                x2={toPos.x + TOKEN_SIZE / 2} y2={toPos.y + TOKEN_SIZE / 2}
                stroke="rgba(251,191,36,0.8)" strokeWidth="2.5" strokeDasharray="10 5"
                markerEnd="url(#cb-arrow)"
              />
              {/* Distance badge inline */}
              <rect
                x={midX - 52} y={midY - 10} width="104" height="20" rx="3"
                fill="rgba(10, 5, 2, 0.88)" stroke="#8a6b3e" strokeWidth="1"
              />
              <text
                x={midX} y={midY + 4}
                fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#d5b88a"
                textAnchor="middle"
              >
                {distanceFtGrid} ft ({Math.round(distancePx / gridSize)} c)
              </text>
            </g>
          )}

          {/* AoE visual template overlay */}
          {effAoeActive && effAoePosition && (
            <g>
              {effAoeType === 'circle' && (
                <circle
                  cx={effAoePosition.x} cy={effAoePosition.y} r={aoeRadiusPixels}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {effAoeType === 'cube' && (
                <rect
                  x={effAoePosition.x - aoeRadiusPixels} y={effAoePosition.y - aoeRadiusPixels}
                  width={aoeRadiusPixels * 2} height={aoeRadiusPixels * 2}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {effAoeType === 'cone' && (
                <circle
                  cx={effAoePosition.x} cy={effAoePosition.y} r={aoeRadiusPixels}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {effAoeType === 'line' && fromPos && (
                <line
                  x1={fromPos.x + TOKEN_SIZE/2} y1={fromPos.y + TOKEN_SIZE/2}
                  x2={effAoePosition.x} y2={effAoePosition.y}
                  stroke="#ef4444" strokeWidth={gridSize} strokeLinecap="round" opacity="0.35"
                />
              )}
            </g>
          )}
        </svg>

        {/* Tokens Container */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
          {tokens.map(token => {
            const pos = positions[token.id]
            if (!pos) return null
            
            const isFrom = effAttackFrom === token.id
            const isTo = effAttackTo === token.id
            const inAoE = checkTokenInAoE(token.id, pos)

            return (
              <CombatToken
                key={token.id}
                data={token}
                pos={pos}
                isFrom={isFrom}
                isTo={isTo}
                inAoE={inAoE}
                onPointerDown={e => {
                  if (e.button === 2) {
                    e.stopPropagation()
                    return
                  }
                  if (e.button !== 0) return
                  e.stopPropagation()
                  const p = positions[token.id] ?? { x: 0, y: 0 }
                  const draggable = !canDrag || canDrag(token.id)
                  if (draggable) {
                    setDragging(token.id)
                  }
                  setActiveDragId(token.id)
                  dragRef.current = { id: token.id, mx: e.clientX, my: e.clientY, tx: p.x, ty: p.y, moved: false, draggable }
                }}
                onContextMenu={e => {
                  if (isPlayer) {
                    // Check if they own this token (players can only start targeting from their own character)
                    const isOwnToken = !canDrag || canDrag(token.id)
                    if (!isOwnToken) {
                      e.preventDefault()
                      return
                    }
                  }
                  e.preventDefault()
                  e.stopPropagation()
                  setAttackFrom(token.id)
                  setAttackTo('ground')
                  setGroundTargetPos({ x: pos.x, y: pos.y })
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Grid Overlay Controls (Top-Right overlay) */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 30,
        background: 'rgba(10,5,2,0.85)', border: '1px solid #8a6b3e', borderRadius: 4,
        padding: '6px 10,px', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'auto',
      }}>
        <button
          onClick={() => setShowGrid(g => !g)}
          style={{
            background: showGrid ? '#5c4322' : 'transparent', border: '1px solid #8a6b3e',
            color: '#d5b88a', fontSize: 10, padding: '3px 8px', borderRadius: 3, cursor: 'pointer', outline: 'none'
          }}
        >
          {showGrid ? 'Ocultar Rejilla' : 'Mostrar Rejilla'}
        </button>

        {showGrid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, opacity: 0.7 }}>Celda:</span>
            <input
              type="number" value={gridSize}
              onChange={e => setGridSize(Math.max(20, Math.min(200, parseInt(e.target.value) || 60)))}
              style={{ width: 38, background: 'rgba(0,0,0,0.6)', border: '1px solid #3c2414', color: '#d5b88a', fontSize: 10, textAlign: 'center', fontFamily: 'monospace', outline: 'none', padding: '2px 0' }}
            />
            <span style={{ fontSize: 9, opacity: 0.7 }}>px</span>

            <div style={{ display: 'flex', gap: 2, marginLeft: 6 }}>
              <button onClick={() => setGridOffset(o => ({ ...o, x: o.x - 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>◀</button>
              <button onClick={() => setGridOffset(o => ({ ...o, y: o.y - 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>▲</button>
              <button onClick={() => setGridOffset(o => ({ ...o, y: o.y + 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>▼</button>
              <button onClick={() => setGridOffset(o => ({ ...o, x: o.x + 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>▶</button>
            </div>
          </div>
        )}
      </div>

      {/* Attack calculation popup */}
      {calcResult && fromPos && toPos && (
        <CombatPopup
          key={`${calcResult.attackerId}-${calcResult.defenderId}`}
          isPlayer={isPlayer}
          isExternalActive={isExternalActive}
          externalTargeting={externalTargeting}
          calcResult={calcResult}
          fromPos={fromPos}
          toPos={toPos}
          midX={midX}
          midY={midY}
          zoom={zoom}
          pan={pan}
          boardSize={boardSize}
          distanceFtGrid={distanceFtGrid}
          distancePx={distancePx}
          gridSize={gridSize}
          attackerChar={attackerChar}
          attackerInventory={attackerInventory}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          selectedWeaponId={selectedWeaponId}
          setSelectedWeaponId={setSelectedWeaponId}
          selectedSpellIndex={selectedSpellIndex}
          setSelectedSpellIndex={setSelectedSpellIndex}
          aoeActive={aoeActive}
          setAoeActive={setAoeActive}
          aoeType={aoeType as any}
          setAoeType={setAoeType as any}
          aoeRadius={aoeRadius}
          setAoeRadius={setAoeRadius}
          aoePosition={aoePosition}
          setAoePosition={setAoePosition}
          targetsInAoE={targetsInAoE}
          tokens={tokens}
          onClose={() => {
            setAttackFrom(null)
            setAttackTo(null)
          }}
          onAttackConfirm={onAttackConfirm}
          rangeConfig={rangeConfig}
        />
      )}
    </div>
  )
}
