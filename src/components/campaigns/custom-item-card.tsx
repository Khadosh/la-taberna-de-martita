import {
  type CustomItem,
  RARITY_LABELS, RARITY_COLOR, RARITY_BORDER,
  ITEM_TYPE_LABELS, DAMAGE_TYPE_LABELS, STAT_LABELS,
  type StatKey,
} from '../../lib/custom-items'

type Props = {
  item: CustomItem
  onEdit: (item: CustomItem) => void
  onDelete: (id: string) => void
  onAssign: (item: CustomItem) => void
  confirmDeleteId: string | null
  setConfirmDeleteId: (id: string | null) => void
}

export function CustomItemCard({ item, onEdit, onDelete, onAssign, confirmDeleteId, setConfirmDeleteId }: Props) {
  const p = item.properties
  const statBonuses = p.stat_bonuses
    ? (Object.entries(p.stat_bonuses) as [StatKey, number][]).filter(([, v]) => v !== 0)
    : []

  return (
    <div className={`bg-stone-900/60 border ${RARITY_BORDER[item.rarity]} rounded-md overflow-hidden flex flex-col`}>
      {/* imagen */}
      <div className="relative bg-stone-950 aspect-square w-full">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-700 text-4xl select-none">
            {item.item_type === 'weapon' ? '⚔' : item.item_type === 'armor' ? '🛡' : '✦'}
          </div>
        )}
        {p.is_cursed && (
          <span className="absolute top-1 right-1 bg-red-900/80 text-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
            Maldito
          </span>
        )}
      </div>

      {/* info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="text-stone-100 font-semibold text-sm leading-tight">{item.name}</p>
          <span className={`text-[10px] font-bold uppercase shrink-0 ${RARITY_COLOR[item.rarity]}`}>
            {RARITY_LABELS[item.rarity]}
          </span>
        </div>
        <p className="text-stone-500 text-[11px]">{ITEM_TYPE_LABELS[item.item_type]}</p>

        {/* bonuses */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {!!p.attack_bonus && (
            <Tag>+{p.attack_bonus} ataque</Tag>
          )}
          {!!p.ac_bonus && (
            <Tag>+{p.ac_bonus} CA</Tag>
          )}
          {!!p.speed_bonus && (
            <Tag>+{p.speed_bonus} ft</Tag>
          )}
          {!!p.max_hp_bonus && (
            <Tag>+{p.max_hp_bonus} HP</Tag>
          )}
          {!!p.hp_regen && (
            <Tag>+{p.hp_regen} regen</Tag>
          )}
          {statBonuses.map(([k, v]) => (
            <Tag key={k}>{STAT_LABELS[k]} {v > 0 ? `+${v}` : v}</Tag>
          ))}
          {p.damage_resistances?.map(dt => (
            <Tag key={dt}>Res. {DAMAGE_TYPE_LABELS[dt]}</Tag>
          ))}
          {p.spells?.map(s => (
            <Tag key={s.name}>{s.name} ×{s.charges}</Tag>
          ))}
        </div>

        {item.description && (
          <p className="text-stone-400 text-[11px] italic line-clamp-2 mt-1">{item.description}</p>
        )}

        {/* acciones */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onAssign(item)}
            className="flex-1 text-xs bg-tavern-gold/20 hover:bg-tavern-gold/30 text-tavern-gold border border-tavern-gold/30 rounded px-2 py-1 transition-colors"
          >
            Dar a personaje
          </button>
          <button
            onClick={() => onEdit(item)}
            className="text-xs text-stone-400 hover:text-stone-200 px-2 py-1 transition-colors"
          >
            Editar
          </button>
          {confirmDeleteId === item.id ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(item.id)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-xs text-stone-500 hover:text-stone-300 px-2 py-1"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(item.id)}
              className="text-xs text-stone-600 hover:text-red-400 px-2 py-1 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] bg-stone-800 text-stone-300 border border-stone-700/50 rounded px-1.5 py-0.5">
      {children}
    </span>
  )
}
