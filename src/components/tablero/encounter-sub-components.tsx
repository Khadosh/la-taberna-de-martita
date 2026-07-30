import { useState, useEffect, useRef } from 'react'
import { type Difficulty, crLabel as crLabelFn } from '../../lib/encounter-generator'
import { MONSTER_INDEX } from './use-encounter-generator'
import { DIFFICULTY_LABELS } from './encounter-constants'
import { useT } from '../../i18n'

export function SpecialAbilityTag({ sa }: { sa: { name: string; desc: string } }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button
        onClick={e => { e.stopPropagation(); setShow(v => !v) }}
        className="text-[7px] px-1 py-0.5 bg-[#eae0cb] border border-[#b8a983] text-[#1c0d02] hover:bg-[#1c0d02] hover:text-[#f5ecd5] font-serif cursor-help transition-all rounded-sm leading-none"
      >
        {sa.name}
      </button>
      {show && (
        <div className="absolute bottom-full left-0 z-50 w-56 p-2 bg-[#1c1208] border border-[#8a6b3e] text-[9px] text-[#e0d1b8] font-serif shadow-xl mb-1 pointer-events-none rounded-sm">
          <p className="font-bold text-[#d5b88a] mb-1">{sa.name}</p>
          <p className="leading-relaxed">{sa.desc}</p>
        </div>
      )}
    </div>
  )
}

export function CountStepper({ value, onChange, activeColor }: { value: number; onChange: (v: number) => void; activeColor?: string }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      <button onClick={() => onChange(Math.max(0, value - 1))}
        className="w-5 h-5 text-[#bc9434] hover:text-[#d5b88a] text-base leading-none flex items-center justify-center transition-colors cursor-pointer select-none">
        −
      </button>
      <span className={`w-5 text-center text-xs font-mono font-semibold ${value > 0 ? (activeColor ?? 'text-[#e0d1b8]') : 'text-stone-700'}`}>
        {value > 0 ? value : '—'}
      </span>
      <button onClick={() => onChange(value + 1)}
        className="w-5 h-5 text-[#bc9434] hover:text-[#d5b88a] text-base leading-none flex items-center justify-center transition-colors cursor-pointer select-none">
        +
      </button>
    </div>
  )
}

export function XpGauge({ adjustedXp, thresholds }: { adjustedXp: number; thresholds: Record<Difficulty, number> }) {
  const t = useT()
  const maxDisplay = Math.max(thresholds.deadly * 1.5, adjustedXp * 1.1, 1)
  const fillPct = Math.min((adjustedXp / maxDisplay) * 100, 100)
  const pct = (v: number) => Math.min((v / maxDisplay) * 100, 98)

  let currentDiff: Difficulty | 'trivial' = 'trivial'
  if (adjustedXp >= thresholds.deadly) currentDiff = 'deadly'
  else if (adjustedXp >= thresholds.hard) currentDiff = 'hard'
  else if (adjustedXp >= thresholds.medium) currentDiff = 'medium'
  else if (adjustedXp >= thresholds.easy) currentDiff = 'easy'

  const fillGradients = {
    trivial: 'linear-gradient(90deg, rgba(120,113,108,0.4) 0%, rgba(168,162,158,0.8) 100%)',
    easy: 'linear-gradient(90deg, rgba(16,185,129,0.4) 0%, rgba(52,211,153,0.8) 100%)',
    medium: 'linear-gradient(90deg, rgba(245,158,11,0.4) 0%, rgba(251,191,36,0.8) 100%)',
    hard: 'linear-gradient(90deg, rgba(249,115,22,0.4) 0%, rgba(251,146,60,0.8) 100%)',
    deadly: 'linear-gradient(90deg, rgba(239,68,68,0.4) 0%, rgba(248,113,113,0.8) 100%)',
  }
  const activeColors = {
    trivial: '#78716c', easy: '#10b981', medium: '#f59e0b', hard: '#f97316', deadly: '#ef4444',
  }

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-serif" style={{ color: '#8a6b3e' }}>{t('encounter.adjustedXp')}</span>
        <span className="text-xs font-mono font-bold" style={{ color: activeColors[currentDiff] }}>
          {adjustedXp} ({DIFFICULTY_LABELS[currentDiff as Difficulty] ?? 'Trivial'})
        </span>
      </div>
      <div
        className="relative h-4 bg-[#20120a] border border-[#5a3c1e] rounded-sm overflow-hidden"
        style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.05)' }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
          <defs>
            <pattern id="laurel-xp" width="16" height="12" patternUnits="userSpaceOnUse">
              <path d="M 1 6 Q 4 3 8 6 Q 4 9 1 6" fill="#bc9434" />
              <path d="M 15 6 Q 12 3 8 6 Q 12 9 15 6" fill="#bc9434" />
              <line x1="0" y1="6" x2="16" y2="6" stroke="#bc9434" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#laurel-xp)" />
        </svg>
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
          style={{
            width: `${fillPct}%`,
            background: fillGradients[currentDiff],
            boxShadow: `0 0 6px ${activeColors[currentDiff]}, 0 0 12px rgba(255,255,255,0.15)`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-6 transition-all duration-500 ease-out pointer-events-none"
          style={{
            left: `${fillPct}%`,
            zIndex: 10,
            background: 'linear-gradient(135deg, #d5b88a 0%, #bc9434 50%, #8a6b3e 100%)',
            border: '1.5px solid #1a0f07',
            borderRadius: '2px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
            clipPath: 'polygon(50% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)',
          }}
        />
        {(['easy', 'medium', 'hard', 'deadly'] as Difficulty[]).map(d => (
          <div
            key={d}
            className="absolute top-0 bottom-0 w-0.5 bg-[#5a3c1e]"
            style={{ left: `${pct(thresholds[d])}%`, boxShadow: '0 0 2px rgba(0,0,0,0.8)' }}
          />
        ))}
      </div>
      <div className="relative h-4">
        {(['easy', 'medium', 'hard', 'deadly'] as Difficulty[]).map(d => (
          <span
            key={d}
            className="absolute text-[8px] font-mono -translate-x-1/2"
            style={{ left: `${pct(thresholds[d])}%`, color: '#8a6b3e' }}
          >
            {DIFFICULTY_LABELS[d]}
          </span>
        ))}
      </div>
    </div>
  )
}

export function MonsterSearchAdd({ onAdd }: { onAdd: (idx: string) => void }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const results = query.trim().length >= 2
    ? MONSTER_INDEX.filter(m => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        placeholder={t('encounter.addMonster')}
        className="w-full px-3 py-1.5 bg-black/30 border-t border-[#3c2414] text-[#d5b88a] text-xs font-serif placeholder-stone-600 focus:outline-none focus:text-[#e0d1b8] focus:border-[#bc9434]"
      />
      {open && results.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-20 bg-[#1c1208] border border-[#8a6b3e] shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
          {results.map(m => (
            <button key={m.index}
              onMouseDown={e => { e.preventDefault(); onAdd(m.index); setQuery(''); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#e0d1b8] hover:bg-[#2c1a0e] hover:text-[#d5b88a] font-serif flex items-center gap-2 cursor-pointer">
              <span className="flex-1">{m.name}</span>
              <span className="text-[#8a6b3e] font-mono text-[10px]">CR {crLabelFn(m.cr)}</span>
              <span className="text-stone-500 font-mono text-[10px]">{m.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
