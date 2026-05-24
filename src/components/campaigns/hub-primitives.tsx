import { Link } from '@tanstack/react-router'

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-amber-50/20 border border-parchment-sienna/20 shadow-sm">
      <Corner pos="tl" />
      <Corner pos="tr" />
      <Corner pos="bl" />
      <Corner pos="br" />
      <div className="border border-stone-400/10">
        {children}
      </div>
    </div>
  )
}

export function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const positions: Record<typeof pos, string> = {
    tl: 'top-[-3px] left-[-3px] border-t-2 border-l-2',
    tr: 'top-[-3px] right-[-3px] border-t-2 border-r-2',
    bl: 'bottom-[-3px] left-[-3px] border-b-2 border-l-2',
    br: 'bottom-[-3px] right-[-3px] border-b-2 border-r-2',
  }
  return <span className={`absolute w-3 h-3 border-stone-900 ${positions[pos]} pointer-events-none`} />
}

export function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-400/40">
      <span className="text-lg">{icon}</span>
      <h2 className="text-sm font-display tracking-[0.25em] uppercase text-stone-700">{label}</h2>
    </div>
  )
}

export function BlockHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center text-[9px] font-display tracking-[0.2em] uppercase text-stone-600 pt-1">
      {children}
    </div>
  )
}

export function Divider() {
  return <div className="border-t border-stone-400/40" />
}

export function StatBox({ label, value, caption }: { label: string; value: string | number; caption: string }) {
  return (
    <div className="text-center bg-amber-100/60 border border-stone-400/40 py-1.5 px-1">
      <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase leading-tight">{label}</p>
      <p className="text-lg font-bold text-stone-900 font-mono leading-tight my-0.5">{value}</p>
      <p className="text-[9px] italic text-stone-600 leading-tight">{caption}</p>
    </div>
  )
}

export function InfoBox({
  label,
  value,
  caption,
  compact,
}: {
  label: string
  value: React.ReactNode
  caption?: string
  compact?: boolean
}) {
  return (
    <div className="bg-amber-100/60 border border-stone-400/40 px-2 py-1.5">
      <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase">{label}</p>
      {typeof value === 'string' || typeof value === 'number' ? (
        <p className={`${compact ? 'text-xs' : 'text-base font-bold'} font-mono text-stone-900 leading-tight`}>
          {value}
        </p>
      ) : (
        <div className="mt-0.5">{value}</div>
      )}
      {caption && <p className="text-[9px] italic text-stone-600 leading-tight mt-0.5">{caption}</p>}
    </div>
  )
}

export function AddSlot({
  label,
  hint,
  to,
  params,
}: {
  label: string
  hint?: string
  to?: '/campaigns/$campaignId/pnj'
  params?: { campaignId: string }
}) {
  const content = (
    <div className="border-2 border-dashed border-stone-500/40 rounded-sm flex flex-col items-center justify-center min-h-[180px] text-center px-4 py-8 hover:border-stone-700/60 hover:bg-amber-100/30 transition-colors">
      <p className="text-sm italic font-serif text-stone-700">{label}</p>
      {hint && <p className="text-xs text-stone-500 mt-1.5 max-w-[180px]">{hint}</p>}
    </div>
  )
  if (to && params) return <Link to={to} params={params}>{content}</Link>
  return content
}
