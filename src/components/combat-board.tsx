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
          background: 'rgba(10,7,3,0.95)',
          border: '1px solid rgba(180,130,40,0.55)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.75)',
          padding: '10px 14px', minWidth: 200,
          fontFamily: 'Georgia, serif',
        }}>
          {/* Header */}
          <p style={{ fontSize: 10, color: 'rgba(180,140,60,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
            Cálculo de ataque
          </p>
          <p style={{ fontSize: 12, color: '#d6d3c8', marginBottom: 8 }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>{calcResult.attackerName}</span>
            {' → '}
            <span style={{ color: '#fca5a5' }}>{calcResult.defenderName}</span>
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 30, fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace', lineHeight: 1 }}>
                {calcResult.nat20Always ? '✔' : `${calcResult.minRoll}+`}
              </p>
              <p style={{ fontSize: 9, color: 'rgba(180,140,60,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                necesita
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#a8a29e', marginBottom: 5 }}>
                +{calcResult.attackBonus} vs CA {calcResult.defAc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#b45309', borderRadius: 3, width: `${calcResult.hitChance}%`, transition: 'width 0.2s' }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#fbbf24' }}>{calcResult.hitChance}%</span>
              </div>
            </div>
          </div>

          {/* Hit / miss + damage */}
          <div style={{ borderTop: '1px solid rgba(80,60,20,0.4)', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap' }}>
            <button
              onClick={() => setHit(true)}
              style={{
                padding: '3px 10px', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', borderRadius: 3, whiteSpace: 'nowrap',
                background: hit === true ? 'rgba(22,101,52,0.8)' : 'rgba(255,255,255,0.05)',
                border: hit === true ? '1px solid #16a34a' : '1px solid rgba(100,80,40,0.4)',
                color: hit === true ? '#86efac' : '#a8a29e',
              }}
            >✓ Pega</button>
            <button
              onClick={() => { setHit(false); setDamage('') }}
              style={{
                padding: '3px 10px', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', borderRadius: 3, whiteSpace: 'nowrap',
                background: hit === false ? 'rgba(127,29,29,0.7)' : 'rgba(255,255,255,0.05)',
                border: hit === false ? '1px solid #dc2626' : '1px solid rgba(100,80,40,0.4)',
                color: hit === false ? '#fca5a5' : '#a8a29e',
              }}
            >✗ Falla</button>
            {hit === true && (
              <input
                autoFocus
                type="number" min={0}
                value={damage}
                onChange={e => setDamage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && damage && onAttackConfirm) {
                    onAttackConfirm(attackFrom!, attackTo!, true, parseInt(damage) || 0)
                    setAttackFrom(null); setAttackTo(null)
                  }
                }}
                placeholder="daño"
                style={{
                  width: 52, padding: '3px 6px', fontSize: 12, fontFamily: 'monospace', textAlign: 'center',
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(220,38,38,0.5)',
                  color: '#fca5a5', borderRadius: 3, outline: 'none',
                }}
              />
            )}
            <div style={{ flex: 1 }} />
            {hit !== null && (
              <button
                onClick={() => {
                  if (!onAttackConfirm) return
                  onAttackConfirm(attackFrom!, attackTo!, hit, hit ? (parseInt(damage) || 0) : undefined)
                  setAttackFrom(null); setAttackTo(null)
                }}
                disabled={hit === true && !damage}
                style={{
                  padding: '3px 10px', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', borderRadius: 3, whiteSpace: 'nowrap',
                  background: 'rgba(120,60,10,0.8)', border: '1px solid rgba(180,100,20,0.6)',
                  color: '#fbbf24', opacity: hit === true && !damage ? 0.4 : 1,
                }}
              >OK</button>
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
