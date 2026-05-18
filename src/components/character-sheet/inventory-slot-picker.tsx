import { type SlotKey, SLOT_LABELS, SLOT_EMPTY_HINT } from '../../lib/equip-slots'

const ALL_SLOTS: SlotKey[] = ['head', 'cloak', 'chest', 'gloves', 'boots', 'amulet', 'ring_1', 'ring_2', 'main_hand', 'off_hand', 'ranged']

export function SlotPickerModal({ itemName, onPick, onClose }: {
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
