import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { dndApi, dndKeys, type MonsterDetail, type MonsterSummary } from '../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/bestiary')({
  component: BestiaryPage,
})

const CR_LABELS: Record<number, string> = {
  0: '0', 0.125: '1/8', 0.25: '1/4', 0.5: '1/2',
}

function formatCr(cr: number) {
  return CR_LABELS[cr] ?? String(cr)
}

function crColor(cr: number) {
  if (cr <= 1) return 'text-green-700'
  if (cr <= 5) return 'text-amber-700'
  if (cr <= 10) return 'text-orange-700'
  return 'text-red-800'
}

function mod(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function modColor(score: number) {
  const m = Math.floor((score - 10) / 2)
  return m > 0 ? 'text-green-800' : m < 0 ? 'text-red-800' : 'text-stone-600'
}

// ── Main page ─────────────────────────────────────────────────────────────────

function BestiaryPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const { data: list = [], isLoading } = useQuery({
    queryKey: dndKeys.monsters,
    queryFn: async () => (await dndApi.monsters()).results,
    staleTime: Infinity,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(m => m.name.toLowerCase().includes(q))
  }, [list, search])

  return (
    <div className="h-screen flex flex-col overflow-hidden text-stone-900" style={parchmentStyle}>

      {/* Header */}
      <header className="border-b-2 border-stone-800 bg-stone-900 px-4 sm:px-8 py-2.5 flex items-center gap-3 shrink-0">
        <Link to="/" className="text-amber-400 hover:text-amber-200 transition-colors text-sm font-serif shrink-0">← La Taberna</Link>
        <div className="w-px h-4 bg-stone-700 shrink-0" />
        <div>
          <p className="text-amber-200 font-serif font-semibold text-sm leading-tight">Bestiario</p>
          <p className="text-stone-500 font-serif text-xs leading-tight">D&amp;D 5ª Edición · SRD</p>
        </div>
        <div className="flex-1" />
        <Link to="/spellbook" className="text-stone-400 hover:text-amber-300 transition-colors text-xs font-serif">
          Conjuros →
        </Link>
      </header>

      <div className="flex-1 overflow-hidden max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row gap-6">

        {/* Left panel — search + list */}
        <div className="w-full sm:w-72 shrink-0 flex flex-col overflow-hidden space-y-3">
          <input
            type="search"
            placeholder="Buscar monstruo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
            className="w-full px-3 py-2 text-sm text-stone-800 placeholder-stone-500 font-serif focus:outline-none shrink-0"
          />

          {isLoading ? (
            <p className="text-stone-500 text-sm font-serif italic px-1 shrink-0">Consultando el bestiario...</p>
          ) : (
            <ul className="flex-1 overflow-y-auto pr-1 space-y-0.5">
              {filtered.length === 0 && (
                <li className="text-stone-500 text-sm font-serif italic px-1">Sin resultados.</li>
              )}
              {filtered.map(m => (
                <MonsterRow
                  key={m.index}
                  monster={m}
                  isActive={selected === m.index}
                  onClick={() => setSelected(m.index === selected ? null : m.index)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Right panel — stat block */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selected ? (
            <StatBlock index={selected} />
          ) : (
            <div className="flex items-center justify-center h-full border border-stone-400/40" style={cardStyle}>
              <p className="text-stone-500 font-serif italic text-sm">Seleccioná un monstruo para ver su ficha.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Monster row ───────────────────────────────────────────────────────────────

function MonsterRow({ monster, isActive, onClick }: {
  monster: MonsterSummary
  isActive: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 text-sm font-serif transition-colors border-l-2 ${
          isActive
            ? 'bg-amber-900/10 border-amber-700 text-stone-800'
            : 'border-transparent hover:bg-stone-900/5 hover:border-stone-400 text-stone-700'
        }`}
      >
        {monster.name}
      </button>
    </li>
  )
}

// ── Stat block ────────────────────────────────────────────────────────────────

function StatBlock({ index }: { index: string }) {
  const { data: m, isLoading } = useQuery({
    queryKey: dndKeys.monster(index),
    queryFn: () => dndApi.monster(index),
    staleTime: Infinity,
  })

  if (isLoading || !m) return (
    <div className="flex items-center justify-center h-64 border border-stone-400/40" style={cardStyle}>
      <p className="text-stone-500 font-serif italic text-sm">Cargando...</p>
    </div>
  )

  const ac = m.armor_class[0]?.value ?? '—'
  const STATS: { key: keyof MonsterDetail; label: string }[] = [
    { key: 'strength', label: 'FUE' },
    { key: 'dexterity', label: 'DES' },
    { key: 'constitution', label: 'CON' },
    { key: 'intelligence', label: 'INT' },
    { key: 'wisdom', label: 'SAB' },
    { key: 'charisma', label: 'CAR' },
  ]

  return (
    <div style={cardStyle} className="border border-stone-400/40 overflow-hidden flex flex-col h-full flex-1">

      {/* Title bar */}
      <div className="bg-amber-950/80 px-5 py-4 border-b-2 border-amber-900/60 shrink-0">
        <h2 className="font-display text-amber-100 text-xl leading-tight">{m.name}</h2>
        <p className="text-amber-300/70 font-serif text-xs mt-0.5 capitalize italic">
          {m.size} {m.type} · {m.alignment}
        </p>
      </div>

      {/* Core stats */}
      <div className="px-5 py-3 border-b border-amber-900/30 bg-amber-950/20 shrink-0">
        <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm font-serif">
          <StatLine label="CA" value={String(ac)} />
          <StatLine label="PV" value={`${m.hit_points} (${m.hit_points_roll})`} />
          <StatLine label="CR" value={formatCr(m.challenge_rating)} valueClass={crColor(m.challenge_rating)} />
          <StatLine label="XP" value={m.xp.toLocaleString()} />
          <StatLine label="Velocidad" value={Object.entries(m.speed).map(([k, v]) => k === 'walk' ? v : `${k} ${v}`).join(', ')} />
        </div>
      </div>

      {/* Ability scores */}
      <div className="px-5 py-3 border-b border-stone-400/30 shrink-0">
        <div className="grid grid-cols-6 gap-1 text-center">
          {STATS.map(({ key, label }) => {
            const score = m[key] as number
            return (
              <div key={key}>
                <p className="text-[10px] text-stone-500 uppercase tracking-wider font-serif">{label}</p>
                <p className="text-sm font-mono font-bold text-stone-800">{score}</p>
                <p className={`text-[11px] font-mono ${modColor(score)}`}>{mod(score)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Traits */}
      {(m.damage_resistances.length > 0 || m.damage_immunities.length > 0 || m.damage_vulnerabilities.length > 0 || m.condition_immunities.length > 0) && (
        <div className="px-5 py-3 border-b border-stone-400/30 space-y-1 shrink-0">
          {m.damage_vulnerabilities.length > 0 && (
            <TraitLine label="Vulnerabilidades" value={m.damage_vulnerabilities.join(', ')} />
          )}
          {m.damage_resistances.length > 0 && (
            <TraitLine label="Resistencias" value={m.damage_resistances.join(', ')} />
          )}
          {m.damage_immunities.length > 0 && (
            <TraitLine label="Inmunidades" value={m.damage_immunities.join(', ')} />
          )}
          {m.condition_immunities.length > 0 && (
            <TraitLine label="Inmune a" value={m.condition_immunities.map(c => c.name).join(', ')} />
          )}
        </div>
      )}

      {/* Senses / Languages */}
      <div className="px-5 py-3 border-b border-stone-400/30 space-y-1 shrink-0">
        <TraitLine label="Sentidos" value={Object.entries(m.senses).map(([k, v]) => `${k.replace(/_/g, ' ')} ${v}`).join(', ')} />
        {m.languages && <TraitLine label="Idiomas" value={m.languages} />}
      </div>

      <div className="px-5 py-4 space-y-4 flex-1 overflow-y-auto">

        {/* Special abilities */}
        {m.special_abilities && m.special_abilities.length > 0 && (
          <ActionSection title="Habilidades especiales" items={m.special_abilities} />
        )}

        {/* Actions */}
        {m.actions && m.actions.length > 0 && (
          <ActionSection title="Acciones" items={m.actions.map(a => ({
            name: a.name,
            desc: a.desc + (a.attack_bonus != null
              ? ` · Ataque +${a.attack_bonus}` + (a.damage?.[0] ? `, ${a.damage[0].damage_dice} ${a.damage[0].damage_type?.name ?? ''}` : '')
              : ''),
          }))} />
        )}

        {/* Reactions */}
        {m.reactions && m.reactions.length > 0 && (
          <ActionSection title="Reacciones" items={m.reactions} />
        )}

        {/* Legendary actions */}
        {m.legendary_actions && m.legendary_actions.length > 0 && (
          <ActionSection title="Acciones legendarias" items={m.legendary_actions} />
        )}

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatLine({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-stone-500 shrink-0">{label}:</span>
      <span className={`text-stone-800 font-medium ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}

function TraitLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs font-serif text-stone-700 leading-relaxed">
      <span className="font-semibold text-stone-800">{label}: </span>{value}
    </p>
  )
}

function ActionSection({ title, items }: { title: string; items: { name: string; desc: string }[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-display tracking-widest text-stone-500 uppercase border-b border-stone-400/40 pb-1">{title}</p>
      {items.map((a, i) => (
        <div key={i}>
          <p className="text-sm font-serif text-stone-800">
            <span className="font-semibold italic">{a.name}. </span>
            {a.desc}
          </p>
        </div>
      ))}
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
