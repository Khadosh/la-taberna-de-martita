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

const CLASS_FLAVOR: Record<string, { desc: string; tags: string[] }> = {
  barbarian: { desc: 'Guerrero feroz con furia en combate.', tags: ['Fuerza', 'Cuerpo a cuerpo'] },
  bard: { desc: 'Maestro de música, elocuencia y magia de apoyo.', tags: ['Carisma', 'Apoyo', 'Conjuros'] },
  cleric: { desc: 'Sacerdote sagrado que invoca poder divino.', tags: ['Sabiduría', 'Sanación', 'Conjuros'] },
  druid: { desc: 'Sacerdote de la naturaleza que adopta formas salvajes.', tags: ['Sabiduría', 'Control', 'Conjuros'] },
  fighter: { desc: 'Especialista en combate con maestría de armas.', tags: ['Fuerza/DES', 'Defensa'] },
  monk: { desc: 'Artista marcial que canaliza su energía interior.', tags: ['Destreza', 'Movilidad'] },
  paladin: { desc: 'Guerrero santo ligado a un juramento sagrado.', tags: ['Fuerza/CAR', 'Defensa', 'Apoyo'] },
  ranger: { desc: 'Cazador y rastreador en las fronteras del mundo.', tags: ['Destreza/SAB', 'Exploración'] },
  rogue: { desc: 'Sigiloso combatiente que ataca desde las sombras.', tags: ['Destreza', 'Sigilo', 'Gran Daño'] },
  sorcerer: { desc: 'Hechicero con magia innata heredada.', tags: ['Carisma', 'Conjuros', 'Daño'] },
  warlock: { desc: 'Mago que pacta con entidades de otros mundos.', tags: ['Carisma', 'Conjuros', 'Utilidad'] },
  wizard: { desc: 'Erudito arcano que domina conjuros por estudio.', tags: ['Inteligencia', 'Conjuros', 'Versátil'] },
}

const RACE_FLAVOR: Record<string, { desc: string; icon: string; traits: string }> = {
  dragonborn: { desc: 'Descendientes de dragones con aliento elemental.', icon: '🐉', traits: 'Aliento de dragón, Resistencia' },
  dwarf: { desc: 'Minadores y guerreros robustos de reinos montañosos.', icon: '🧔', traits: 'Resistencia, Visión nocturna' },
  elf: { desc: 'Seres mágicos y gráciles de vida longeva.', icon: '🧝', traits: 'Sentidos agudos, Ancestro feérico' },
  gnome: { desc: 'Inventores ingeniosos y magos sumamente curiosos.', icon: '⚙️', traits: 'Astucia gnómica, Visión nocturna' },
  'half-elf': { desc: 'Combinan la gracia élfica con la adaptabilidad humana.', icon: '🧑‍🧝', traits: 'Versatilidad de pericias' },
  'half-orc': { desc: 'Criaturas robustas de gran fuerza física y furia.', icon: '👹', traits: 'Resistencia incansable, Brutal' },
  halfling: { desc: 'Personas amables, hogareñas y afortunadas.', icon: '👣', traits: 'Afortunado, Escurridizo' },
  human: { desc: 'La raza más adaptable y ambiciosa del multiverso.', icon: '🧑', traits: 'Versatilidad' },
  tiefling: { desc: 'Humanos con herencia demoníaca y afinidad al fuego.', icon: '😈', traits: 'Resistencia fuego, Legado infernal' },
}

export function Step1BasicInfo({ draft, patch, races, classes, raceDetail, classDetail, classSubclasses }: Step1Props) {
  const classIcon = CLASS_ICONS[draft.classIndex] ?? '🎲'
  const subclassReqLevel = SUBCLASS_SELECTION_LEVELS[draft.classIndex] ?? 1
  const showSubclass = draft.classIndex && draft.level >= subclassReqLevel

  return (
    <div className="space-y-6">
      <StepTitle>Información básica</StepTitle>

      <div className="space-y-4">
        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Nombre del Aventurero</label>
          <input
            type="text"
            placeholder="Introduce el nombre..."
            value={draft.name}
            onChange={e => patch({ name: e.target.value })}
            style={inputStyle}
            className="w-full px-4 py-3 text-stone-100 placeholder-stone-600 font-serif focus:outline-none transition-colors"
          />
        </div>

        {/* Level input */}
        <div className="space-y-1.5">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Nivel inicial</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={20}
              value={draft.level}
              onChange={e => patch({ level: Math.min(20, Math.max(1, +e.target.value)) })}
              style={inputStyle}
              className="w-24 px-4 py-2.5 text-stone-100 font-mono text-center focus:outline-none transition-colors"
            />
            <span className="text-xs text-stone-500 font-serif italic">
              Bono de Competencia: +{Math.floor((draft.level - 1) / 4) + 2}
            </span>
          </div>
        </div>

        {/* Race selection grid */}
        <div className="space-y-2">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Selecciona una Especie/Raza</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {races?.results.map((r: any) => {
              const isSelected = draft.raceIndex === r.index
              const flavor = RACE_FLAVOR[r.index] ?? { desc: 'Especie del multiverso.', icon: '🎲', traits: 'Rasgos comunes' }
              return (
                <button
                  key={r.index}
                  type="button"
                  onClick={() => patch({ raceIndex: r.index })}
                  className={`text-left p-3 border transition-all ${
                    isSelected
                      ? 'border-amber-600/90 text-amber-100 bg-amber-950/20 shadow-sm'
                      : 'border-stone-800 text-stone-400 hover:border-amber-800/40 hover:text-stone-200'
                  }`}
                  style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg shrink-0">{flavor.icon}</span>
                    <p className="text-sm font-display tracking-wide font-semibold">{r.name}</p>
                  </div>
                  <p className="text-[11px] text-stone-500 font-serif mt-1 line-clamp-1 leading-snug">{flavor.desc}</p>
                  <p className="text-[9px] text-amber-500/70 font-mono mt-1 uppercase tracking-wide truncate">{flavor.traits}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Class selection grid */}
        <div className="space-y-2">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Selecciona tu Clase de Héroe</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {classes?.results.map((c: any) => {
              const isSelected = draft.classIndex === c.index
              const flavor = CLASS_FLAVOR[c.index] ?? { desc: 'Una clase de héroe.', tags: [] }
              const classIcon = CLASS_ICONS[c.index] ?? '🎲'
              return (
                <button
                  key={c.index}
                  type="button"
                  onClick={() => patch({ classIndex: c.index, subclassIndex: '', spells: [], skillProficiencies: [], expertise: [] })}
                  className={`text-left p-3 border transition-all ${
                    isSelected
                      ? `border-amber-600/90 text-amber-100 bg-amber-950/20 shadow-sm`
                      : `border-stone-800 text-stone-400 hover:border-amber-800/40 hover:text-stone-200`
                  }`}
                  style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{classIcon}</span>
                      <p className="text-sm font-display tracking-wide font-semibold">{c.name}</p>
                    </div>
                    <div className="flex gap-1">
                      {flavor.tags.slice(0, 1).map(t => (
                        <span key={t} className="text-[8px] px-1 py-0.2 bg-stone-900 border border-stone-800 text-stone-500 rounded-sm font-serif">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 font-serif mt-1 line-clamp-1 leading-snug">{flavor.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Subclass cards grid */}
        {showSubclass && classSubclasses && classSubclasses.results.length > 0 && (
          <div className="space-y-2 border-t border-stone-850 pt-4 mt-4">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Especialización (Subclase)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {classSubclasses.results.map((s: any) => {
                const isSelected = draft.subclassIndex === s.index
                return (
                  <button
                    key={s.index}
                    type="button"
                    onClick={() => patch({ subclassIndex: s.index })}
                    className={`text-left p-3 border transition-all ${
                      isSelected
                        ? 'border-amber-600/90 text-amber-100 bg-amber-950/20 shadow-sm'
                        : 'border-stone-800 text-stone-400 hover:border-amber-800/40 hover:text-stone-200'
                    }`}
                    style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                  >
                    <p className="text-sm font-display tracking-wide font-semibold">{s.name}</p>
                    <p className="text-[10px] text-stone-600 font-serif mt-0.5 italic">
                      Se desbloquea al Nivel {subclassReqLevel}
                    </p>
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-stone-700 font-serif italic mt-1">
              Contenido de subclase disponible según el SRD estándar (licencia abierta).
            </p>
          </div>
        )}

        {/* Selected class details */}
        {(raceDetail || classDetail) && (
          <div style={cardStyle} className="p-4 space-y-3 bg-stone-900/40 border border-stone-800/80 rounded-sm">
            {classDetail && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">{classIcon}</span>
                <div>
                  <p className="text-amber-200/80 font-display text-sm tracking-wide">{classDetail.name}</p>
                  <p className="text-stone-500 text-xs font-serif">
                    Dado de Golpe: d{classDetail.hit_die} · Salvaciones: {classDetail.saving_throws.map((s: any) => s.name).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {raceDetail && (
              <p className="text-xs text-stone-500 font-serif italic">
                Los bonificadores de atributo se eligen en el paso de Trasfondo (reglas 2024). Velocidad: {raceDetail.speed} pies.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
