import React from 'react'

// ── Shared parchment styles ───────────────────────────────────────────────────

export const parchmentStyle: React.CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 30%, #f2e6c8 0%, #e8d5a8 40%, #d4b87a 100%)',
}

export const sheetStyle: React.CSSProperties = {
  background: 'rgba(244, 232, 190, 0.6)',
  border: '1px solid #78603a',
  boxShadow: `
    inset 0 0 80px rgba(90, 45, 5, 0.35),
    inset 0 0 30px rgba(70, 30, 0, 0.2),
    0 8px 32px rgba(0,0,0,0.35),
    0 2px 8px rgba(0,0,0,0.2)
  `,
}

// ── Primitive layout components ───────────────────────────────────────────────

export function SheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-stone-500/40" />
      <p className="text-xs tracking-widest text-stone-500 uppercase font-serif whitespace-nowrap">{children}</p>
      <div className="flex-1 h-px bg-stone-500/40" />
    </div>
  )
}

export function SheetRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col sm:flex-row border-x border-stone-600 ${className}`}>{children}</div>
}

export function StatBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-2 sm:px-4 py-1 sm:py-0">
      <p className="text-[10px] sm:text-xs text-stone-400 font-serif tracking-widest uppercase whitespace-nowrap">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold text-amber-300 mt-0.5 ${mono ? 'font-mono' : 'font-serif'}`}>{value}</p>
    </div>
  )
}

export function QuickPill({
  label, value, variant, title,
}: {
  label: string
  value: string
  variant?: 'racial' | 'save' | 'gold'
  title?: string
}) {
  const cls = variant === 'racial'
    ? 'border-amber-600/70 text-amber-900 bg-amber-50/60'
    : variant === 'save'
      ? 'border-green-600/60 text-green-900 bg-green-50/50'
      : variant === 'gold'
        ? 'border-amber-500/80 text-amber-800 bg-amber-50/70 font-semibold'
        : 'border-stone-400/70 text-stone-700'
  return (
    <div className="flex items-center gap-1.5 text-xs font-serif" title={title}>
      <span className="text-stone-400">{label}</span>
      <span className={`px-1.5 py-px border font-mono ${cls}`}>{value}</span>
    </div>
  )
}

// ── Sheet tab bar ─────────────────────────────────────────────────────────────

export type SheetTab = 'resumen' | 'pericias' | 'combate' | 'hechizos'

const TAB_DEFS: { id: SheetTab; label: string; icon: string }[] = [
  { id: 'resumen', label: 'Resumen', icon: '📋' },
  { id: 'pericias', label: 'Pericias', icon: '🎯' },
  { id: 'combate', label: 'Combate', icon: '⚔️' },
  { id: 'hechizos', label: 'Hechizos', icon: '✨' },
]

export function SheetTabBar({
  active,
  onChange,
}: {
  active: SheetTab
  onChange: (t: SheetTab) => void
}) {
  return (
    <div className="flex border-x border-t border-stone-600" style={{ background: 'rgba(180,145,80,0.12)' }}>
      {TAB_DEFS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-4 py-2.5 text-xs font-serif tracking-wide transition-all border-r border-stone-600 last:border-r-0
            ${active === tab.id
              ? 'bg-amber-50/80 text-stone-800 font-semibold border-b-2 border-b-amber-700'
              : 'text-stone-500 hover:text-stone-700 hover:bg-amber-50/40 border-b border-b-stone-600'
            }
          `}
        >
          <span className="text-sm leading-none">{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
