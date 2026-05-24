import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import {
  D20Icon,
  StylizedArrow,
  DecorativeProgressBar,
  CornerBracket,
} from './combat-helpers'
import type { TokenData, Pos } from './combat-types'
import { CombatModePanel } from './combat-mode-panel'
import { CombatActionRow } from './combat-action-row'

type CombatPopupProps = {
  isPlayer: boolean
  isExternalActive: boolean
  externalTargeting: any
  calcResult: any
  fromPos: Pos
  toPos: Pos
  midX: number
  midY: number
  zoom: number
  pan: Pos
  boardSize: { width: number; height: number }
  distanceFtGrid: number
  distancePx: number
  gridSize: number

  attackerChar: any
  attackerInventory: any[]

  selectedMode: 'melee' | 'ranged' | 'thrown' | 'spell'
  setSelectedMode: (mode: 'melee' | 'ranged' | 'thrown' | 'spell') => void
  selectedWeaponId: string | null
  setSelectedWeaponId: (id: string | null) => void
  selectedSpellIndex: string | null
  setSelectedSpellIndex: (idx: string | null) => void

  aoeActive: boolean
  setAoeActive: (active: boolean) => void
  aoeType: 'circle' | 'cube' | 'line'
  setAoeType: (t: 'circle' | 'cube' | 'line') => void
  aoeRadius: number
  setAoeRadius: (r: number) => void
  aoePosition: Pos | null
  setAoePosition: (pos: Pos | null) => void

  targetsInAoE: string[]
  tokens: TokenData[]

  onClose: () => void
  onAttackConfirm?: (
    attackerId: string,
    targetId: string,
    hit: boolean,
    damage?: number,
    isHealing?: boolean,
    spellLevel?: number
  ) => void

  rangeConfig: {
    label: string
    normal: number
    long: number
    status: 'ok' | 'too_far' | 'disadvantage_long'
    disadvantageThreat?: boolean
  }
}

export function CombatPopup({
  isPlayer, isExternalActive, externalTargeting, calcResult,
  toPos, midX, midY, zoom, pan, boardSize, distanceFtGrid,
  attackerChar, attackerInventory,
  selectedMode, setSelectedMode,
  selectedWeaponId, setSelectedWeaponId,
  selectedSpellIndex, setSelectedSpellIndex,
  aoeActive, setAoeActive,
  aoeType, setAoeType,
  aoeRadius, setAoeRadius,
  aoePosition, setAoePosition,
  targetsInAoE, tokens,
  onClose, onAttackConfirm, rangeConfig,
}: CombatPopupProps) {
  const [popupOffset, setPopupOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const [hit, setHit] = useState<boolean | null>(null)
  const [damageInput, setDamageInput] = useState('')

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('svg') || target.closest('option')) return
    e.stopPropagation()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY, ox: popupOffset.x, oy: popupOffset.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    e.stopPropagation()
    setPopupOffset({
      x: dragStartRef.current.ox + (e.clientX - dragStartRef.current.x),
      y: dragStartRef.current.oy + (e.clientY - dragStartRef.current.y),
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    e.stopPropagation()
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // ── Spell queries ──────────────────────────────────────────────────────────

  const { data: spellDetail } = useQuery({
    queryKey: ['dnd-spell', selectedSpellIndex],
    queryFn: async () => selectedSpellIndex ? dndApi.spell(selectedSpellIndex) : null,
    enabled: selectedMode === 'spell' && !!selectedSpellIndex,
    staleTime: 60 * 1000 * 10,
  })

  const attackerSpells = useMemo(() => attackerChar?.sheet_json.spells ?? [], [attackerChar])
  const attackerSpellsQueries = useQueries({
    queries: attackerSpells.map((index: string) => ({
      queryKey: dndKeys.spell(index),
      queryFn: () => dndApi.spell(index),
      staleTime: Infinity,
    }))
  })
  const groupedAttackerSpells = useMemo(() => {
    const groups: Record<number, { index: string; name: string }[]> = {}
    attackerSpellsQueries.forEach(res => {
      if (res.data) {
        const data = res.data as any
        const lvl = data.level
        if (!groups[lvl]) groups[lvl] = []
        groups[lvl].push({ index: data.index, name: data.name })
      }
    })
    return groups
  }, [attackerSpellsQueries])

  // ── Reset on context change ────────────────────────────────────────────────

  useEffect(() => {
    setHit(null)
    setDamageInput('')
  }, [selectedMode, selectedSpellIndex, selectedWeaponId, calcResult.attackerName, calcResult.defenderName])

  // ── Positioning ────────────────────────────────────────────────────────────

  const POPUP_WIDTH = 410
  const POPUP_HEIGHT = 440
  const rawPopupX = midX * zoom + pan.x
  const rawPopupY = midY * zoom + pan.y
  const currentPopupWidth = Math.min(POPUP_WIDTH, boardSize.width - 24)
  const popupX = Math.max(currentPopupWidth / 2 + 12, Math.min(boardSize.width - currentPopupWidth / 2 - 12, rawPopupX))
  const popupY = Math.max(POPUP_HEIGHT / 2 + 12, Math.min(boardSize.height - POPUP_HEIGHT / 2 - 12, rawPopupY))

  // ── Confirm ────────────────────────────────────────────────────────────────

  const spellLevel = selectedMode === 'spell' && spellDetail ? spellDetail.level : undefined
  const effAttackFromId = calcResult.attackerId ?? ''
  const effAttackToId = calcResult.defenderId ?? ''

  const handleActionConfirm = () => {
    if (!onAttackConfirm) return
    const isHealing = calcResult.isHealing
    const resolvedHit = isHealing ? true : (hit ?? false)
    const dmg = parseInt(damageInput) || 0
    if (aoeActive && targetsInAoE.length > 0) {
      targetsInAoE.forEach(tid => onAttackConfirm(calcResult.attackerId || effAttackFromId, tid, resolvedHit, dmg, isHealing, spellLevel))
    } else {
      onAttackConfirm(calcResult.attackerId || effAttackFromId, calcResult.defenderId || effAttackToId, resolvedHit, dmg, isHealing, spellLevel)
    }
    onClose()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: popupX + popupOffset.x,
        top: popupY + popupOffset.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 40, pointerEvents: 'auto',
        background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
        border: '8px solid #23140a', borderRadius: 8,
        boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 25px rgba(0,0,0,0.95), 0 0 0 1.5px #120a05',
        padding: '12px 14px',
        width: 'calc(100% - 24px)', maxWidth: POPUP_WIDTH,
        fontFamily: 'Georgia, serif', boxSizing: 'border-box',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <CornerBracket rotation={0} /><CornerBracket rotation={270} />
      <CornerBracket rotation={90} /><CornerBracket rotation={180} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 9, color: 'rgba(180,140,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 'bold', margin: 0 }}>
            Cálculo de Combate
          </p>
          <span style={{ fontSize: 9, color: '#fca5a5', fontFamily: 'monospace' }}>Dist: {distanceFtGrid} ft</span>
        </div>
        {!isExternalActive && (
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(180,140,60,0.6)', fontSize: 14, cursor: 'pointer', padding: '0 4px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s', outline: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(180,140,60,0.6)'}
            title="Cerrar"
          >✕</button>
        )}
      </div>

      {/* Mode config — external observer or interactive */}
      {isExternalActive ? (
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '10px 12px', marginBottom: 12, border: '1px dashed #3c2414', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {externalTargeting?.attackerName && (
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '6px 10px', borderRadius: 4, fontSize: 11, color: '#fbbf24', textAlign: 'center', fontStyle: 'italic', marginBottom: 4 }}>
              👁️ Viendo preparación de {externalTargeting.attackerName} en tiempo real
            </div>
          )}
          <p style={{ margin: 0, fontSize: 11, color: '#fbbf24', fontWeight: 'bold' }}>
            Acción Seleccionada: {
              selectedMode === 'melee' ? '⚔️ Cuerpo a Cuerpo (Melee)' :
              selectedMode === 'ranged' ? '🏹 Ataque a Distancia (Arco)' :
              selectedMode === 'thrown' ? '🎯 Objeto Arrojadizo (Lanzar)' :
              '✨ Conjuro (Spell)'
            }
          </p>
          {rangeConfig.label && (
            <p style={{ margin: 0, fontSize: 10, color: '#d4d4d8' }}>Detalle: <strong style={{ color: '#d5b88a' }}>{rangeConfig.label}</strong></p>
          )}
          {aoeActive && (
            <p style={{ margin: 0, fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>
              Plantilla de Área: Activa ({aoeType === 'circle' ? 'Esfera' : aoeType === 'cube' ? 'Cubo' : 'Línea'} de {aoeRadius} ft)
            </p>
          )}
          {aoeActive && targetsInAoE.length > 0 && (
            <p style={{ margin: 0, fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>
              🎯 Blancos en área: {targetsInAoE.map(tid => tokens.find(t => t.id === tid)?.name).join(', ')}
            </p>
          )}
        </div>
      ) : (
        <CombatModePanel
          selectedMode={selectedMode} setSelectedMode={setSelectedMode}
          rangeConfig={rangeConfig} distanceFtGrid={distanceFtGrid}
          attackerChar={attackerChar} attackerInventory={attackerInventory}
          selectedWeaponId={selectedWeaponId} setSelectedWeaponId={setSelectedWeaponId}
          selectedSpellIndex={selectedSpellIndex} setSelectedSpellIndex={setSelectedSpellIndex}
          spellDetail={spellDetail} groupedAttackerSpells={groupedAttackerSpells}
          aoeActive={aoeActive} setAoeActive={setAoeActive}
          aoeType={aoeType} setAoeType={setAoeType}
          aoeRadius={aoeRadius} setAoeRadius={setAoeRadius}
          aoePosition={aoePosition} setAoePosition={setAoePosition}
          targetsInAoE={targetsInAoE} tokens={tokens} toPos={toPos}
        />
      )}

      {/* Attacker → Defender header */}
      <div style={{ fontSize: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        <span style={{ color: '#d5b88a', fontWeight: 700 }}>{calcResult.attackerName}</span>
        <StylizedArrow />
        <span style={{ color: '#fca5a5', fontWeight: 600 }}>
          {aoeActive && targetsInAoE.length > 0 ? `Área (${targetsInAoE.length})` : calcResult.defenderName}
        </span>
      </div>

      {/* Probability bar / saving throw display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            <span style={{ fontSize: 34, fontWeight: 'bold', color: '#d5b88a', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {calcResult.isHealing ? '💚' : isPlayer ? '?' : (calcResult.saveAbility ? calcResult.spellSaveDc : (calcResult.nat20Always ? '✔' : calcResult.minRoll))}
            </span>
            {!calcResult.nat20Always && !calcResult.saveAbility && !calcResult.isHealing && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 3, marginLeft: 2, position: 'relative' }}>
                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#d5b88a', lineHeight: 1 }}>+</span>
                <div style={{ marginLeft: 2, marginTop: -4 }}><D20Icon size={14} /></div>
              </div>
            )}
          </div>
          <span style={{ fontSize: 8, color: 'rgba(180,140,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4, fontWeight: 600 }}>
            {calcResult.isHealing ? 'Curación' : (calcResult.saveAbility ? 'CD Salva' : 'D20 Necesita')}
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {calcResult.isHealing ? (
            <span style={{ fontSize: 12, color: '#86efac' }}>El hechizo recupera puntos de golpe de forma automática.</span>
          ) : calcResult.saveAbility ? (
            <span style={{ fontSize: 12, color: '#fca5a5' }}>
              Objetivo debe salvar <strong style={{ color: '#d5b88a' }}>{calcResult.saveAbility}</strong> contra CD {isPlayer ? <strong>?</strong> : <strong>{calcResult.spellSaveDc}</strong>}
            </span>
          ) : (
            <>
              <span style={{ fontSize: 12, color: '#d4d4d8' }}>
                {calcResult.attackBonus >= 0 ? `+${calcResult.attackBonus}` : calcResult.attackBonus} vs CA {isPlayer ? '?' : calcResult.defAc}
              </span>
              {!isPlayer && <DecorativeProgressBar percentage={calcResult.hitChance} />}
              {isPlayer && (
                <span style={{ fontSize: 10, color: 'rgba(180,140,60,0.6)', fontStyle: 'italic' }}>
                  (La clase de armadura y probabilidad están ocultas)
                </span>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ height: 2, borderTop: '1.5px solid #1a0f07', borderBottom: '1.5px solid #3c2414', margin: '6px 0 12px 0', opacity: 0.8 }} />

      <CombatActionRow
        isExternalActive={isExternalActive}
        hit={hit} setHit={setHit}
        damageInput={damageInput} setDamageInput={setDamageInput}
        calcResult={calcResult}
        onConfirm={handleActionConfirm}
      />
    </div>
  )
}
