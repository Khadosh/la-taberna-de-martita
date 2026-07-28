import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dndApi, dndKeys, type ApiRef } from '../../lib/dnd-api'
import { getItemIconUrl, getItemFallbackEmoji } from '../../lib/item-icons'
import { GameIcon } from '../icons/game-icon'

const QUICK_FILTERS = [
  { label: 'Armas',        index: 'weapon',             emoji: '⚔' },
  { label: 'Armaduras',    index: 'armor',               emoji: '🛡' },
  { label: 'Aventura',     index: 'adventuring-gear',    emoji: '🎒' },
  { label: 'Herramientas', index: 'tools',               emoji: '🔧' },
  { label: 'Monturas',     index: 'mounts-and-vehicles', emoji: '🐴' },
] as const

export function AddItemModal({ onAdd, onClose }: {
  onAdd: (item: { name: string; weight_lbs: number; quantity: number; notes?: string }) => Promise<void>
  onClose: () => void
}) {
  const [tab, setTab] = useState<'catalog' | 'custom'>('catalog')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<ApiRef | null>(null)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)

  const [customName, setCustomName] = useState('')
  const [customWeight, setCustomWeight] = useState('')
  const [customQty, setCustomQty] = useState('1')

  const { data: equipList, isLoading } = useQuery({
    queryKey: dndKeys.equipment,
    queryFn: dndApi.equipment,
    staleTime: Infinity,
  })

  const { data: detail } = useQuery({
    queryKey: ['dnd', 'equipment', selected?.index ?? ''],
    queryFn: () => dndApi.equipmentDetail(selected!.index),
    enabled: !!selected,
    staleTime: Infinity,
  })

  const { data: categoryData } = useQuery({
    queryKey: dndKeys.equipmentCategory(activeFilter ?? ''),
    queryFn: () => dndApi.equipmentCategory(activeFilter!),
    enabled: !!activeFilter,
    staleTime: Infinity,
  })

  const categorySet = useMemo(
    () => categoryData ? new Set(categoryData.equipment.map(e => e.index)) : null,
    [categoryData]
  )

  const filtered = useMemo(() => {
    if (!equipList) return []
    const q = search.toLowerCase()
    let list = equipList.results.filter(e => e.name.toLowerCase().includes(q))
    if (categorySet) list = list.filter(e => categorySet.has(e.index))
    return list
  }, [equipList, search, categorySet])

  const handleAddCatalog = async () => {
    if (!selected || adding) return
    setAdding(true)
    await onAdd({
      name: detail?.name ?? selected.name,
      weight_lbs: detail?.weight ?? 0,
      quantity: qty,
      notes: detail?.desc?.[0],
    })
    setAdding(false)
  }

  const handleAddCustom = async () => {
    if (!customName.trim() || adding) return
    setAdding(true)
    await onAdd({
      name: customName.trim(),
      weight_lbs: parseFloat(customWeight) || 0,
      quantity: parseInt(customQty) || 1,
    })
    setAdding(false)
  }

  const selectedIconUrl = selected ? getItemIconUrl(selected.name) : null

  return (
    <div className="absolute inset-0 bg-black/92 z-40 flex flex-col animate-in fade-in">
      {/* Header con tabs */}
      <div className="bg-[#0d0d0d] border-b border-[#2a2a2a] px-3 pt-3 pb-0 flex items-end justify-between shrink-0">
        <div className="flex gap-0">
          {(['catalog', 'custom'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[10px] px-4 py-2 font-bold uppercase tracking-widest transition-colors border-b-2 ${
                tab === t ? 'text-amber-400 border-amber-600' : 'text-stone-600 border-transparent hover:text-stone-400'
              }`}>
              {t === 'catalog' ? 'Catálogo' : 'Personalizado'}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-stone-600 hover:text-stone-300 pb-2 pr-1 text-lg leading-none">✕</button>
      </div>

      {tab === 'catalog' ? (
        <>
          <div className="px-3 pt-2 pb-0 bg-[#0a0a0a] shrink-0">
            <input
              autoFocus
              placeholder="Buscar en el catálogo D&D..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
              className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs outline-none focus:border-amber-700/60 text-stone-300 rounded-sm"
            />
          </div>

          <div className="bg-[#0a0a0a] border-b border-[#1a1a1a] shrink-0 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => { setActiveFilter(null); setSelected(null) }}
              className={`shrink-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors ${
                !activeFilter
                  ? 'bg-amber-800/60 border-amber-700/60 text-amber-300'
                  : 'border-[#333] text-stone-600 hover:text-stone-400 hover:border-[#444]'
              }`}>
              Todos
            </button>
            {QUICK_FILTERS.map(f => (
              <button key={f.index}
                onClick={() => { setActiveFilter(activeFilter === f.index ? null : f.index); setSelected(null) }}
                className={`shrink-0 flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-colors ${
                  activeFilter === f.index
                    ? 'bg-amber-800/60 border-amber-700/60 text-amber-300'
                    : 'border-[#333] text-stone-600 hover:text-stone-400 hover:border-[#444]'
                }`}>
                <span className="text-[11px]">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <p className="text-center text-stone-600 text-xs p-8 italic">Cargando catálogo...</p>
            )}
            {filtered.map(item => {
              const iconUrl = getItemIconUrl(item.name)
              const isSelected = selected?.index === item.index
              return (
                <button key={item.index}
                  onClick={() => { setSelected(item); setQty(1) }}
                  className={`w-full flex items-center gap-3 px-3 py-2 border-b border-[#111] text-left transition-colors ${
                    isSelected ? 'bg-amber-900/25 border-b-amber-900/20' : 'hover:bg-[#1a1a1a]'
                  }`}>
                  <div className={`w-9 h-9 shrink-0 bg-[#0d0d0d] flex items-center justify-center rounded-sm border border-[#2a2a2a] overflow-hidden ${
                    isSelected ? 'text-amber-400' : 'text-stone-400'
                  }`}>
                    {iconUrl
                      ? <GameIcon url={iconUrl} title={item.name} className="w-6 h-6 opacity-80" />
                      : <span className="text-base opacity-25">{getItemFallbackEmoji(item.name)}</span>
                    }
                  </div>
                  <span className={`text-xs font-serif flex-1 min-w-0 truncate ${isSelected ? 'text-amber-400' : 'text-stone-300'}`}>
                    {item.name}
                  </span>
                  {isSelected && <span className="text-amber-600 text-xs shrink-0">✓</span>}
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="shrink-0 bg-[#0f0f0f] border-t border-[#3a3a3a] p-4 space-y-3 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 shrink-0 bg-[#0a0a0a] border border-amber-900/40 flex items-center justify-center rounded-sm overflow-hidden shadow-[inset_0_0_12px_rgba(217,119,6,0.12)] text-amber-400">
                  {selectedIconUrl
                    ? <GameIcon url={selectedIconUrl} title={selected.name} className="w-8 h-8 opacity-90" />
                    : <span className="text-2xl">{getItemFallbackEmoji(selected.name)}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-amber-400 font-serif">{detail?.name ?? selected.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detail ? (
                      <>
                        <span className="text-[9px] text-stone-500 font-mono bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                          ⚖ {detail.weight} lb
                        </span>
                        {detail.cost?.quantity > 0 && (
                          <span className="text-[9px] text-amber-700 font-mono bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                            {detail.cost.quantity} {detail.cost.unit}
                          </span>
                        )}
                        {detail.equipment_category && (
                          <span className="text-[9px] text-stone-600 italic">
                            {detail.equipment_category.name}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[9px] text-stone-700 italic">Cargando detalles...</span>
                    )}
                  </div>
                  {detail?.desc?.[0] && (
                    <p className="text-[10px] text-stone-500 mt-1.5 line-clamp-2 italic leading-relaxed">
                      {detail.desc[0]}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[#1a1a1a]">
                <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-full px-3 py-1.5">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="text-stone-500 hover:text-white transition-colors w-4 text-center leading-none">－</button>
                  <span className="text-xs font-mono font-bold text-stone-300 min-w-[20px] text-center">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="text-stone-500 hover:text-white transition-colors w-4 text-center leading-none">＋</button>
                </div>
                <button onClick={handleAddCatalog} disabled={adding}
                  className="flex-1 bg-amber-800 hover:bg-amber-700 text-amber-100 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-sm disabled:opacity-40 shadow-lg">
                  {adding ? '...' : 'Añadir al inventario'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 p-6 flex flex-col gap-4 justify-center">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest text-center border-b border-[#222] pb-3">
            Objeto Personalizado
          </p>
          <input
            autoFocus
            placeholder="Nombre del objeto..."
            className="w-full bg-[#0d0d0d] border border-[#333] p-2.5 text-xs outline-none focus:border-amber-700/60 text-stone-300 rounded-sm"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[8px] text-stone-600 mb-1 ml-1 uppercase tracking-wider">Peso (lb)</p>
              <input type="number" min="0" step="0.5"
                className="w-full bg-[#0d0d0d] border border-[#333] p-2 text-xs outline-none focus:border-amber-700/60 text-stone-300 rounded-sm"
                value={customWeight} onChange={e => setCustomWeight(e.target.value)} />
            </div>
            <div className="flex-1">
              <p className="text-[8px] text-stone-600 mb-1 ml-1 uppercase tracking-wider">Cantidad</p>
              <input type="number" min="1"
                className="w-full bg-[#0d0d0d] border border-[#333] p-2 text-xs outline-none focus:border-amber-700/60 text-stone-300 rounded-sm"
                value={customQty} onChange={e => setCustomQty(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddCustom}
              disabled={!customName.trim() || adding}
              className="flex-1 bg-amber-800 text-amber-100 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-colors rounded-sm disabled:opacity-40">
              Añadir
            </button>
            <button onClick={onClose} className="px-4 border border-[#333] text-[10px] uppercase font-bold text-stone-600 hover:text-stone-300 rounded-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
