import { useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { SheetLabel, SheetRow } from './sheet-primitives'
import { SpellBadge } from './sheet-badges'
import type { SpellDetail } from '../../lib/dnd-api'
import { isWarlock, PREPARED_CASTERS, getMaxPreparedSpells } from '../../lib/dnd-constants'
import type { InfoModalData } from './types'
import { SpellPickerPanel } from './spell-picker-panel'

interface TabHechizosProps {
  spells: string[]
  preparedSpells: string[]
  maxSlots: number[]
  slotsUsed: Record<string, number>
  characterClass: string
  characterLevel: number
  characterStats: Record<string, number>
  isOwner: boolean
  isSpellcaster: boolean
  setModal: (m: InfoModalData) => void
  toggleSlot: (level: number, slotIndex: number) => void
  onTogglePrepared: (index: string) => void
  onAddKnownSpell: (index: string) => void
  onRemoveKnownSpell: (index: string) => void
}

// Prepared toggle icon
function PrepToggle({ prepared, onClick }: { prepared: boolean; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      title={prepared ? 'Quitar de preparados' : 'Preparar para hoy'}
      className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-sm border transition-colors ${
        prepared
          ? 'border-amber-600/70 text-amber-700 bg-amber-100/60 hover:bg-amber-200/60'
          : 'border-stone-400/50 text-stone-400 hover:border-amber-500/60 hover:text-amber-600'
      }`}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill={prepared ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4">
        <polygon points="5,1 6.5,3.5 9.5,4 7.2,6.2 7.8,9.2 5,7.8 2.2,9.2 2.8,6.2 0.5,4 3.5,3.5" />
      </svg>
    </button>
  )
}

export function TabHechizos({
  spells, preparedSpells, maxSlots, slotsUsed,
  characterClass, characterLevel, characterStats,
  isOwner, isSpellcaster, setModal, toggleSlot,
  onTogglePrepared, onAddKnownSpell, onRemoveKnownSpell,
}: TabHechizosProps) {
  const [showPicker, setShowPicker] = useState(false)
  const classLower = characterClass.toLowerCase()
  const isPreparedCaster = PREPARED_CASTERS.has(classLower)
  const maxPrepared = isPreparedCaster
    ? getMaxPreparedSpells(classLower, characterLevel, characterStats)
    : null

  // Fetch details for all known spells
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

  const spellsByLevel: Record<number, SpellDetail[]> = {}
  spellResults.forEach(res => {
    if (res.data) {
      const lvl = res.data.level
      if (!spellsByLevel[lvl]) spellsByLevel[lvl] = []
      spellsByLevel[lvl].push(res.data)
    }
  })
  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b)

  // For prepared casters: non-cantrip prepared count
  const nonCantrips = spells.filter(s => {
    const detail = spellResults.find(r => r.data?.index === s)?.data
    return detail ? detail.level > 0 : true
  })
  const preparedNonCantrips = preparedSpells.filter(s => {
    const detail = spellResults.find(r => r.data?.index === s)?.data
    return detail ? detail.level > 0 : true
  })

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

      {/* Known spells list */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SheetLabel>
                {isPreparedCaster ? 'Hechizos conocidos' : 'Conjuros conocidos'}
              </SheetLabel>
              {isPreparedCaster && nonCantrips.length > 0 && maxPrepared != null && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  preparedNonCantrips.length > maxPrepared
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : preparedNonCantrips.length === maxPrepared
                      ? 'bg-amber-100 text-amber-800 border border-amber-400'
                      : 'bg-stone-100 text-stone-500 border border-stone-300'
                }`}>
                  {preparedNonCantrips.length}/{maxPrepared} preparados
                </span>
              )}
              {!isPreparedCaster && spells.length > 0 && (
                <span className="text-[10px] text-stone-500 font-serif italic">todos disponibles</span>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => setShowPicker(true)}
                className="text-[10px] px-2 py-1 border border-amber-700/50 text-amber-700 hover:bg-amber-100/50 font-serif transition-colors"
              >
                ＋ Conjuro
              </button>
            )}
          </div>

          {spells.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-stone-600 font-serif italic text-sm">No hay conjuros aprendidos.</p>
              {isOwner && (
                <button
                  onClick={() => setShowPicker(true)}
                  className="text-xs px-4 py-2 border border-amber-700/60 text-amber-700 hover:bg-amber-100/50 font-serif transition-colors"
                >
                  ＋ Elegir conjuros conocidos
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedLevels.map(lvl => (
                <div key={lvl}>
                  <p className="text-[10px] font-serif tracking-widest uppercase pb-0.5 mb-2"
                    style={{ color: '#6b4c24', borderBottom: '1px solid rgba(109,85,48,0.35)' }}>
                    {lvl === 0 ? 'Trucos (Cantrips)' : `Nivel ${lvl}`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {spellsByLevel[lvl].map(spell => {
                      const isCantrip = spell.level === 0
                      // Known casters: all spells always prepared; prepared casters: toggle
                      const isPrepared = !isPreparedCaster || isCantrip || preparedSpells.includes(spell.index)
                      return (
                        <div key={spell.index} className={`flex items-center gap-1 transition-opacity ${
                          isPreparedCaster && !isCantrip && !isPrepared ? 'opacity-45' : ''
                        }`}>
                          {isPreparedCaster && !isCantrip && isOwner && (
                            <PrepToggle
                              prepared={isPrepared}
                              onClick={() => onTogglePrepared(spell.index)}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <SpellBadge
                              index={spell.index}
                              onInfo={(data: SpellDetail) => setModal({ kind: 'spell', data })}
                            />
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => onRemoveKnownSpell(spell.index)}
                              className="shrink-0 text-stone-300 hover:text-red-500 transition-colors text-xs leading-none"
                              title="Olvidar conjuro"
                            >✕</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isPreparedCaster && maxPrepared != null && nonCantrips.length > 0 && (
            <p className="text-[10px] text-stone-500 font-serif italic mt-3">
              ★ = preparado para hoy · los no preparados no se pueden lanzar
            </p>
          )}
        </div>
      </SheetRow>

      {showPicker && (
        <SpellPickerPanel
          classIndex={characterClass.toLowerCase()}
          knownSpells={spells}
          onAdd={onAddKnownSpell}
          onRemove={onRemoveKnownSpell}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
