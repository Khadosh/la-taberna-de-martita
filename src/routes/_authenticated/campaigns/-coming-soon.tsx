export function ComingSoon({
  icon,
  title,
  lines,
  footer,
}: {
  icon: string
  title: string
  lines: string[]
  footer?: React.ReactNode
}) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
      <div className="relative bg-amber-50/50 border border-stone-400/40 px-8 py-12 text-center">
        <span className="absolute -top-[3px] -left-[3px] w-3 h-3 border-t-2 border-l-2 border-stone-900" />
        <span className="absolute -top-[3px] -right-[3px] w-3 h-3 border-t-2 border-r-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -left-[3px] w-3 h-3 border-b-2 border-l-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -right-[3px] w-3 h-3 border-b-2 border-r-2 border-stone-900" />

        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-2xl font-display tracking-wide text-stone-900 mb-3">{title}</h2>
        <p className="text-xs font-serif italic uppercase tracking-[0.3em] text-amber-800 mb-6">Próximamente</p>
        <div className="space-y-2 text-sm font-serif text-stone-700 leading-relaxed">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        {footer}
      </div>
    </main>
  )
}
