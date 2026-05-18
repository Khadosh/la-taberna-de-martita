import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { InventoryItem } from './inventory-types'
import { ItemIcon } from './inventory-item-icon'

export function DraggableItem({
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
      style={{
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        width: 48, height: 48,
        background: 'rgba(3,1,0,0.91)',
        border: isSelected ? '1px solid rgba(245,158,11,0.75)' : '1px solid rgba(0,0,0,0.88)',
        boxShadow: isSelected
          ? 'inset 2px 2px 8px rgba(0,0,0,0.98), inset 0 4px 14px rgba(0,0,0,0.90), 0 0 10px rgba(217,119,6,0.4)'
          : 'inset 2px 2px 8px rgba(0,0,0,0.98), inset 0 4px 14px rgba(0,0,0,0.92), inset -1px -1px 5px rgba(90,45,8,0.32)',
        borderRadius: 6,
      }}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="relative cursor-grab active:cursor-grabbing hover:brightness-110 transition-all group overflow-hidden touch-none flex items-center justify-center"
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
