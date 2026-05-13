import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys, rollStat, abilityModifier, ABILITY_LABELS, ABILITY_FULL } from '../../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/characters/new')({
  component: NewCharacter,
})

type Stats = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

interface Draft {
  name: string
  raceIndex: string
  classIndex: string
  level: number
  rolledValues: number[]
  stats: Stats
  skillProficiencies: string[]
  spells: string[]
  backstory: string
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
  const [draft, setDraft] = useState<Draft>({
    name: '', raceIndex: '', classIndex: '', level: 1,
    rolledValues: rollAll(),
    stats: EMPTY_STATS,
    skillProficiencies: [], spells: [], backstory: '',
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
  const { data: classSpells } = useQuery({
    queryKey: dndKeys.classSpells(draft.classIndex),
    queryFn: () => dndApi.classSpells(draft.classIndex),
    enabled: !!draft.classIndex && !!classDetail?.spellcasting,
  })

  const racialBonuses = raceDetail?.ability_bonuses.reduce<Partial<Stats>>((acc, b) => {
    const key = b.ability_score.index as keyof Stats
    if (key in EMPTY_STATS) acc[key] = (acc[key] ?? 0) + b.bonus
    return acc
  }, {}) ?? {}

  const totalStats = STAT_KEYS.reduce<Stats>((acc, k) => {
    acc[k] = (draft.stats[k] || 0) + (racialBonuses[k] ?? 0)
    return acc
  }, { ...EMPTY_STATS })

  const isCaster = !!classDetail?.spellcasting
  const totalSteps = isCaster ? 5 : 4

  const canProceed = () => {
    if (step === 1) return draft.name.trim() && draft.raceIndex && draft.classIndex
    if (step === 2) {
      const unassigned = STAT_KEYS.filter(k => !draft.stats[k])
      return unassigned.length === 0 && new Set(Object.values(draft.stats)).size === 6
    }
    if (step === 3) {
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
      sheet_json: {
        base_stats: draft.stats,
        racial_bonuses: racialBonuses,
        skill_proficiencies: draft.skillProficiencies,
        weapon_proficiencies: classDetail?.proficiencies.map(p => p.index) ?? [],
        spells: draft.spells,
        hit_die: classDetail?.hit_die ?? 8,
        saving_throws: classDetail?.saving_throws.map(s => s.index) ?? [],
      },
    })
    if (error) { setError(error.message); return }
    await queryClient.invalidateQueries({ queryKey: ['characters'] })
    navigate({ to: '/' })
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-200">Nuevo personaje</h1>
        <span className="text-sm text-stone-500">Paso {step} de {totalSteps}</span>
      </header>

      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Información básica</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del personaje"
                value={draft.name}
                onChange={e => patch({ name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 focus:outline-none focus:border-amber-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-stone-400">Raza</label>
                  <select
                    value={draft.raceIndex}
                    onChange={e => patch({ raceIndex: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Elegir raza...</option>
                    {races?.results.map(r => <option key={r.index} value={r.index}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-stone-400">Clase</label>
                  <select
                    value={draft.classIndex}
                    onChange={e => patch({ classIndex: e.target.value, spells: [], skillProficiencies: [] })}
                    className="w-full px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Elegir clase...</option>
                    {classes?.results.map(c => <option key={c.index} value={c.index}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-stone-400">Nivel</label>
                <input
                  type="number" min={1} max={20}
                  value={draft.level}
                  onChange={e => patch({ level: Math.min(20, Math.max(1, +e.target.value)) })}
                  className="w-32 px-4 py-2 rounded-lg bg-stone-800 border border-stone-700 focus:outline-none focus:border-amber-500"
                />
              </div>
              {raceDetail && (
                <div className="p-4 rounded-lg bg-stone-900 border border-stone-800 text-sm space-y-1">
                  <p className="text-stone-400">Bonificaciones raciales:</p>
                  {raceDetail.ability_bonuses.map(b => (
                    <p key={b.ability_score.index} className="text-amber-300">
                      +{b.bonus} {b.ability_score.name}
                    </p>
                  ))}
                  {raceDetail.ability_bonuses.length === 0 && <p className="text-stone-500">Ninguna</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Stats */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Atributos</h2>
              <button
                onClick={() => patch({ rolledValues: rollAll(), stats: EMPTY_STATS })}
                className="text-sm px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 transition-colors"
              >
                ↺ Volver a tirar
              </button>
            </div>
            <p className="text-sm text-stone-400">
              Asigná cada valor a un atributo. Cada valor puede usarse una sola vez.
            </p>

            {/* Rolled values */}
            <div className="flex gap-2 flex-wrap">
              {draft.rolledValues.map((v, i) => {
                const used = Object.values(draft.stats).includes(v) &&
                  Object.values(draft.stats).filter(s => s === v).length >
                  draft.rolledValues.slice(0, i).filter(r => r === v).length
                return (
                  <span
                    key={i}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${used ? 'bg-stone-800 text-stone-600' : 'bg-amber-900 text-amber-200'}`}
                  >
                    {v}
                  </span>
                )
              })}
            </div>

            {/* Stat assignment */}
            <div className="grid grid-cols-2 gap-3">
              {STAT_KEYS.map(key => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-stone-900 border border-stone-800">
                  <div className="w-16">
                    <p className="font-bold text-amber-200">{ABILITY_LABELS[key]}</p>
                    <p className="text-xs text-stone-500">{ABILITY_FULL[key]}</p>
                  </div>
                  <select
                    value={draft.stats[key] || ''}
                    onChange={e => patch({ stats: { ...draft.stats, [key]: +e.target.value } })}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-stone-800 border border-stone-700 focus:outline-none focus:border-amber-500 text-sm"
                  >
                    <option value="">—</option>
                    {draft.rolledValues.map((v, i) => <option key={i} value={v}>{v}</option>)}
                  </select>
                  {draft.stats[key] > 0 && (
                    <div className="text-right w-16">
                      <p className="text-sm font-mono">{draft.stats[key] + (racialBonuses[key] ?? 0)}</p>
                      <p className="text-xs text-amber-300">{abilityModifier(draft.stats[key] + (racialBonuses[key] ?? 0))}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {Object.keys(racialBonuses).length > 0 && (
              <p className="text-xs text-stone-500">Los valores mostrados ya incluyen los bonificadores raciales.</p>
            )}
          </div>
        )}

        {/* Step 3: Proficiencies */}
        {step === 3 && classDetail && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Pericias</h2>

            {/* Auto-assigned weapon/armor proficiencies */}
            {classDetail.proficiencies.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-300">Competencias automáticas de clase</p>
                <div className="flex flex-wrap gap-2">
                  {classDetail.proficiencies.map(p => (
                    <span key={p.index} className="px-2 py-1 text-xs rounded bg-stone-800 text-stone-300 border border-stone-700">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skill choices */}
            {classDetail.proficiency_choices.map((choice, ci) => (
              <div key={ci} className="space-y-3">
                <p className="text-sm font-medium text-stone-300">
                  Elegí {choice.choose} pericias de habilidad:
                  <span className="text-amber-400 ml-2">{draft.skillProficiencies.length}/{choice.choose}</span>
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
                        className={`px-3 py-2 rounded-lg text-sm text-left transition-colors border ${
                          selected
                            ? 'bg-amber-800 border-amber-600 text-amber-100'
                            : maxed
                            ? 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
                            : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-700'
                        }`}
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

        {/* Step 4: Spells (only for casters) */}
        {step === 4 && isCaster && classSpells && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Hechizos</h2>
            <p className="text-sm text-stone-400">
              Seleccioná los hechizos iniciales de tu {classDetail?.name}.
              Hechizos seleccionados: <span className="text-amber-400">{draft.spells.length}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {classSpells.results.map(s => {
                const selected = draft.spells.includes(s.index)
                return (
                  <button
                    key={s.index}
                    onClick={() => patch({
                      spells: selected
                        ? draft.spells.filter(i => i !== s.index)
                        : [...draft.spells, s.index],
                    })}
                    className={`px-3 py-2 rounded-lg text-sm text-left transition-colors border ${
                      selected
                        ? 'bg-amber-800 border-amber-600 text-amber-100'
                        : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-700'
                    }`}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Last step: Backstory */}
        {step === totalSteps && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Historia</h2>
            <textarea
              placeholder="Contá la historia de tu personaje... (opcional)"
              value={draft.backstory}
              onChange={e => patch({ backstory: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 rounded-lg bg-stone-800 border border-stone-700 focus:outline-none focus:border-amber-500 resize-none text-sm"
            />

            {/* Summary */}
            <div className="p-4 rounded-lg bg-stone-900 border border-stone-800 space-y-2 text-sm">
              <p className="font-medium text-stone-300">Resumen</p>
              <p><span className="text-stone-500">Nombre:</span> {draft.name}</p>
              <p><span className="text-stone-500">Raza:</span> {raceDetail?.name} · <span className="text-stone-500">Clase:</span> {classDetail?.name} · <span className="text-stone-500">Nivel:</span> {draft.level}</p>
              <p><span className="text-stone-500">Stats:</span> {STAT_KEYS.map(k => `${ABILITY_LABELS[k]} ${totalStats[k]}`).join(' · ')}</p>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate({ to: '/' })}
            className="flex-1 py-2 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors text-sm"
          >
            {step === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          {step < totalSteps ? (
            <button
              onClick={() => canProceed() && setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-sm"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors text-sm"
            >
              Crear personaje
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
