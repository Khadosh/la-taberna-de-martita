import type { ReactElement } from 'react'
import { type SlotKey, SLOT_LABELS } from '../../lib/equip-slots'
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

// ── Slot SVG icons (empty-state line art, viewBox 0 0 40 40) ─────────────────

const SLOT_SVG: Record<SlotKey, ReactElement> = {
  head: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* dome */}
      <path d="M8 22 Q8 8 20 7 Q32 8 32 22" />
      {/* visor */}
      <path d="M10 19 L30 19" />
      {/* cheek guards + chin */}
      <path d="M8 22 L8 28 L12 30 L28 30 L32 28 L32 22" />
      {/* nose guard */}
      <path d="M20 19 L20 24" />
    </svg>
  ),

  cloak: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* collar */}
      <path d="M13 6 Q20 4 27 6" />
      {/* left panel */}
      <path d="M13 6 L9 10 L7 34 L18 36" />
      {/* right panel */}
      <path d="M27 6 L31 10 L33 34 L22 36" />
      {/* bottom */}
      <path d="M18 36 Q20 38 22 36" />
      {/* center seam */}
      <path d="M20 5 L20 37" strokeDasharray="2 2" strokeOpacity="0.5" />
    </svg>
  ),

  chest: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* main plate */}
      <path d="M10 10 Q10 7 20 6 Q30 7 30 10 L28 32 Q20 35 12 32 Z" />
      {/* left pauldron strap */}
      <path d="M10 10 L7 14 L10 17" />
      {/* right pauldron strap */}
      <path d="M30 10 L33 14 L30 17" />
      {/* center ridge */}
      <path d="M20 7 L20 33" strokeOpacity="0.4" />
      {/* horizontal band */}
      <path d="M12 22 L28 22" strokeOpacity="0.4" />
    </svg>
  ),

  gloves: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* palm */}
      <path d="M9 22 L9 32 Q9 36 20 36 Q31 36 31 32 L31 22" />
      {/* index */}
      <path d="M11 22 L11 11 Q11 8 14 8 Q17 8 17 11 L17 22" />
      {/* middle */}
      <path d="M17 22 L17 9 Q17 6 20 6 Q23 6 23 9 L23 22" />
      {/* ring */}
      <path d="M23 22 L23 11 Q23 8 26 8 Q29 8 29 11 L29 22" />
      {/* pinky */}
      <path d="M29 22 L29 14 Q29 12 31 12 L31 22" />
      {/* thumb */}
      <path d="M9 26 L5 23 Q4 20 6 18 Q8 16 10 18" />
    </svg>
  ),

  boots: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* leg shaft */}
      <path d="M13 5 L13 25 Q12 28 10 30" />
      <path d="M25 5 L25 22" />
      <path d="M13 5 L25 5" />
      {/* ankle + foot */}
      <path d="M10 30 L8 34 L30 34 L32 30 Q28 26 25 26 L25 22 Q20 20 16 22 L16 28 Q13 29 10 30" />
      {/* toe cap */}
      <path d="M8 34 Q10 37 18 37 Q28 37 30 34" />
    </svg>
  ),

  amulet: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* chain arc */}
      <path d="M12 8 Q20 4 28 8" />
      {/* chain drop */}
      <path d="M12 8 Q8 16 12 22" />
      <path d="M28 8 Q32 16 28 22" />
      {/* pendant gem (diamond) */}
      <path d="M20 22 L26 28 L20 36 L14 28 Z" />
      {/* gem facet */}
      <path d="M14 28 L26 28" strokeOpacity="0.5" />
      <path d="M20 22 L20 36" strokeOpacity="0.5" />
    </svg>
  ),

  ring_1: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* band */}
      <ellipse cx="20" cy="22" rx="11" ry="6" />
      <path d="M9 22 L9 28 Q9 34 20 34 Q31 34 31 28 L31 22" />
      {/* gem setting */}
      <path d="M15 16 Q15 10 20 9 Q25 10 25 16 L25 18 L15 18 Z" />
      {/* gem */}
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
      {/* blade */}
      <path d="M20 4 L22 26" />
      <path d="M20 4 L18 26" />
      <path d="M20 4 L20 26" />
      {/* tip */}
      <path d="M18 6 L20 4 L22 6" />
      {/* crossguard */}
      <path d="M12 26 L28 26" strokeWidth="2" />
      {/* grip */}
      <path d="M20 26 L20 34" strokeWidth="1.8" />
      {/* pommel */}
      <circle cx="20" cy="36" r="2.5" />
    </svg>
  ),

  off_hand: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* shield outline */}
      <path d="M8 8 Q8 5 20 4 Q32 5 32 8 L32 22 Q32 34 20 38 Q8 34 8 22 Z" />
      {/* vertical divider */}
      <path d="M20 4 L20 38" strokeOpacity="0.35" />
      {/* horizontal divider */}
      <path d="M8 16 L32 16" strokeOpacity="0.35" />
      {/* boss (center button) */}
      <circle cx="20" cy="22" r="3" strokeOpacity="0.6" />
    </svg>
  ),

  ranged: (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {/* bow limb */}
      <path d="M8 5 Q4 20 8 35" strokeWidth="2" />
      {/* bowstring */}
      <path d="M8 5 L8 35" strokeDasharray="3 2" strokeOpacity="0.5" />
      {/* arrow shaft */}
      <path d="M8 20 L33 20" />
      {/* arrowhead */}
      <path d="M29 16 L33 20 L29 24" />
      {/* fletchings */}
      <path d="M10 20 L8 16 M10 20 L8 24" strokeOpacity="0.7" />
    </svg>
  ),
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

      <ellipse cx="30" cy="88" rx="28" ry="55" fill="url(#torsoGlow)" />

      {/* Head */}
      <ellipse cx="30" cy="13" rx="9.5" ry="11" fill="#1e1e1e" stroke="#4a4130" strokeWidth="1.2" filter="url(#softShadow)" />
      <ellipse cx="30" cy="13" rx="6" ry="7.5" fill="#181818" stroke="#3a3228" strokeWidth="0.6" />

      {/* Neck */}
      <rect x="26" y="23" width="8" height="6" rx="1" fill="#1a1a1a" stroke="#3a3228" strokeWidth="0.8" />

      {/* Pauldrons */}
      <path d="M10 31 Q15 28 30 27 Q45 28 50 31 L48 39 Q38 37 30 38 Q22 37 12 39 Z"
        fill="#222" stroke="#4a4130" strokeWidth="1.2" />

      {/* Torso */}
      <path d="M12 39 L16 84 Q30 88 44 84 L48 39 Q38 37 30 38 Q22 37 12 39 Z"
        fill="#1c1c1c" stroke="#3a3228" strokeWidth="1.2" />

      <path d="M24 42 L22 82" stroke="#78350f" strokeWidth="0.4" opacity="0.5" />
      <path d="M36 42 L38 82" stroke="#78350f" strokeWidth="0.4" opacity="0.5" />
      <path d="M18 58 L42 58" stroke="#78350f" strokeWidth="0.4" opacity="0.3" />

      {/* Belt */}
      <rect x="16" y="82" width="28" height="7" rx="1" fill="#161616" stroke="#555" strokeWidth="1" />
      <circle cx="30" cy="85.5" r="2" fill="#1e1e1e" stroke="#666" strokeWidth="0.8" />

      {/* Left arm */}
      <path d="M10 31 L4 35 L2 66 L8 67 L11 41 Q10 35 10 31 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
      <rect x="1" y="64" width="8" height="10" rx="2" fill="#161616" stroke="#333" strokeWidth="0.8" />

      {/* Right arm */}
      <path d="M50 31 L56 35 L58 66 L52 67 L49 41 Q50 35 50 31 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
      <rect x="51" y="64" width="8" height="10" rx="2" fill="#161616" stroke="#333" strokeWidth="0.8" />

      {/* Hips */}
      <path d="M16 89 Q30 93 44 89 L46 98 Q30 101 14 98 Z" fill="#181818" stroke="#333" strokeWidth="0.8" />

      {/* Left leg */}
      <rect x="14" y="97" width="14" height="54" rx="2" fill="#161616" stroke="#2e2e2e" strokeWidth="0.8" />
      <ellipse cx="21" cy="136" rx="7" ry="4" fill="#1e1e1e" stroke="#3a3228" strokeWidth="0.8" />

      {/* Right leg */}
      <rect x="32" y="97" width="14" height="54" rx="2" fill="#161616" stroke="#2e2e2e" strokeWidth="0.8" />
      <ellipse cx="39" cy="136" rx="7" ry="4" fill="#1e1e1e" stroke="#3a3228" strokeWidth="0.8" />

      {/* Left foot */}
      <path d="M12 151 L33 151 L32 158 Q22 162 10 158 Z" fill="#141414" stroke="#2e2e2e" strokeWidth="0.8" />

      {/* Right foot */}
      <path d="M29 151 L48 151 L50 158 Q40 162 28 158 Z" fill="#141414" stroke="#2e2e2e" strokeWidth="0.8" />

      <path d="M10 31 Q15 28 30 27 Q45 28 50 31" fill="none" stroke="#78350f" strokeWidth="0.6" opacity="0.6" />
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
      style={{ width: size, height: size }}
      className={[
        'group relative flex items-center justify-center rounded-sm transition-all overflow-visible shrink-0',
        isEmpty
          ? 'bg-[#0d0d0d] border border-[#252525] hover:border-[#3a3228] hover:bg-[#111]'
          : isSelected
            ? 'bg-[#1e1a10] border-2 border-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.5)]'
            : 'bg-[#181510] border border-amber-900/50 hover:border-amber-700/70 shadow-[inset_0_0_8px_rgba(217,119,6,0.08)]',
      ].join(' ')}
    >
      {/* Content */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-sm">
        {isEmpty ? (
          <div className="w-[60%] h-[60%] text-[#2a2520] opacity-60 flex items-center justify-center">
            {SLOT_SVG[slotKey]}
          </div>
        ) : iconUrl ? (
          <img src={iconUrl} alt={item.name} className="w-full h-full object-contain p-0.5 opacity-90" />
        ) : (
          <div className="w-[60%] h-[60%] text-amber-800/50 flex items-center justify-center">
            {SLOT_SVG[slotKey]}
          </div>
        )}
      </div>

      {/* Tooltip — appears above the slot, visible on group hover */}
      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50
                      pointer-events-none select-none whitespace-nowrap
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="bg-[#0a0a0a] border border-amber-900/40 px-2 py-0.5 rounded-sm shadow-lg">
          <span className="text-[9px] text-amber-400/90 font-serif tracking-wide">
            {item?.name ?? SLOT_LABELS[slotKey]}
          </span>
        </div>
        {/* Arrow */}
        <div className="w-1.5 h-1.5 bg-[#0a0a0a] border-b border-r border-amber-900/40 rotate-45 mx-auto -mt-1" />
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

        {/* Mano principal + Escudo */}
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
          <div className="relative flex items-center justify-center" style={{ width: 52, height: 58 }}>
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

        {/* Ranged + empty slot */}
        <div className="flex gap-1.5">
          <Slot slotKey="ranged"
            item={bySlot('ranged')}
            isSelected={bySlot('ranged')?.id === selectedItemId}
            onClick={() => handleSlot('ranged')}
            size={40}
          />
          <div className="w-10 h-10 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] opacity-20" />
        </div>
      </div>
    </div>
  )
}
