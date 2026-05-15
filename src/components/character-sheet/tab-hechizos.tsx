/**
 * Tab "Hechizos": spell slots (toggle) + lista de hechizos preparados.
 */
import { SheetLabel, SheetRow } from './sheet-primitives'
import { SpellBadge } from './sheet-badges'
import type { SpellDetail } from '../../lib/dnd-api'
import { isWarlock } from '../../lib/dnd-constants'
import type { InfoModalData } from './types'

interface TabHechizosProps {
  spells: string[]
  maxSlots: number[]
  slotsUsed: Record<string, number>
  characterClass: string
  isOwner: boolean
  isSpellcaster: boolean
  setModal: (m: InfoModalData) => void
  toggleSlot: (level: number, slotIndex: number) => void
}

export function TabHechizos({
  spells, maxSlots, slotsUsed, characterClass,
  isOwner, isSpellcaster, setModal, toggleSlot,
}: TabHechizosProps) {
  if (!isSpellcaster && spells.length === 0) {
    return (
      <SheetRow className="border-t border-stone-600">
        <div className="flex-1 p-6 text-center">
          <p className="text-stone-400 font-serif italic text-sm">Esta clase no tiene acceso a magia.</p>
          <p className="text-stone-400 font-serif text-xs mt-1">(Algunas subclases pueden otorgarlo a nivel 3)</p>
        </div>
      </SheetRow>
    )
  }

  return (
    <div>
      {/* Spell slots */}
      {isSpellcaster && (
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4">
            <SheetLabel>Espacios de Conjuro</SheetLabel>
            <div className="mt-3 space-y-2">
              {maxSlots.map((max, idx) => {
                if (max === 0) return null
                const slotLevel = idx + 1
                const used = slotsUsed[String(slotLevel)] ?? 0
                const available = max - used
                return (
                  <div key={slotLevel} className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 font-serif w-10">Nv. {slotLevel}</span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: max }, (_, i) => (
                        <button key={i}
                          onClick={() => isOwner && toggleSlot(slotLevel, i)}
                          title={i < available ? 'Usar espacio' : 'Recuperar espacio'}
                          className={`w-5 h-5 border-2 rounded-full transition-colors ${i < available
                            ? 'bg-amber-700 border-amber-600 hover:bg-amber-600'
                            : 'bg-transparent border-stone-500 hover:border-amber-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400 font-serif">{available}/{max}</span>
                  </div>
                )
              })}
            </div>
            {isWarlock(characterClass) && (
              <p className="text-xs text-stone-500 font-serif italic mt-2">Magia de pacto — se recupera con descanso corto</p>
            )}
          </div>
        </SheetRow>
      )}

      {/* Prepared spells */}
      {spells.length > 0 && (
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4">
            <SheetLabel>Conjuros preparados · {spells.length}</SheetLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {spells.map(idx => (
                <SpellBadge key={idx} index={idx} onInfo={(data: SpellDetail) => setModal({ kind: 'spell', data })} />
              ))}
            </div>
          </div>
        </SheetRow>
      )}

      {isSpellcaster && spells.length === 0 && (
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4 text-center">
            <p className="text-stone-400 font-serif italic text-sm">No hay conjuros preparados.</p>
            <p className="text-stone-400 font-serif text-xs mt-1">Agregá conjuros desde la pantalla de creación o pedíselos al DM.</p>
          </div>
        </SheetRow>
      )}
    </div>
  )
}
