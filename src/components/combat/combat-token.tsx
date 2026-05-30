import React from 'react'
import type { TokenData, Pos } from './combat-types'
import { TOKEN_SIZE, R, CIRC, arcColor } from './combat-helpers'
import { getDeterministicColor } from '../tablero/tablero-types'

export function CombatToken({
  data, pos, isFrom, isTo, inAoE, onPointerDown, onContextMenu,
  hoveredTokenId, hoveredGroupId, onHoverToken, isPlayer,
}: {
  data: TokenData
  pos: Pos
  isFrom: boolean
  isTo: boolean
  inAoE?: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
  hoveredTokenId?: string | null
  hoveredGroupId?: string | null
  onHoverToken?: (id: string | null) => void
  isPlayer?: boolean
}) {
  const pct = data.maxHp > 0 ? Math.max(0, Math.min(1, data.currentHp / data.maxHp)) : 0
  const arc = pct * CIRC
  const color = arcColor(pct)
  const half = TOKEN_SIZE / 2
  const tokenColor = getDeterministicColor(data.id)
  const isHovered = hoveredTokenId === data.id || (!!hoveredGroupId && data.spawnGroup === hoveredGroupId)
  const isDead = data.kind === 'npc' && data.maxHp > 0 && data.currentHp === 0

  return (
    <div
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: TOKEN_SIZE, touchAction: 'none', cursor: isDead ? 'default' : 'grab',
        zIndex: isDead ? 5 : isHovered ? 35 : (isFrom || isTo ? 20 : 10),
        pointerEvents: 'auto',
        opacity: isDead ? 0.4 : 1,
        filter: isDead ? 'grayscale(0.8)' : 'none',
        transition: 'opacity 0.4s, filter 0.4s',
      }}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      onMouseEnter={() => onHoverToken?.(data.id)}
      onMouseLeave={() => onHoverToken?.(null)}
    >
      <div style={{ position: 'relative', width: TOKEN_SIZE, height: TOKEN_SIZE }}>
        {/* Hover Glow Ring */}
        {isHovered && (
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%', pointerEvents: 'none',
            boxShadow: `0 0 0 3.5px ${tokenColor}, 0 0 20px ${tokenColor}`,
          }} />
        )}
        {/* AoE Highlight Ring */}
        {inAoE && (
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%', pointerEvents: 'none',
            boxShadow: '0 0 0 3px #ef4444, 0 0 16px rgba(239, 68, 68, 0.7)',
            animation: 'pulse-aoe 1.2s infinite ease-in-out',
          }} />
        )}
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
          border: `2px solid ${isDead ? '#44403c' : tokenColor}`,
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
          {isDead && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>☠</div>
          )}
          {data.isHidden && !isPlayer && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 7, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(-45deg, rgba(180,180,180,0.35) 0px, rgba(180,180,180,0.35) 2px, transparent 2px, transparent 9px)',
            }} />
          )}
        </div>
      </div>
      {/* Name + role */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        marginTop: 3, pointerEvents: 'none', maxWidth: TOKEN_SIZE,
      }}>
        <p style={{
          textAlign: 'center', fontSize: 10, fontFamily: 'Georgia, serif',
          color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,1)',
          lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {data.name}
        </p>
        {data.role && (() => {
          const roleColors: Record<string, { bg: string; text: string }> = {
            melee:   { bg: '#7f1d1d', text: '#fca5a5' },
            ranged:  { bg: '#14532d', text: '#86efac' },
            magic:   { bg: '#3b0764', text: '#d8b4fe' },
            support: { bg: '#713f12', text: '#fde68a' },
          }
          const roleLabels: Record<string, string> = { melee: 'M', ranged: 'D', magic: 'G', support: 'S' }
          const c = roleColors[data.role] ?? { bg: '#1c1917', text: '#a8a29e' }
          return (
            <span style={{
              flexShrink: 0,
              width: 13, height: 13, borderRadius: '50%',
              background: c.bg, border: '1px solid rgba(0,0,0,0.6)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 700, fontFamily: 'Georgia, serif',
              color: c.text, lineHeight: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}>
              {roleLabels[data.role] ?? data.role.charAt(0).toUpperCase()}
            </span>
          )
        })()}
      </div>
      {/* HP */}
      {data.showHp !== false && (
        <p style={{
          textAlign: 'center', fontSize: 9, fontFamily: 'monospace',
          color: 'rgba(255,230,150,0.9)', textShadow: '0 1px 2px rgba(0,0,0,1)',
          lineHeight: 1.1, pointerEvents: 'none',
        }}>
          {data.currentHp}/{data.maxHp}
          {data.kind === 'npc' && data.level != null && (
            <span style={{ color: 'rgba(180,200,255,0.75)', marginLeft: 3 }}>Nv{data.level}</span>
          )}
        </p>
      )}
    </div>
  )
}
