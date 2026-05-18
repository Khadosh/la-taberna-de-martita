import React from 'react'

// ── Shared parchment styles ───────────────────────────────────────────────────

export const parchmentStyle: React.CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 30%, #f2e6c8 0%, #e8d5a8 40%, #d4b87a 100%)',
}

// Fondo mesa de juego — tabla de madera oscura
export const mapBgStyle: React.CSSProperties = {
  backgroundImage: `url('/assets/images/board_bg.png')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
}

// Hoja de pergamino sobre la mesa — con textura de papiro real
export const sheetStyle: React.CSSProperties = {
  backgroundImage: `url('/assets/images/papiro.png')`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundBlendMode: 'multiply',
}

// Versión mobile: sin bordes ni sombras (va edge-to-edge)
export const sheetStyleMobile: React.CSSProperties = {
  backgroundImage: `url('/assets/images/papiro.png')`,
  backgroundSize: '100% 100%',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundBlendMode: 'multiply',
}

// Marco oscuro para el panel de inventario (no parchment)
export const darkFrameStyle: React.CSSProperties = {
  border: '2px solid #1e1208',
  boxShadow: `
    0 30px 80px rgba(0,0,0,0.85),
    0 12px 35px rgba(0,0,0,0.65),
    0 4px 12px rgba(0,0,0,0.45),
    inset 0 0 0 1px rgba(255,255,255,0.04)
  `,
}

// ── Primitive layout components ───────────────────────────────────────────────

export function SheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px" style={{ background: 'rgba(100,70,30,0.45)' }} />
      <p className="text-xs tracking-widest uppercase font-serif whitespace-nowrap" style={{ color: '#6b4c24', letterSpacing: '0.13em' }}>{children}</p>
      <div className="flex-1 h-px" style={{ background: 'rgba(100,70,30,0.45)' }} />
    </div>
  )
}

export function SheetRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col sm:flex-row ${className}`}>{children}</div>
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
  variant?: 'racial' | 'save' | 'gold' | 'warn'
  title?: string
}) {
  const cls = variant === 'racial'
    ? 'border-amber-600/70 text-amber-900 bg-amber-50/60'
    : variant === 'save'
      ? 'border-green-600/60 text-green-900 bg-green-50/50'
      : variant === 'gold'
        ? 'border-amber-500/80 text-amber-800 bg-amber-50/70 font-semibold'
        : variant === 'warn'
          ? 'border-red-700/60 text-red-900 bg-red-50/60 font-semibold'
          : 'border-stone-400/70 text-stone-700'
  return (
    <div className="flex items-center gap-1.5 text-xs font-serif" title={title}>
      <span style={{ color: '#7a5828' }}>{label}</span>
      <span className={`px-1.5 py-px border font-mono ${cls}`}>{value}</span>
    </div>
  )
}

// ── Sheet tab bar ─────────────────────────────────────────────────────────────

export type SheetTab = 'resumen' | 'pericias' | 'hechizos' | 'historia'

function TabSvgList() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="1.5" y="1" width="9" height="10" rx="1" />
      <line x1="3.5" y1="4" x2="8.5" y2="4" />
      <line x1="3.5" y1="6.5" x2="8.5" y2="6.5" />
      <line x1="3.5" y1="9" x2="6.5" y2="9" />
    </svg>
  )
}
function TabSvgShield() {
  return (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1.5L10.5 3V7C10.5 10 6 12 6 12S1.5 10 1.5 7V3Z" />
      <circle cx="6" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
function TabSvgStar() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 1L7.4 4.6H11.2L8.1 6.9L9.2 10.7L6 8.4L2.8 10.7L3.9 6.9L0.8 4.6H4.6Z" />
    </svg>
  )
}
function TabSvgFeather() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 1C6 1 1 4.5 1 12" />
      <path d="M10 1C10 6 6 10 1 12" />
      <line x1="3.5" y1="9.5" x2="1" y2="13" />
    </svg>
  )
}

const TAB_DEFS: { id: SheetTab; label: string; icon: React.ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <TabSvgList /> },
  { id: 'pericias', label: 'Pericias', icon: <TabSvgShield /> },
  { id: 'hechizos', label: 'Hechizos', icon: <TabSvgStar /> },
  { id: 'historia', label: 'Historia', icon: <TabSvgFeather /> },
]

function TabStitch({ side }: { side: 'left' | 'right' }) {
  return (
    <div style={{
      position: 'absolute',
      [side]: 5,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      pointerEvents: 'none',
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 2,
          height: 7,
          borderRadius: 1,
          background: 'rgba(188,148,52,0.55)',
          boxShadow: '1px 0 1px rgba(0,0,0,0.6), -0.5px 0 0 rgba(230,190,80,0.12)',
        }} />
      ))}
    </div>
  )
}

export function SheetTabBar({
  active,
  onChange,
}: {
  active: SheetTab
  onChange: (t: SheetTab) => void
}) {
  return (
    <div
      className="flex w-full"
      style={{
        gap: '4px',
      }}
    >
      {TAB_DEFS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-xs font-serif tracking-wide transition-all"
            style={isActive ? {
              fontWeight: 600,
              borderRadius: '3px 3px 0 0',
            } : {
              background: 'rgba(22,12,4,0.75)',
              color: '#c79d67ff',
              borderRadius: '3px 3px 0 0',
              borderBottom: '1px solid rgba(100,70,30,0.45)',
            }}
          >
            <TabStitch side="left" />
            <TabStitch side="right" />
            <span className="text-sm leading-none" style={{ opacity: isActive ? 1 : 0.65 }}>{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
