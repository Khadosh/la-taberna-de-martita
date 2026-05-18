import { useState, useMemo, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import { supabase } from '../../lib/supabase'
import type { SheetJson } from './types'
import { inferSlot, type SlotKey } from '../../lib/equip-slots'
import { PaperDoll, type ActiveDrag } from './paper-doll'
import type { InventoryItem } from './inventory-types'
import { ItemIcon } from './inventory-item-icon'
import { DraggableItem } from './inventory-grid-item'
import { CurrencyPlates } from './inventory-currency'
import { AddItemModal } from './inventory-add-modal'
import { SlotPickerModal } from './inventory-slot-picker'

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

export function InventoryPanel({
  characterId, inventory, sheet, isOwner, ac,
  toggleEquip, equipToSlot, moveEquipSlot,
  patchCurrency, currency, strScore,
}: InventoryPanelProps) {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [slotPickerItem, setSlotPickerItem] = useState<InventoryItem | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const equippedItemIds = useMemo(() => new Set(sheet.equipped_items ?? []), [sheet.equipped_items])

  // Backward compat: si hay equipped_items pero no equipped_slots (datos viejos),
  // reconstruye el mapa de slots para que el paper doll muestre los ítems correctamente
  const displayEquippedSlots = useMemo(() => {
    const slots = sheet.equipped_slots ?? {}
    if (Object.keys(slots).length > 0) return slots
    const equippedIds = sheet.equipped_items ?? []
    const rebuilt: Partial<Record<SlotKey, string>> = {}
    for (const itemId of equippedIds) {
      const item = inventory.find(i => i.id === itemId)
      if (!item) continue
      const slot = inferSlot(item.name, rebuilt)
      if (slot) rebuilt[slot] = itemId
    }
    return rebuilt
  }, [sheet.equipped_slots, sheet.equipped_items, inventory])

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

  const handleEquip = useCallback((item: InventoryItem) => {
    if (equippedItemIds.has(item.id)) {
      toggleEquip(item.id)
      return
    }
    const inferred = inferSlot(item.name)
    if (!inferred) {
      setSlotPickerItem(item)
    } else {
      toggleEquip(item.id)
    }
  }, [equippedItemIds, toggleEquip])

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
      const inferred = inferSlot(drag.itemName as string)
      if (!inferred || inferred === drop.slot) {
        equipToSlot(drag.itemId as string, drop.slot as SlotKey)
      }
    } else if (drag.kind === 'slot' && drop.kind === 'slot' && drag.fromSlot !== drop.slot) {
      moveEquipSlot(drag.itemId as string, drag.fromSlot as SlotKey, drop.slot as SlotKey)
    } else if (drag.kind === 'slot' && drop.kind === 'inventory') {
      toggleEquip(drag.itemId as string)
    }
  }, [equipToSlot, moveEquipSlot, toggleEquip])

  const { setNodeRef: setInventoryZoneRef, isOver: isOverInventory } = useDroppable({
    id: 'inventory-zone',
    data: { kind: 'inventory' },
  })

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

  const dragOverlayItem = activeDrag ? inventory.find(i => i.id === activeDrag.itemId) : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full text-stone-300 overflow-hidden font-serif relative"
        style={{ backgroundImage: "url('/assets/images/wood_panel.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>

        {/* Barra superior */}
        <div className="p-3 flex items-center justify-between shrink-0"
          style={{ background: 'rgba(8,3,0,0.52)', borderBottom: '1px solid rgba(0,0,0,0.55)' }}>
          <div className="flex items-center gap-2 rounded-full px-3 py-1 flex-1 max-w-[200px]"
            style={{ background: 'rgba(3,1,0,0.75)', border: '1px solid rgba(0,0,0,0.65)' }}>
            <span className="text-stone-500 text-xs">🔍</span>
            <input placeholder="Filtrar morral..." className="bg-transparent border-none outline-none text-[10px] w-full text-stone-400 font-serif" />
          </div>
          {isOwner && (
            <button onClick={() => setAddingItem(true)} className="text-stone-500 hover:text-amber-500 text-lg transition-colors ml-2">＋</button>
          )}
        </div>

        {/* Monedas */}
        <CurrencyPlates currency={currency} isOwner={isOwner} patchCurrency={patchCurrency} />

        {/* Paper Doll */}
        <div className="shrink-0 px-1"
          style={{ backgroundColor: 'rgba(8,3,0,0.22)', backgroundImage: 'radial-gradient(ellipse 62% 62% at 50% 46%, rgba(210,100,15,0.32) 0%, transparent 70%)', borderBottom: '1px solid rgba(0,0,0,0.5)' }}>
          <PaperDoll
            equippedSlots={displayEquippedSlots}
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

        {/* Grid de inventario */}
        <div
          ref={setInventoryZoneRef}
          className="flex-1 overflow-y-auto p-4 transition-colors"
          style={{ background: isOverInventory && activeDrag?.kind === 'slot' ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.10)' }}
        >
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
              <div key={`empty-${i}`} style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(3,1,0,0.93)', boxShadow: 'inset 2px 2px 8px rgba(0,0,0,0.98), inset 0 4px 14px rgba(0,0,0,0.92), inset -1px -1px 5px rgba(90,45,8,0.35), 1px 1px 0 rgba(160,90,20,0.40)', border: '1px solid rgba(0,0,0,0.88)' }} />
            ))}
          </div>
        </div>

        {/* Panel del item seleccionado */}
        {selectedItem && (
          <div className="p-4 z-10 animate-in fade-in slide-in-from-bottom-4 shrink-0"
            style={{ background: 'rgba(10,4,0,0.88)', borderTop: '1px solid rgba(0,0,0,0.6)', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)' }}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-start flex-1 min-w-0">
                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-sm overflow-hidden"
                  style={{ background: 'rgba(3,1,0,0.88)', border: '1px solid rgba(0,0,0,0.7)', boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.8)' }}>
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
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.45)' }}>
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
              <div className="flex items-center gap-3 rounded-full px-2 py-1"
                style={{ background: 'rgba(3,1,0,0.80)', border: '1px solid rgba(0,0,0,0.65)' }}>
                <button onClick={() => updateQty(selectedItem.id, -1, selectedItem.quantity)} className="w-5 h-5 text-stone-500 hover:text-white transition-colors">－</button>
                <span className="text-[10px] font-mono font-bold text-stone-300 min-w-[12px] text-center">{selectedItem.quantity}</span>
                <button onClick={() => updateQty(selectedItem.id, 1, selectedItem.quantity)} className="w-5 h-5 text-stone-500 hover:text-white transition-colors">＋</button>
              </div>
            </div>
          </div>
        )}

        {/* Barra de carga */}
        <div className="px-5 py-4 shrink-0" style={{ background: 'rgba(10,4,0,0.85)', borderTop: '1px solid rgba(0,0,0,0.6)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-stone-600 text-xs">⚖</span>
            <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider">
              {totalWeight.toFixed(1)} <span className="text-stone-700">/</span> {carryCapacity} <span className="text-stone-700 ml-1 italic opacity-60">lb</span>
            </span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden flex"
            style={{ background: '#100804', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.7)', border: '1px solid rgba(0,0,0,0.4)' }}>
            <div className="h-full bg-gradient-to-r from-amber-900 to-amber-600 transition-all duration-1000 shadow-[0_0_12px_rgba(217,119,6,0.6)]"
              style={{ width: `${weightPct}%` }} />
          </div>
        </div>

        {addingItem && (
          <AddItemModal onAdd={addInventoryItem} onClose={() => setAddingItem(false)} />
        )}

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
