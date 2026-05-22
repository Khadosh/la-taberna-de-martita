import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import { supabase } from '../../lib/supabase'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import type { SheetJson } from './types'
import { inferSlot, type SlotKey } from '../../lib/equip-slots'
import { PaperDoll, type ActiveDrag } from './paper-doll'
import type { InventoryItem } from './inventory-types'
import { ItemIcon } from './inventory-item-icon'
import { DraggableItem } from './inventory-grid-item'
import { CurrencyPlates } from './inventory-currency'
import { AddItemModal } from './inventory-add-modal'
import { SlotPickerModal } from './inventory-slot-picker'
import { STAT_ICONS } from './stat-icons'

// ── Stat badge pill ────────────────────────────────────────────────────────────
const PILL_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: 'rgba(120,60,8,0.45)',  border: 'rgba(180,100,20,0.5)',  text: '#d97706' },
  blue:  { bg: 'rgba(30,58,100,0.45)', border: 'rgba(60,100,180,0.5)',  text: '#60a5fa' },
  red:   { bg: 'rgba(100,20,20,0.45)', border: 'rgba(160,40,40,0.5)',   text: '#f87171' },
  gold:  { bg: 'rgba(100,80,10,0.45)', border: 'rgba(180,150,20,0.5)',  text: '#fbbf24' },
  stone: { bg: 'rgba(40,32,20,0.55)',  border: 'rgba(80,60,30,0.5)',    text: '#a8a29e' },
}
function StatPill({ accent = 'stone', iconKey, children }: { accent?: string; iconKey?: string; children: ReactNode }) {
  const s = PILL_STYLES[accent] ?? PILL_STYLES.stone
  const icon = iconKey ? STAT_ICONS[iconKey] : null
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text, letterSpacing: '0.04em' }}
    >
      {icon && <span style={{ width: 10, height: 10, display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
      {children}
    </span>
  )
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
  const [tooltipItem, setTooltipItem] = useState<InventoryItem | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const handleHover = useCallback((item: InventoryItem | null, x: number, y: number) => {
    setTooltipItem(item)
    if (item) setTooltipPos({ x, y })
  }, [])

  // Derive D&D API index from item name: "Leather Armor" → "leather-armor"
  const selectedIndex = useMemo(() => {
    if (!selectedItem) return null
    return selectedItem.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }, [selectedItem?.name])

  // Lazy fetch: only runs when an item is selected; silently fails for custom items
  const { data: itemDetail, isLoading: detailLoading } = useQuery({
    queryKey: dndKeys.equipmentDetail(selectedIndex ?? ''),
    queryFn: () => dndApi.equipmentDetail(selectedIndex!),
    enabled: !!selectedIndex,
    retry: false,
    staleTime: 1000 * 60 * 10, // cache 10 min
  })

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
        style={{ backgroundImage: "url('/assets/images/wood_panel.png')", backgroundSize: '100% 100%' }}>

        {/* Encabezado: monedas arriba + filtro abajo */}
        <div className="shrink-0">
          <CurrencyPlates currency={currency} isOwner={isOwner} patchCurrency={patchCurrency} />
          <div className="px-4 py-2 flex items-center justify-between"
            style={{ background: 'rgba(8,3,0,0.18)', borderBottom: '1px solid rgba(0,0,0,0.35)' }}>
            <div className="flex items-center gap-2 rounded-sm px-3 py-1.5 flex-1 max-w-[200px]"
              style={{ background: 'rgba(2,1,0,0.92)', border: '1px solid rgba(0,0,0,0.85)', boxShadow: 'inset 3px 3px 10px rgba(0,0,0,1), inset 0 5px 18px rgba(0,0,0,0.95), inset -2px -2px 6px rgba(0,0,0,0.7), 1px 1px 0 rgba(120,70,15,0.25)' }}>
              <svg viewBox="0 0 14 14" fill="none" style={{ width: 11, height: 11, flexShrink: 0, color: 'rgba(180,130,70,0.55)' }}>
                <path d="M1 2h12l-4.5 5.5V12L5.5 13V7.5L1 2z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinejoin="round" />
              </svg>
              <input placeholder="Filtrar morral..." className="bg-transparent border-none outline-none text-[10px] w-full text-stone-400 font-serif" />
            </div>
            {isOwner && (
              <button
                onClick={() => setAddingItem(true)}
                className="text-amber-400 hover:text-amber-300 transition-colors ml-2 font-bold leading-none"
                style={{
                  width: 24, height: 24, borderRadius: 4, fontSize: 18,
                  border: '1px solid rgba(120,75,15,0.6)',
                  boxShadow: 'inset 0 1px 0 rgba(255,220,100,0.18), 0 3px 7px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >＋</button>
            )}
          </div>
        </div>

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
                onHover={handleHover}
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

                  {/* D&D API stat badges */}
                  {detailLoading && (
                    <div className="flex gap-1 mt-2">
                      {[1,2].map(i => (
                        <div key={i} className="h-4 w-14 rounded animate-pulse" style={{ background: 'rgba(120,70,15,0.2)' }} />
                      ))}
                    </div>
                  )}
                  {itemDetail && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {/* Weapon: damage */}
                      {itemDetail.damage && (
                        <StatPill accent="amber">
                          {itemDetail.damage.damage_dice} {itemDetail.damage.damage_type.name}
                        </StatPill>
                      )}
                      {/* Weapon: properties (all, with icons) */}
                      {itemDetail.properties?.map(p => (
                        <StatPill key={p.index} accent="stone" iconKey={p.index}>
                          {p.name}
                        </StatPill>
                      ))}
                      {/* Weapon: category */}
                      {itemDetail.weapon_category && (
                        <StatPill accent="stone" iconKey={itemDetail.weapon_category}>
                          {itemDetail.weapon_category}
                        </StatPill>
                      )}
                      {/* Weapon: range */}
                      {itemDetail.weapon_range && (
                        <StatPill accent="stone" iconKey={itemDetail.weapon_range}>
                          {itemDetail.weapon_range}
                        </StatPill>
                      )}
                      {/* Armor: AC */}
                      {itemDetail.armor_class && (
                        <StatPill accent="blue">
                          CA {itemDetail.armor_class.base}
                          {itemDetail.armor_class.dex_bonus ? ' + DES' : ''}
                          {itemDetail.armor_class.max_bonus != null ? ` (máx +${itemDetail.armor_class.max_bonus})` : ''}
                        </StatPill>
                      )}
                      {/* Armor: category with icon */}
                      {itemDetail.armor_category && (
                        <StatPill accent="stone" iconKey={`${itemDetail.armor_category} Armor`}>
                          {itemDetail.armor_category}
                        </StatPill>
                      )}
                      {/* Armor: stealth disadvantage */}
                      {(itemDetail as any).stealth_disadvantage === true && (
                        <StatPill accent="red">Sigilo ⚠</StatPill>
                      )}
                      {/* Cost */}
                      {itemDetail.cost && (
                        <StatPill accent="gold">
                          {itemDetail.cost.quantity} {itemDetail.cost.unit}
                        </StatPill>
                      )}
                    </div>
                  )}
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
        <div className="mx-20 pt-1 pb-1 shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-stone-100 opacity-50 text-xl">⚖</span>
            <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider">
              {totalWeight.toFixed(1)} <span className="text-stone-200">/</span> {carryCapacity} <span className="text-stone-200 ml-1 italic opacity-60">lb</span>
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

      {/* Tooltip fixed — escapes overflow clipping del grid */}
      {tooltipItem && !activeDrag && (
        <div
          className="pointer-events-none z-[9999]"
          style={{
            position: 'fixed',
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 8,
            transform: 'translateY(-100%)',
          }}
        >
          <div style={{
            background: 'rgba(10,6,2,0.96)',
            border: '1px solid rgba(180,120,40,0.5)',
            borderRadius: 5,
            padding: '6px 10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.9)',
            maxWidth: 200,
          }}>
            <p className="text-[11px] font-semibold text-amber-300 font-serif leading-tight">{tooltipItem.name}</p>
            {tooltipItem.weight_lbs != null && tooltipItem.weight_lbs > 0 && (
              <p className="text-[9px] text-stone-500 font-mono mt-0.5">⚖ {tooltipItem.weight_lbs} lb</p>
            )}
            {tooltipItem.notes && (
              <p className="text-[10px] text-stone-400 font-serif italic mt-1 leading-snug">{tooltipItem.notes}</p>
            )}
          </div>
        </div>
      )}
    </DndContext>
  )
}
