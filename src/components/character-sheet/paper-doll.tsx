import { type SlotKey, SLOT_LABELS, SLOT_EMPTY_HINT } from '../../lib/equip-slots'
import { getItemIconUrl } from '../../lib/item-icons'

type InventoryItem = {
  id: string
  name: string
  image_url?: string
}

interface PaperDollProps {
  equippedSlots: Partial<Record<SlotKey, string>>
  inventory: InventoryItem[]
  selectedItemId?: string | null
  ac: number
  onSelectItem: (item: InventoryItem | null) => void
}

// ── Humanoid SVG silhouette ───────────────────────────────────────────────────

function HumanoidSVG() {
  return (
    <svg viewBox="0 0 60 170" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="torsoGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#92400e" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0" />
        </radialGradient>
        <filter id="softShadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* ambient glow */}
      <ellipse cx="30" cy="88" rx="28" ry="55" fill="url(#torsoGlow)" />

      {/* Head */}
      <ellipse cx="30" cy="13" rx="9.5" ry="11" fill="#1e1e1e" stroke="#4a4130" strokeWidth="1.2" filter="url(#softShadow)" />
      <ellipse cx="30" cy="13" rx="6" ry="7.5" fill="#181818" stroke="#3a3228" strokeWidth="0.6" />

      {/* Neck */}
      <rect x="26" y="23" width="8" height="6" rx="1" fill="#1a1a1a" stroke="#3a3228" strokeWidth="0.8" />

      {/* Pauldrons / shoulders */}
      <path d="M10 31 Q15 28 30 27 Q45 28 50 31 L48 39 Q38 37 30 38 Q22 37 12 39 Z"
        fill="#222" stroke="#4a4130" strokeWidth="1.2" />

      {/* Torso */}
      <path d="M12 39 L16 84 Q30 88 44 84 L48 39 Q38 37 30 38 Q22 37 12 39 Z"
        fill="#1c1c1c" stroke="#3a3228" strokeWidth="1.2" />

      {/* Chest line detail */}
      <path d="M24 42 L22 82" stroke="#78350f" strokeWidth="0.4" opacity="0.5" />
      <path d="M36 42 L38 82" stroke="#78350f" strokeWidth="0.4" opacity="0.5" />
      <path d="M18 58 L42 58" stroke="#78350f" strokeWidth="0.4" opacity="0.3" />

      {/* Belt */}
      <rect x="16" y="82" width="28" height="7" rx="1" fill="#161616" stroke="#555" strokeWidth="1" />
      <circle cx="30" cy="85.5" r="2" fill="#1e1e1e" stroke="#666" strokeWidth="0.8" />

      {/* Left arm */}
      <path d="M10 31 L4 35 L2 66 L8 67 L11 41 Q10 35 10 31 Z"
        fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
      {/* Left wrist/hand */}
      <rect x="1" y="64" width="8" height="10" rx="2" fill="#161616" stroke="#333" strokeWidth="0.8" />

      {/* Right arm */}
      <path d="M50 31 L56 35 L58 66 L52 67 L49 41 Q50 35 50 31 Z"
        fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
      {/* Right wrist/hand */}
      <rect x="51" y="64" width="8" height="10" rx="2" fill="#161616" stroke="#333" strokeWidth="0.8" />

      {/* Hips */}
      <path d="M16 89 Q30 93 44 89 L46 98 Q30 101 14 98 Z"
        fill="#181818" stroke="#333" strokeWidth="0.8" />

      {/* Left leg */}
      <rect x="14" y="97" width="14" height="54" rx="2" fill="#161616" stroke="#2e2e2e" strokeWidth="0.8" />
      {/* Left knee pad */}
      <ellipse cx="21" cy="136" rx="7" ry="4" fill="#1e1e1e" stroke="#3a3228" strokeWidth="0.8" />

      {/* Right leg */}
      <rect x="32" y="97" width="14" height="54" rx="2" fill="#161616" stroke="#2e2e2e" strokeWidth="0.8" />
      {/* Right knee pad */}
      <ellipse cx="39" cy="136" rx="7" ry="4" fill="#1e1e1e" stroke="#3a3228" strokeWidth="0.8" />

      {/* Left foot */}
      <path d="M12 151 L33 151 L32 158 Q22 162 10 158 Z"
        fill="#141414" stroke="#2e2e2e" strokeWidth="0.8" />

      {/* Right foot */}
      <path d="M29 151 L48 151 L50 158 Q40 162 28 158 Z"
        fill="#141414" stroke="#2e2e2e" strokeWidth="0.8" />

      {/* Subtle amber trim on shoulders */}
      <path d="M10 31 Q15 28 30 27 Q45 28 50 31"
        fill="none" stroke="#78350f" strokeWidth="0.6" opacity="0.6" />
    </svg>
  )
}

// ── Individual slot ───────────────────────────────────────────────────────────

function Slot({
  slotKey, item, isSelected, onClick, size = 44,
}: {
  slotKey: SlotKey
  item?: InventoryItem
  isSelected: boolean
  onClick: () => void
  size?: number
}) {
  const iconUrl = item ? getItemIconUrl(item.name) : null
  const isEmpty = !item

  return (
    <button
      onClick={onClick}
      title={SLOT_LABELS[slotKey]}
      style={{ width: size, height: size }}
      className={[
        'relative flex items-center justify-center rounded-sm transition-all overflow-hidden shrink-0',
        isEmpty
          ? 'bg-[#0d0d0d] border border-[#252525] hover:border-[#3a3228] hover:bg-[#111]'
          : isSelected
            ? 'bg-[#1e1a10] border-2 border-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.5)]'
            : 'bg-[#181510] border border-amber-900/50 hover:border-amber-700/70 shadow-[inset_0_0_8px_rgba(217,119,6,0.08)]',
      ].join(' ')}
    >
      {isEmpty ? (
        <span className="text-[#2a2520] text-base select-none">{SLOT_EMPTY_HINT[slotKey]}</span>
      ) : iconUrl ? (
        <img src={iconUrl} alt={item.name} className="w-full h-full object-contain p-0.5 opacity-90" />
      ) : (
        <span className="text-amber-800/70 text-base select-none">{SLOT_EMPTY_HINT[slotKey]}</span>
      )}

      {/* Slot label on hover */}
      <div className="absolute inset-0 bg-black/70 flex items-end justify-center pb-0.5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[7px] text-amber-400/80 font-serif leading-none text-center px-0.5">
          {SLOT_LABELS[slotKey]}
        </span>
      </div>
    </button>
  )
}

// ── Paper Doll ────────────────────────────────────────────────────────────────

export function PaperDoll({
  equippedSlots, inventory, selectedItemId, ac, onSelectItem,
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
    <div className="relative w-full select-none" style={{ height: 320 }}>
      {/* ── Left column ── */}
      <div className="absolute left-2 top-3 flex flex-col gap-2">
        {leftSlots.map(slot => (
          <Slot key={slot} slotKey={slot}
            item={bySlot(slot)}
            isSelected={bySlot(slot)?.id === selectedItemId}
            onClick={() => handleSlot(slot)}
          />
        ))}
      </div>

      {/* ── Center SVG ── */}
      <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none"
        style={{ paddingLeft: 56, paddingRight: 56 }}>
        <div style={{ width: 100, height: 285 }}>
          <HumanoidSVG />
        </div>
      </div>

      {/* ── Right column ── */}
      <div className="absolute right-2 top-3 flex flex-col gap-2">
        {rightSlots.map(slot => (
          <Slot key={slot} slotKey={slot}
            item={bySlot(slot)}
            isSelected={bySlot(slot)?.id === selectedItemId}
            onClick={() => handleSlot(slot)}
          />
        ))}
      </div>

      {/* ── Bottom row ── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-2 pb-2">
        {/* Melee weapons */}
        <div className="flex gap-1.5">
          <Slot slotKey="main_hand"
            item={bySlot('main_hand')}
            isSelected={bySlot('main_hand')?.id === selectedItemId}
            onClick={() => handleSlot('main_hand')}
            size={40}
          />
          <Slot slotKey="off_hand"
            item={bySlot('off_hand')}
            isSelected={bySlot('off_hand')?.id === selectedItemId}
            onClick={() => handleSlot('off_hand')}
            size={40}
          />
        </div>

        {/* CA badge */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center"
            style={{ width: 52, height: 58 }}>
            {/* Shield shape */}
            <svg viewBox="0 0 52 58" className="absolute inset-0 w-full h-full">
              <path d="M4 4 L48 4 L48 36 Q48 52 26 56 Q4 52 4 36 Z"
                fill="#0d0d0d" stroke="#78350f" strokeWidth="1.5" />
              <path d="M8 8 L44 8 L44 36 Q44 50 26 54 Q8 50 8 36 Z"
                fill="#111" stroke="#4a2910" strokeWidth="0.8" />
            </svg>
            <div className="relative z-10 flex flex-col items-center -mt-1">
              <span className="text-[8px] text-amber-700 uppercase tracking-widest font-serif leading-none">CA</span>
              <span className="text-xl font-bold text-amber-400 font-serif leading-none">{ac}</span>
            </div>
          </div>
        </div>

        {/* Ranged weapon */}
        <div className="flex gap-1.5">
          <Slot slotKey="ranged"
            item={bySlot('ranged')}
            isSelected={bySlot('ranged')?.id === selectedItemId}
            onClick={() => handleSlot('ranged')}
            size={40}
          />
          {/* second ranged slot placeholder */}
          <div className="w-10 h-10 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] opacity-30" />
        </div>
      </div>
    </div>
  )
}
