import { useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
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
  // Fetch details for all spells to group them by level
  const spellResults = useQueries({
    queries: spells.map(index => ({
      queryKey: dndKeys.spell(index),
      queryFn: () => dndApi.spell(index),
      staleTime: Infinity,
    }))
  })

  if (!isSpellcaster && spells.length === 0) {
    return (
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-6 text-center">
          <p className="text-stone-800 font-serif italic text-sm">Esta clase no tiene acceso a magia.</p>
          <p className="text-stone-800 font-serif text-xs mt-1">(Algunas subclases pueden otorgarlo a nivel 3)</p>
        </div>
      </SheetRow>
    )
  }

  // Group spells by level
  const spellsByLevel: Record<number, SpellDetail[]> = {}
  spellResults.forEach(res => {
    if (res.data) {
      const lvl = res.data.level
      if (!spellsByLevel[lvl]) spellsByLevel[lvl] = []
      spellsByLevel[lvl].push(res.data)
    }
  })

  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b)

  return (
    <div>
      {/* Spell slots */}
      {isSpellcaster && (
        <SheetRow className="border-t border-stone-500/30">
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
                          className="transition-colors"
                          style={i < available ? {
                            width: 18, height: 18, borderRadius: '50%',
                            background: 'radial-gradient(circle at 38% 32%, #b45309 0%, #78350f 100%)',
                            border: '1.5px solid rgba(212,130,30,0.8)',
                            boxShadow: 'inset 0 1px 0 rgba(255,200,80,0.3), 0 2px 4px rgba(0,0,0,0.4)',
                          } : {
                            width: 18, height: 18, borderRadius: '50%',
                            background: 'rgba(180,140,70,0.06)',
                            border: '1.5px solid rgba(109,85,48,0.38)',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.18)',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-stone-800 font-serif">{available}/{max}</span>
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

      {/* Prepared spells grouped by level */}
      {sortedLevels.length > 0 && (
        <SheetRow className="border-t border-stone-500/30">
          <div className="flex-1 p-4">
            <SheetLabel>Conjuros preparados</SheetLabel>
            <div className="mt-3 space-y-6">
              {sortedLevels.map(lvl => (
                <div key={lvl}>
                  <p className="text-[10px] font-serif tracking-widest uppercase pb-0.5 mb-2" style={{ color: '#6b4c24', borderBottom: '1px solid rgba(109,85,48,0.35)' }}>
                    {lvl === 0 ? 'Trucos (Cantrips)' : `Nivel ${lvl}`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {spellsByLevel[lvl].map(spell => (
                      <SpellBadge
                        key={spell.index}
                        index={spell.index}
                        onInfo={(data: SpellDetail) => setModal({ kind: 'spell', data })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetRow>
      )}

      {isSpellcaster && spells.length === 0 && (
        <SheetRow className="border-t border-stone-500/30">
          <div className="flex-1 p-4 text-center">
            <p className="text-stone-800 font-serif italic text-sm">No hay conjuros preparados.</p>
            <p className="text-stone-800 font-serif text-xs mt-1">Agregá conjuros desde la pantalla de creación o pedíselos al DM.</p>
          </div>
        </SheetRow>
      )}
    </div>
  )
}
