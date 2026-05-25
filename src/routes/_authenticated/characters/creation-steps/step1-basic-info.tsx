import { CLASS_ICONS } from '../../../../lib/class-meta'
import { SUBCLASS_SELECTION_LEVELS } from '../../../../lib/class-choices'
import { StepTitle, cardStyle } from './primitives'
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
  barbarian: { desc: 'Un guerrero feroz de trasfondo salvaje que entra en furia.', tags: ['Fuerza'] },
  bard: { desc: 'Un maestro del canto, la oratoria y la magia de apoyo.', tags: ['Carisma'] },
  cleric: { desc: 'Un campeón sacerdotal que maneja magia divina.', tags: ['Sabiduría'] },
  druid: { desc: 'Un sacerdote de la naturaleza que adopta formas salvajes.', tags: ['Sabiduría'] },
  fighter: { desc: 'Un especialista en combate experto en armas y armaduras.', tags: ['Fuerza/DES'] },
  monk: { desc: 'Un artista marcial que canaliza su energía física y Ki.', tags: ['Destreza'] },
  paladin: { desc: 'Un guerrero santo ligado a un juramento sagrado.', tags: ['Fuerza/CAR'] },
  ranger: { desc: 'Un cazador y rastreador en las fronteras del mundo.', tags: ['Destreza/SAB'] },
  rogue: { desc: 'Un combatiente sigiloso que usa la astucia y el ataque furtivo.', tags: ['Destreza'] },
  sorcerer: { desc: 'Un lanzador de conjuros con magia innata heredada.', tags: ['Carisma'] },
  warlock: { desc: 'Un mago que pacta con entidades de otros mundos.', tags: ['Carisma'] },
  wizard: { desc: 'Un erudito arcano que domina conjuros por estudio.', tags: ['Inteligencia'] },
}

const RACE_FLAVOR: Record<string, { desc: string; icon: string; traits: string }> = {
  dragonborn: { desc: 'Descendientes de dragones con aliento elemental.', icon: '🐉', traits: 'Aliento dragón, Resistencia' },
  dwarf: { desc: 'Minadores y guerreros robustos de reinos montañosos.', icon: '🧔', traits: 'Resistencia, Visión nocturna' },
  elf: { desc: 'Seres mágicos y gráciles de vida longeva.', icon: '🧝', traits: 'Sentidos agudos, Ancestros feéricos' },
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

      <div className="space-y-5">
        {/* Name input */}
        <div className="space-y-1.5">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Nombre del Aventurero</label>
          <input
            type="text"
            placeholder="Introduce el nombre..."
            value={draft.name}
            onChange={e => patch({ name: e.target.value })}
            className="w-full px-4 py-3 bg-[#e8d5a8] text-[#3f1a04] font-serif border border-[#6b4c24]/50 focus:border-[#6b4c24] focus:outline-none placeholder-[#6b4c24]/40 rounded-sm shadow-inner transition-colors"
          />
        </div>

        {/* Level input styled as a decorative shield badge */}
        <div className="space-y-1.5">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Nivel de Aventurero</label>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 flex items-center justify-center bg-stone-900 border border-stone-850 rounded-sm shadow-md overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-tavern-gold/40"></div>
              <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-tavern-gold/40"></div>
              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-tavern-gold/40"></div>
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-tavern-gold/40"></div>
              <input
                type="number"
                min={1}
                max={20}
                value={draft.level}
                onChange={e => patch({ level: Math.min(20, Math.max(1, +e.target.value)) })}
                className="w-full h-full text-center text-xl font-mono font-bold text-amber-200 bg-transparent focus:outline-none select-all"
              />
            </div>
            <span className="text-xs text-stone-500 font-serif italic">
              Bono de Competencia: +{Math.floor((draft.level - 1) / 4) + 2}
            </span>
          </div>
        </div>

        {/* Race selection grid */}
        <div className="space-y-2">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Selecciona tu Especie/Raza</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {races?.results.map((r: any) => {
              const isSelected = draft.raceIndex === r.index
              const flavor = RACE_FLAVOR[r.index] ?? { desc: 'Especie del multiverso.', icon: '🎲', traits: 'Rasgos comunes' }
              return (
                <button
                  key={r.index}
                  type="button"
                  onClick={() => patch({ raceIndex: r.index })}
                  className={`relative text-left p-3.5 border transition-all overflow-hidden flex items-center justify-between rounded-sm h-24 ${
                    isSelected
                      ? 'text-amber-100'
                      : 'text-stone-400 hover:text-stone-250'
                  }`}
                  style={{
                    backgroundImage: isSelected
                      ? `linear-gradient(100deg, rgba(24, 14, 6, 0.95) 45%, rgba(120, 60, 10, 0.5) 80%, rgba(120, 60, 10, 0.3) 100%), url('/assets/images/races/${r.index}.png')`
                      : `linear-gradient(100deg, rgba(15, 8, 4, 0.96) 45%, rgba(24, 14, 6, 0.8) 80%, rgba(24, 14, 6, 0.45) 100%), url('/assets/images/races/${r.index}.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                    borderColor: isSelected ? 'rgba(180, 100, 20, 0.85)' : 'rgba(120, 70, 20, 0.22)',
                    boxShadow: isSelected ? 'inset 0 0 12px rgba(180, 100, 20, 0.25), 0 4px 12px rgba(0, 0, 0, 0.5)' : 'none',
                  }}
                >
                  <div className="z-10 flex-1 pr-16">
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0">{flavor.icon}</span>
                      <p className="text-sm font-display tracking-wide font-bold uppercase">{r.name}</p>
                    </div>
                    <p className="text-[11px] text-stone-500 font-serif mt-1.5 leading-snug line-clamp-2">{flavor.desc}</p>
                    <p className="text-[9px] text-amber-500/70 font-mono mt-1.5 uppercase tracking-wider truncate">{flavor.traits}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Class selection grid */}
        <div className="space-y-2">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Selecciona tu Clase de Héroe</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {classes?.results.map((c: any) => {
              const isSelected = draft.classIndex === c.index
              const flavor = CLASS_FLAVOR[c.index] ?? { desc: 'Una clase de héroe.', tags: [] }
              const classIcon = CLASS_ICONS[c.index] ?? '🎲'
              return (
                <button
                  key={c.index}
                  type="button"
                  onClick={() => patch({ classIndex: c.index, subclassIndex: '', spells: [], skillProficiencies: [], expertise: [] })}
                  className={`relative text-left p-3.5 border transition-all overflow-hidden flex items-center justify-between rounded-sm h-24 ${
                    isSelected
                      ? 'text-amber-100'
                      : 'text-stone-400 hover:text-stone-250'
                  }`}
                  style={{
                    backgroundImage: isSelected
                      ? `linear-gradient(100deg, rgba(24, 14, 6, 0.95) 45%, rgba(120, 60, 10, 0.5) 80%, rgba(120, 60, 10, 0.3) 100%), url('/assets/images/classes/${c.index}.png')`
                      : `linear-gradient(100deg, rgba(15, 8, 4, 0.96) 45%, rgba(24, 14, 6, 0.8) 80%, rgba(24, 14, 6, 0.45) 100%), url('/assets/images/classes/${c.index}.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                    borderColor: isSelected ? 'rgba(180, 100, 20, 0.85)' : 'rgba(120, 70, 20, 0.22)',
                    boxShadow: isSelected ? 'inset 0 0 12px rgba(180, 100, 20, 0.25), 0 4px 12px rgba(0, 0, 0, 0.5)' : 'none',
                  }}
                >
                  <div className="z-10 flex-1 pr-16">
                    <div className="flex items-center gap-2">
                      <span className="text-base shrink-0">{classIcon}</span>
                      <p className="text-sm font-display tracking-wide font-bold uppercase">{c.name}</p>
                    </div>
                    <p className="text-[11px] text-stone-500 font-serif mt-1.5 leading-snug line-clamp-2">{flavor.desc}</p>
                  </div>
                  
                  {/* Tag Pill on Top Right */}
                  <div className="absolute right-3 top-3 z-10">
                    {flavor.tags.slice(0, 1).map(t => (
                      <span key={t} className="text-[8px] px-1.5 py-0.5 bg-stone-950/75 border border-stone-850 text-amber-500/70 rounded-sm font-mono tracking-wider uppercase">
                        {t}
                      </span>
                    ))}
                  </div>
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
          </div>
        )}

        {/* Split Open-Book Class/Race Detail Panel */}
        {(raceDetail || classDetail) && (
          <div className="grid grid-cols-1 md:grid-cols-12 bg-parchment-gradient border border-parchment-sienna/40 rounded-sm shadow-tavern-depth text-[#3f1a04] overflow-hidden">
            {/* Left side: Large Illustration */}
            <div className="md:col-span-4 h-48 md:h-full min-h-[10rem] relative bg-stone-900 border-r border-parchment-sienna/20">
              <img
                src={classDetail ? `/assets/images/classes/${draft.classIndex}.png` : `/assets/images/races/${draft.raceIndex}.png`}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100c08] via-transparent to-transparent opacity-60 md:hidden" />
            </div>

            {/* Right side: Parchment Content */}
            <div className="md:col-span-8 p-5 space-y-4 flex flex-col justify-center">
              {classDetail && (
                <div className="space-y-1">
                  <h3 className="font-display text-2xl font-bold tracking-wide text-[#5a3a14] uppercase flex items-center gap-2">
                    <span>{classIcon}</span>
                    <span>{classDetail.name}</span>
                  </h3>
                  <p className="text-xs font-mono font-semibold text-[#7a5828] uppercase tracking-wider">
                    Dado de Golpe: d{classDetail.hit_die} · Salvaciones: {classDetail.saving_throws.map((s: any) => s.name).join(', ')}
                  </p>
                </div>
              )}
              
              {raceDetail && (
                <div className="p-3 bg-amber-50/50 border border-parchment-sienna/30 rounded-sm flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-xs text-[#5c3e1b] font-serif leading-relaxed">
                    Los bonificadores de atributo se eligen en el paso de Trasfondo (reglas 2024). Velocidad de movimiento base: <span className="font-mono font-bold">{raceDetail.speed} pies</span>.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
