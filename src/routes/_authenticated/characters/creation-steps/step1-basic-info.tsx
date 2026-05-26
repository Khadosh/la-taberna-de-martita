import { CLASS_ICONS } from '../../../../lib/class-meta'
import { SUBCLASS_SELECTION_LEVELS } from '../../../../lib/class-choices'
import { BACKGROUNDS, ABILITY_LABELS_ES, type Background } from '../../../../lib/dnd-backgrounds'
import { cardStyle } from './primitives'
import type { Draft } from '../character-creation-steps'

interface Step1Props {
  draft: Draft
  patch: (u: Partial<Draft>) => void
  races: any
  classes: any
  raceDetail: any
  classDetail: any
  classSubclasses: any
  selectedBg: Background | null
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

const RACE_FLAVOR: Record<string, { desc: string; traits: string }> = {
  dragonborn: { desc: 'Descendientes de dragones con aliento elemental.', traits: 'Aliento dragón, Resistencia' },
  dwarf: { desc: 'Minadores y guerreros robustos de reinos montañosos.', traits: 'Resistencia, Visión nocturna' },
  elf: { desc: 'Seres mágicos y gráciles de vida longeva.', traits: 'Sentidos agudos, Ancestros feéricos' },
  gnome: { desc: 'Inventores ingeniosos y magos sumamente curiosos.', traits: 'Astucia gnómica, Visión nocturna' },
  'half-elf': { desc: 'Combinan la gracia élfica con la adaptabilidad humana.', traits: 'Versatilidad de pericias' },
  'half-orc': { desc: 'Criaturas robustas de gran fuerza física y furia.', traits: 'Resistencia incansable, Brutal' },
  halfling: { desc: 'Personas amables, hogareñas y afortunadas.', traits: 'Afortunado, Escurridizo' },
  human: { desc: 'La raza más adaptable y ambiciosa del multiverso.', traits: 'Versatilidad' },
  tiefling: { desc: 'Humanos con herencia demoníaca y afinidad al fuego.', traits: 'Resistencia fuego, Legado infernal' },
}

export function Step1BasicInfo({
  draft, patch, races, classes, raceDetail, classDetail, classSubclasses, selectedBg
}: Step1Props) {
  const classIcon = CLASS_ICONS[draft.classIndex] ?? '🎲'
  const subclassReqLevel = SUBCLASS_SELECTION_LEVELS[draft.classIndex] ?? 1
  const showSubclass = draft.classIndex && draft.level >= subclassReqLevel

  // Selected details values
  const currentClassName = classes?.results.find((c: any) => c.index === draft.classIndex)?.name || ''
  const currentRaceName = races?.results.find((r: any) => r.index === draft.raceIndex)?.name || ''

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Selections (Class, Race, Background) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Name and Level Inputs side-by-side */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3 space-y-1.5">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase">Nombre del Aventurero</label>
            <input
              type="text"
              placeholder="Introduce el nombre..."
              value={draft.name}
              onChange={e => patch({ name: e.target.value })}
              className="w-full px-4 py-3 bg-[#e8d5a8] text-[#3f1a04] font-serif border border-[#6b4c24]/50 focus:border-[#6b4c24] focus:outline-none placeholder-[#6b4c24]/40 rounded-sm shadow-inner transition-colors"
            />
          </div>
          <div className="col-span-1 space-y-1.5">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase block text-center">Nivel</label>
            <div className="relative w-full h-[46px] flex items-center justify-center bg-stone-900 border border-stone-850 rounded-sm shadow-md overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-tavern-gold/40"></div>
              <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-tavern-gold/40"></div>
              <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-tavern-gold/40"></div>
              <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-tavern-gold/40"></div>
              <input
                type="number"
                min={1}
                max={20}
                value={draft.level}
                onChange={e => patch({ level: Math.min(20, Math.max(1, +e.target.value)) })}
                className="w-full h-full text-center text-lg font-mono font-bold text-amber-200 bg-transparent focus:outline-none select-all"
              />
            </div>
          </div>
        </div>

        {/* Side-by-side columns: Race (Left) and Class (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Race selection grid */}
          <div className="space-y-2">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Especie / Raza</label>
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
              {races?.results.map((r: any) => {
                const isSelected = draft.raceIndex === r.index
                const flavor = RACE_FLAVOR[r.index] ?? { desc: 'Especie del multiverso.', traits: 'Rasgos comunes' }
                return (
                  <button
                    key={r.index}
                    type="button"
                    onClick={() => patch({ raceIndex: r.index })}
                    className="relative text-left p-3 border transition-all overflow-hidden flex items-center justify-between rounded-sm h-[84px] w-full"
                    style={{
                      backgroundImage: isSelected
                        ? `linear-gradient(100deg, rgba(24, 14, 6, 0.96) 25%, rgba(120, 60, 10, 0.5) 35%, rgba(120, 60, 10, 0.15) 100%), url('/assets/images/races/${r.index}.png')`
                        : `linear-gradient(100deg, rgba(15, 8, 4, 0.98) 25%, rgba(24, 14, 6, 0.8) 55%, rgba(24, 14, 6, 0.45) 100%), url('/assets/images/races/${r.index}.png')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'right center',
                      borderColor: isSelected ? 'rgba(180, 100, 20, 0.85)' : 'rgba(120, 70, 20, 0.22)',
                      boxShadow: isSelected ? 'inset 0 0 10px rgba(180, 100, 20, 0.25), 0 2px 6px rgba(0, 0, 0, 0.4)' : 'none',
                    }}
                  >
                    <div className="z-10 flex-1 pr-14">
                      <div className="flex items-center gap-2">
                        <img
                          src={`/assets/images/races/${r.index}_avatar.png`}
                          className="w-8 h-8 rounded-full border border-tavern-gold/40  shrink-0 bg-stone-950"
                          alt=""
                        />
                        <div className="flex flex-col">
                          <p className="text-xs font-display tracking-wide font-bold uppercase">{r.name}</p>
                          <p className="text-[8px] text-amber-500/70 font-mono mt-1 uppercase tracking-wide truncate">{flavor.traits}</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-stone-300 text-shadow-2 font-serif mt-1 ">{flavor.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Class selection grid */}
          <div className="space-y-2">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Clase de Héroe</label>
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
              {classes?.results.map((c: any) => {
                const isSelected = draft.classIndex === c.index
                const flavor = CLASS_FLAVOR[c.index] ?? { desc: 'Una clase de héroe.', tags: [] }
                const classIcon = CLASS_ICONS[c.index] ?? '🎲'
                return (
                  <button
                    key={c.index}
                    type="button"
                    onClick={() => patch({ classIndex: c.index, subclassIndex: '', spells: [], skillProficiencies: [], expertise: [] })}
                    className="relative text-left p-3 border transition-all overflow-hidden flex items-center justify-between rounded-sm h-[84px] w-full"
                    style={{
                      backgroundImage: isSelected
                        ? `linear-gradient(100deg, rgba(24, 14, 6, 0.96) 25%, rgba(120, 60, 10, 0.3) 55%, rgba(120, 60, 10, 0.15) 100%), url('/assets/images/classes/${c.index}.png')`
                        : `linear-gradient(100deg, rgba(15, 8, 4, 0.98) 25%, rgba(24, 14, 6, 0.8) 55%, rgba(24, 14, 6, 0.45) 100%), url('/assets/images/classes/${c.index}.png')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'right center',
                      borderColor: isSelected ? 'rgba(180, 100, 20, 0.85)' : 'rgba(120, 70, 20, 0.22)',
                      boxShadow: isSelected ? 'inset 0 0 10px rgba(180, 100, 20, 0.25), 0 2px 6px rgba(0, 0, 0, 0.4)' : 'none',
                    }}
                  >
                    <div className="z-10 flex-1 pr-14">
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{classIcon}</span>
                        <p className="text-xs font-display tracking-wide font-bold uppercase">{c.name}</p>
                      </div>
                      <p className="text-[10px] text-stone-500 font-serif mt-1 leading-snug line-clamp-1">{flavor.desc}</p>
                    </div>

                    {/* Attribute tags */}
                    <div className="absolute right-2 top-2.5 z-10">
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
        </div>

        {/* Subclass option if high level enough */}
        {showSubclass && classSubclasses && classSubclasses.results.length > 0 && (
          <div className="space-y-2 border-t border-stone-850/60 pt-4 mt-2">
            <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Especialización (Subclase)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {classSubclasses.results.map((s: any) => {
                const isSelected = draft.subclassIndex === s.index
                return (
                  <button
                    key={s.index}
                    type="button"
                    onClick={() => patch({ subclassIndex: s.index })}
                    className={`text-left p-3 border transition-all ${isSelected
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

        {/* Background selection grid */}
        <div className="space-y-2 border-t border-stone-850/60 pt-4">
          <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Selecciona tu Trasfondo (Background)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {Object.entries(BACKGROUNDS).map(([key, bg]) => {
              const isSelected = draft.backgroundKey === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => patch({ backgroundKey: key, bgBonus2: '', bgBonus1: '' })}
                  className={`text-left p-3 border transition-all ${isSelected
                    ? 'border-amber-600/90 text-amber-100 bg-amber-950/20 shadow-sm'
                    : 'border-stone-800 text-stone-400 hover:border-amber-800/40 hover:text-stone-250'
                    }`}
                  style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                >
                  <div className="flex justify-between items-baseline gap-1">
                    <p className="text-xs font-display tracking-wide font-bold uppercase">{bg.name}</p>
                    <p className="text-[9px] font-mono text-amber-500/70 uppercase tracking-widest shrink-0">
                      {bg.abilities.map(a => ABILITY_LABELS_ES[a]).join(' · ')}
                    </p>
                  </div>
                  <p className="text-[10px] text-stone-550 font-serif mt-1 leading-snug line-clamp-1">{bg.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Background tactile +2 and +1 stat choices */}
        {selectedBg && (
          <div style={cardStyle} className="p-4 space-y-4 bg-stone-900/40 border border-stone-800/80 rounded-sm">
            <div>
              <p className="text-xs text-amber-500/70 font-display tracking-widest uppercase mb-1">Bonos de {selectedBg.name}</p>
              <p className="text-[11px] text-stone-400 font-serif leading-snug">
                Elige dos de las tres características asociadas para aplicar tus modificadores (+2 y +1):
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-display tracking-widest uppercase block">Bono +2 a...</label>
                <div className="flex gap-2">
                  {selectedBg.abilities.map(a => {
                    const isSelected = draft.bgBonus2 === a
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => patch({ bgBonus2: a, bgBonus1: draft.bgBonus1 === a ? '' : draft.bgBonus1 })}
                        className={`flex-1 py-1.5 text-center text-xs font-mono font-bold border transition-all ${isSelected
                          ? 'border-amber-600/90 text-amber-250 bg-amber-950/20'
                          : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                          }`}
                        style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                      >
                        {ABILITY_LABELS_ES[a]}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-stone-500 font-display tracking-widest uppercase block">Bono +1 a...</label>
                <div className="flex gap-2">
                  {selectedBg.abilities.map(a => {
                    const isSelected = draft.bgBonus1 === a
                    const isUsedFor2 = draft.bgBonus2 === a
                    return (
                      <button
                        key={a}
                        type="button"
                        disabled={isUsedFor2}
                        onClick={() => patch({ bgBonus1: a })}
                        className={`flex-1 py-1.5 text-center text-xs font-mono font-bold border transition-all ${isUsedFor2
                          ? 'opacity-20 border-stone-900 text-stone-800 cursor-not-allowed'
                          : isSelected
                            ? 'border-amber-600/90 text-amber-250 bg-amber-950/20'
                            : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                          }`}
                        style={!isUsedFor2 && isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                      >
                        {ABILITY_LABELS_ES[a]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {draft.bgBonus2 && draft.bgBonus1 && (
              <div className="flex gap-2 flex-wrap pt-2 border-t border-stone-850/60 items-center text-xs font-serif text-stone-400">
                <span>Pericias: <span className="font-semibold text-stone-300">{selectedBg.skills.join(', ')}</span></span>
                {selectedBg.tool && <span className="ml-3">Herramienta: <span className="font-semibold text-stone-300">{selectedBg.tool}</span></span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Interactive Arched Portrait Preview Frame */}
      <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
        <div className="relative w-full aspect-[3/4] bg-stone-950 rounded-t-[180px] rounded-b-md border border-tavern-gold/40 shadow-tavern-depth flex flex-col justify-end overflow-hidden">
          {/* Gold Decorative Arch Line */}
          <div className="absolute inset-x-2 top-2 bottom-2 rounded-t-[150px] rounded-b-sm border border-tavern-gold/20 pointer-events-none" />

          {/* Background Split: 50% Class & 50% Race */}
          {(draft.classIndex || draft.raceIndex) ? (
            <div className="absolute inset-0 z-0 flex">
              <div
                className="w-1/2 h-full bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage: draft.classIndex ? `url('/assets/images/classes/${draft.classIndex}.png')` : 'none',
                  backgroundColor: '#0c0a09',
                }}
              />
              <div
                className="w-1/2 h-full bg-cover bg-center transition-all duration-300 border-l border-stone-900/40"
                style={{
                  backgroundImage: draft.raceIndex ? `url('/assets/images/races/${draft.raceIndex}.png')` : 'none',
                  backgroundColor: '#0c0a09',
                }}
              />
              {/* Radial gradient vignette to dim and integrate split backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-stone-900/40 z-10" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0 bg-stone-900/60 flex items-center justify-center">
              <p className="text-stone-700 font-serif italic text-xs">Sin clase ni raza elegida</p>
            </div>
          )}

          {/* Large Gold Portrait Frame with Crop Avatar */}
          <div className="
          relative z-20 w-40 h-40 mx-auto rounded-full p-2
          overflow-hidden border-2 border-tavern-gold shadow-lg 
          bg-stone-900/50 flex items-center justify-center  mt-18
          ">
            {draft.raceIndex ? (
              <img
                src={`/assets/images/races/${draft.raceIndex}_avatar.png`}
                className="w-[full] h-full object-cover object-center"
                alt={currentRaceName}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-stone-600">👤</div>
            )}
          </div>

          {/* Text overlays */}
          <div className="relative z-20 px-6 pb-6 text-center space-y-1.5 mt-auto">
            <h3 className="font-display text-lg font-bold tracking-wider text-stone-100 uppercase truncate h-6">
              {draft.name.trim()}
            </h3>

            <p className="font-display text-xs tracking-widest text-amber-500/80 uppercase font-semibold h-4">
              {currentClassName || currentRaceName ? (
                <>
                  {classIcon} {currentClassName || 'Clase'} {currentRaceName && `· ${currentRaceName}`}
                </>
              ) : (
                'Crea tu Aventurero'
              )}
            </p>

            <div className="text-[11px] font-mono text-stone-500">
              Nivel: <span className="text-stone-300 font-bold">{draft.level}</span>
            </div>
          </div>
        </div>

        {/* Technical summary specs (grimorio parchment card at bottom of preview) */}
        {(classDetail || raceDetail) && (
          <div className="bg-parchment-gradient border border-parchment-sienna/40 p-4 rounded-sm shadow-md text-[#3f1a04] space-y-3">
            <h4 className="font-display text-sm font-bold uppercase border-b border-[#6b4c24]/20 pb-1.5 text-[#5a3a14]">
              Resumen de Creación
            </h4>
            <div className="space-y-1.5 text-[11px] font-serif leading-snug">
              {classDetail && (
                <p>
                  <span className="font-sans uppercase text-[9px] tracking-wider text-stone-600 font-bold">Clase:</span> d{classDetail.hit_die} Dado de Golpe · Salvaciones: {classDetail.saving_throws.map((s: any) => s.name).join(', ')}
                </p>
              )}
              {raceDetail && (
                <p>
                  <span className="font-sans uppercase text-[9px] tracking-wider text-stone-600 font-bold">Especie:</span> Movimiento {raceDetail.speed} pies.
                </p>
              )}
              {selectedBg && (
                <p>
                  <span className="font-sans uppercase text-[9px] tracking-wider text-stone-600 font-bold">Trasfondo:</span> {selectedBg.name}
                  {draft.bgBonus2 && draft.bgBonus1 && ` (+2 ${ABILITY_LABELS_ES[draft.bgBonus2]}, +1 ${ABILITY_LABELS_ES[draft.bgBonus1]})`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
