import type { ReactElement } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { type SlotKey, SLOT_LABELS, inferSlot } from '../../lib/equip-slots'
import { getItemIconUrl } from '../../lib/item-icons'
import { GameIcon } from '../icons/game-icon'

type InventoryItem = {
  id: string
  name: string
  image_url?: string
  notes?: string | null
  weight_lbs?: number | null
}

export type ActiveDrag = {
  kind: 'inventory' | 'slot'
  itemId: string
  itemName: string
  fromSlot?: SlotKey
}

interface PaperDollProps {
  equippedSlots: Partial<Record<SlotKey, string>>
  inventory: InventoryItem[]
  selectedItemId?: string | null
  ac: number
  activeDrag: ActiveDrag | null
  onSelectItem: (item: InventoryItem | null) => void
  onUnequip: (itemId: string) => void
}

// ── Slot SVG icons (empty-state line art, viewBox 0 0 40 40) ─────────────────

const SLOT_SVG: Record<SlotKey, ReactElement> = {
  head: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22 Q8 8 20 7 Q32 8 32 22" />
      <path d="M10 19 L30 19" />
      <path d="M8 22 L8 28 L12 30 L28 30 L32 28 L32 22" />
      <path d="M20 19 L20 24" />
    </svg>
  ),
  cloak: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 6 Q20 4 27 6" />
      <path d="M13 6 L9 10 L7 34 L18 36" />
      <path d="M27 6 L31 10 L33 34 L22 36" />
      <path d="M18 36 Q20 38 22 36" />
      <path d="M20 5 L20 37" strokeDasharray="2 2" strokeOpacity="0.5" />
    </svg>
  ),
  chest: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 10 Q10 7 20 6 Q30 7 30 10 L28 32 Q20 35 12 32 Z" />
      <path d="M10 10 L7 14 L10 17" />
      <path d="M30 10 L33 14 L30 17" />
      <path d="M20 7 L20 33" strokeOpacity="0.4" />
      <path d="M12 22 L28 22" strokeOpacity="0.4" />
    </svg>
  ),
  gloves: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 22 L9 32 Q9 36 20 36 Q31 36 31 32 L31 22" />
      <path d="M11 22 L11 11 Q11 8 14 8 Q17 8 17 11 L17 22" />
      <path d="M17 22 L17 9 Q17 6 20 6 Q23 6 23 9 L23 22" />
      <path d="M23 22 L23 11 Q23 8 26 8 Q29 8 29 11 L29 22" />
      <path d="M29 22 L29 14 Q29 12 31 12 L31 22" />
      <path d="M9 26 L5 23 Q4 20 6 18 Q8 16 10 18" />
    </svg>
  ),
  boots: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 5 L13 25 Q12 28 10 30" />
      <path d="M25 5 L25 22" />
      <path d="M13 5 L25 5" />
      <path d="M10 30 L8 34 L30 34 L32 30 Q28 26 25 26 L25 22 Q20 20 16 22 L16 28 Q13 29 10 30" />
      <path d="M8 34 Q10 37 18 37 Q28 37 30 34" />
    </svg>
  ),
  amulet: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8 Q20 4 28 8" />
      <path d="M12 8 Q8 16 12 22" />
      <path d="M28 8 Q32 16 28 22" />
      <path d="M20 22 L26 28 L20 36 L14 28 Z" />
      <path d="M14 28 L26 28" strokeOpacity="0.5" />
      <path d="M20 22 L20 36" strokeOpacity="0.5" />
    </svg>
  ),
  ring_1: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="20" cy="22" rx="11" ry="6" />
      <path d="M9 22 L9 28 Q9 34 20 34 Q31 34 31 28 L31 22" />
      <path d="M15 16 Q15 10 20 9 Q25 10 25 16 L25 18 L15 18 Z" />
      <path d="M17 16 Q17 13 20 12 Q23 13 23 16" strokeOpacity="0.6" />
    </svg>
  ),
  ring_2: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="20" cy="22" rx="11" ry="6" />
      <path d="M9 22 L9 28 Q9 34 20 34 Q31 34 31 28 L31 22" />
      <path d="M15 16 Q15 10 20 9 Q25 10 25 16 L25 18 L15 18 Z" />
      <path d="M17 16 Q17 13 20 12 Q23 13 23 16" strokeOpacity="0.6" />
    </svg>
  ),
  main_hand: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4 L22 26 M20 4 L18 26 M20 4 L20 26" />
      <path d="M18 6 L20 4 L22 6" />
      <path d="M12 26 L28 26" strokeWidth="2" />
      <path d="M20 26 L20 34" strokeWidth="1.8" />
      <circle cx="20" cy="36" r="2.5" />
    </svg>
  ),
  off_hand: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8 Q8 5 20 4 Q32 5 32 8 L32 22 Q32 34 20 38 Q8 34 8 22 Z" />
      <path d="M20 4 L20 38" strokeOpacity="0.35" />
      <path d="M8 16 L32 16" strokeOpacity="0.35" />
      <circle cx="20" cy="22" r="3" strokeOpacity="0.6" />
    </svg>
  ),
  ranged: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5 Q4 20 8 35" strokeWidth="2" />
      <path d="M8 5 L8 35" strokeDasharray="3 2" strokeOpacity="0.5" />
      <path d="M8 20 L33 20" />
      <path d="M29 16 L33 20 L29 24" />
      <path d="M10 20 L8 16 M10 20 L8 24" strokeOpacity="0.7" />
    </svg>
  ),
}


// ── Individual slot — droppable + draggable (when filled) ─────────────────────

function Slot({
  slotKey, item, isSelected, onClick, onDoubleClick, size = 44, activeDrag,
}: {
  slotKey: SlotKey
  item?: InventoryItem
  isSelected: boolean
  onClick: () => void
  onDoubleClick?: () => void
  size?: number
  activeDrag: ActiveDrag | null
}) {
  // Droppable
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `slot-${slotKey}`,
    data: { kind: 'slot', slot: slotKey },
  })

  // Draggable (only when filled)
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `slot-drag-${slotKey}`,
    data: { kind: 'slot', itemId: item?.id ?? '', fromSlot: slotKey },
    disabled: !item,
  })

  const setRef = (el: HTMLElement | null) => {
    setDropRef(el)
    setDragRef(el)
  }

  // Is this slot a valid drop target for the current drag?
  const isCompatible = activeDrag
    ? activeDrag.kind === 'inventory'
      ? (() => {
        const inferred = inferSlot(activeDrag.itemName)
        return inferred === null || inferred === slotKey  // null = acepta cualquier slot
      })()
      : activeDrag.fromSlot !== slotKey              // slot-to-slot: cualquier otro
    : false

  const iconUrl = item ? getItemIconUrl(item.name) : null
  const isEmpty = !item

  // All border + background via inline style — no Tailwind for these to avoid v4 currentColor issues
  const slotStyle = ((): React.CSSProperties => {
    const base: React.CSSProperties = { width: size, height: size }

    if (isDragging) {
      base.transform = CSS.Transform.toString(transform)
      base.opacity = 0.3
      base.zIndex = 50
    }

    if (isOver && isCompatible) {
      base.border = '2px solid #f59e0b'
      base.background = '#1e1a10'
      base.boxShadow = '0 0 14px rgba(217,119,6,0.55)'
      return base
    }
    if (isOver && !isCompatible) {
      base.border = '2px solid rgba(127,29,29,0.5)'
      base.background = '#120808'
      return base
    }

    if (!isEmpty) {
      base.background = 'rgba(5,2,0,0.90)'
      if (isSelected) {
        base.border = '2px solid #f59e0b'
        base.boxShadow = '0 0 10px rgba(217,119,6,0.45), inset 2px 2px 8px rgba(0,0,0,0.95), inset 0 4px 12px rgba(0,0,0,0.85), 1px 1px 0 rgba(160,90,20,0.40)'
      } else {
        base.border = '1px solid rgba(80,35,8,0.65)'
        base.boxShadow = 'inset 2px 2px 8px rgba(0,0,0,0.98), inset 0 4px 14px rgba(0,0,0,0.90), inset -1px -1px 5px rgba(90,45,8,0.30), 1px 1px 0 rgba(160,90,20,0.40)'
      }
      return base
    }

    // Empty slot
    if (!activeDrag) {
      base.background = 'rgba(3,1,0,0.93)'
      base.border = '1px solid rgba(0,0,0,0.88)'
      base.boxShadow = 'inset 2px 2px 8px rgba(0,0,0,0.98), inset 0 4px 14px rgba(0,0,0,0.92), inset -1px -1px 5px rgba(90,45,8,0.35), 1px 1px 0 rgba(160,90,20,0.40)'
      return base
    }
    if (isCompatible) {
      base.background = 'rgba(8,4,0,0.88)'
      base.border = '1px dashed rgba(150,75,15,0.65)'
      base.boxShadow = '0 0 8px rgba(217,119,6,0.28), inset 2px 2px 8px rgba(0,0,0,0.95), inset 0 4px 12px rgba(0,0,0,0.88)'
      return base
    }
    // Incompatible during drag: fade out
    base.background = 'rgba(3,1,0,0.90)'
    base.border = '1px solid rgba(0,0,0,0.82)'
    base.opacity = 0.35
    return base
  })()

  return (
    <button
      ref={setRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={slotStyle}
      {...(item ? { ...listeners, ...attributes } : {})}
      className={[
        'group relative flex items-center justify-center rounded-sm transition-all shrink-0 touch-none',
        item ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        !isEmpty && !isOver && !isSelected ? 'hover:brightness-125' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-sm pointer-events-none">
        {isEmpty ? (
          <div
            className="w-[58%] h-[58%] flex items-center justify-center transition-colors"
            style={{ color: isCompatible && activeDrag ? 'rgba(180,90,15,0.65)' : 'rgba(160,100,50,0.35)' }}
          >
            {SLOT_SVG[slotKey]}
          </div>
        ) : iconUrl ? (
          <div className="w-full h-full flex items-center justify-center text-amber-300/90">
            <GameIcon url={iconUrl} title={item.name} className="w-[70%] h-[70%]" />
          </div>
        ) : (
          // Equipado pero sin icono: mostrar nombre abreviado sobre el SVG del slot
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-[58%] h-[58%] text-amber-700/40 flex items-center justify-center">
              {SLOT_SVG[slotKey]}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[8px] text-amber-400/80 font-serif font-semibold text-center leading-tight px-0.5 truncate w-full text-center">
                {item!.name.split(' ').slice(0, 2).join(' ')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50
                      pointer-events-none select-none
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ minWidth: 80, maxWidth: 180 }}>
        <div className="px-2.5 py-1.5 rounded-sm shadow-lg" style={{ background: 'rgba(5,2,0,0.95)', border: '1px solid rgba(120,60,10,0.5)' }}>
          <p className="text-[10px] text-amber-400/90 font-serif font-semibold leading-tight whitespace-nowrap">
            {item?.name ?? SLOT_LABELS[slotKey]}
          </p>
          {item?.weight_lbs != null && item.weight_lbs > 0 && (
            <p className="text-[9px] text-stone-500 font-mono mt-0.5">⚖ {item.weight_lbs} lb</p>
          )}
          {item?.notes && (
            <p className="text-[9px] text-stone-400 font-serif italic mt-1 leading-snug" style={{ whiteSpace: 'normal', maxWidth: 160 }}>{item.notes}</p>
          )}
        </div>
        <div className="w-1.5 h-1.5 bg-[#0a0a0a] border-b border-r border-amber-900/40 rotate-45 mx-auto -mt-1" />
      </div>
    </button>
  )
}

// ── Paper Doll ────────────────────────────────────────────────────────────────

export function PaperDoll({
  equippedSlots, inventory, selectedItemId, ac, activeDrag, onSelectItem, onUnequip,
}: PaperDollProps) {
  const bySlot = (slot: SlotKey): InventoryItem | undefined => {
    const id = equippedSlots[slot]
    return id ? inventory.find(i => i.id === id) : undefined
  }

  const handleSlot = (slot: SlotKey) => {
    const item = bySlot(slot)
    onSelectItem(item ?? null)
  }

  const leftSlots: SlotKey[] = ['head', 'cloak', 'chest', 'gloves', 'boots']
  const rightSlots: SlotKey[] = ['amulet', 'ring_1', 'ring_2']

  return (
    <div className="relative w-full select-none" style={{ height: 340, background: 'radial-gradient(ellipse 58% 58% at 50% 48%, rgba(210,100,12,0.28) 0%, rgba(100,45,8,0) 72%)' }}>
      {/* Left column */}
      <div className="absolute left-2 top-3 flex flex-col gap-2">
        {leftSlots.map(slot => (
          <Slot key={slot} slotKey={slot}
            item={bySlot(slot)}
            isSelected={bySlot(slot)?.id === selectedItemId}
            onClick={() => handleSlot(slot)}
            onDoubleClick={() => { const i = bySlot(slot); if (i) onUnequip(i.id) }}
            activeDrag={activeDrag}
          />
        ))}
      </div>

      {/* Center mannequin */}
      <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none"
        style={{ paddingLeft: 56, paddingRight: 56 }}>
        <img
          src="/assets/images/maniqui.png"
          alt="maniquí"
          style={{ width: '100%', height: 340, objectFit: 'contain', opacity: .8 }}
        />
      </div>

      {/* Right column */}
      <div className="absolute right-2 top-3 flex flex-col gap-2">
        {rightSlots.map(slot => (
          <Slot key={slot} slotKey={slot}
            item={bySlot(slot)}
            isSelected={bySlot(slot)?.id === selectedItemId}
            onClick={() => handleSlot(slot)}
            onDoubleClick={() => { const i = bySlot(slot); if (i) onUnequip(i.id) }}
            activeDrag={activeDrag}
          />
        ))}
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center px-2 pb-2">
        <div style={{ flex: 1 }} className="flex gap-1.5">
          {(['main_hand', 'off_hand'] as SlotKey[]).map(slot => (
            <Slot key={slot} slotKey={slot}
              item={bySlot(slot)}
              isSelected={bySlot(slot)?.id === selectedItemId}
              onClick={() => handleSlot(slot)}
              onDoubleClick={() => { const i = bySlot(slot); if (i) onUnequip(i.id) }}
              activeDrag={activeDrag}
            />
          ))}
        </div>

        {/* CA badge — centrado exacto */}
        <div className="relative flex items-center justify-center" style={{ width: 52, height: 58 }}>
          <svg viewBox="0 0 52 58" className="absolute inset-0 w-full h-full">
            <path d="M4 4 L48 4 L48 36 Q48 52 26 56 Q4 52 4 36 Z" fill="#0d0d0d" stroke="#78350f" strokeWidth="1.5" />
            <path d="M8 8 L44 8 L44 36 Q44 50 26 54 Q8 50 8 36 Z" fill="#111" stroke="#4a2910" strokeWidth="0.8" />
          </svg>
          <div className="relative z-10 flex flex-col items-center -mt-1">
            <span className="text-[8px] text-amber-700 uppercase tracking-widest font-serif leading-none">CA</span>
            <span className="text-xl font-bold text-amber-400 font-serif leading-none">{ac}</span>
          </div>
        </div>

        <div style={{ flex: 1 }} className="flex gap-1.5 items-center justify-end">
          <Slot slotKey="ranged"
            item={bySlot('ranged')}
            isSelected={bySlot('ranged')?.id === selectedItemId}
            onClick={() => handleSlot('ranged')}
            onDoubleClick={() => { const i = bySlot('ranged'); if (i) onUnequip(i.id) }}
            activeDrag={activeDrag}
          />
        </div>
      </div>
    </div>
  )
}
