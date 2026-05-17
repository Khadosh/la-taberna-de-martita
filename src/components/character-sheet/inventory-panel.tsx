import { useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
  useDraggable, useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'
import { dndApi, dndKeys, type ApiRef } from '../../lib/dnd-api'
import { getItemIconUrl, getItemFallbackEmoji } from '../../lib/item-icons'
import type { SheetJson } from './types'
import { inferSlot, type SlotKey, SLOT_LABELS, SLOT_EMPTY_HINT } from '../../lib/equip-slots'
import { PaperDoll, type ActiveDrag } from './paper-doll'

type InventoryItem = {
  id: string
  name: string
  quantity: number
  weight_lbs: number | null
  notes: string | null
  image_url?: string
}

interface InventoryPanelProps {
  characterId: string
  inventory: InventoryItem[]
  sheet: SheetJson
  isOwner: boolean
  ac: number
  toggleEquip: (id: string) => Promise<void>
  equipToSlot: (itemId: string, slot: SlotKey) => Promise<void>
  moveEquipSlot: (itemId: string, fromSlot: SlotKey, toSlot: SlotKey) => Promise<void>
  patchCurrency: (patch: Partial<{ gold: number; silver: number; copper: number }>) => void
  currency: { gold: number; silver: number; copper: number }
  strScore: number
}

// ── Item Icon ─────────────────────────────────────────────────────────────────

function ItemIcon({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} className="w-full h-full object-cover" alt={name} />
  }
  const url = getItemIconUrl(name)
  if (url) {
    return (
      <img src={url} className="w-8 h-8 object-contain opacity-75" alt={name}
        onError={e => {
          const t = e.currentTarget
          t.style.display = 'none'
          const span = document.createElement('span')
          span.className = 'text-lg opacity-40'
          span.textContent = getItemFallbackEmoji(name)
          t.parentElement?.appendChild(span)
        }}
      />
    )
  }
  return <span className="text-lg opacity-40">{getItemFallbackEmoji(name)}</span>
}

// ── Draggable inventory grid item ─────────────────────────────────────────────

function DraggableItem({
  item, isSelected, onClick, onDoubleClick,
}: {
  item: InventoryItem
  isSelected: boolean
  onClick: () => void
  onDoubleClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `inventory-${item.id}`,
    data: { kind: 'inventory', itemId: item.id, itemName: item.name },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.3 : 1 }}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={[
        'w-12 h-12 bg-[#1e1e1e] border border-[#333] flex items-center justify-center',
        'relative cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a] hover:border-[#555]',
        'transition-all group overflow-hidden rounded-sm touch-none',
        isSelected ? 'ring-1 ring-amber-500 border-amber-500/50' : '',
      ].join(' ')}
    >
      <ItemIcon name={item.name} imageUrl={item.image_url} />
      {item.quantity > 1 && (
        <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {item.quantity}
        </span>
      )}
    </div>
  )
}

// ── Quick filters ─────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  { label: 'Armas',     index: 'weapon',             emoji: '⚔' },
  { label: 'Armaduras', index: 'armor',               emoji: '🛡' },
  { label: 'Aventura',  index: 'adventuring-gear',    emoji: '🎒' },
  { label: 'Herramientas', index: 'tools',            emoji: '🔧' },
  { label: 'Monturas',  index: 'mounts-and-vehicles', emoji: '🐴' },
] as const

// ── Add Item Modal ─────────────────────────────────────────────────────────────

function AddItemModal({ onAdd, onClose }: {
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
          {/* Buscador */}
          <div className="px-3 pt-2 pb-0 bg-[#0a0a0a] shrink-0">
            <input
              autoFocus
              placeholder="Buscar en el catálogo D&D..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
              className="w-full bg-[#1a1a1a] border border-[#333] px-3 py-2 text-xs outline-none focus:border-amber-700/60 text-stone-300 rounded-sm"
            />
          </div>

          {/* Quick filters */}
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

          {/* Lista de items */}
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
                  <div className="w-9 h-9 shrink-0 bg-[#0d0d0d] flex items-center justify-center rounded-sm border border-[#2a2a2a] overflow-hidden">
                    {iconUrl
                      ? <img src={iconUrl} className="w-full h-full object-contain opacity-80" alt={item.name} />
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

          {/* Panel del item seleccionado */}
          {selected && (
            <div className="shrink-0 bg-[#0f0f0f] border-t border-[#3a3a3a] p-4 space-y-3 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 shrink-0 bg-[#0a0a0a] border border-amber-900/40 flex items-center justify-center rounded-sm overflow-hidden shadow-[inset_0_0_12px_rgba(217,119,6,0.12)]">
                  {selectedIconUrl
                    ? <img src={selectedIconUrl} className="w-full h-full object-contain opacity-90" alt={selected.name} />
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
        // Tab personalizado
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

// ── Slot picker modal — shown when item has no inferable slot ─────────────────

const ALL_SLOTS: SlotKey[] = ['head', 'cloak', 'chest', 'gloves', 'boots', 'amulet', 'ring_1', 'ring_2', 'main_hand', 'off_hand', 'ranged']

function SlotPickerModal({ itemName, onPick, onClose }: {
  itemName: string
  onPick: (slot: SlotKey) => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-sm p-5 w-full shadow-2xl">
        <p className="text-[9px] text-stone-500 uppercase tracking-widest font-bold text-center mb-1">¿En qué slot equipar?</p>
        <p className="text-xs text-amber-400 font-serif text-center mb-4 truncate px-2">{itemName}</p>
        <div className="grid grid-cols-3 gap-2">
          {ALL_SLOTS.map(slot => (
            <button key={slot} onClick={() => onPick(slot)}
              className="flex flex-col items-center gap-1 p-2.5 bg-[#181510] border border-[#2a2a2a] rounded-sm hover:border-amber-700/50 hover:bg-[#1e1a10] transition-all group">
              <span className="text-base leading-none">{SLOT_EMPTY_HINT[slot]}</span>
              <span className="text-[8px] text-stone-500 group-hover:text-amber-400 transition-colors uppercase tracking-wider font-bold leading-tight text-center">
                {SLOT_LABELS[slot]}
              </span>
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-4 w-full text-[9px] text-stone-700 hover:text-stone-400 uppercase tracking-widest font-bold py-1.5 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Inventory Panel ───────────────────────────────────────────────────────────

export function InventoryPanel({
  characterId, inventory, sheet, isOwner, ac,
  toggleEquip, equipToSlot, moveEquipSlot,
  patchCurrency, currency, strScore,
}: InventoryPanelProps) {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [editingCoin, setEditingCoin] = useState<'gold' | 'silver' | 'copper' | null>(null)
  const [coinInput, setCoinInput] = useState('')
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [slotPickerItem, setSlotPickerItem] = useState<InventoryItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const equippedItemIds = useMemo(() => new Set(sheet.equipped_items ?? []), [sheet.equipped_items])

  const displayInventory = useMemo(() => {
    const inv: InventoryItem[] = []
    for (const item of inventory) {
      if (equippedItemIds.has(item.id)) {
        if (item.quantity > 1) inv.push({ ...item, quantity: item.quantity - 1 })
      } else {
        inv.push(item)
      }
    }
    return inv
  }, [inventory, equippedItemIds])

  const totalWeight = inventory.reduce((s, i) => s + (Number(i.weight_lbs) || 0) * i.quantity, 0)
  const carryCapacity = strScore * 15
  const weightPct = Math.min((totalWeight / carryCapacity) * 100, 100)

  // ── Equip with slot fallback ────────────────────────────────────────────────

  const handleEquip = useCallback((item: InventoryItem) => {
    if (equippedItemIds.has(item.id)) {
      // Already equipped → unequip directly
      toggleEquip(item.id)
      return
    }
    const inferred = inferSlot(item.name)
    if (!inferred) {
      // Can't determine slot → ask user
      setSlotPickerItem(item)
    } else {
      toggleEquip(item.id)
    }
  }, [equippedItemIds, toggleEquip])

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const d = e.active.data.current
    if (!d) return
    if (d.kind === 'inventory') {
      const item = inventory.find(i => i.id === d.itemId)
      if (item) setActiveDrag({ kind: 'inventory', itemId: item.id, itemName: item.name })
    } else if (d.kind === 'slot') {
      const item = inventory.find(i => i.id === d.itemId)
      if (item) setActiveDrag({ kind: 'slot', itemId: item.id, itemName: item.name, fromSlot: d.fromSlot as SlotKey })
    }
  }, [inventory])

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveDrag(null)
    const { over, active } = e
    if (!over) return
    const drag = active.data.current
    const drop = over.data.current
    if (!drag || !drop) return

    if (drag.kind === 'inventory' && drop.kind === 'slot') {
      // Only equip if compatible slot (or item has no inferred slot → allow any)
      const inferred = inferSlot(drag.itemName as string)
      if (!inferred || inferred === drop.slot) {
        equipToSlot(drag.itemId as string, drop.slot as SlotKey)
      }
    } else if (drag.kind === 'slot' && drop.kind === 'slot' && drag.fromSlot !== drop.slot) {
      moveEquipSlot(drag.itemId as string, drag.fromSlot as SlotKey, drop.slot as SlotKey)
    } else if (drag.kind === 'slot' && drop.kind === 'inventory') {
      // Unequip by dragging to inventory zone
      toggleEquip(drag.itemId as string)
    }
  }, [equipToSlot, moveEquipSlot, toggleEquip])

  // ── Droppable inventory zone ─────────────────────────────────────────────────

  const { setNodeRef: setInventoryZoneRef, isOver: isOverInventory } = useDroppable({
    id: 'inventory-zone',
    data: { kind: 'inventory' },
  })

  // ── DB helpers ───────────────────────────────────────────────────────────────

  const addInventoryItem = async (item: { name: string; weight_lbs: number; quantity: number; notes?: string }) => {
    await supabase.from('character_inventory').insert({
      character_id: characterId,
      name: item.name,
      weight_lbs: item.weight_lbs,
      quantity: item.quantity,
      notes: item.notes ?? null,
    })
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
    setAddingItem(false)
  }

  const removeInventoryItem = async (id: string) => {
    await supabase.from('character_inventory').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
    setSelectedItem(null)
  }

  const updateQty = async (id: string, delta: number, current: number) => {
    const next = current + delta
    if (next <= 0) return removeInventoryItem(id)
    await supabase.from('character_inventory').update({ quantity: next }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
  }

  // ── Drag overlay item ────────────────────────────────────────────────────────

  const dragOverlayItem = activeDrag ? inventory.find(i => i.id === activeDrag.itemId) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-[#1a1a1a] text-stone-300 overflow-hidden font-serif relative">
        {/* Barra superior */}
        <div className="p-3 bg-[#121212] border-b border-[#333] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 bg-[#2a2a2a] border border-[#444] rounded-full px-3 py-1 flex-1 max-w-[200px]">
            <span className="text-stone-500 text-xs">🔍</span>
            <input placeholder="Filtrar morral..." className="bg-transparent border-none outline-none text-[10px] w-full text-stone-400 font-serif" />
          </div>
          {isOwner && (
            <button onClick={() => setAddingItem(true)} className="text-stone-500 hover:text-amber-500 text-lg transition-colors ml-2">＋</button>
          )}
        </div>

        {/* Monedas */}
        <div className="px-4 py-2 bg-[#0d0d0d] border-b border-[#222] flex justify-around items-center shrink-0">
          {[
            { key: 'gold' as const, color: 'text-amber-500', label: 'PO' },
            { key: 'silver' as const, color: 'text-stone-300', label: 'PP' },
            { key: 'copper' as const, color: 'text-orange-700', label: 'PC' },
          ].map(({ key, color, label }) => (
            <div key={key} className="flex items-center gap-1.5 group cursor-pointer"
              onClick={() => { if (isOwner) { setEditingCoin(key); setCoinInput('') } }}>
              <span className={`text-[10px] ${color}`}>●</span>
              {editingCoin === key ? (
                <input autoFocus className="bg-transparent w-8 outline-none border-b border-stone-600 text-xs font-mono text-stone-200"
                  value={coinInput}
                  onBlur={() => setEditingCoin(null)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      patchCurrency({ [key]: currency[key] + (parseInt(coinInput) || 0) })
                      setEditingCoin(null)
                    }
                  }}
                  onChange={e => setCoinInput(e.target.value)}
                />
              ) : (
                <span className="text-xs font-mono font-bold group-hover:text-white transition-colors">{currency[key]}</span>
              )}
              <span className={`text-[8px] ${color} opacity-60`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Paper Doll */}
        <div className="bg-[#0f0f0f] border-b border-[#222] shrink-0 px-1">
          <PaperDoll
            equippedSlots={sheet.equipped_slots ?? {}}
            inventory={inventory}
            selectedItemId={selectedItem?.id}
            ac={ac}
            activeDrag={activeDrag}
            onSelectItem={slim => {
              if (!slim) { setSelectedItem(null); return }
              const full = inventory.find(i => i.id === slim.id) ?? null
              setSelectedItem(full)
            }}
            onUnequip={itemId => toggleEquip(itemId)}
          />
        </div>

        {/* Grid de inventario — droppable zone */}
        <div
          ref={setInventoryZoneRef}
          className={[
            'flex-1 overflow-y-auto p-4 transition-colors',
            isOverInventory && activeDrag?.kind === 'slot'
              ? 'bg-[#1a1610]'
              : 'bg-[#121212]',
          ].join(' ')}
        >
          {/* Hint when slot drag is over inventory */}
          {isOverInventory && activeDrag?.kind === 'slot' && (
            <p className="text-[9px] text-amber-600/70 text-center mb-2 font-serif italic tracking-wide">
              Soltar para desequipar
            </p>
          )}
          <div className="grid grid-cols-5 gap-2">
            {displayInventory.map(item => (
              <DraggableItem
                key={`inv-${item.id}`}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
                onDoubleClick={() => isOwner && handleEquip(item)}
              />
            ))}
            {Array.from({ length: Math.max(0, 30 - displayInventory.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-12 h-12 bg-[#0d0d0d] border border-[#1a1a1a] opacity-30 rounded-sm" />
            ))}
          </div>
        </div>

        {/* Panel del item seleccionado */}
        {selectedItem && (
          <div className="p-4 bg-[#1a1a1a] border-t border-[#3a3a3a] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10 animate-in fade-in slide-in-from-bottom-4 shrink-0">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-start flex-1 min-w-0">
                <div className="w-10 h-10 shrink-0 bg-[#0d0d0d] border border-[#333] flex items-center justify-center rounded-sm overflow-hidden">
                  <ItemIcon name={selectedItem.name} imageUrl={selectedItem.image_url} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-500 tracking-wide uppercase">{selectedItem.name}</p>
                  {selectedItem.weight_lbs != null && selectedItem.weight_lbs > 0 && (
                    <p className="text-[9px] text-stone-600 font-mono mt-0.5">⚖ {selectedItem.weight_lbs} lb</p>
                  )}
                  <p className="text-[10px] text-stone-500 italic mt-1 leading-relaxed line-clamp-2">
                    {selectedItem.notes || 'Sin descripción.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-stone-600 hover:text-stone-300 ml-2 shrink-0">✕</button>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <button onClick={() => handleEquip(selectedItem)}
                      className="text-[10px] uppercase font-bold px-3 py-1.5 bg-amber-900/30 border border-amber-900/50 text-amber-400 hover:bg-amber-900/50 transition-colors rounded-sm">
                      {equippedItemIds.has(selectedItem.id) ? 'Quitar' : 'Equipar'}
                    </button>
                    <button onClick={() => removeInventoryItem(selectedItem.id)}
                      className="text-[10px] uppercase font-bold px-3 py-1.5 bg-red-900/10 border border-red-900/30 text-red-500 hover:bg-red-900/30 rounded-sm">
                      ✕
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 bg-[#121212] rounded-full px-2 py-1 border border-[#333]">
                <button onClick={() => updateQty(selectedItem.id, -1, selectedItem.quantity)} className="w-5 h-5 text-stone-500 hover:text-white transition-colors">－</button>
                <span className="text-[10px] font-mono font-bold text-stone-300 min-w-[12px] text-center">{selectedItem.quantity}</span>
                <button onClick={() => updateQty(selectedItem.id, 1, selectedItem.quantity)} className="w-5 h-5 text-stone-500 hover:text-white transition-colors">＋</button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de carga */}
        <div className="px-5 py-4 bg-[#0a0a0a] border-t border-[#222] shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-stone-600 text-xs">⚖</span>
            <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider">
              {totalWeight.toFixed(1)} <span className="text-stone-700">/</span> {carryCapacity} <span className="text-stone-700 ml-1 italic opacity-60">lb</span>
            </span>
          </div>
          <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden flex shadow-inner border border-[#222]">
            <div className="h-full bg-gradient-to-r from-amber-900 to-amber-600 transition-all duration-1000 shadow-[0_0_12px_rgba(217,119,6,0.6)]" style={{ width: `${weightPct}%` }} />
          </div>
        </div>

        {/* Modal de agregar item */}
        {addingItem && (
          <AddItemModal onAdd={addInventoryItem} onClose={() => setAddingItem(false)} />
        )}

        {/* Modal de selección de slot */}
        {slotPickerItem && (
          <SlotPickerModal
            itemName={slotPickerItem.name}
            onPick={async slot => {
              await equipToSlot(slotPickerItem.id, slot)
              setSlotPickerItem(null)
            }}
            onClose={() => setSlotPickerItem(null)}
          />
        )}
      </div>

      {/* Drag overlay — ícono flotante mientras arrastrás */}
      <DragOverlay dropAnimation={null}>
        {dragOverlayItem && (
          <div className="w-12 h-12 bg-[#1e1a10] border-2 border-amber-500 rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(217,119,6,0.6)] opacity-95 pointer-events-none">
            <ItemIcon name={dragOverlayItem.name} imageUrl={dragOverlayItem.image_url} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
