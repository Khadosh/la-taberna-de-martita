import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import {
  D20Icon,
  StylizedArrow,
  DecorativeProgressBar,
  CrossedSwordsIcon,
  BowIcon,
  ThrownIcon,
  SpellIcon,
  CornerBracket,
  TOKEN_SIZE
} from './combat-helpers'
import type { TokenData, Pos } from './combat-types'

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
  
  // Attacker configuration
  attackerChar: any
  attackerInventory: any[]
  
  // Selected weapon / spell / mode states and setters
  selectedMode: 'melee' | 'ranged' | 'thrown' | 'spell'
  setSelectedMode: (mode: 'melee' | 'ranged' | 'thrown' | 'spell') => void
  selectedWeaponId: string | null
  setSelectedWeaponId: (id: string | null) => void
  selectedSpellIndex: string | null
  setSelectedSpellIndex: (idx: string | null) => void
  
  // AoE template states and setters
  aoeActive: boolean
  setAoeActive: (active: boolean) => void
  aoeType: 'circle' | 'cube' | 'line'
  setAoeType: (t: 'circle' | 'cube' | 'line') => void
  aoeRadius: number
  setAoeRadius: (r: number) => void
  aoePosition: Pos | null
  setAoePosition: (pos: Pos | null) => void
  
  // Targets count
  targetsInAoE: string[]
  tokens: TokenData[]
  
  // Close and Confirm handlers
  onClose: () => void
  onAttackConfirm?: (
    attackerId: string,
    targetId: string,
    hit: boolean,
    damage?: number,
    isHealing?: boolean,
    spellLevel?: number
  ) => void
  
  // Range config helper output
  rangeConfig: {
    label: string
    normal: number
    long: number
    status: 'ok' | 'too_far' | 'disadvantage_long'
    disadvantageThreat?: boolean
  }
}

export function CombatPopup({
  isPlayer,
  isExternalActive,
  externalTargeting,
  calcResult,
  toPos,
  midX,
  midY,
  zoom,
  pan,
  boardSize,
  distanceFtGrid,
  attackerChar,
  attackerInventory,
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
  targetsInAoE,
  tokens,
  onClose,
  onAttackConfirm,
  rangeConfig
}: CombatPopupProps) {
  const [popupOffset, setPopupOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  // Input states for resolution
  const [hit, setHit] = useState<boolean | null>(null)
  const [damageInput, setDamageInput] = useState('')

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('svg') || target.closest('option')) {
      return
    }
    e.stopPropagation()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: popupOffset.x,
      oy: popupOffset.y
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      e.stopPropagation()
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPopupOffset({
        x: dragStartRef.current.ox + dx,
        y: dragStartRef.current.oy + dy
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      e.stopPropagation()
      setIsDragging(false)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // Fetch spell details if in spell mode
  const { data: spellDetail } = useQuery({
    queryKey: ['dnd-spell', selectedSpellIndex],
    queryFn: async () => {
      if (!selectedSpellIndex) return null
      return dndApi.spell(selectedSpellIndex)
    },
    enabled: selectedMode === 'spell' && !!selectedSpellIndex,
    staleTime: 60 * 1000 * 10, // 10 minutes cache
  })

  // Fetch details for all attacker spells to group them by level in the dropdown
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

  // Reset inputs on mode or targets change
  useEffect(() => {
    setHit(null)
    setDamageInput('')
  }, [selectedMode, selectedSpellIndex, selectedWeaponId, calcResult.attackerName, calcResult.defenderName])

  // Resolve calculations
  const POPUP_WIDTH = 410
  const POPUP_HEIGHT = 440

  const rawPopupX = midX * zoom + pan.x
  const rawPopupY = midY * zoom + pan.y

  const currentPopupWidth = Math.min(POPUP_WIDTH, boardSize.width - 24)
  const popupX = Math.max(currentPopupWidth / 2 + 12, Math.min(boardSize.width - currentPopupWidth / 2 - 12, rawPopupX))
  const popupY = Math.max(POPUP_HEIGHT / 2 + 12, Math.min(boardSize.height - POPUP_HEIGHT / 2 - 12, rawPopupY))

  const spellLevel = selectedMode === 'spell' && spellDetail ? spellDetail.level : undefined

  const handleActionConfirm = () => {
    if (!onAttackConfirm) return
    const isHealing = calcResult.isHealing
    const resolvedHit = isHealing ? true : (hit ?? false)
    const dmg = parseInt(damageInput) || 0

    if (aoeActive && targetsInAoE.length > 0) {
      targetsInAoE.forEach(tid => {
        onAttackConfirm(
          calcResult.attackerId || effAttackFromId,
          tid,
          resolvedHit,
          dmg,
          isHealing,
          spellLevel
        )
      })
    } else {
      onAttackConfirm(
        calcResult.attackerId || effAttackFromId,
        calcResult.defenderId || effAttackToId,
        resolvedHit,
        dmg,
        isHealing,
        spellLevel
      )
    }

    onClose()
  }

  const effAttackFromId = calcResult.attackerId ?? ''
  const effAttackToId = calcResult.defenderId ?? ''

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
        zIndex: 40,
        pointerEvents: 'auto',
        background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
        border: '8px solid #23140a',
        borderRadius: 8,
        boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 25px rgba(0,0,0,0.95), 0 0 0 1.5px #120a05',
        padding: '12px 14px',
        width: 'calc(100% - 24px)',
        maxWidth: POPUP_WIDTH,
        fontFamily: 'Georgia, serif',
        boxSizing: 'border-box',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Decorative Corner Brackets */}
      <CornerBracket rotation={0} /><CornerBracket rotation={270} />
      <CornerBracket rotation={90} /><CornerBracket rotation={180} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 9, color: 'rgba(180,140,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 'bold', margin: 0 }}>
            Cálculo de Combate
          </p>
          <span style={{ fontSize: 9, color: '#fca5a5', fontFamily: 'monospace' }}>
            Dist: {distanceFtGrid} ft
          </span>
        </div>
        {!isExternalActive && (
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'rgba(180,140,60,0.6)',
              fontSize: 14, cursor: 'pointer', padding: '0 4px', margin: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s', outline: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(180,140,60,0.6)'}
            title="Cerrar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Mode Selector and Details */}
      {isExternalActive ? (
        <div style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '10px 12px', marginBottom: 12, border: '1px dashed #3c2414',
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          {externalTargeting?.attackerName && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 11,
              color: '#fbbf24',
              textAlign: 'center',
              fontStyle: 'italic',
              marginBottom: 4,
            }}>
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
            <p style={{ margin: 0, fontSize: 10, color: '#d4d4d8' }}>
              Detalle: <strong style={{ color: '#d5b88a' }}>{rangeConfig.label}</strong>
            </p>
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
        <>
          {/* Mode Selector icons */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[
              { id: 'melee' as const, label: 'Melee', icon: <CrossedSwordsIcon /> },
              { id: 'ranged' as const, label: 'Arco', icon: <BowIcon /> },
              { id: 'thrown' as const, label: 'Lanzar', icon: <ThrownIcon /> },
              { id: 'spell' as const, label: 'Conjuro', icon: <SpellIcon /> },
            ].map(m => {
              const isSel = selectedMode === m.id
              return (
                <button
                  key={m.id} onClick={() => setSelectedMode(m.id)}
                  style={{
                    flex: 1, height: 38, borderRadius: 4, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    border: isSel ? '1px solid #d5b88a' : '1px solid #3c2414',
                    background: isSel ? 'rgba(213, 184, 138, 0.15)' : 'rgba(0,0,0,0.45)',
                    color: isSel ? '#d5b88a' : '#8a6b3e',
                    boxShadow: isSel ? '0 0 8px rgba(213,184,138,0.2)' : 'none',
                    transition: 'all 0.15s',
                  }}
                  title={m.label}
                >
                  {m.icon}
                  <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                </button>
              )
            })}
          </div>

          {/* Mode details */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '8px 10px', marginBottom: 12, border: '1px solid #3c2414' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: 10, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Configuración de Acción
            </p>

            {/* MELEE MODE DETAILS */}
            {selectedMode === 'melee' && (
              <div style={{ fontSize: 11, color: '#e7e5e4' }}>
                <p style={{ margin: '4px 0' }}>⚔️ Arma: <strong style={{ color: '#d5b88a' }}>{rangeConfig.label}</strong></p>
                <p style={{ margin: '4px 0' }}>📏 Alcance: <strong>{rangeConfig.normal} ft</strong></p>
                {rangeConfig.status === 'too_far' && (
                  <p style={{ margin: '6px 0 0 0', color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>
                    ⚠️ Objetivo fuera del alcance de cuerpo a cuerpo ({distanceFtGrid} ft &gt; {rangeConfig.normal} ft)
                  </p>
                )}
              </div>
            )}

            {/* RANGED MODE DETAILS */}
            {selectedMode === 'ranged' && (
              <div style={{ fontSize: 11, color: '#e7e5e4' }}>
                <p style={{ margin: '4px 0' }}>🏹 Arma: <strong style={{ color: '#d5b88a' }}>{rangeConfig.label}</strong></p>
                <p style={{ margin: '4px 0' }}>📏 Rango de tiro: <strong>{rangeConfig.normal}/{rangeConfig.long} ft</strong></p>
                {rangeConfig.status === 'too_far' && (
                  <p style={{ margin: '6px 0 0 0', color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>
                    ❌ Fuera de rango máximo ({distanceFtGrid} ft &gt; {rangeConfig.long} ft)
                  </p>
                )}
                {rangeConfig.status === 'disadvantage_long' && (
                  <p style={{ margin: '6px 0 0 0', color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                    ⚠️ Rango Largo: Ataque con DESVENTAJA
                  </p>
                )}
                {rangeConfig.disadvantageThreat && (
                  <p style={{ margin: '4px 0 0 0', color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                    ⚠️ Amenaza en cuerpo a cuerpo: Ataque con DESVENTAJA
                  </p>
                )}
              </div>
            )}

            {/* THROWN MODE DETAILS */}
            {selectedMode === 'thrown' && (
              <div style={{ fontSize: 11, color: '#e7e5e4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 6px 0' }}>
                  <span style={{ fontSize: 11 }}>Objeto:</span>
                  {attackerChar ? (
                    <select
                      value={selectedWeaponId ?? ''}
                      onChange={e => setSelectedWeaponId(e.target.value || null)}
                      style={{ flex: 1, background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', padding: '2px 4px', fontSize: 11, borderRadius: 3, outline: 'none' }}
                    >
                      <option value="">-- Lanzamiento Genérico --</option>
                      {attackerInventory.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (x{item.quantity})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ color: '#a8a29e' }}>Cualquier objeto arrojadizo</span>
                  )}
                </div>
                <p style={{ margin: '4px 0' }}>📏 Rango arrojadizo: <strong>{rangeConfig.normal}/{rangeConfig.long} ft</strong></p>
                {rangeConfig.status === 'too_far' && (
                  <p style={{ margin: '6px 0 0 0', color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>
                    ❌ Fuera de rango máximo ({distanceFtGrid} ft &gt; {rangeConfig.long} ft)
                  </p>
                )}
                {rangeConfig.status === 'disadvantage_long' && (
                  <p style={{ margin: '6px 0 0 0', color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                    ⚠️ Rango Largo: Ataque con DESVENTAJA
                  </p>
                )}
              </div>
            )}

            {/* SPELL CAST MODE DETAILS */}
            {selectedMode === 'spell' && (
              <div style={{ fontSize: 11, color: '#e7e5e4', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Conjuro:</span>
                  {attackerChar ? (
                    <select
                      value={selectedSpellIndex ?? ''}
                      onChange={e => {
                        setSelectedSpellIndex(e.target.value || null)
                        setAoeActive(false)
                        setAoePosition(null)
                      }}
                      style={{ flex: 1, background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', padding: '2px 4px', fontSize: 11, borderRadius: 3, outline: 'none' }}
                    >
                      <option value="">-- Seleccionar Hechizo --</option>
                      {Object.keys(groupedAttackerSpells).length > 0 ? (
                        Object.keys(groupedAttackerSpells)
                          .map(Number)
                          .sort((a, b) => a - b)
                          .map(lvl => (
                            <optgroup
                              key={lvl}
                              label={lvl === 0 ? 'TRUCOS (CANTRIPS)' : `CONJUROS DE NIVEL ${lvl}`}
                              style={{ background: '#1c1208', color: '#bc9434', fontStyle: 'normal', fontWeight: 'bold' }}
                            >
                              {groupedAttackerSpells[lvl].map(sp => (
                                <option
                                  key={sp.index}
                                  value={sp.index}
                                  style={{ color: '#d5b88a', fontWeight: 'normal' }}
                                >
                                  {sp.name}
                                </option>
                              ))}
                            </optgroup>
                          ))
                      ) : (
                        (attackerChar.sheet_json.spells ?? []).map((sp: any) => (
                          <option key={sp} value={sp}>
                            {sp.replace(/-/g, ' ').toUpperCase()}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <span style={{ color: '#a8a29e' }}>Ataque mágico genérico</span>
                  )}
                </div>

                {spellDetail && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 3, fontSize: 10, border: '1px dashed #5a3c1e' }}>
                    <p style={{ margin: '2px 0' }}>📏 Rango del Hechizo: <strong>{spellDetail.range}</strong></p>
                    <p style={{ margin: '2px 0', color: '#fbbf24' }}>⌛ Ejecución: <strong>{spellDetail.casting_time}</strong> | Duración: <strong>{spellDetail.duration}</strong></p>
                    {rangeConfig.status === 'too_far' && (
                      <p style={{ margin: '4px 0 0 0', color: '#f87171', fontWeight: 'bold' }}>
                        ❌ Objetivo fuera de rango ({distanceFtGrid} ft &gt; {rangeConfig.normal} ft)
                      </p>
                    )}
                  </div>
                )}

                {/* AoE Configurator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid #3c2414', paddingTop: 6, marginTop: 2 }}>
                  <button
                    onClick={() => {
                      const nextVal = !aoeActive
                      setAoeActive(nextVal)
                      if (nextVal && !aoePosition && toPos) {
                        setAoePosition({ x: toPos.x + TOKEN_SIZE/2, y: toPos.y + TOKEN_SIZE/2 })
                      }
                    }}
                    style={{
                      background: aoeActive ? 'rgba(239, 68, 68, 0.25)' : '#2d1808',
                      border: '1px solid #784c18', color: aoeActive ? '#ef4444' : '#d5b88a',
                      padding: '3px 8px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 'bold'
                    }}
                  >
                    {aoeActive ? 'Área: Activa 🎯' : 'Proyectar Área (AoE)'}
                  </button>

                  {aoeActive && (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <select
                        value={aoeType} onChange={e => setAoeType(e.target.value as any)}
                        style={{ background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', fontSize: 9, padding: '2px 3px', borderRadius: 3 }}
                      >
                        <option value="circle">Esfera</option>
                        <option value="cube">Cubo</option>
                        <option value="line">Línea</option>
                      </select>
                      <input
                        type="number" value={aoeRadius} step={5} min={5} max={120}
                        onChange={e => setAoeRadius(Math.max(5, Math.min(120, parseInt(e.target.value) || 20)))}
                        style={{ width: 28, background: 'rgba(0,0,0,0.6)', border: '1px solid #3c2414', color: '#d5b88a', fontSize: 9, textAlign: 'center', padding: '1px 0' }}
                      />
                      <span style={{ fontSize: 9, opacity: 0.8 }}>ft</span>
                    </div>
                  )}
                </div>

                {aoeActive && (
                  <p style={{ margin: '2px 0 0 0', fontSize: 8, color: '#fbbf24', fontStyle: 'italic' }}>
                    * Haz clic en el tablero para reposicionar el área del hechizo.
                  </p>
                )}

                {aoeActive && targetsInAoE.length > 0 && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>
                    🎯 Blancos en área: {targetsInAoE.map(tid => tokens.find(t => t.id === tid)?.name).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Names Header */}
      <div style={{
        fontSize: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.8)'
      }}>
        <span style={{ color: '#d5b88a', fontWeight: 700 }}>{calcResult.attackerName}</span>
        <StylizedArrow />
        <span style={{ color: '#fca5a5', fontWeight: 600 }}>
          {aoeActive && targetsInAoE.length > 0 ? `Área (${targetsInAoE.length})` : calcResult.defenderName}
        </span>
      </div>

      {/* Probability Progress Bar / Saving Throws */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
            <span style={{ fontSize: 34, fontWeight: 'bold', color: '#d5b88a', lineHeight: 1, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
              {calcResult.isHealing ? '💚' : isPlayer ? '?' : (calcResult.saveAbility ? calcResult.spellSaveDc : (calcResult.nat20Always ? '✔' : calcResult.minRoll))}
            </span>
            {!calcResult.nat20Always && !calcResult.saveAbility && !calcResult.isHealing && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 3, marginLeft: 2, position: 'relative' }}>
                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#d5b88a', lineHeight: 1 }}>+</span>
                <div style={{ marginLeft: 2, marginTop: -4 }}>
                  <D20Icon size={14} />
                </div>
              </div>
            )}
          </div>
          <span style={{ fontSize: 8, color: 'rgba(180,140,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4, fontWeight: 600 }}>
            {calcResult.isHealing ? 'Curación' : (calcResult.saveAbility ? 'CD Salva' : 'D20 Necesita')}
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {calcResult.isHealing ? (
            <span style={{ fontSize: 12, color: '#86efac' }}>
              El hechizo recupera puntos de golpe de forma automática.
            </span>
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

      {/* Action Row */}
      {isExternalActive ? (
        <div style={{
          textAlign: 'center',
          fontSize: 11,
          color: '#d5b88a',
          fontStyle: 'italic',
          padding: '8px 0',
          border: '1px dashed #3c2414',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.2)'
        }}>
          ⏳ Esperando resolución del atacante...
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          {calcResult.isHealing ? (
            // HEALING BUTTONS
            <button
              onClick={() => setHit(true)}
              style={{
                flex: 1, height: 36, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
                background: 'linear-gradient(180deg, #15803d 0%, #166534 100%)',
                border: '2px solid #22c55e', color: '#fcd34d',
                boxShadow: '0 0 12px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              💚 Cura
            </button>
          ) : (
            // ATTACK BUTTONS
            <>
              <button
                onClick={() => setHit(true)}
                style={{
                  flex: 1, height: 36, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
                  opacity: hit === false ? 0.4 : 1,
                  ...(hit === true
                    ? {
                        background: 'linear-gradient(180deg, #3d6a45 0%, #1c3521 100%)',
                        border: '2px solid #528c5c', color: '#fcd34d',
                        boxShadow: '0 0 12px rgba(74,222,128,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4)',
                      }
                    : {
                        background: 'linear-gradient(180deg, #27272a 0%, #09090b 100%)',
                        border: '1px solid #3c2414', color: '#d5b88a',
                      })
                }}
              >
                ✔ Acierto
              </button>
              <button
                onClick={() => setHit(false)}
                style={{
                  flex: 1, height: 36, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
                  opacity: hit === true ? 0.4 : 1,
                  ...(hit === false
                    ? {
                        background: 'linear-gradient(180deg, #881337 0%, #4c0519 100%)',
                        border: '2px solid #f43f5e', color: '#fda4af',
                        boxShadow: '0 0 12px rgba(244,63,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4)',
                      }
                    : {
                        background: 'linear-gradient(180deg, #27272a 0%, #09090b 100%)',
                        border: '1px solid #3c2414', color: '#d5b88a',
                      })
                }}
              >
                ✕ Fallo
              </button>
            </>
          )}

          {/* Damage input & Apply resolution */}
          {(hit !== null || calcResult.isHealing) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 145 }}>
              <input
                type="number"
                placeholder={calcResult.isHealing ? "Cura" : "Daño"}
                value={damageInput}
                onChange={e => setDamageInput(e.target.value)}
                className="no-spinners"
                style={{
                  width: 62, height: 34, background: '#0a0502', border: '1px solid #5a3c1e', borderRadius: 4,
                  color: calcResult.isHealing ? '#86efac' : '#fca5a5', textAlign: 'center', fontSize: 14, fontFamily: 'monospace', outline: 'none',
                }}
              />
              <button
                onClick={handleActionConfirm}
                style={{
                  flex: 1, height: 34, background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
                  border: '1px solid #d5b88a', color: '#f5f5f4', fontSize: 11, fontWeight: 'bold', borderRadius: 4,
                  cursor: 'pointer', transition: 'all 0.15s', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
