import { useState, useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { parchmentStyle } from './sheet-primitives'

interface SpellPickerPanelProps {
  classIndex: string
  knownSpells: string[]
  onAdd: (index: string) => void
  onRemove: (index: string) => void
  onClose: () => void
}

export function SpellPickerPanel({ classIndex, knownSpells, onAdd, onRemove, onClose }: SpellPickerPanelProps) {
  const [search, setSearch] = useState('')

  const { data: classSpellRefs, isLoading: loadingRefs } = useQuery({
    queryKey: dndKeys.classSpells(classIndex),
    queryFn: () => dndApi.classSpells(classIndex),
    staleTime: Infinity,
  })

  const allRefs = classSpellRefs?.results ?? []

  const spellResults = useQueries({
    queries: allRefs.map(s => ({
      queryKey: dndKeys.spell(s.index),
      queryFn: () => dndApi.spell(s.index),
      staleTime: Infinity,
    })),
  })

  const loadedPct = allRefs.length > 0
    ? Math.round(spellResults.filter(r => r.data).length / allRefs.length * 100)
    : 0

  const filtered = useMemo(() =>
    spellResults
      .map(r => r.data)
      .filter(Boolean)
      .filter(s => !search || s!.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a!.level - b!.level || a!.name.localeCompare(b!.name)),
    [spellResults, search]
  )

  const spellsByLevel = useMemo(() => {
    const map: Record<number, typeof filtered> = {}
    for (const s of filtered) {
      if (!s) continue
      if (!map[s.level]) map[s.level] = []
      map[s.level].push(s)
    }
    return map
  }, [filtered])

  const sortedLevels = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="border-4 border-double border-stone-700 max-w-lg w-full max-h-[85vh] flex flex-col"
        style={{ ...parchmentStyle, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-stone-400 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
              Lista de conjuros — {classIndex}
            </p>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors text-lg leading-none">✕</button>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Buscar conjuro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-stone-400 bg-amber-50/80 focus:outline-none focus:border-amber-700 font-serif"
          />
          {loadedPct < 100 && (
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(200,170,110,0.3)' }}>
              <div className="h-full rounded-full bg-amber-700 transition-all" style={{ width: `${loadedPct}%` }} />
            </div>
          )}
        </div>

        {/* Spell list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loadingRefs && (
            <p className="text-xs text-stone-400 font-serif italic text-center py-4">Cargando lista de conjuros...</p>
          )}
          {!loadingRefs && sortedLevels.length === 0 && loadedPct === 100 && (
            <p className="text-xs text-stone-400 font-serif italic text-center py-4">No se encontraron conjuros.</p>
          )}
          {sortedLevels.map(lvl => (
            <div key={lvl}>
              <p className="text-[10px] font-serif tracking-widest uppercase pb-0.5 mb-2"
                style={{ color: '#6b4c24', borderBottom: '1px solid rgba(109,85,48,0.35)' }}>
                {lvl === 0 ? 'Trucos (Cantrips)' : `Nivel ${lvl}`}
              </p>
              <div className="space-y-1">
                {spellsByLevel[lvl].map(spell => {
                  if (!spell) return null
                  const isKnown = knownSpells.includes(spell.index)
                  return (
                    <div key={spell.index}
                      className="flex items-center gap-2 px-3 py-2 border transition-colors"
                      style={{
                        borderColor: isKnown ? 'rgba(180,100,20,0.6)' : 'rgba(109,85,48,0.25)',
                        background: isKnown ? 'rgba(200,140,40,0.12)' : 'rgba(200,170,110,0.06)',
                      }}>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-stone-800 font-serif">{spell.name}</span>
                        <span className="text-[10px] text-stone-400 font-serif ml-2">{spell.school?.name ?? ''}</span>
                      </div>
                      <button
                        onClick={() => isKnown ? onRemove(spell.index) : onAdd(spell.index)}
                        className={`shrink-0 text-[10px] px-2 py-0.5 border font-serif transition-colors ${
                          isKnown
                            ? 'border-red-400/50 text-red-600 hover:bg-red-100/50'
                            : 'border-amber-600/50 text-amber-700 hover:bg-amber-100/50'
                        }`}
                      >
                        {isKnown ? '− Quitar' : '+ Aprender'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-stone-400 shrink-0">
          <button onClick={onClose}
            className="w-full px-3 py-2 text-sm border border-stone-400 text-stone-600 hover:bg-stone-200/50 font-serif transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
