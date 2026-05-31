import { useState } from 'react'
import { Info } from 'lucide-react'
import { SUBCLASS_SELECTION_LEVELS } from '../../../../lib/class-choices'
import { BACKGROUNDS, ABILITY_LABELS_ES, type Background } from '../../../../lib/dnd-backgrounds'
import { cardStyle } from './primitives'
import { BACKGROUND_ICONS, CLASS_FLAVOR, RACE_FLAVOR } from './step1-constants'
import { DetailModal } from './detail-modal'
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

export function Step1BasicInfo({
  draft, patch, races, classes, raceDetail, classDetail, classSubclasses, selectedBg
}: Step1Props) {
  const subclassReqLevel = SUBCLASS_SELECTION_LEVELS[draft.classIndex] ?? 1
  const showSubclass = draft.classIndex && draft.level >= subclassReqLevel

  const [infoModalData, setInfoModalData] = useState<{
    type: 'class' | 'race' | 'subclass' | 'background'
    indexOrKey: string
    name: string
  } | null>(null)

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
                  <div
                    key={r.index}
                    onClick={() => patch({ raceIndex: r.index })}
                    className="relative text-left p-3 border transition-all overflow-hidden flex items-center justify-between rounded-sm h-[84px] w-full cursor-pointer"
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
                    {/* Info Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoModalData({ type: 'race', indexOrKey: r.index, name: r.name });
                      }}
                      className="absolute right-2.5 bottom-2.5 z-20 p-1 flex items-center justify-center rounded-full bg-stone-900/60 border border-stone-850 hover:border-amber-500/60 text-stone-400 hover:text-amber-300 transition-all shadow-sm"
                      title="Ver detalles"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                return (
                  <div
                    key={c.index}
                    onClick={() => patch({ classIndex: c.index, subclassIndex: '', spells: [], skillProficiencies: [], expertise: [] })}
                    className="relative text-left p-3 border transition-all overflow-hidden flex items-center justify-between rounded-sm h-[84px] w-full cursor-pointer"
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
                        <img
                          src={`/assets/images/classes/${c.index}_avatar.png`}
                          className="w-8 h-8 rounded-full border border-tavern-gold/40 shrink-0 bg-stone-950 object-cover object-center"
                          alt=""
                        />
                        <p className="text-xs font-display tracking-wide font-bold uppercase">{c.name}</p>
                      </div>
                      <p className="text-[12px] text-stone-300 font-serif mt-1">{flavor.desc}</p>
                    </div>

                    {/* Attribute tags */}
                    <div className="absolute right-2 top-2.5 z-10">
                      {flavor.tags.slice(0, 1).map(t => (
                        <span key={t} className="text-[8px] px-1.5 py-0.5 bg-stone-950/75 border border-stone-850 text-amber-500/70 rounded-sm font-mono tracking-wider uppercase">
                          {t}
                        </span>
                      ))}
                    </div>
                    {/* Info Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoModalData({ type: 'class', indexOrKey: c.index, name: c.name });
                      }}
                      className="absolute right-2.5 bottom-2.5 z-20 p-1 flex items-center justify-center rounded-full bg-stone-900/60 border border-stone-850 hover:border-amber-500/60 text-stone-400 hover:text-amber-300 transition-all shadow-sm"
                      title="Ver detalles"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  <div
                    key={s.index}
                    onClick={() => patch({ subclassIndex: s.index })}
                    className={`relative text-left p-3 border transition-all pr-10 cursor-pointer ${isSelected
                      ? 'border-amber-600/90 text-amber-100 bg-amber-950/20 shadow-sm'
                      : 'border-stone-800 text-stone-400 hover:border-amber-800/40 hover:text-stone-200'
                      }`}
                    style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                  >
                    <div>
                      <p className="text-sm font-display tracking-wide font-semibold">{s.name}</p>
                      <p className="text-[10px] text-stone-600 font-serif mt-0.5 italic">
                        Se desbloquea al Nivel {subclassReqLevel}
                      </p>
                    </div>
                    {/* Info Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInfoModalData({ type: 'subclass', indexOrKey: s.index, name: s.name });
                      }}
                      className="absolute right-2.5 bottom-2.5 z-20 p-1 flex items-center justify-center rounded-full bg-stone-900/60 border border-stone-850 hover:border-amber-500/60 text-stone-400 hover:text-amber-300 transition-all shadow-sm"
                      title="Ver detalles"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <div
                  key={key}
                  onClick={() => patch({ backgroundKey: key, bgBonus2: '', bgBonus1: '' })}
                  className="relative text-left p-3 border transition-all overflow-hidden flex items-start gap-2.5 pr-10 rounded-sm h-[84px] w-full cursor-pointer"
                  style={{
                    backgroundImage: isSelected
                      ? `linear-gradient(100deg, rgba(24, 14, 6, 0.96) 25%, rgba(120, 60, 10, 0.3) 55%, rgba(120, 60, 10, 0.15) 100%), url('/assets/images/backgrounds/${key}.png')`
                      : `linear-gradient(100deg, rgba(15, 8, 4, 0.98) 25%, rgba(24, 14, 6, 0.8) 55%, rgba(24, 14, 6, 0.45) 100%), url('/assets/images/backgrounds/${key}.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                    borderColor: isSelected ? 'rgba(180, 100, 20, 0.85)' : 'rgba(120, 70, 20, 0.22)',
                    boxShadow: isSelected ? 'inset 0 0 10px rgba(180, 100, 20, 0.25), 0 2px 6px rgba(0, 0, 0, 0.4)' : 'none',
                  }}
                >
                  <img
                    src={`/assets/icons/bg3/30px-Background_${BACKGROUND_ICONS[key] || 'Noble'}_Icon.png.webp`}
                    className="z-10 w-8 h-8 rounded-sm border border-tavern-gold/40 bg-stone-950 shrink-0 object-cover mt-0.5"
                    alt=""
                  />
                  <div className="z-10 flex-1 min-w-0 pr-2">
                    <div className="flex justify-between items-baseline gap-1">
                      <p className="text-xs font-display tracking-wide font-bold uppercase truncate">{bg.name}</p>
                      <div className="flex gap-1">
                        {bg.abilities.map(a =>
                          <span key={a} className="w-fit px-1 py-0.5 rounded text-[8px] font-mono text-amber-500/70 uppercase tracking-wide truncate mr-1 border border-amber-500/70 bg-amber-950/20">{ABILITY_LABELS_ES[a]}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[12px] text-stone-300 font-serif mt-1 leading-snug line-clamp-2">{bg.desc}</p>
                  </div>
                  {/* Info Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInfoModalData({ type: 'background', indexOrKey: key, name: bg.name });
                    }}
                    className="absolute right-2.5 bottom-2.5 z-20 p-1 flex items-center justify-center rounded-full bg-stone-900/60 border border-stone-850 hover:border-amber-500/60 text-stone-400 hover:text-amber-300 transition-all shadow-sm"
                    title="Ver detalles"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
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
          <div className="absolute inset-2 rounded-t-[170px] border border-tavern-gold/20 pointer-events-none" />

          {/* Tripartite Background Vitral */}
          {(draft.classIndex || draft.raceIndex || draft.backgroundKey) ? (
            <div className="absolute inset-0 z-0 flex flex-col">
              {/* Top half: Race (Left) & Class (Right) */}
              <div className="flex w-full h-[75%]">
                <div
                  className="w-1/2 h-full bg-cover bg-center transition-all duration-300"
                  style={{
                    backgroundImage: draft.raceIndex ? `url('/assets/images/races/${draft.raceIndex}.png')` : 'none',
                    backgroundColor: '#0c0a09',
                  }}
                />
                <div
                  className="w-1/2 h-full bg-cover bg-center transition-all duration-300 border-l border-stone-900/50"
                  style={{
                    backgroundImage: draft.classIndex ? `url('/assets/images/classes/${draft.classIndex}.png')` : 'none',
                    backgroundColor: '#0c0a09',
                  }}
                />
              </div>
              {/* Bottom half: Background */}
              <div
                className="w-full h-[25%] bg-cover bg-center border-t border-stone-900/40 transition-all duration-300"
                style={{
                  backgroundImage: draft.backgroundKey ? `url('/assets/images/backgrounds/${draft.backgroundKey}.png')` : 'none',
                  backgroundColor: '#0c0a09',
                }}
              />
              {/* Radial gradient vignette to dim and integrate split backgrounds */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-stone-950/15 to-transparent z-10 pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0 bg-stone-900/60 flex items-center justify-center">

            </div>
          )}

          {/* Large Gold Portrait Frame with Crop Avatar */}
          <div className="
          relative z-20 w-40 h-40 mx-auto rounded-full p-2
          overflow-hidden border-2 border-tavern-gold shadow-lg 
          bg-stone-900/50 flex items-center justify-center  mt-18
          ">
            {draft.raceIndex && (
              <img
                src={`/assets/images/races/${draft.raceIndex}_avatar.png`}
                className="w-full h-full object-cover object-center"
                alt={currentRaceName}
              />
            )}
          </div>

          {/* Text overlays with Integrated Summary */}
          <div className="relative z-20 px-6 pb-5 text-center space-y-2 mt-auto bg-gradient-to-t from-stone-950/85 via-stone-950/45 to-transparent pt-8 backdrop-blur-[1px]">
            <h3 className="font-display text-lg font-bold tracking-wider text-stone-100 uppercase truncate h-6" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
              {draft.name.trim() || 'Aventurero'}
            </h3>

            <p className="font-display text-xs tracking-widest text-amber-500/80 uppercase font-semibold h-4 flex items-center justify-center gap-1.5" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}>
              {currentClassName || currentRaceName ? (
                <>
                  {draft.classIndex && (
                    <img
                      src={`/assets/images/classes/${draft.classIndex}_avatar.png`}
                      className="w-4 h-4 rounded-full border border-tavern-gold/40 bg-stone-950 object-cover"
                      alt=""
                    />
                  )}
                  <span>
                    {currentClassName || 'Clase'} {currentRaceName && `· ${currentRaceName}`}
                  </span>
                </>
              ) : (
                'Crea tu Aventurero'
              )}
            </p>

            <div className="text-[11px] font-mono text-stone-400" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.95)' }}>
              Nivel: <span className="text-stone-300 font-bold">{draft.level}</span>
            </div>

            {/* INTEGRATED SUMMARY SPECS */}
            {(classDetail || raceDetail || selectedBg) && (
              <div className="pt-2 border-t border-stone-850/30 mt-2 text-[10px] text-stone-400 font-serif leading-relaxed text-left space-y-1 max-w-[240px] mx-auto" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.95)' }}>
                {classDetail && (
                  <p className="truncate">
                    <span className="font-sans uppercase text-[8px] tracking-wider text-stone-500 font-bold">Clase:</span> d{classDetail.hit_die} HG · Salvaciones: {classDetail.saving_throws.map((s: any) => s.name).join(', ')}
                  </p>
                )}
                {raceDetail && (
                  <p className="truncate">
                    <span className="font-sans uppercase text-[8px] tracking-wider text-stone-500 font-bold">Especie:</span> Movimiento {raceDetail.speed} pies.
                  </p>
                )}
                {selectedBg && (
                  <p className="truncate">
                    <span className="font-sans uppercase text-[8px] tracking-wider text-stone-500 font-bold">Trasfondo:</span> {selectedBg.name}
                    {draft.bgBonus2 && draft.bgBonus1 && ` (+2 ${ABILITY_LABELS_ES[draft.bgBonus2]}, +1 ${ABILITY_LABELS_ES[draft.bgBonus1]})`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {infoModalData && (
        <DetailModal
          type={infoModalData.type}
          indexOrKey={infoModalData.indexOrKey}
          name={infoModalData.name}
          onClose={() => setInfoModalData(null)}
        />
      )}
    </div>
  )
}

