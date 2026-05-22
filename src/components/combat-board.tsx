import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { dndApi, dndKeys } from '../lib/dnd-api'
import type { SheetJson } from './character-sheet/types'

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

export type BoardCharacter = {
  id: string
  name: string
  class: string
  race: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  armor_class: number | null
  portrait_url?: string | null
  user_id: string
  conditions: string[]
  sheet_json: SheetJson
}

type Pos = { x: number; y: number }

function arcColor(pct: number): string {
  if (pct > 0.5) return '#16a34a'
  if (pct > 0.25) return '#d97706'
  return '#dc2626'
}

function CombatToken({
  data, pos, isFrom, isTo, inAoE, onPointerDown, onContextMenu,
}: {
  data: TokenData
  pos: Pos
  isFrom: boolean
  isTo: boolean
  inAoE?: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
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
      onContextMenu={onContextMenu}
    >
      <div style={{ position: 'relative', width: TOKEN_SIZE, height: TOKEN_SIZE }}>
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

// ── Visual Icon SVGs ─────────────────────────────────────────────────────────

function CrossedSwordsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="4" y1="20" x2="20" y2="4" />
      <line x1="5" y1="15" x2="9" y2="19" />
      <line x1="20" y1="20" x2="4" y2="4" />
      <line x1="19" y1="15" x2="15" y2="19" />
    </svg>
  )
}

function ThrownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M2 17h5a1 1 0 0 0 .7-.3l7.5-7.5a1 1 0 0 0 0-1.4l-3-3a1 1 0 0 0-1.4 0L3.3 12.3a1 1 0 0 0-.3.7v4" />
      <path d="M12.5 5.5l6-3" />
      <path d="M16 11l5-2.5" />
      <path d="M14 8.5l6-4.5" />
    </svg>
  )
}

function BowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M6 3c5.3 0 9.7 4.4 9.7 9.7S11.3 22.4 6 22.4" />
      <line x1="6" y1="3" x2="6" y2="22.4" />
      <line x1="1.5" y1="12.7" x2="16.5" y2="12.7" />
      <path d="M13.5 9.7l3 3-3 3" />
    </svg>
  )
}

function SpellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
      <circle cx="12" cy="12" r="3" />
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

function distToSegment(p: Pos, v: Pos, w: Pos) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y)
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)))
}

function getSpellcastingAbility(klass: string = ''): 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' {
  const k = klass.toLowerCase()
  if (['cleric', 'druid', 'ranger', 'clérigo', 'druida', 'explorador'].includes(k)) return 'wis'
  if (['wizard', 'mago'].includes(k)) return 'int'
  if (['bard', 'paladin', 'sorcerer', 'warlock', 'bardo', 'paladín', 'hechicero', 'brujo'].includes(k)) return 'cha'
  return 'wis' // fallback
}

export function CombatBoard({
  tokens,
  allEntities,
  mapUrl,
  externalPositions,
  onTokenMoved,
  canDrag,
  onAttackConfirm,
  characters = [],
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
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Record<string, Pos>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)
  const dragRef = useRef<{ id: string; mx: number; my: number; tx: number; ty: number; moved: boolean } | null>(null)
  
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
  const fromPos = attackFrom ? positions[attackFrom] : null
  const toPos = attackTo === 'ground' ? groundTargetPos : (attackTo ? positions[attackTo] : null)
  const [hit, setHit] = useState<boolean | null>(null)
  const [damage, setDamage] = useState('')

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

  // Fetch inventory for active attacker (players only)
  const attackerChar = useMemo(() => characters.find(c => c.id === attackFrom), [characters, attackFrom])
  
  const { data: attackerInventory = [] } = useQuery({
    queryKey: ['inventory', attackFrom],
    queryFn: async () => {
      if (!attackFrom || !attackerChar) return []
      const { data, error } = await supabase
        .from('character_inventory').select('*')
        .eq('character_id', attackFrom).order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!attackFrom && !!attackerChar,
  })

  // Fetch selected spell details
  const { data: spellDetail } = useQuery({
    queryKey: dndKeys.spell(selectedSpellIndex ?? ''),
    queryFn: () => dndApi.spell(selectedSpellIndex!),
    enabled: !!selectedSpellIndex,
    staleTime: Infinity,
  })

  // Fetch details for all attacker spells to group them by level in the dropdown
  const attackerSpells = useMemo(() => attackerChar?.sheet_json.spells ?? [], [attackerChar])
  const attackerSpellsQueries = useQueries({
    queries: attackerSpells.map(index => ({
      queryKey: dndKeys.spell(index),
      queryFn: () => dndApi.spell(index),
      staleTime: Infinity,
    }))
  })

  const groupedAttackerSpells = useMemo(() => {
    const groups: Record<number, { index: string; name: string }[]> = {}
    attackerSpellsQueries.forEach(res => {
      if (res.data) {
        const lvl = res.data.level
        if (!groups[lvl]) groups[lvl] = []
        groups[lvl].push({ index: res.data.index, name: res.data.name })
      }
    })
    return groups
  }, [attackerSpellsQueries])

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
    setHit(null)
    setDamage('')
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

  useEffect(() => {
    if (!attackFrom) {
      setAttackTo(null)
      setGroundTargetPos(null)
    }
  }, [attackFrom])

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
      if (onTokenMoved) {
        newlyPlaced.forEach(({ id, nx, ny }) => onTokenMoved(id, nx, ny))
      }
    }
    requestAnimationFrame(init)
  }, [tokens])

  // Pointer move handler (drag token or pan map)
  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      // Divide offset by current zoom factor so token moves precisely under the pointer
      const dx = (e.clientX - d.mx) / zoom
      const dy = (e.clientY - d.my) / zoom
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
          const dx = (e.clientX - d.mx) / zoom
          const dy = (e.clientY - d.my) / zoom
          const x = Math.max(0, Math.min(rect.width - TOKEN_SIZE, d.tx + dx))
          const y = Math.max(0, Math.min(rect.height - TOKEN_SIZE - 34, d.ty + dy))
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
  }, [dragging, zoom])

  // Zoom wheel handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const nextZoom = e.deltaY < 0 ? Math.min(zoom + 0.1, 4) : Math.max(zoom - 0.1, 0.5)
    
    // Zoom centered on mouse cursor
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const canvasX = (mouseX - pan.x) / zoom
    const canvasY = (mouseY - pan.y) / zoom
    
    const nextPanX = mouseX - canvasX * nextZoom
    const nextPanY = mouseY - canvasY * nextZoom
    
    setZoom(nextZoom)
    setPan({ x: nextPanX, y: nextPanY })
  }

  // Pointer panning handlers
  const handleBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 1 || e.button === 2 || e.target === boardRef.current || (e.target as HTMLElement).id === 'map-canvas') {
      setIsPanning(true)
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      e.currentTarget.setPointerCapture(e.pointerId)
      e.stopPropagation()
    }
  }

  const handleBgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      })
    }
  }

  const handleBgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // Handle placing/moving AoE on click
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
  const distanceFtEuclidean = fromPos && toPos ? (distancePx / gridSize) * 5 : 0

  // Range checkers based on mode and character inventory
  const rangeConfig = useMemo(() => {
    if (!attackerChar) return { label: 'Melee', normal: 5, long: 5, status: 'ok' }

    if (selectedMode === 'melee') {
      const mainHandItemId = attackerChar.sheet_json.equipped_slots?.main_hand
      const weapon = attackerInventory.find(i => i.id === mainHandItemId)
      const wName = weapon?.name.toLowerCase() ?? ''
      
      // Reach weapons
      const hasReach = ['lanza', 'alabarda', 'látigo', 'halberd', 'glaive', 'pike', 'whip', 'reach', 'alcance'].some(w => wName.includes(w))
      const reach = hasReach ? 10 : 5
      
      const status = distanceFtGrid <= reach ? 'ok' : 'too_far'
      return { label: weapon?.name ?? 'Cuerpo a Cuerpo', normal: reach, long: reach, status }
    }

    if (selectedMode === 'ranged') {
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
      const isThreatened = tokens.some(t => t.id !== attackFrom && t.kind === 'npc' && positions[t.id] && 
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

    if (selectedMode === 'thrown') {
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

    if (selectedMode === 'spell') {
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

    return { label: 'Generic', normal: 0, long: 0, status: 'ok' }
  }, [selectedMode, attackerChar, attackerInventory, selectedWeaponId, spellDetail, distanceFtGrid, tokens, positions, attackFrom, fromPos, gridSize])

  // Calculate attack/spell statistics
  const calcResult = useMemo(() => {
    if (!attackFrom || !attackTo) return null
    const atk = allEntities.find(e => e.id === attackFrom)
    const def = attackTo === 'ground'
      ? { id: 'ground', name: 'Terreno', ac: 10, attackBonus: 0 }
      : allEntities.find(e => e.id === attackTo)
    if (!atk || !def) return null

    // Fetch attack stats
    let bonus = atk.attackBonus
    let spellSaveDc = 10
    let saveAbility: string | null = null
    let isHealing = false

    if (attackerChar && selectedMode === 'spell') {
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
  }, [attackFrom, attackTo, allEntities, selectedMode, attackerChar, parsedSpellConfig])

  // AoE Targets checker
  const aoeRadiusPixels = (aoeRadius / 5) * gridSize
  
  const checkTokenInAoE = (tokenId: string, tokenPos: Pos) => {
    if (!aoeActive || !aoePosition) return false
    const center = { x: tokenPos.x + TOKEN_SIZE/2, y: tokenPos.y + TOKEN_SIZE/2 }
    const dist = Math.hypot(center.x - aoePosition.x, center.y - aoePosition.y)

    if (aoeType === 'circle' || aoeType === 'cone') {
      return dist <= aoeRadiusPixels
    }
    if (aoeType === 'cube') {
      return (
        Math.abs(center.x - aoePosition.x) <= aoeRadiusPixels &&
        Math.abs(center.y - aoePosition.y) <= aoeRadiusPixels
      )
    }
    if (aoeType === 'line') {
      if (!fromPos) return false
      const attackerCenter = { x: fromPos.x + TOKEN_SIZE/2, y: fromPos.y + TOKEN_SIZE/2 }
      return distToSegment(center, attackerCenter, aoePosition) <= gridSize / 2
    }
    return false
  }

  const targetsInAoE = useMemo(() => {
    if (!aoeActive || !aoePosition) return []
    return tokens
      .filter(t => checkTokenInAoE(t.id, positions[t.id]))
      .map(t => t.id)
  }, [aoeActive, aoePosition, tokens, positions])

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
          {aoeActive && aoePosition && (
            <g>
              {aoeType === 'circle' && (
                <circle
                  cx={aoePosition.x} cy={aoePosition.y} r={aoeRadiusPixels}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {aoeType === 'cube' && (
                <rect
                  x={aoePosition.x - aoeRadiusPixels} y={aoePosition.y - aoeRadiusPixels}
                  width={aoeRadiusPixels * 2} height={aoeRadiusPixels * 2}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {aoeType === 'cone' && (
                <circle
                  cx={aoePosition.x} cy={aoePosition.y} r={aoeRadiusPixels}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {aoeType === 'line' && fromPos && (
                <line
                  x1={fromPos.x + TOKEN_SIZE/2} y1={fromPos.y + TOKEN_SIZE/2}
                  x2={aoePosition.x} y2={aoePosition.y}
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
            const inAoE = checkTokenInAoE(token.id, pos)
            return (
              <CombatToken
                key={token.id}
                data={token}
                pos={pos}
                isFrom={attackFrom === token.id}
                isTo={attackTo === token.id}
                inAoE={inAoE}
                onPointerDown={e => {
                  if (e.button !== 0) return // Only drag on left click
                  if (canDrag && !canDrag(token.id)) return
                  e.stopPropagation()
                  const p = positions[token.id] ?? { x: 0, y: 0 }
                  setDragging(token.id)
                  dragRef.current = { id: token.id, mx: e.clientX, my: e.clientY, tx: p.x, ty: p.y, moved: false }
                }}
                onContextMenu={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setAttackFrom(token.id)
                  setAttackTo('ground')
                  const p = positions[token.id] ?? { x: 0, y: 0 }
                  setGroundTargetPos({ x: p.x, y: p.y })
                  setSelectedMode('spell')
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Floating Map Control Widgets */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14, zIndex: 30,
        background: 'rgba(15,9,5,0.92)', border: '2px solid #5a3c1e', borderRadius: 6,
        padding: '6px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Georgia, serif', fontSize: 11, color: '#d5b88a'
      }}>
        <button onClick={() => setZoom(z => Math.min(z + 0.2, 4))} style={{ background: '#2d1808', border: '1px solid #784c18', color: '#d5b88a', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }}>＋</button>
        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} style={{ background: '#2d1808', border: '1px solid #784c18', color: '#d5b88a', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontWeight: 'bold' }}>－</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} style={{ background: '#2d1808', border: '1px solid #784c18', color: '#d5b88a', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 9 }}>Reset</button>
        
        <div style={{ width: 1, height: 16, background: '#3c2414' }} />

        <button
          onClick={() => setShowGrid(g => !g)}
          style={{
            background: showGrid ? 'rgba(213, 184, 138, 0.18)' : '#2d1808',
            border: '1px solid #784c18', color: '#d5b88a', padding: '3px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 9
          }}
        >
          {showGrid ? 'Grid: ON' : 'Grid: OFF'}
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
      {(() => {
        if (!calcResult || !fromPos || !toPos) return null

        const POPUP_WIDTH = 410
        const POPUP_HEIGHT = 440 // approximate height

        // We want the popup to follow the map's zoom and pan so it floats near the targets
        const rawPopupX = midX * zoom + pan.x
        const rawPopupY = midY * zoom + pan.y

        // Clamp to prevent the popup from going outside the viewport boundary
        const currentPopupWidth = Math.min(POPUP_WIDTH, boardSize.width - 24)
        const popupX = Math.max(currentPopupWidth / 2 + 12, Math.min(boardSize.width - currentPopupWidth / 2 - 12, rawPopupX))
        const popupY = Math.max(POPUP_HEIGHT / 2 + 12, Math.min(boardSize.height - POPUP_HEIGHT / 2 - 12, rawPopupY))

        const spellLevel = selectedMode === 'spell' && spellDetail ? spellDetail.level : undefined

        return (
          <div style={{
            position: 'absolute', left: popupX, top: popupY,
            transform: 'translate(-50%, -50%)',
            zIndex: 40, pointerEvents: 'auto',
            background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
            border: '8px solid #23140a', borderRadius: 8,
            boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 25px rgba(0,0,0,0.95), 0 0 0 1.5px #120a05',
            padding: '12px 14px', width: 'calc(100% - 24px)', maxWidth: POPUP_WIDTH,
            fontFamily: 'Georgia, serif', boxSizing: 'border-box',
          }}>
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
            <button
              onClick={() => {
                setAttackFrom(null)
                setAttackTo(null)
              }}
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
          </div>

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
                {(rangeConfig as any).disadvantageThreat && (
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
                        (attackerChar.sheet_json.spells ?? []).map(sp => (
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
                      setAoeActive(v => !v)
                      if (!aoePosition && toPos) {
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
                  {calcResult.isHealing ? '💚' : calcResult.saveAbility ? calcResult.spellSaveDc : (calcResult.nat20Always ? '✔' : calcResult.minRoll)}
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
                  Objetivo debe salvar <strong style={{ color: '#d5b88a' }}>{calcResult.saveAbility}</strong> contra CD <strong>{calcResult.spellSaveDc}</strong>
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 12, color: '#d4d4d8' }}>
                    {calcResult.attackBonus >= 0 ? `+${calcResult.attackBonus}` : calcResult.attackBonus} vs CA {calcResult.defAc}
                  </span>
                  <DecorativeProgressBar percentage={calcResult.hitChance} />
                </>
              )}
            </div>
          </div>

          <div style={{ height: 2, borderTop: '1.5px solid #1a0f07', borderBottom: '1.5px solid #3c2414', margin: '6px 0 12px 0', opacity: 0.8 }} />

          {/* Action Row */}
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
                          background: 'linear-gradient(180deg, #1e3322 0%, #122115 100%)',
                          border: '2px solid #2e4d34', color: 'rgba(134,239,172,0.6)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.5)',
                        })
                  }}
                >
                  <CrossedSwordsIcon />
                  Impacta
                </button>

                <button
                  onClick={() => { setHit(false); setDamage('') }}
                  style={{
                    flex: 1, height: 36, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
                    opacity: hit === true ? 0.4 : 1,
                    ...(hit === false
                      ? {
                          background: 'linear-gradient(180deg, #881337 0%, #4c0519 100%)',
                          border: '2px solid #f43f5e', color: '#fcd34d',
                          boxShadow: '0 0 12px rgba(244,63,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4)',
                        }
                      : {
                          background: 'linear-gradient(180deg, #2a2e30 0%, #1b1e1f 100%)',
                          border: '2px solid #3f4547', color: 'rgba(212,212,216,0.6)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.5)',
                        })
                  }}
                >
                  <CrossedArrowsIcon />
                  Falla
                </button>
              </>
            )}

            {/* HP Value input */}
            {hit === true && (
              <input
                autoFocus type="number" min={0} placeholder="0"
                value={damage} onChange={e => setDamage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && damage && onAttackConfirm) {
                    const hpVal = parseInt(damage) || 0
                    if (aoeActive && targetsInAoE.length > 0) {
                      targetsInAoE.forEach((tid, idx) => {
                        onAttackConfirm(attackFrom!, tid, true, hpVal, calcResult.isHealing, idx === 0 ? spellLevel : undefined)
                      })
                    } else {
                      onAttackConfirm(attackFrom!, attackTo!, true, hpVal, calcResult.isHealing, spellLevel)
                    }
                    setAttackFrom(null); setAttackTo(null)
                  }
                }}
                className="no-spinners"
                style={{
                  width: 50, height: 36, padding: '0 4px', fontSize: 18, fontFamily: 'monospace', textAlign: 'center',
                  background: 'rgba(0,0,0,0.65)', border: '2px solid #1e1208', color: '#d5b88a', borderRadius: 4, outline: 'none',
                  boxSizing: 'border-box', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.9)',
                }}
              />
            )}

            {/* OK Confirmation Seal */}
            {hit !== null && (
              <button
                onClick={() => {
                  if (!onAttackConfirm) return
                  const hpVal = hit ? (parseInt(damage) || 0) : 0
                  
                  if (aoeActive && targetsInAoE.length > 0) {
                    targetsInAoE.forEach((tid, idx) => {
                      onAttackConfirm(attackFrom!, tid, hit, hpVal, calcResult.isHealing, idx === 0 ? spellLevel : undefined)
                    })
                  } else {
                    onAttackConfirm(attackFrom!, attackTo!, hit, hpVal, calcResult.isHealing, spellLevel)
                  }
                  setAttackFrom(null); setAttackTo(null)
                }}
                disabled={hit === true && !damage}
                style={{
                  position: 'relative', width: 52, height: 52, background: 'none', border: 'none',
                  cursor: hit === true && !damage ? 'not-allowed' : 'pointer', padding: 0, outline: 'none',
                  transition: 'transform 0.1s, opacity 0.2s', opacity: hit === true && !damage ? 0.35 : 1, flexShrink: 0
                }}
                onMouseDown={e => {
                  if (!(hit === true && !damage)) e.currentTarget.style.transform = 'scale(0.92)'
                }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <img
                  src="/assets/images/wax seal (1).png" alt="Confirmar" draggable={false}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))' }}
                />
                
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 1 }}>
                  <svg
                    viewBox="0 0 24 24" width="18" height="18"
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
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 11, fontWeight: 'bold', color: '#fcd34d', textShadow: '0 2px 3px rgba(0,0,0,0.9)', zIndex: 1, letterSpacing: '0.05em' }}>
                    OK
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      )
    })()}

      {/* Target select helper message */}
      {attackFrom && !attackTo && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, pointerEvents: 'none',
          background: 'rgba(10,7,3,0.88)', border: '1px solid rgba(96,165,250,0.35)',
          padding: '5px 14px', fontFamily: 'Georgia, serif', fontSize: 11,
          color: 'rgba(147,197,253,0.85)', whiteSpace: 'nowrap', borderRadius: 4,
        }}>
          {aoeActive ? 'Selecciona un punto en el mapa para posicionar el área' : 'Selecciona un objetivo para calcular el ataque'}
        </div>
      )}
    </div>
  )
}
