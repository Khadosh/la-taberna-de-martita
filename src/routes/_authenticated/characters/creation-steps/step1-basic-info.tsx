import { CLASS_ICONS } from '../../../../lib/class-meta'
import { SUBCLASS_SELECTION_LEVELS } from '../../../../lib/class-choices'
import { StepTitle, inputStyle, cardStyle } from './primitives'
import type { Draft } from '../character-creation-steps'

interface Step1Props {
  draft: Draft
  patch: (u: Partial<Draft>) => void
  races: any
  classes: any
  raceDetail: any
  classDetail: any
  classSubclasses: any
}

export function Step1BasicInfo({ draft, patch, races, classes, raceDetail, classDetail, classSubclasses }: Step1Props) {
  const classIcon = CLASS_ICONS[draft.classIndex] ?? '🎲'
  const subclassReqLevel = SUBCLASS_SELECTION_LEVELS[draft.classIndex] ?? 1
  const showSubclass = draft.classIndex && draft.level >= subclassReqLevel

  return (
    <div className="space-y-6">
      <StepTitle>Información básica</StepTitle>
      <div className="space-y-4">
        <input
          type="text" placeholder="Nombre del personaje"
          value={draft.name} onChange={e => patch({ name: e.target.value })}
          style={inputStyle}
          className="w-full px-4 py-3 text-stone-100 placeholder-stone-600 font-serif focus:outline-none transition-colors"
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Raza</label>
            <select value={draft.raceIndex} onChange={e => patch({ raceIndex: e.target.value })}
              style={inputStyle} className="w-full px-3 py-2.5 text-stone-100 font-serif focus:outline-none transition-colors font-serif">
              <option value="">Elegir raza...</option>
              {races?.results.map((r: any) => <option key={r.index} value={r.index}>{r.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Clase</label>
            <select value={draft.classIndex}
              onChange={e => patch({ classIndex: e.target.value, subclassIndex: '', spells: [], skillProficiencies: [], expertise: [] })}
              style={inputStyle} className="w-full px-3 py-2.5 text-stone-100 font-serif focus:outline-none transition-colors font-serif">
              <option value="">Elegir clase...</option>
              {classes?.results.map((c: any) => <option key={c.index} value={c.index}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Nivel</label>
          <input type="number" min={1} max={20} value={draft.level}
            onChange={e => patch({ level: Math.min(20, Math.max(1, +e.target.value)) })}
            style={inputStyle}
            className="w-24 px-4 py-2.5 text-stone-100 font-mono focus:outline-none transition-colors"
          />
        </div>
        {showSubclass && classSubclasses && classSubclasses.results.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Subclase</label>
            <select value={draft.subclassIndex} onChange={e => patch({ subclassIndex: e.target.value })}
              style={inputStyle} className="w-full px-3 py-2.5 text-stone-100 font-serif focus:outline-none transition-colors font-serif">
              <option value="">Elegir subclase... (opcional)</option>
              {classSubclasses.results.map((s: any) => (
                <option key={s.index} value={s.index}>{s.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-stone-700 font-serif italic">Contenido disponible según el SRD (licencia abierta D&D)</p>
          </div>
        )}
        {(raceDetail || classDetail) && (
          <div style={cardStyle} className="p-4 space-y-3">
            {classDetail && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{classIcon}</span>
                <div>
                  <p className="text-amber-200/80 font-display text-sm tracking-wide">{classDetail.name}</p>
                  <p className="text-stone-500 text-xs font-serif">d{classDetail.hit_die} hit die · {classDetail.saving_throws.map((s: any) => s.name).join(', ')}</p>
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
  )
}
