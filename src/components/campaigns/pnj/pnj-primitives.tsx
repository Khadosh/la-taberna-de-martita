export const inputClass =
  'w-full px-2 py-1.5 bg-amber-50 border border-stone-400/40 text-stone-900 text-sm font-serif focus:outline-none focus:border-stone-700 focus:bg-white'

export function SectionHeader({ icon, label, extra }: { icon: string; label: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-400/40">
      <span className="text-lg">{icon}</span>
      <h2 className="text-sm font-display tracking-[0.25em] uppercase text-stone-700 flex-1">{label}</h2>
      {extra}
    </div>
  )
}

export function Block({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-display tracking-[0.25em] uppercase text-stone-600">{label}</p>
        {right}
      </div>
      {children}
    </div>
  )
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`block text-[10px] font-serif tracking-wide uppercase mb-1 ${required ? 'text-stone-900' : 'text-stone-600'}`}>
        {label}
      </span>
      {children}
    </label>
  )
}

export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-amber-50/20 border border-parchment-sienna/20 shadow-sm">
      <span className="absolute -top-[3px] -left-[3px] w-3 h-3 border-t-2 border-l-2 border-stone-900" />
      <span className="absolute -top-[3px] -right-[3px] w-3 h-3 border-t-2 border-r-2 border-stone-900" />
      <span className="absolute -bottom-[3px] -left-[3px] w-3 h-3 border-b-2 border-l-2 border-stone-900" />
      <span className="absolute -bottom-[3px] -right-[3px] w-3 h-3 border-b-2 border-r-2 border-stone-900" />
      <div className="border border-stone-400/10">{children}</div>
    </div>
  )
}
