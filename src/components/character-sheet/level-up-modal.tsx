import { useQuery, useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { parchmentStyle } from './sheet-primitives'

const STAT_LABELS_FULL: Record<string, string> = {
  str: 'Fuerza', dex: 'Destreza', con: 'Constitución',
  int: 'Inteligencia', wis: 'Sabiduría', cha: 'Carisma',
}

export function LevelUpModal({
  character, level, hitDie, conMod, stats,
  hpInput, setHpInput,
  subclass, setSubclass,
  asi, setAsi,
  currentSubclass,
  onConfirm, onCancel,
}: {
  character: { name: string; class: string }
  level: number
  hitDie: number
  conMod: number
  stats: Record<string, number>
  hpInput: string
  setHpInput: (v: string) => void
  subclass: string
  setSubclass: (v: string) => void
  asi: Record<string, number>
  setAsi: (v: Record<string, number>) => void
  currentSubclass?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const nextLevel = level + 1
  const classIndex = character.class.toLowerCase()

  const { data: classLevels } = useQuery({
    queryKey: dndKeys.classLevels(classIndex),
    queryFn: () => dndApi.classLevels(classIndex),
    staleTime: Infinity,
  })
  const { data: subclasses } = useQuery({
    queryKey: dndKeys.classSubclasses(classIndex),
    queryFn: () => dndApi.classSubclasses(classIndex),
    staleTime: Infinity,
  })

  const targetLevel = classLevels?.find(l => l.level === nextLevel)
  const features = targetLevel?.features ?? []
  const hasAsi = (targetLevel?.ability_score_bonuses ?? 0) > 0 && !currentSubclass?.includes('asi-done-' + nextLevel)
  const needsSubclass = features.some(f =>
    ['archetype', 'tradition', 'oath', 'origin', 'circle', 'domain', 'patron', 'path',
      'college', 'school', 'roguish', 'ranger', 'sorcerous', 'subclass'].some(kw =>
      f.name.toLowerCase().includes(kw) || f.index.includes(kw)
    )
  ) && !currentSubclass

  const featureResults = useQueries({
    queries: features.map(f => ({
      queryKey: dndKeys.feature(f.index),
      queryFn: () => dndApi.feature(f.index),
      staleTime: Infinity,
    })),
  })

  const totalAsiPoints = Object.values(asi).reduce((a, b) => a + b, 0)
  const maxAsiPoints = 2
  const avgHp = Math.floor(hitDie / 2) + 1 + conMod

  const hpValid = hpInput && parseInt(hpInput) >= 1
  const subclassValid = !needsSubclass || subclass
  const asiValid = !hasAsi || totalAsiPoints === maxAsiPoints
  const canConfirm = hpValid && subclassValid && asiValid

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="border-4 border-double border-stone-700 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
        style={{ ...parchmentStyle, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b-2 border-stone-600 pb-3">
          <h3 className="font-bold text-stone-800 font-serif text-xl">⬆ Subir al nivel {nextLevel}</h3>
          <p className="text-sm text-stone-500 font-serif italic mt-1">{character.name} · {character.class} · d{hitDie}</p>
        </div>

        {features.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">Nuevas características</p>
            {featureResults.map((q, i) => (
              <div key={features[i].index} className="border border-stone-400 p-3" style={{ background: 'rgba(200,170,110,0.15)' }}>
                <p className="text-sm font-semibold text-stone-800 font-serif">{features[i].name}</p>
                {q.data?.desc?.[0] && <p className="text-xs text-stone-600 font-serif italic mt-1 line-clamp-3">{q.data.desc[0]}</p>}
              </div>
            ))}
          </div>
        )}

        {needsSubclass && subclasses && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">Elegí tu especialidad</p>
            <p className="text-xs text-stone-500 font-serif italic">Al llegar a nivel {nextLevel}, elegís tu camino de especialización.</p>
            <div className="grid gap-2">
              {subclasses.results.map(sc => (
                <SubclassOption key={sc.index} index={sc.index} selected={subclass === sc.index} onSelect={() => setSubclass(sc.index)} />
              ))}
            </div>
          </div>
        )}

        {hasAsi && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
              Mejora de características ({totalAsiPoints}/{maxAsiPoints} puntos)
            </p>
            <p className="text-xs text-stone-500 font-serif italic">Repartí {maxAsiPoints} puntos entre tus características (máx 20).</p>
            <div className="grid grid-cols-3 gap-2">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(k => {
                const current = stats[k] ?? 10
                const bonus = asi[k] ?? 0
                const canAdd = totalAsiPoints < maxAsiPoints && current + bonus < 20
                return (
                  <div key={k} className="border border-stone-400 p-2 text-center" style={{ background: bonus > 0 ? 'rgba(200,140,40,0.15)' : 'rgba(200,170,110,0.08)' }}>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">{STAT_LABELS_FULL[k]}</p>
                    <p className="text-lg font-bold font-mono text-stone-800">
                      {current}{bonus > 0 && <span className="text-amber-700 text-sm ml-0.5">+{bonus}</span>}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <button disabled={bonus <= 0} onClick={() => setAsi({ ...asi, [k]: bonus - 1 })}
                        className="w-5 h-5 text-xs border border-stone-400 text-stone-500 disabled:opacity-30 hover:bg-stone-200/50 leading-none font-mono">−</button>
                      <button disabled={!canAdd} onClick={() => setAsi({ ...asi, [k]: bonus + 1 })}
                        className="w-5 h-5 text-xs border border-stone-400 text-stone-500 disabled:opacity-30 hover:bg-stone-200/50 leading-none font-mono">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">Puntos de golpe</p>
          <p className="text-xs text-stone-500 font-serif italic">
            Tirá 1d{hitDie} + {conMod >= 0 ? `+${conMod}` : conMod} CON = entre {Math.max(1, 1 + conMod)} y {hitDie + conMod} PG. Promedio: {avgHp}.
          </p>
          <div className="flex items-center gap-2">
            <input
              autoFocus={!needsSubclass}
              type="number" min={1}
              value={hpInput}
              onChange={e => setHpInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canConfirm && onConfirm()}
              placeholder={String(avgHp)}
              className="flex-1 px-3 py-2 text-lg font-mono text-center border border-stone-500 bg-amber-50/80 focus:outline-none focus:border-amber-700"
            />
            <button onClick={() => setHpInput(String(avgHp))}
              className="px-3 py-2 text-xs border border-stone-400 text-stone-600 hover:bg-stone-200/50 font-serif transition-colors">
              Promedio ({avgHp})
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-stone-400">
          <button onClick={onCancel}
            className="flex-1 px-3 py-2 text-sm border border-stone-400 text-stone-500 hover:bg-stone-200/50 font-serif transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={!canConfirm}
            className="flex-1 px-3 py-2 text-sm bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors font-semibold">
            ⬆ Confirmar nivel {nextLevel}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubclassOption({ index, selected, onSelect }: { index: string; selected: boolean; onSelect: () => void }) {
  const { data: detail } = useQuery({
    queryKey: dndKeys.subclass(index),
    queryFn: () => dndApi.subclass(index),
    staleTime: Infinity,
  })

  return (
    <button
      onClick={onSelect}
      className={`text-left border p-3 transition-colors ${selected
        ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600'
        : 'border-stone-400 hover:border-amber-600 hover:bg-amber-50/30'
      }`}
    >
      <p className="text-sm font-semibold text-stone-800 font-serif capitalize">{detail?.name ?? index.replace(/-/g, ' ')}</p>
      {detail?.subclass_flavor && <p className="text-[10px] text-stone-500 font-serif uppercase tracking-wider mt-0.5">{detail.subclass_flavor}</p>}
      {detail?.desc && <p className="text-xs text-stone-600 font-serif italic mt-1 line-clamp-2">{detail.desc}</p>}
    </button>
  )
}
