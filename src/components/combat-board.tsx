import React, { useEffect, useMemo, useRef, useState } from 'react'

const TOKEN_SIZE = 76
const R = 34
const CIRC = 2 * Math.PI * R

export type TokenData = {
  id: string
  name: string
  kind: 'player' | 'npc'
  currentHp: number
  maxHp: number
  portraitUrl?: string | null
  isActive: boolean
  showHp?: boolean
}

export type AttackEntity = {
  id: string
  name: string
  ac: number
  attackBonus: number
}

type Pos = { x: number; y: number }

function arcColor(pct: number): string {
  if (pct > 0.5) return '#16a34a'
  if (pct > 0.25) return '#d97706'
  return '#dc2626'
}

function CombatToken({
  data, pos, isFrom, isTo, onPointerDown,
}: {
  data: TokenData
  pos: Pos
  isFrom: boolean
  isTo: boolean
  onPointerDown: (e: React.PointerEvent) => void
}) {
  const pct = data.maxHp > 0 ? Math.max(0, Math.min(1, data.currentHp / data.maxHp)) : 0
  const arc = pct * CIRC
  const color = arcColor(pct)
  const half = TOKEN_SIZE / 2

  return (
    <div
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: TOKEN_SIZE, touchAction: 'none', cursor: 'grab',
        zIndex: isFrom || isTo ? 20 : 10,
      }}
      onPointerDown={onPointerDown}
    >
      <div style={{ position: 'relative', width: TOKEN_SIZE, height: TOKEN_SIZE }}>
        {/* Active turn glow */}
        {data.isActive && (
          <div style={{
            position: 'absolute', inset: -5, borderRadius: '50%', pointerEvents: 'none',
            boxShadow: '0 0 0 3px rgba(251,191,36,0.9), 0 0 22px rgba(251,191,36,0.45)',
          }} />
        )}
        {/* Attacker ring (blue) */}
        {isFrom && (
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%', pointerEvents: 'none',
            boxShadow: '0 0 0 3px rgba(96,165,250,0.9)',
          }} />
        )}
        {/* Target ring (red) */}
        {isTo && (
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%', pointerEvents: 'none',
            boxShadow: '0 0 0 3px rgba(248,113,113,0.9)',
          }} />
        )}
        {/* HP arc SVG */}
        {data.showHp !== false && (
          <svg
            width={TOKEN_SIZE} height={TOKEN_SIZE}
            viewBox={`0 0 ${TOKEN_SIZE} ${TOKEN_SIZE}`}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <circle cx={half} cy={half} r={R} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={7} />
            <circle
              cx={half} cy={half} r={R}
              fill="none" stroke={color} strokeWidth={6}
              strokeDasharray={`${arc} ${CIRC}`}
              strokeLinecap="round"
              transform={`rotate(-90, ${half}, ${half})`}
            />
          </svg>
        )}
        {/* Portrait */}
        <div style={{
          position: 'absolute', inset: 9, borderRadius: '50%', overflow: 'hidden',
          background: data.kind === 'player' ? '#1a2e1e' : '#2e1a1a',
          border: '1.5px solid rgba(0,0,0,0.6)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
        }}>
          {data.portraitUrl ? (
            <img
              src={data.portraitUrl} alt={data.name} draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700,
              color: data.kind === 'player' ? '#86efac' : '#fca5a5',
            }}>
              {data.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      {/* Name */}
      <p style={{
        textAlign: 'center', fontSize: 10, fontFamily: 'Georgia, serif',
        color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,1)',
        marginTop: 3, lineHeight: 1.2, pointerEvents: 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: TOKEN_SIZE,
      }}>
        {data.name}
      </p>
      {/* HP */}
      {data.showHp !== false && (
        <p style={{
          textAlign: 'center', fontSize: 9, fontFamily: 'monospace',
          color: 'rgba(255,230,150,0.9)', textShadow: '0 1px 2px rgba(0,0,0,1)',
          lineHeight: 1.1, pointerEvents: 'none',
        }}>
          {data.currentHp}/{data.maxHp}
        </p>
      )}
    </div>
  )
}

// ── Visual enhancements for Attack Calculation ───────────────────────────────

function CrossedSwordsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="5" y1="15" x2="9" y2="19" />
      <line x1="20" y1="20" x2="4" y2="4" />
      <line x1="19" y1="15" x2="15" y2="19" />
    </svg>
  )
}

function CrossedArrowsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="4" y1="20" x2="20" y2="4" />
      <polyline points="15,4 20,4 20,9" />
      <line x1="20" y1="20" x2="4" y2="4" />
      <polyline points="9,20 4,20 4,15" />
    </svg>
  )
}

function D20Icon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#d5b88a" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
      <polygon points="12,2 22,7.5 22,16.5 12,22 2,16.5 2,7.5" />
      <polygon points="12,2 12,8 2,7.5" />
      <polygon points="12,2 12,8 22,7.5" />
      <polygon points="12,8 22,7.5 17,14" />
      <polygon points="12,8 2,7.5 7,14" />
      <polygon points="12,8 7,14 17,14" />
      <polygon points="7,14 17,14 12,22" />
      <polygon points="2,16.5 7,14 12,22" />
      <polygon points="22,16.5 17,14 12,22" />
      <polygon points="2,7.5 2,16.5 7,14" />
      <polygon points="22,7.5 22,16.5 17,14" />
      <text x="12" y="12.5" fontSize="5" fontFamily="monospace" fontWeight="bold" fill="#d5b88a" stroke="none" textAnchor="middle">D20</text>
    </svg>
  )
}

function StylizedArrow() {
  return (
    <svg width="28" height="10" viewBox="0 0 36 12" fill="none" style={{ opacity: 0.8, flexShrink: 0 }}>
      <line x1="6" y1="6" x2="30" y2="6" stroke="#bc9434" strokeWidth="1.5" />
      <path d="M 28 3 L 34 6 L 28 9 L 29.5 6 Z" fill="#bc9434" />
      <path d="M 4 2 L 8 6 L 4 10" stroke="#bc9434" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 2 3 L 5 6 L 2 9" stroke="#bc9434" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CornerBracket({ rotation }: { rotation: 0 | 90 | 180 | 270 }) {
  const styles: React.CSSProperties = {
    position: 'absolute',
    width: 20,
    height: 20,
    transform: `rotate(${rotation}deg)`,
    pointerEvents: 'none',
    zIndex: 5,
  }

  if (rotation === 0) {
    styles.top = -8
    styles.left = -8
  } else if (rotation === 90) {
    styles.top = -8
    styles.right = -8
  } else if (rotation === 180) {
    styles.bottom = -8
    styles.right = -8
  } else if (rotation === 270) {
    styles.bottom = -8
    styles.left = -8
  }

  return (
    <svg viewBox="0 0 24 24" style={styles}>
      <defs>
        <linearGradient id={`brass-grad-${rotation}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a6b3e" />
          <stop offset="50%" stopColor="#d5b88a" />
          <stop offset="100%" stopColor="#5c4322" />
        </linearGradient>
      </defs>
      <path
        d="M 0 0 L 24 0 L 24 5 L 5 5 L 5 24 L 0 24 Z"
        fill={`url(#brass-grad-${rotation})`}
        filter="drop-shadow(1px 1.5px 1px rgba(0,0,0,0.8))"
      />
      <circle cx="11" cy="11" r="2.2" fill="#1c1208" />
      <circle cx="11" cy="11" r="1.5" fill="#d5b88a" />
    </svg>
  )
}

function DecorativeProgressBar({ percentage }: { percentage: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <style>{`
        @keyframes lightning-wiggle {
          0% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(-1px) scaleY(1.15); }
          100% { transform: translateY(0px) scaleY(1); }
        }
        /* Hide HTML5 Up/Down Spinners */
        .no-spinners::-webkit-outer-spin-button,
        .no-spinners::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinners {
          -moz-appearance: textfield;
        }
      `}</style>
      <div style={{
        position: 'relative',
        flex: 1,
        height: 12,
        background: '#20120a',
        border: '2px solid #5a3c1e',
        borderRadius: 4,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}>
        {/* Laurel leaves pattern (background) */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
          <defs>
            <pattern id="laurel" width="16" height="12" patternUnits="userSpaceOnUse">
              <path d="M 1 6 Q 4 3 8 6 Q 4 9 1 6" fill="#bc9434" />
              <path d="M 15 6 Q 12 3 8 6 Q 12 9 15 6" fill="#bc9434" />
              <line x1="0" y1="6" x2="16" y2="6" stroke="#bc9434" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#laurel)" />
        </svg>

        {/* Fill container */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${percentage}%`,
          background: 'linear-gradient(90deg, rgba(59,130,246,0.3) 0%, rgba(96,165,250,0.7) 70%, rgba(255,255,255,0.95) 100%)',
          boxShadow: '0 0 8px #3b82f6, 0 0 15px rgba(96,165,250,0.6)',
          transition: 'width 0.4s ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          overflow: 'hidden',
        }}>
          {/* Lightning bolt effect */}
          <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 20" style={{ position: 'absolute', inset: 0 }}>
            <path
              d="M 0 10 Q 15 12 30 8 T 60 12 T 90 8 T 100 10"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="1.5"
              style={{
                filter: 'drop-shadow(0 0 3px #60a5fa)',
                animation: 'lightning-wiggle 0.6s infinite ease-in-out',
              }}
            />
            <path
              d="M 0 10 L 15 7 L 30 13 L 45 8 L 60 12 L 75 6 L 90 14 L 100 10"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.75"
              style={{
                filter: 'drop-shadow(0 0 2px #93c5fd)',
              }}
            />
          </svg>
        </div>
      </div>
      
      {/* Percentage text */}
      <span style={{
        fontSize: 13,
        fontFamily: 'Georgia, serif',
        fontWeight: 'bold',
        color: '#d5b88a',
        minWidth: 36,
        textAlign: 'right',
        textShadow: '0 2px 4px rgba(0,0,0,0.9)',
      }}>
        {percentage}%
      </span>
    </div>
  )
}

export function CombatBoard({
  tokens,
  allEntities,
  mapUrl,
  externalPositions,
  onTokenMoved,
  canDrag,
  onAttackConfirm,
}: {
  tokens: TokenData[]
  allEntities: AttackEntity[]
  mapUrl?: string | null
  externalPositions?: Record<string, Pos>
  onTokenMoved?: (entityId: string, x: number, y: number) => void
  canDrag?: (tokenId: string) => boolean
  onAttackConfirm?: (attackerId: string, targetId: string, hit: boolean, damage?: number) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Record<string, Pos>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)
  const dragRef = useRef<{ id: string; mx: number; my: number; tx: number; ty: number; moved: boolean } | null>(null)
  const [attackFrom, setAttackFrom] = useState<string | null>(null)
  const [attackTo, setAttackTo] = useState<string | null>(null)
  const [hit, setHit] = useState<boolean | null>(null)
  const [damage, setDamage] = useState('')

  // Reset hit/damage when attack selection changes
  React.useEffect(() => { setHit(null); setDamage('') }, [attackFrom, attackTo])

  // Keep draggingRef in sync so the externalPositions effect can read it without being a dep
  useEffect(() => { draggingRef.current = dragging }, [dragging])

  // Merge external position updates (from realtime) — only runs when server data changes,
  // NOT when dragging ends (avoiding the stale-position snap-back bug).
  // externalPositions stores normalized (0-1) coords; denormalize to pixels using current board size.
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPositions])

  // Initialize positions when combat starts or new tokens are added
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
      if (width === 0) { requestAnimationFrame(init); return }
      const newlyPlaced: { id: string; nx: number; ny: number }[] = []
      setPositions(prev => {
        const next = { ...prev }
        const players = tokens.filter(t => t.kind === 'player')
        const npcs = tokens.filter(t => t.kind === 'npc')
        const layout = (group: TokenData[], startFrac: number) => {
          const cols = Math.max(1, Math.ceil(Math.sqrt(group.length)))
          group.forEach((t, i) => {
            if (next[t.id]) return
            const col = i % cols
            const row = Math.floor(i / cols)
            const x = Math.min(width - TOKEN_SIZE - 10, width * startFrac + col * (TOKEN_SIZE + 28) + 20)
            const y = Math.min(height - TOKEN_SIZE - 50, height * 0.12 + row * (TOKEN_SIZE + 46))
            next[t.id] = { x, y }
            newlyPlaced.push({ id: t.id, nx: x / width, ny: y / height })
          })
        }
        layout(players, 0.04)
        layout(npcs, 0.54)
        return next
      })
      // Persist initial positions normalized so other clients see correct placement
      if (onTokenMoved) {
        newlyPlaced.forEach(({ id, nx, ny }) => onTokenMoved(id, nx, ny))
      }
    }
    requestAnimationFrame(init)
  }, [tokens])

  // Global pointer handlers for drag
  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.mx
      const dy = e.clientY - d.my
      if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true
      if (d.moved) {
        const board = boardRef.current
        if (!board) return
        const rect = board.getBoundingClientRect()
        setPositions(prev => ({
          ...prev,
          [dragging]: {
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
        setAttackFrom(prev => {
          if (prev === null) { setAttackTo(null); return id }
          if (prev === id) { setAttackTo(null); return null }
          setAttackTo(id); return prev
        })
      } else if (d && d.moved && onTokenMoved) {
        const board = boardRef.current
        if (board) {
          const rect = board.getBoundingClientRect()
          const dx = e.clientX - d.mx
          const dy = e.clientY - d.my
          const x = Math.max(0, Math.min(rect.width - TOKEN_SIZE, d.tx + dx))
          const y = Math.max(0, Math.min(rect.height - TOKEN_SIZE - 34, d.ty + dy))
          // Normalizar a 0-1 para que las coordenadas sean independientes del tamaño del board
          onTokenMoved(d.id, x / rect.width, y / rect.height)
        }
      }
      setDragging(null)
      dragRef.current = null
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragging])

  const calcResult = useMemo(() => {
    if (!attackFrom || !attackTo) return null
    const atk = allEntities.find(e => e.id === attackFrom)
    const def = allEntities.find(e => e.id === attackTo)
    if (!atk || !def) return null
    const needed = def.ac - atk.attackBonus
    const minRoll = Math.max(2, Math.min(20, needed))
    return {
      attackerName: atk.name, defenderName: def.name,
      attackBonus: atk.attackBonus, defAc: def.ac,
      minRoll, hitChance: Math.max(5, Math.min(100, (21 - minRoll) * 5)),
      nat20Always: needed <= 1,
    }
  }, [attackFrom, attackTo, allEntities])

  const fromPos = attackFrom ? positions[attackFrom] : null
  const toPos = attackTo ? positions[attackTo] : null
  const midX = fromPos && toPos ? (fromPos.x + toPos.x) / 2 + TOKEN_SIZE / 2 : 0
  const midY = fromPos && toPos ? (fromPos.y + toPos.y) / 2 + TOKEN_SIZE / 2 : 0

  const bgUrl = mapUrl ?? '/assets/images/mapa_combate.png'

  return (
    <div
      ref={boardRef}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        backgroundImage: `url('${bgUrl}')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}
      onClick={e => {
        if (e.target === boardRef.current) { setAttackFrom(null); setAttackTo(null) }
      }}
    >
      {/* Attack arrow */}
      {fromPos && toPos && (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 25, overflow: 'visible' }}
        >
          <defs>
            <marker id="cb-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(251,191,36,0.95)" />
            </marker>
          </defs>
          <line
            x1={fromPos.x + TOKEN_SIZE / 2} y1={fromPos.y + TOKEN_SIZE / 2}
            x2={toPos.x + TOKEN_SIZE / 2} y2={toPos.y + TOKEN_SIZE / 2}
            stroke="rgba(251,191,36,0.8)" strokeWidth="2.5" strokeDasharray="10 5"
            markerEnd="url(#cb-arrow)"
          />
        </svg>
      )}

      {/* Tokens */}
      {tokens.map(token => {
        const pos = positions[token.id]
        if (!pos) return null
        return (
          <CombatToken
            key={token.id}
            data={token}
            pos={pos}
            isFrom={attackFrom === token.id}
            isTo={attackTo === token.id}
            onPointerDown={e => {
              if (canDrag && !canDrag(token.id)) return
              e.stopPropagation()
              const p = positions[token.id] ?? { x: 0, y: 0 }
              setDragging(token.id)
              dragRef.current = { id: token.id, mx: e.clientX, my: e.clientY, tx: p.x, ty: p.y, moved: false }
            }}
          />
        )
      })}

      {/* Attack calc popup */}
      {calcResult && fromPos && toPos && (
        <div style={{
          position: 'absolute', left: midX, top: midY,
          transform: 'translate(-50%, -50%)',
          zIndex: 40, pointerEvents: 'auto',
          background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
          border: '8px solid #23140a',
          borderRadius: 8,
          boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 25px rgba(0,0,0,0.95), 0 0 0 1.5px #120a05',
          padding: '12px 14px 12px',
          width: 'calc(100% - 24px)',
          maxWidth: 370,
          fontFamily: 'Georgia, serif',
          boxSizing: 'border-box',
        }}>
          {/* Corner Brackets */}
          <CornerBracket rotation={0} />
          <CornerBracket rotation={270} />
          <CornerBracket rotation={90} />
          <CornerBracket rotation={180} />

          {/* Header */}
          <p style={{ fontSize: 9, color: 'rgba(180,140,60,0.6)', textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 8, fontWeight: 'bold' }}>
            Cálculo de Ataque
          </p>

          {/* Names */}
          <div style={{
            fontSize: 15,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: 1,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}>
            <span style={{ color: '#d5b88a', fontWeight: 700, fontFamily: 'Georgia, serif' }}>{calcResult.attackerName}</span>
            <StylizedArrow />
            <span style={{ color: '#fca5a5', fontWeight: 600, fontFamily: 'Georgia, serif' }}>{calcResult.defenderName}</span>
          </div>

          {/* Number + bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            {/* Needs roll block */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 65 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                <span style={{
                  fontSize: 38,
                  fontWeight: 'bold',
                  color: '#d5b88a',
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                }}>
                  {calcResult.nat20Always ? '✔' : calcResult.minRoll}
                </span>
                {!calcResult.nat20Always && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 3, marginLeft: 2, position: 'relative' }}>
                    <span style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: '#d5b88a',
                      fontFamily: 'Georgia, serif',
                      lineHeight: 1,
                    }}>+</span>
                    <div style={{ marginLeft: 2, marginTop: -4 }}>
                      <D20Icon size={15} />
                    </div>
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 8,
                color: 'rgba(180,140,60,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginTop: 4,
                fontWeight: 600,
              }}>
                Necesita
              </span>
            </div>

            {/* Progress bar + VS block */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{
                fontSize: 12,
                color: '#d4d4d8',
                fontFamily: 'Georgia, serif',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}>
                {calcResult.attackBonus >= 0 ? `+${calcResult.attackBonus}` : calcResult.attackBonus} vs CA {calcResult.defAc}
              </span>
              
              <DecorativeProgressBar percentage={calcResult.hitChance} />
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: 2,
            background: 'none',
            borderTop: '1.5px solid #1a0f07',
            borderBottom: '1.5px solid #3c2414',
            margin: '6px 0 12px 0',
            opacity: 0.8,
          }} />

          {/* Action row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            {/* Pega Button */}
            <button
              onClick={() => setHit(true)}
              style={{
                flex: 1,
                height: 36,
                fontSize: 13,
                fontFamily: 'Georgia, serif',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
                outline: 'none',
                opacity: hit === false ? 0.4 : 1,
                ...(hit === true
                  ? {
                      background: 'linear-gradient(180deg, #3d6a45 0%, #1c3521 100%)',
                      border: '2px solid #528c5c',
                      color: '#fcd34d',
                      boxShadow: '0 0 12px rgba(74,222,128,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4)',
                    }
                  : {
                      background: 'linear-gradient(180deg, #1e3322 0%, #122115 100%)',
                      border: '2px solid #2e4d34',
                      color: 'rgba(134,239,172,0.6)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.5)',
                    })
              }}
            >
              <CrossedSwordsIcon />
              Pega
            </button>

            {/* Falla Button */}
            <button
              onClick={() => { setHit(false); setDamage('') }}
              style={{
                flex: 1,
                height: 36,
                fontSize: 13,
                fontFamily: 'Georgia, serif',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
                outline: 'none',
                opacity: hit === true ? 0.4 : 1,
                ...(hit === false
                  ? {
                      background: 'linear-gradient(180deg, #881337 0%, #4c0519 100%)',
                      border: '2px solid #f43f5e',
                      color: '#fcd34d',
                      boxShadow: '0 0 12px rgba(244,63,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4)',
                    }
                  : {
                      background: 'linear-gradient(180deg, #2a2e30 0%, #1b1e1f 100%)',
                      border: '2px solid #3f4547',
                      color: 'rgba(212,212,216,0.6)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.5)',
                    })
              }}
            >
              <CrossedArrowsIcon />
              Falla
            </button>

            {/* Damage Input (centered directly in flex row) */}
            {hit === true && (
              <input
                autoFocus
                type="number"
                min={0}
                placeholder="0"
                value={damage}
                onChange={e => setDamage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && damage && onAttackConfirm) {
                    onAttackConfirm(attackFrom!, attackTo!, true, parseInt(damage) || 0)
                    setAttackFrom(null); setAttackTo(null)
                  }
                }}
                className="no-spinners"
                style={{
                  width: 50,
                  height: 36,
                  padding: '0 4px',
                  fontSize: 18,
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.65)',
                  border: '2px solid #1e1208',
                  color: '#d5b88a',
                  borderRadius: 4,
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.9)',
                }}
              />
            )}

            {/* Wax Seal OK Button */}
            {hit !== null && (
              <button
                onClick={() => {
                  if (!onAttackConfirm) return
                  onAttackConfirm(attackFrom!, attackTo!, hit, hit ? (parseInt(damage) || 0) : undefined)
                  setAttackFrom(null); setAttackTo(null)
                }}
                disabled={hit === true && !damage}
                style={{
                  position: 'relative',
                  width: 52,
                  height: 52,
                  background: 'none',
                  border: 'none',
                  cursor: hit === true && !damage ? 'not-allowed' : 'pointer',
                  padding: 0,
                  outline: 'none',
                  flexShrink: 0,
                  transition: 'transform 0.1s, opacity 0.2s',
                  opacity: hit === true && !damage ? 0.35 : 1,
                }}
                onMouseDown={e => {
                  if (!(hit === true && !damage)) {
                    e.currentTarget.style.transform = 'scale(0.92)'
                  }
                }}
                onMouseUp={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <img
                  src="/assets/images/wax seal (1).png"
                  alt="Confirmar"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))',
                  }}
                />
                
                {/* Embossed content */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 1,
                }}>
                  {/* Crossed Axes watermark */}
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    style={{
                      color: 'rgba(195,115,62,0.85)',
                      filter: 'drop-shadow(0 1px 0.8px rgba(8,2,0,0.82)) drop-shadow(0 -0.5px 0.5px rgba(255,195,130,0.28))',
                      position: 'absolute',
                    }}
                  >
                    <path d="M4 20 L20 4 M20 20 L4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M15 3 L21 6 L18 9 L15 6 Z" fill="currentColor" />
                    <path d="M9 3 L3 6 L6 9 L9 6 Z" fill="currentColor" />
                  </svg>

                  {/* Text label */}
                  <span style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    color: '#fcd34d',
                    textShadow: '0 2px 3px rgba(0,0,0,0.9)',
                    zIndex: 1,
                    letterSpacing: '0.05em',
                  }}>
                    OK
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )}


      {/* Hint when attacker selected but no target yet */}
      {attackFrom && !attackTo && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, pointerEvents: 'none',
          background: 'rgba(10,7,3,0.85)', border: '1px solid rgba(96,165,250,0.35)',
          padding: '5px 14px', fontFamily: 'Georgia, serif', fontSize: 11,
          color: 'rgba(147,197,253,0.85)', whiteSpace: 'nowrap',
        }}>
          Click en un objetivo para calcular el ataque
        </div>
      )}
    </div>
  )
}
