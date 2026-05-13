import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys, rollStat, abilityModifier, modifierColor, ABILITY_LABELS, ABILITY_FULL } from '../../../lib/dnd-api'
import type { SpellDetail } from '../../../lib/dnd-api'
import { CLASS_ICONS } from '../../../lib/class-meta'
import { BACKGROUNDS, ABILITY_LABELS_ES } from '../../../lib/dnd-backgrounds'
import type { StatKey } from '../../../lib/dnd-backgrounds'

export const Route = createFileRoute('/_authenticated/characters/new')({
  component: NewCharacter,
})

type Stats = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

interface Draft {
  name: string
  raceIndex: string
  classIndex: string
  subclassIndex: string
  level: number
  rolledValues: number[]
  stats: Stats
  backgroundKey: string
  bgBonus2: StatKey | ''
  bgBonus1: StatKey | ''
  skillProficiencies: string[]
  spells: string[]
  backstory: string
  campaignId: string
}

const EMPTY_STATS: Stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

function rollAll(): number[] {
  return Array.from({ length: 6 }, rollStat).sort((a, b) => b - a)
}

function NewCharacter() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = Route.useRouteContext() as { session: Session }

  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [spellModal, setSpellModal] = useState<SpellDetail | null>(null)
  const [statMode, setStatMode] = useState<'rolled' | 'manual'>('rolled')
  const [draft, setDraft] = useState<Draft>({
    name: '', raceIndex: '', classIndex: '', subclassIndex: '', level: 1,
    rolledValues: rollAll(),
    stats: EMPTY_STATS,
    backgroundKey: '', bgBonus2: '', bgBonus1: '',
    skillProficiencies: [], spells: [], backstory: '', campaignId: '',
  })

  const patch = (update: Partial<Draft>) => setDraft(d => ({ ...d, ...update }))

  const { data: races } = useQuery({ queryKey: dndKeys.races, queryFn: dndApi.races })
  const { data: classes } = useQuery({ queryKey: dndKeys.classes, queryFn: dndApi.classes })
  const { data: raceDetail } = useQuery({
    queryKey: dndKeys.race(draft.raceIndex),
    queryFn: () => dndApi.race(draft.raceIndex),
    enabled: !!draft.raceIndex,
  })
  const { data: classDetail } = useQuery({
    queryKey: dndKeys.klass(draft.classIndex),
    queryFn: () => dndApi.klass(draft.classIndex),
    enabled: !!draft.classIndex,
  })
  const { data: classSubclasses } = useQuery({
    queryKey: dndKeys.classSubclasses(draft.classIndex),
    queryFn: () => dndApi.classSubclasses(draft.classIndex),
    enabled: !!draft.classIndex,
  })
  const { data: userCampaigns = [] } = useQuery({
    queryKey: ['campaigns', 'all', session.user.id],
    queryFn: async () => {
      const [gm, player] = await Promise.all([
        supabase.from('campaigns').select('id, name').eq('dm_id', session.user.id),
        supabase.from('campaign_players').select('campaigns(id, name)').eq('user_id', session.user.id),
      ])
      const gmList = gm.data ?? []
      const playerList = (player.data ?? []).flatMap(r => r.campaigns ? [r.campaigns as { id: string; name: string }] : [])
      const seen = new Set<string>()
      return [...gmList, ...playerList].filter(c => seen.has(c.id) ? false : (seen.add(c.id), true))
    },
  })

  const { data: classSpells } = useQuery({
    queryKey: dndKeys.classSpells(draft.classIndex),
    queryFn: () => dndApi.classSpells(draft.classIndex),
    enabled: !!draft.classIndex && !!classDetail?.spellcasting,
  })

  const selectedBg = draft.backgroundKey ? BACKGROUNDS[draft.backgroundKey] : null
  const backgroundBonuses: Partial<Stats> = selectedBg && draft.bgBonus2 && draft.bgBonus1
    ? { [draft.bgBonus2]: 2, [draft.bgBonus1]: 1 }
    : {}

  const totalStats = STAT_KEYS.reduce<Stats>((acc, k) => {
    acc[k] = (draft.stats[k] || 0) + (backgroundBonuses[k] ?? 0)
    return acc
  }, { ...EMPTY_STATS })

  const isCaster = !!classDetail?.spellcasting
  const totalSteps = isCaster ? 6 : 5

  const canProceed = () => {
    if (step === 1) return draft.name.trim() && draft.raceIndex && draft.classIndex
    if (step === 2) {
      if (statMode === 'manual') {
        return STAT_KEYS.every(k => draft.stats[k] >= 3 && draft.stats[k] <= 20)
      }
      const unassigned = STAT_KEYS.filter(k => !draft.stats[k])
      return unassigned.length === 0 && new Set(Object.values(draft.stats)).size === 6
    }
    if (step === 3) {
      return !!(draft.backgroundKey && draft.bgBonus2 && draft.bgBonus1 && draft.bgBonus2 !== draft.bgBonus1)
    }
    if (step === 4) {
      const choices = classDetail?.proficiency_choices[0]
      return !choices || draft.skillProficiencies.length === choices.choose
    }
    return true
  }

  const handleSave = async () => {
    setError(null)
    const { error } = await supabase.from('characters').insert({
      user_id: session.user.id,
      name: draft.name.trim(),
      race: draft.raceIndex,
      class: draft.classIndex,
      level: draft.level,
      stats: totalStats,
      backstory: draft.backstory || null,
      campaign_id: draft.campaignId || null,
      sheet_json: {
        base_stats: draft.stats,
        background: draft.backgroundKey || null,
        background_bonuses: backgroundBonuses,
        background_skills: selectedBg?.skills ?? [],
        skill_proficiencies: draft.skillProficiencies,
        weapon_proficiencies: classDetail?.proficiencies.map(p => p.index) ?? [],
        spells: draft.spells,
        hit_die: classDetail?.hit_die ?? 8,
        saving_throws: classDetail?.saving_throws.map(s => s.index) ?? [],
        ...(draft.subclassIndex ? { subclass: draft.subclassIndex } : {}),
      },
    })
    if (error) { setError(error.message); return }
    await queryClient.invalidateQueries({ queryKey: ['characters'] })
    navigate({ to: '/' })
  }

  const classIcon = CLASS_ICONS[draft.classIndex] ?? '🎲'

  return (
    <div className="min-h-screen bg-stone-tavern text-stone-100">

      {/* Header */}
      <header className="border-b border-stone-800/80 px-4 sm:px-8 py-3 flex items-center justify-between gap-2" style={headerStyle}>
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="w-7 h-7" />
          <div className="hidden sm:block">
            <h1 className="font-display text-amber-200/90 text-base leading-tight tracking-wide">La Taberna</h1>
            <p className="font-display text-amber-500/80 text-[0.6rem] tracking-[0.3em] uppercase leading-none">de Martita</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-display text-amber-500/70 text-xs tracking-widest uppercase hidden sm:block">Nuevo personaje</p>
          <span className="text-xs text-stone-600 font-serif">Paso {step} de {totalSteps}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8">

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-6 h-6 flex items-center justify-center text-xs font-display transition-colors ${
                i + 1 < step ? 'text-amber-600 border border-amber-800/60' :
                i + 1 === step ? 'text-amber-300 border border-amber-600' :
                'text-stone-700 border border-stone-800'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < totalSteps - 1 && <div className={`flex-1 h-px mx-1 ${i + 1 < step ? 'bg-amber-800/60' : 'bg-stone-800'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-6">
            <StepTitle>Información básica</StepTitle>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del personaje"
                value={draft.name}
                onChange={e => patch({ name: e.target.value })}
                style={inputStyle}
                className="w-full px-4 py-3 text-stone-100 placeholder-stone-600 font-serif focus:outline-none transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Raza</label>
                  <select
                    value={draft.raceIndex}
                    onChange={e => patch({ raceIndex: e.target.value })}
                    style={inputStyle}
                    className="w-full px-3 py-2.5 text-stone-100 font-serif focus:outline-none transition-colors"
                  >
                    <option value="">Elegir raza...</option>
                    {races?.results.map(r => <option key={r.index} value={r.index}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Clase</label>
                  <select
                    value={draft.classIndex}
                    onChange={e => patch({ classIndex: e.target.value, subclassIndex: '', spells: [], skillProficiencies: [] })}
                    style={inputStyle}
                    className="w-full px-3 py-2.5 text-stone-100 font-serif focus:outline-none transition-colors"
                  >
                    <option value="">Elegir clase...</option>
                    {classes?.results.map(c => <option key={c.index} value={c.index}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Nivel</label>
                <input
                  type="number" min={1} max={20}
                  value={draft.level}
                  onChange={e => patch({ level: Math.min(20, Math.max(1, +e.target.value)) })}
                  style={inputStyle}
                  className="w-24 px-4 py-2.5 text-stone-100 font-mono focus:outline-none transition-colors"
                />
              </div>

              {/* Subclass selector */}
              {classSubclasses && classSubclasses.results.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Subclase</label>
                  <select
                    value={draft.subclassIndex}
                    onChange={e => patch({ subclassIndex: e.target.value })}
                    style={inputStyle}
                    className="w-full px-3 py-2.5 text-stone-100 font-serif focus:outline-none transition-colors"
                  >
                    <option value="">Elegir subclase... (opcional)</option>
                    {classSubclasses.results.map(s => (
                      <option key={s.index} value={s.index}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-stone-700 font-serif italic">Contenido disponible según el SRD (licencia abierta D&D)</p>
                </div>
              )}

              {/* Race + class preview */}
              {(raceDetail || classDetail) && (
                <div style={cardStyle} className="p-4 space-y-3">
                  {classDetail && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{classIcon}</span>
                      <div>
                        <p className="text-amber-200/80 font-display text-sm tracking-wide">{classDetail.name}</p>
                        <p className="text-stone-500 text-xs font-serif">d{classDetail.hit_die} hit die · {classDetail.saving_throws.map(s => s.name).join(', ')}</p>
                      </div>
                    </div>
                  )}
                  {raceDetail && (
                    <p className="text-xs text-stone-600 font-serif italic">
                      Los bonificadores de atributo vienen del trasfondo, no de la raza (reglas 2024).
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Stats */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <StepTitle>Atributos</StepTitle>
              {/* Mode toggle */}
              <div className="flex shrink-0 border border-stone-700 overflow-hidden">
                <button
                  onClick={() => { setStatMode('rolled'); patch({ rolledValues: rollAll(), stats: EMPTY_STATS }) }}
                  className={`px-3 py-1.5 text-xs font-serif transition-colors border-r border-stone-700 ${
                    statMode === 'rolled'
                      ? 'text-amber-300 bg-amber-900/30'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  🎲 Sistema
                </button>
                <button
                  onClick={() => { setStatMode('manual'); patch({ stats: EMPTY_STATS }) }}
                  className={`px-3 py-1.5 text-xs font-serif transition-colors ${
                    statMode === 'manual'
                      ? 'text-amber-300 bg-amber-900/30'
                      : 'text-stone-500 hover:text-stone-300'
                  }`}
                >
                  ✍ Manual
                </button>
              </div>
            </div>

            {statMode === 'rolled' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-stone-500 font-serif italic">
                    Asigná cada valor a un atributo. Cada valor puede usarse una sola vez.
                  </p>
                  <button
                    onClick={() => patch({ rolledValues: rollAll(), stats: EMPTY_STATS })}
                    className="text-xs px-3 py-1.5 border border-stone-700 hover:border-amber-700 text-stone-400 hover:text-amber-400 transition-colors font-serif shrink-0 ml-4"
                  >
                    ↺ Volver a tirar
                  </button>
                </div>

                {/* Rolled values chips */}
                <div className="flex gap-2 flex-wrap">
                  {draft.rolledValues.map((v, i) => {
                    const used = Object.values(draft.stats).includes(v) &&
                      Object.values(draft.stats).filter(s => s === v).length >
                      draft.rolledValues.slice(0, i).filter(r => r === v).length
                    return (
                      <span
                        key={i}
                        className={`px-3 py-1.5 text-sm font-mono font-bold border ${used ? 'border-stone-800 text-stone-700' : 'border-amber-700/60 text-amber-300'}`}
                        style={used ? {} : { background: 'rgba(120,60,10,0.2)' }}
                      >
                        {v}
                      </span>
                    )
                  })}
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-2 gap-2.5">
                  {STAT_KEYS.map(key => (
                    <div key={key} style={cardStyle} className="flex items-center gap-3 p-3">
                      <div className="w-12 shrink-0">
                        <p className="font-display text-amber-400/80 text-xs tracking-wider">{ABILITY_LABELS[key]}</p>
                        <p className="text-[10px] text-stone-600 font-serif">{ABILITY_FULL[key]}</p>
                      </div>
                      <select
                        value={draft.stats[key] || ''}
                        onChange={e => patch({ stats: { ...draft.stats, [key]: +e.target.value } })}
                        style={inputStyle}
                        className="flex-1 px-2 py-1.5 text-stone-100 font-mono text-sm focus:outline-none"
                      >
                        <option value="">—</option>
                        {draft.rolledValues.map((v, i) => <option key={i} value={v}>{v}</option>)}
                      </select>
                      {draft.stats[key] > 0 && (
                        <div className="text-right w-12 shrink-0">
                          <p className="text-sm font-mono text-stone-200">{draft.stats[key]}</p>
                          <p className={`text-xs font-mono ${modifierColor(draft.stats[key])}`}>{abilityModifier(draft.stats[key])}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-stone-500 font-serif italic">
                  Ingresá los valores de tus atributos (3–20). Podés tirar los dados físicamente y escribir el resultado.
                </p>

                {/* Manual number inputs */}
                <div className="grid grid-cols-2 gap-2.5">
                  {STAT_KEYS.map(key => {
                    const total = draft.stats[key] || 0
                    return (
                      <div key={key} style={cardStyle} className="flex items-center gap-3 p-3">
                        <div className="w-12 shrink-0">
                          <p className="font-display text-amber-400/80 text-xs tracking-wider">{ABILITY_LABELS[key]}</p>
                          <p className="text-[10px] text-stone-600 font-serif">{ABILITY_FULL[key]}</p>
                        </div>
                        <input
                          type="number"
                          min={3} max={20}
                          placeholder="—"
                          value={draft.stats[key] || ''}
                          onChange={e => {
                            const v = Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
                            patch({ stats: { ...draft.stats, [key]: v } })
                          }}
                          style={inputStyle}
                          className="flex-1 px-3 py-1.5 text-stone-100 font-mono text-lg font-bold text-center focus:outline-none w-0"
                        />
                        {draft.stats[key] >= 3 && (
                          <div className="text-right w-12 shrink-0">
                            <p className="text-sm font-mono text-stone-200">{total}</p>
                            <p className={`text-xs font-mono ${modifierColor(total)}`}>{abilityModifier(total)}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <p className="text-xs text-stone-600 font-serif italic">Los bonificadores +2/+1 del trasfondo se asignan en el siguiente paso.</p>
          </div>
        )}

        {/* Step 3: Background */}
        {step === 3 && (
          <div className="space-y-6">
            <StepTitle>Trasfondo</StepTitle>
            <p className="text-sm text-stone-500 font-serif italic">
              El trasfondo define quién eras antes de aventurarte. Cada trasfondo otorga +2 y +1 a dos de sus tres características predefinidas.
            </p>

            {/* Background grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {Object.entries(BACKGROUNDS).map(([key, bg]) => {
                const isSelected = draft.backgroundKey === key
                return (
                  <button
                    key={key}
                    onClick={() => patch({ backgroundKey: key, bgBonus2: '', bgBonus1: '' })}
                    className={`text-left p-3 border transition-colors ${
                      isSelected
                        ? 'border-amber-700/80 text-amber-100'
                        : 'border-stone-700/50 text-stone-400 hover:border-amber-800/50 hover:text-stone-200'
                    }`}
                    style={isSelected ? { background: 'rgba(120,60,10,0.3)', border: '1px solid rgba(180,100,20,0.5)' } : cardStyle}
                  >
                    <p className="text-sm font-serif font-semibold leading-tight">{bg.name}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5 font-display tracking-wider">
                      {bg.abilities.map(a => ABILITY_LABELS_ES[a]).join(' · ')}
                    </p>
                    <p className="text-[11px] text-stone-600 font-serif italic mt-1 leading-snug line-clamp-2">{bg.desc}</p>
                  </button>
                )
              })}
            </div>

            {/* ASI assignment */}
            {selectedBg && (
              <div style={cardStyle} className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-stone-400 font-display tracking-widest uppercase mb-1">{selectedBg.name}</p>
                  <p className="text-[11px] text-stone-600 font-serif">Pericias: {selectedBg.skills.join(', ')} · Herramienta: {selectedBg.tool}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 font-display tracking-widest uppercase">+2 a...</label>
                    <select
                      value={draft.bgBonus2}
                      onChange={e => {
                        const val = e.target.value as StatKey | ''
                        patch({
                          bgBonus2: val,
                          bgBonus1: draft.bgBonus1 === val ? '' : draft.bgBonus1,
                        })
                      }}
                      style={inputStyle}
                      className="w-full px-3 py-2 text-stone-100 font-serif text-sm focus:outline-none"
                    >
                      <option value="">Elegir...</option>
                      {selectedBg.abilities.map(a => (
                        <option key={a} value={a}>{ABILITY_LABELS_ES[a]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-500 font-display tracking-widest uppercase">+1 a...</label>
                    <select
                      value={draft.bgBonus1}
                      onChange={e => patch({ bgBonus1: e.target.value as StatKey | '' })}
                      style={inputStyle}
                      className="w-full px-3 py-2 text-stone-100 font-serif text-sm focus:outline-none"
                    >
                      <option value="">Elegir...</option>
                      {selectedBg.abilities.filter(a => a !== draft.bgBonus2).map(a => (
                        <option key={a} value={a}>{ABILITY_LABELS_ES[a]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bonus preview */}
                {draft.bgBonus2 && draft.bgBonus1 && (
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-stone-800">
                    <span className="text-xs text-amber-400/90 border border-amber-900/50 px-2 py-0.5 font-serif">
                      +2 {ABILITY_LABELS_ES[draft.bgBonus2]}
                    </span>
                    <span className="text-xs text-amber-400/60 border border-amber-900/30 px-2 py-0.5 font-serif">
                      +1 {ABILITY_LABELS_ES[draft.bgBonus1]}
                    </span>
                    <span className="text-xs text-stone-700 font-serif italic ml-auto">
                      El tercer atributo ({ABILITY_LABELS_ES[selectedBg.abilities.find(a => a !== draft.bgBonus2 && a !== draft.bgBonus1)!]}) no recibe bono
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Proficiencies */}
        {step === 4 && classDetail && (
          <div className="space-y-6">
            <StepTitle>Pericias</StepTitle>

            {classDetail.proficiencies.length > 0 && (
              <div style={cardStyle} className="p-4 space-y-2">
                <p className="text-xs text-stone-500 font-display tracking-widest uppercase">Competencias automáticas de clase</p>
                <div className="flex flex-wrap gap-1.5">
                  {classDetail.proficiencies.map(p => (
                    <span key={p.index} className="px-2 py-0.5 text-xs font-serif text-stone-400 border border-stone-700/60">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedBg && selectedBg.skills.length > 0 && (
              <div style={cardStyle} className="p-4 space-y-2">
                <p className="text-xs text-stone-500 font-display tracking-widest uppercase">Pericias de trasfondo ({selectedBg.name})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBg.skills.map(s => (
                    <span key={s} className="px-2 py-0.5 text-xs font-serif text-amber-400/70 border border-amber-900/30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {classDetail.proficiency_choices.map((choice, ci) => (
              <div key={ci} className="space-y-3">
                <p className="text-sm text-stone-300 font-serif">
                  Elegí {choice.choose} pericias adicionales:{' '}
                  <span className={`font-mono ${draft.skillProficiencies.length >= choice.choose ? 'text-amber-400' : 'text-stone-500'}`}>
                    {draft.skillProficiencies.length}/{choice.choose}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {choice.from.options.map(opt => {
                    const idx = opt.item.index
                    const name = opt.item.name.replace('Skill: ', '')
                    const selected = draft.skillProficiencies.includes(idx)
                    const maxed = !selected && draft.skillProficiencies.length >= choice.choose
                    return (
                      <button
                        key={idx}
                        disabled={maxed}
                        onClick={() => patch({
                          skillProficiencies: selected
                            ? draft.skillProficiencies.filter(s => s !== idx)
                            : [...draft.skillProficiencies, idx],
                        })}
                        className={`px-3 py-2 text-sm text-left transition-colors border font-serif ${
                          selected
                            ? 'border-amber-700/80 text-amber-200'
                            : maxed
                            ? 'border-stone-800 text-stone-700 cursor-not-allowed'
                            : 'border-stone-700/60 text-stone-400 hover:border-amber-800/60 hover:text-stone-200'
                        }`}
                        style={selected ? { background: 'rgba(120,60,10,0.3)' } : {}}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Spells (only for casters) */}
        {step === 5 && isCaster && classSpells && (
          <div className="space-y-6">
            <StepTitle>Hechizos iniciales</StepTitle>
            <p className="text-sm text-stone-500 font-serif italic">
              Seleccioná los hechizos de tu {classDetail?.name}.{' '}
              <span className="text-amber-500/80 not-italic">{draft.spells.length} seleccionados</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 max-h-[400px] overflow-y-auto pr-1">
              {classSpells.results.map(s => {
                const selected = draft.spells.includes(s.index)
                return (
                  <div key={s.index} className={`flex items-center border transition-colors ${
                    selected ? 'border-amber-700/80' : 'border-stone-700/50 hover:border-amber-800/50'
                  }`} style={selected ? { background: 'rgba(120,60,10,0.25)' } : {}}>
                    <button
                      onClick={() => patch({
                        spells: selected
                          ? draft.spells.filter(i => i !== s.index)
                          : [...draft.spells, s.index],
                      })}
                      className="flex-1 px-3 py-2 text-sm text-left font-serif"
                    >
                      <span className={selected ? 'text-amber-200' : 'text-stone-400'}>{s.name}</span>
                    </button>
                    <SpellInfoButton index={s.index} onInfo={setSpellModal} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Last step: Backstory */}
        {step === totalSteps && (
          <div className="space-y-6">
            <StepTitle>Historia & resumen</StepTitle>
            <textarea
              placeholder="Contá la historia de tu personaje... (opcional)"
              value={draft.backstory}
              onChange={e => patch({ backstory: e.target.value })}
              rows={6}
              style={inputStyle}
              className="w-full px-4 py-3 text-stone-200 placeholder-stone-600 font-serif focus:outline-none resize-none text-sm"
            />

            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Campaña <span className="text-stone-700 normal-case">(opcional)</span></label>
              <select
                value={draft.campaignId}
                onChange={e => patch({ campaignId: e.target.value })}
                style={inputStyle}
                className="w-full px-4 py-2.5 text-stone-200 font-serif focus:outline-none text-sm"
              >
                <option value="">Sin campaña por ahora</option>
                {userCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={cardStyle} className="p-4 space-y-3 text-sm">
              <p className="text-xs text-stone-500 font-display tracking-widest uppercase mb-3">Resumen</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{classIcon}</span>
                <div>
                  <p className="text-stone-200 font-serif font-semibold">{draft.name}</p>
                  <p className="text-stone-500 text-xs font-serif capitalize">{raceDetail?.name} · {classDetail?.name} · Nivel {draft.level}</p>
                  {selectedBg && (
                    <p className="text-stone-600 text-xs font-serif">Trasfondo: {selectedBg.name}</p>
                  )}
                </div>
              </div>

              {/* Background bonuses summary */}
              {selectedBg && draft.bgBonus2 && draft.bgBonus1 && (
                <div className="flex gap-2 flex-wrap pb-2">
                  <span className="text-xs text-amber-400/80 border border-amber-900/40 px-2 py-0.5 font-serif">
                    {selectedBg.name}: +2 {ABILITY_LABELS_ES[draft.bgBonus2]} · +1 {ABILITY_LABELS_ES[draft.bgBonus1]}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-6 gap-1 pt-2 border-t border-stone-800">
                {STAT_KEYS.map(k => (
                  <div key={k} className="text-center">
                    <p className="text-[10px] text-stone-600 font-display tracking-wider uppercase">{ABILITY_LABELS[k]}</p>
                    <p className="text-sm font-mono font-bold text-stone-200">{totalStats[k] || '—'}</p>
                    {totalStats[k] > 0 && <p className={`text-[10px] font-mono ${modifierColor(totalStats[k])}`}>{abilityModifier(totalStats[k])}</p>}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-400/90 text-xs font-serif text-center border border-red-900/40 px-3 py-1.5 bg-red-950/30">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate({ to: '/' })}
            className="flex-1 py-2.5 border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-stone-200 transition-colors text-sm font-serif"
          >
            {step === 1 ? 'Cancelar' : '← Atrás'}
          </button>
          {step < totalSteps ? (
            <button
              onClick={() => canProceed() && setStep(s => s + 1)}
              disabled={!canProceed()}
              style={canProceed() ? btnStyle : {}}
              className={`flex-1 py-2.5 text-sm font-display tracking-wider transition-all ${!canProceed() ? 'border border-stone-800 text-stone-700 cursor-not-allowed' : ''}`}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSave}
              style={btnStyle}
              className="flex-1 py-2.5 font-display text-sm tracking-wider transition-all"
            >
              Crear personaje
            </button>
          )}
        </div>
      </div>

      {/* Spell info modal */}
      {spellModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSpellModal(null)}>
          <div onClick={e => e.stopPropagation()} style={modalStyle} className="max-w-md w-full p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-amber-200 tracking-wide">{spellModal.name}</h3>
                <p className="text-xs text-stone-500 mt-0.5 font-serif">
                  Nv. {spellModal.level} · {spellModal.school.name} · {spellModal.casting_time}
                </p>
              </div>
              <button onClick={() => setSpellModal(null)} className="text-stone-600 hover:text-stone-300 text-lg leading-none ml-4">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 font-serif border-t border-stone-800 pt-3">
              <span>Alcance: {spellModal.range}</span>
              <span>Duración: {spellModal.duration}</span>
              <span>Componentes: {spellModal.components.join(', ')}</span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed font-serif max-h-48 overflow-y-auto">{spellModal.desc[0]}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-stone-800" />
        <p className="text-xs font-display tracking-widest text-stone-500 uppercase whitespace-nowrap">{children}</p>
        <div className="h-px flex-1 bg-stone-800" />
      </div>
    </div>
  )
}

function SpellInfoButton({ index, onInfo }: { index: string; onInfo: (s: SpellDetail) => void }) {
  const { data: spell } = useQuery({
    queryKey: dndKeys.spell(index),
    queryFn: () => dndApi.spell(index),
  })
  if (!spell) return null
  return (
    <button
      onClick={e => { e.stopPropagation(); onInfo(spell) }}
      className="px-2 py-2 text-stone-600 hover:text-amber-500 transition-colors text-xs"
      title="Ver descripción"
    >
      ℹ
    </button>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #100c08 0%, #0c0a08 100%)',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(120,70,20,0.35)',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
}

const btnStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #9B4A10 0%, #7B3408 100%)',
  color: '#f5d9a8',
  border: '1px solid #6B2C06',
  letterSpacing: '0.1em',
}

const modalStyle: React.CSSProperties = {
  background: 'linear-gradient(170deg, #180e06 0%, #0f0804 100%)',
  border: '1px solid rgba(120,70,20,0.4)',
}
