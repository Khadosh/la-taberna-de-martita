import { useQuery } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../../../lib/dnd-api'
import { BACKGROUNDS, ABILITY_LABELS_ES } from '../../../../lib/dnd-backgrounds'

interface DetailModalProps {
  type: 'class' | 'race' | 'subclass' | 'background'
  indexOrKey: string
  name: string
  onClose: () => void
}

export function DetailModal({ type, indexOrKey, name, onClose }: DetailModalProps) {
  const { data: raceInfo, isLoading: loadingRace } = useQuery({
    queryKey: dndKeys.race(indexOrKey),
    queryFn: () => dndApi.race(indexOrKey),
    enabled: type === 'race',
  })

  const { data: classInfo, isLoading: loadingClass } = useQuery({
    queryKey: dndKeys.klass(indexOrKey),
    queryFn: () => dndApi.klass(indexOrKey),
    enabled: type === 'class',
  })

  const { data: subclassInfo, isLoading: loadingSubclass } = useQuery({
    queryKey: dndKeys.subclass(indexOrKey),
    queryFn: () => dndApi.subclass(indexOrKey),
    enabled: type === 'subclass',
  })

  const isLoading = (type === 'race' && loadingRace) ||
    (type === 'class' && loadingClass) ||
    (type === 'subclass' && loadingSubclass)

  const bgInfo = type === 'background' ? BACKGROUNDS[indexOrKey] : null

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative max-w-md w-full p-6 space-y-4 rounded-md border border-[#6b4c24]/50 shadow-2xl overflow-hidden font-serif"
        style={{ background: 'linear-gradient(165deg, #1d120a 0%, #0f0804 100%)' }}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-tavern-gold/40 to-transparent" />

        <div className="flex items-start justify-between border-b border-[#6b4c24]/20 pb-3">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-amber-500/70 font-sans font-bold">
              Detalles de {type === 'class' ? 'Clase' : type === 'race' ? 'Especie' : type === 'subclass' ? 'Subclase' : 'Trasfondo'}
            </span>
            <h3 className="font-display text-lg font-bold text-amber-100 tracking-wide mt-0.5">{name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-amber-200 transition-colors text-lg leading-none p-1 font-sans"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-96 pr-1 text-sm text-stone-300 leading-relaxed font-serif">
          {isLoading ? (
            <div className="py-8 text-center text-stone-500 font-sans text-xs tracking-wider uppercase animate-pulse">
              Cargando del grimorio...
            </div>
          ) : (
            <>
              {type === 'race' && raceInfo && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans text-stone-400 bg-stone-950/40 p-2.5 border border-[#6b4c24]/10 rounded-sm">
                    <p><span className="text-amber-500/80 font-semibold">Velocidad:</span> {raceInfo.speed} pies</p>
                    <p className="col-span-2">
                      <span className="text-amber-500/80 font-semibold">Competencias:</span>{' '}
                      {raceInfo.ability_bonuses?.map(ab => `${ab.ability_score.name} +${ab.bonus}`).join(', ') || 'Ninguna'}
                    </p>
                  </div>
                  {raceInfo.traits && raceInfo.traits.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs uppercase font-sans tracking-wide text-amber-500/80 font-bold border-b border-[#6b4c24]/10 pb-1">Rasgos raciales:</h4>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {raceInfo.traits.map(t => (
                          <TraitItem key={t.index} traitIndex={t.index} traitName={t.name} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {type === 'class' && classInfo && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans text-stone-400 bg-stone-950/40 p-2.5 border border-[#6b4c24]/10 rounded-sm">
                    <p><span className="text-amber-500/80 font-semibold">Dado de Golpe:</span> d{classInfo.hit_die}</p>
                    <p><span className="text-amber-500/80 font-semibold">Salvaciones:</span> {classInfo.saving_throws.map(s => s.name).join(', ')}</p>
                    <p className="col-span-2">
                      <span className="text-amber-500/80 font-semibold">Competencias en armas/armaduras:</span>{' '}
                      {classInfo.proficiencies.map(p => p.name).join(', ') || 'Ninguna'}
                    </p>
                  </div>
                  {classInfo.proficiency_choices && classInfo.proficiency_choices.length > 0 && (
                    <div className="pt-1 text-xs">
                      <span className="text-amber-500/80 font-sans font-bold uppercase tracking-wider block mb-1">Elegir habilidades:</span>
                      <p className="text-stone-400 italic">{classInfo.proficiency_choices[0].desc}</p>
                    </div>
                  )}
                </div>
              )}

              {type === 'subclass' && subclassInfo && (
                <div className="space-y-3">
                  {subclassInfo.subclass_flavor && (
                    <p className="italic text-amber-250/70 border-l-2 border-[#6b4c24]/30 pl-3">
                      "{subclassInfo.subclass_flavor}"
                    </p>
                  )}
                  <div className="space-y-2">
                    {subclassInfo.desc ? (
                      Array.isArray(subclassInfo.desc) ? (
                        subclassInfo.desc.map((p, idx) => <p key={idx}>{p}</p>)
                      ) : (
                        <p>{subclassInfo.desc}</p>
                      )
                    ) : (
                      <p className="text-stone-500 italic">Sin descripción disponible.</p>
                    )}
                  </div>
                </div>
              )}

              {type === 'background' && bgInfo && (
                <div className="space-y-3">
                  <p>{bgInfo.desc}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans text-stone-400 bg-stone-950/40 p-2.5 border border-[#6b4c24]/10 rounded-sm">
                    <p className="col-span-2">
                      <span className="text-amber-500/80 font-semibold">Características asociadas (elige +2 y +1):</span>{' '}
                      {bgInfo.abilities.map(a => ABILITY_LABELS_ES[a]).join(', ')}
                    </p>
                    <p className="col-span-2">
                      <span className="text-amber-500/80 font-semibold">Pericias automáticas:</span>{' '}
                      {bgInfo.skills.join(', ')}
                    </p>
                    {bgInfo.tool && (
                      <p className="col-span-2">
                        <span className="text-amber-500/80 font-semibold">Herramientas:</span> {bgInfo.tool}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TraitItem({ traitIndex, traitName }: { traitIndex: string; traitName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: dndKeys.trait(traitIndex),
    queryFn: () => dndApi.trait(traitIndex),
  })

  return (
    <div className="bg-stone-950/25 border border-stone-900 p-2.5 rounded-sm space-y-1">
      <h5 className="text-xs font-sans font-semibold text-amber-200/90">{traitName}</h5>
      {isLoading ? (
        <p className="text-[10px] text-stone-500 italic animate-pulse">Cargando detalles...</p>
      ) : data?.desc ? (
        <p className="text-[11px] text-stone-400 leading-snug">{data.desc.join(' ')}</p>
      ) : (
        <p className="text-[10px] text-stone-500 italic">Sin descripción.</p>
      )}
    </div>
  )
}
