/**
 * Tab "Combate": CA, GACO, iniciativa, velocidad y habilidades de clase compactas.
 */
import { SheetLabel, SheetRow } from './sheet-primitives'
import { FeatureCard } from './sheet-badges'
import type { InfoModalData } from './types'
import type { FeatureDetail } from '../../lib/dnd-api'

interface ClassFeatureLevel {
  level: number
  features: { index: string; name: string }[]
}

interface TabCombateProps {
  ac: number
  dexMod: number
  strMod: number
  profBonus: number
  raceDetailSpeed?: number
  hitDie: number
  hitDiceAvailable: number
  level: number
  equippedItems: { id: string; name: string; notes?: string | null }[]
  equippedArmor?: {
    name: string; base: number; dex_bonus: boolean; max_bonus?: number; category: string
  }
  classFeaturesByLevel: ClassFeatureLevel[]
  subclassDetail?: { name: string; subclass_flavor?: string }
  subclassFeatureList?: { results: { index: string; name: string }[] }
  setModal: (m: InfoModalData) => void
}

function fmtMod(m: number) { return m >= 0 ? `+${m}` : String(m) }

export function TabCombate({
  ac, dexMod, strMod, profBonus, raceDetailSpeed,
  hitDie, hitDiceAvailable, level,
  equippedItems, equippedArmor,
  classFeaturesByLevel, subclassDetail, subclassFeatureList,
  setModal,
}: TabCombateProps) {
  // GACO = prof + max(str, dex)
  const gaco = profBonus + Math.max(strMod, dexMod)

  return (
    <div>
      {/* Combat stats grid */}
      <SheetRow className="border-t border-stone-600">
        <div className="flex-1 p-4">
          <SheetLabel>Stats de combate</SheetLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[
              { label: 'CA', value: String(ac), caption: equippedArmor ? `${equippedArmor.name}` : 'Base 10+DES' },
              { label: 'GACO', value: fmtMod(gaco), caption: 'Bono de ataque' },
              { label: 'Iniciativa', value: fmtMod(dexMod), caption: 'Orden de turnos' },
              { label: 'Velocidad', value: `${raceDetailSpeed ?? 30} ft`, caption: 'Por turno' },
            ].map(stat => (
              <div key={stat.label} className="border border-stone-400 text-center py-3 px-2" style={{ background: 'rgba(200,170,110,0.15)' }}>
                <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500">{stat.label}</p>
                <p className="text-2xl font-bold font-mono text-stone-900 my-0.5" style={{ fontFamily: 'Georgia, serif' }}>{stat.value}</p>
                <p className="text-[10px] italic text-stone-400 font-serif">{stat.caption}</p>
              </div>
            ))}
          </div>

          {/* Dice */}
          <div className="mt-4 flex items-center gap-4">
            <div className="border border-stone-400 px-3 py-2 text-center" style={{ background: 'rgba(200,170,110,0.12)' }}>
              <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500">Dado de golpe</p>
              <p className="text-lg font-bold font-mono text-stone-800">d{hitDie}</p>
            </div>
            <div className="border border-stone-400 px-3 py-2 text-center" style={{ background: 'rgba(200,170,110,0.12)' }}>
              <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500">DG disponibles</p>
              <p className="text-lg font-bold font-mono text-stone-800">{hitDiceAvailable}/{level}</p>
            </div>
            <div className="border border-stone-400 px-3 py-2 text-center" style={{ background: 'rgba(200,170,110,0.12)' }}>
              <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500">Prof. bonus</p>
              <p className="text-lg font-bold font-mono text-stone-800">+{profBonus}</p>
            </div>
          </div>
        </div>
      </SheetRow>

      {/* Equipped items */}
      {equippedItems.length > 0 && (
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4">
            <SheetLabel>Equipado</SheetLabel>
            <div className="space-y-1.5 mt-3">
              {equippedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 border border-amber-600/30 bg-amber-100/30">
                  <span className="text-amber-700 text-sm">⚔</span>
                  <span className="text-sm font-serif text-stone-800 font-medium flex-1">{item.name}</span>
                  {item.notes && <span className="text-xs text-stone-500 italic">{item.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        </SheetRow>
      )}

      {/* Class features — compact (no full desc by default, "ℹ" to expand) */}
      <SheetRow className="border-t border-stone-600">
        <div className="flex-1 p-4">
          <SheetLabel>
            Habilidades de clase
            {subclassDetail && <span className="font-serif normal-case tracking-normal ml-1 text-amber-700">· {subclassDetail.name}</span>}
          </SheetLabel>
          <div className="mt-3 space-y-4">
            {classFeaturesByLevel.length === 0 && (
              <p className="text-stone-400 text-xs font-serif italic">Cargando habilidades...</p>
            )}
            {classFeaturesByLevel.map(({ level: lvl, features }) => (
              <div key={lvl}>
                <p className="text-[10px] text-stone-400 font-serif tracking-widest uppercase border-b border-stone-300/60 pb-0.5 mb-2">
                  Nivel {lvl}{lvl === level && <span className="ml-2 text-amber-600">★ Nivel actual</span>}
                </p>
                <div className="space-y-2">
                  {features.map(f => (
                    <FeatureCard
                      key={f.index}
                      index={f.index}
                      name={f.name}
                      isNew={lvl === level}
                      onInfo={(data: FeatureDetail) => setModal({ kind: 'feature', data })}
                    />
                  ))}
                </div>
              </div>
            ))}
            {subclassFeatureList && subclassFeatureList.results.length > 0 && (
              <div>
                <p className="text-[10px] text-stone-400 font-serif tracking-widest uppercase border-b border-amber-600/30 pb-0.5 mb-2">
                  {subclassDetail?.subclass_flavor ?? 'Subclase'} · {subclassDetail?.name}
                </p>
                <div className="space-y-2">
                  {subclassFeatureList.results.map(f => (
                    <FeatureCard
                      key={f.index}
                      index={f.index}
                      name={f.name}
                      isNew={false}
                      onInfo={(data: FeatureDetail) => setModal({ kind: 'feature', data })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetRow>
    </div>
  )
}
