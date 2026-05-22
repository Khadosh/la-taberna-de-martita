import React from 'react'
import type { Pos } from './combat-types'

export const TOKEN_SIZE = 76
export const R = 34
export const CIRC = 2 * Math.PI * R

export function arcColor(pct: number): string {
  if (pct > 0.5) return '#16a34a'
  if (pct > 0.25) return '#d97706'
  return '#dc2626'
}

export function distToSegment(p: Pos, v: Pos, w: Pos) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y)
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)))
}

export function getSpellcastingAbility(klass: string = ''): 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' {
  const k = klass.toLowerCase()
  if (['cleric', 'druid', 'ranger', 'clérigo', 'druida', 'explorador'].includes(k)) return 'wis'
  if (['wizard', 'mago'].includes(k)) return 'int'
  if (['bard', 'paladin', 'sorcerer', 'warlock', 'bardo', 'paladín', 'hechicero', 'brujo'].includes(k)) return 'cha'
  return 'wis' // fallback
}

export function CrossedSwordsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="5" y1="15" x2="9" y2="19" />
      <line x1="20" y1="20" x2="4" y2="4" />
      <line x1="19" y1="15" x2="15" y2="19" />
    </svg>
  )
}

export function ThrownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M2 17h5a1 1 0 0 0 .7-.3l7.5-7.5a1 1 0 0 0 0-1.4l-3-3a1 1 0 0 0-1.4 0L3.3 12.3a1 1 0 0 0-.3.7v4" />
      <path d="M12.5 5.5l6-3" />
      <path d="M16 11l5-2.5" />
      <path d="M14 8.5l6-4.5" />
    </svg>
  )
}

export function BowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M6 3c5.3 0 9.7 4.4 9.7 9.7S11.3 22.4 6 22.4" />
      <line x1="6" y1="3" x2="6" y2="22.4" />
      <line x1="1.5" y1="12.7" x2="16.5" y2="12.7" />
      <path d="M13.5 9.7l3 3-3 3" />
    </svg>
  )
}

export function SpellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function CrossedArrowsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="4" y1="20" x2="20" y2="4" />
      <polyline points="15,4 20,4 20,9" />
      <line x1="20" y1="20" x2="4" y2="4" />
      <polyline points="9,20 4,20 4,15" />
    </svg>
  )
}

export function D20Icon({ size = 15 }: { size?: number }) {
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

export function StylizedArrow() {
  return (
    <svg width="28" height="10" viewBox="0 0 36 12" fill="none" style={{ opacity: 0.8, flexShrink: 0 }}>
      <line x1="6" y1="6" x2="30" y2="6" stroke="#bc9434" strokeWidth="1.5" />
      <path d="M 28 3 L 34 6 L 28 9 L 29.5 6 Z" fill="#bc9434" />
      <path d="M 4 2 L 8 6 L 4 10" stroke="#bc9434" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 2 3 L 5 6 L 2 9" stroke="#bc9434" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function CornerBracket({ rotation }: { rotation: 0 | 90 | 180 | 270 }) {
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

export function DecorativeProgressBar({ percentage }: { percentage: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <style>{`
        @keyframes lightning-wiggle {
          0% { transform: translateY(0px) scaleY(1); }
          50% { transform: translateY(-1px) scaleY(1.15); }
          100% { transform: translateY(0px) scaleY(1); }
        }
        @keyframes pulse-aoe {
          0% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.7; }
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
          <pattern id="laurel" width="16" height="12" patternUnits="userSpaceOnUse">
            <path d="M 1 6 Q 4 3 8 6 Q 4 9 1 6" fill="#bc9434" />
            <path d="M 15 6 Q 12 3 8 6 Q 12 9 15 6" fill="#bc9434" />
            <line x1="0" y1="6" x2="16" y2="6" stroke="#bc9434" strokeWidth="1" />
          </pattern>
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
