import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { dndApi, dndKeys, type SpellDetail } from '../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/spellbook')({
  component: SpellbookPage,
})

const SPELL_SCHOOLS: Record<string, string> = {
  abjuration: '🛡 Abjuración',
  conjuration: '🌀 Conjuración',
  divination: '🔮 Adivinación',
  enchantment: '✨ Encantamiento',
  evocation: '🔥 Evocación',
  illusion: '🌫 Ilusión',
  necromancy: '💀 Nigromancia',
  transmutation: '⚗ Transmutación',
}

const CLASS_FILTER = ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard']

// ── Main page ─────────────────────────────────────────────────────────────────

function SpellbookPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [classFilter, setClassFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | ''>('')

  // Get spells for specific class or all
  const { data: allSpells = [], isLoading: loadingAll } = useQuery({
    queryKey: [...dndKeys.classes, 'all-spells'],
    queryFn: async () => {
      const res = await fetch(`https://www.dnd5eapi.co/api/spells`)
      const data = await res.json()
      return data.results as { index: string; name: string; level: number; url: string }[]
    },
    staleTime: Infinity,
  })

  const { data: classSpells } = useQuery({
    queryKey: ['dnd', 'class-spells', classFilter],
    queryFn: async () => {
      if (!classFilter) return null
      const res = await dndApi.classSpells(classFilter)
      return new Set(res.results.map(s => s.index))
    },
    staleTime: Infinity,
    enabled: !!classFilter,
  })

  const filtered = useMemo(() => {
    let list = allSpells
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(s => s.name.toLowerCase().includes(q))
    if (levelFilter !== '') list = list.filter(s => s.level === levelFilter)
    if (classFilter && classSpells) list = list.filter(s => classSpells.has(s.index))
    return list
  }, [allSpells, search, levelFilter, classFilter, classSpells])

  return (
    <div className="min-h-screen text-stone-900" style={parchmentStyle}>

      {/* Header */}
      <header className="border-b-2 border-stone-800 bg-stone-900 px-4 sm:px-8 py-2.5 flex items-center gap-3">
        <Link to="/" className="text-amber-400 hover:text-amber-200 transition-colors text-sm font-serif shrink-0">← La Taberna</Link>
        <div className="w-px h-4 bg-stone-700 shrink-0" />
        <div>
          <p className="text-amber-200 font-serif font-semibold text-sm leading-tight">Compendio de Conjuros</p>
          <p className="text-stone-500 font-serif text-xs leading-tight">D&amp;D 5ª Edición · SRD</p>
        </div>
        <div className="flex-1" />
        <Link to="/bestiary" className="text-stone-400 hover:text-amber-300 transition-colors text-xs font-serif">
          Bestiario →
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row gap-6">

        {/* Left panel — search + filters + list */}
        <div className="w-full sm:w-80 shrink-0 space-y-3">
          <input
            type="search"
            placeholder="Buscar conjuro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
            className="w-full px-3 py-2 text-sm text-stone-800 placeholder-stone-500 font-serif focus:outline-none"
          />

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              style={inputStyle}
              className="flex-1 px-2 py-1.5 text-xs text-stone-700 font-serif focus:outline-none"
            >
              <option value="">Todas las clases</option>
              {CLASS_FILTER.map(c => (
                <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value === '' ? '' : parseInt(e.target.value))}
              style={inputStyle}
              className="w-24 px-2 py-1.5 text-xs text-stone-700 font-serif focus:outline-none"
            >
              <option value="">Nivel</option>
              <option value={0}>Trucos (0)</option>
              {[1,2,3,4,5,6,7,8,9].map(l => (
                <option key={l} value={l}>Nv. {l}</option>
              ))}
            </select>
          </div>

          <p className="text-[10px] text-stone-500 font-serif italic">
            {filtered.length} conjuros{classFilter ? ` de ${classFilter}` : ''}
          </p>

          {loadingAll ? (
            <p className="text-stone-500 text-sm font-serif italic px-1">Consultando los grimoires...</p>
          ) : (
            <ul className="space-y-0.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <li className="text-stone-500 text-sm font-serif italic px-1">Sin resultados.</li>
              )}
              {filtered.map(s => (
                <li key={s.index}>
                  <button
                    onClick={() => setSelected(s.index === selected ? null : s.index)}
                    className={`w-full text-left px-3 py-2 text-sm font-serif transition-colors border-l-2 ${
                      selected === s.index
                        ? 'bg-amber-900/10 border-amber-700 text-stone-800'
                        : 'border-transparent hover:bg-stone-900/5 hover:border-stone-400 text-stone-700'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>{s.name}</span>
                      <span className="text-[10px] text-stone-400 font-mono">{s.level === 0 ? 'Truco' : `Nv.${s.level}`}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right panel — spell detail */}
        <div className="flex-1">
          {selected ? (
            <SpellCard index={selected} />
          ) : (
            <div className="flex items-center justify-center h-64 border border-stone-400/40" style={cardStyle}>
              <p className="text-stone-500 font-serif italic text-sm">Seleccioná un conjuro para ver los detalles.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Spell card ────────────────────────────────────────────────────────────────

function SpellCard({ index }: { index: string }) {
  const { data: spell, isLoading } = useQuery({
    queryKey: dndKeys.spell(index),
    queryFn: () => dndApi.spell(index),
    staleTime: Infinity,
  })

  if (isLoading || !spell) return (
    <div className="flex items-center justify-center h-64 border border-stone-400/40" style={cardStyle}>
      <p className="text-stone-500 font-serif italic text-sm">Cargando...</p>
    </div>
  )

  const schoolName = SPELL_SCHOOLS[spell.school.index] ?? spell.school.name

  return (
    <div style={cardStyle} className="border border-stone-400/40 overflow-hidden">

      {/* Title bar */}
      <div className="bg-amber-950/80 px-5 py-4 border-b-2 border-amber-900/60">
        <h2 className="font-display text-amber-100 text-xl leading-tight">{spell.name}</h2>
        <p className="text-amber-300/70 font-serif text-xs mt-0.5 italic">
          {spell.level === 0 ? 'Truco' : `Nivel ${spell.level}`} · {schoolName}
        </p>
      </div>

      {/* Properties */}
      <div className="px-5 py-3 border-b border-amber-900/30 bg-amber-950/20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm font-serif">
          <PropLine label="Tiempo" value={spell.casting_time} />
          <PropLine label="Alcance" value={spell.range} />
          <PropLine label="Componentes" value={spell.components.join(', ')} />
          <PropLine label="Duración" value={spell.duration} />
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {spell.desc.map((p, i) => (
          <p key={i} className="text-sm font-serif text-stone-800 leading-relaxed whitespace-pre-line">{p}</p>
        ))}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PropLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-stone-500 shrink-0">{label}:</span>
      <span className="text-stone-800 font-medium">{value}</span>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const parchmentStyle: React.CSSProperties = {
  background: 'linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d9b8 100%)',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.5)',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(120,90,40,0.35)',
  borderRadius: '2px',
}
