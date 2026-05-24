import { CLASS_ICONS } from '../../../lib/class-meta'
import type { Tables } from '../../../lib/database.types'
import { Frame } from './pnj-primitives'
import { type Stats, STAT_KEYS, ROLES, abilityMod, formatMod } from './pnj-types'

type Npc = Tables<'npcs'>

interface NpcCardProps {
  npc: Npc
  onEdit: () => void
  onDelete: () => void
  confirmingDelete: boolean
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

export function NpcCard({ npc, onEdit, onDelete, confirmingDelete, onCancelDelete, onConfirmDelete }: NpcCardProps) {
  const stats = npc.stats as Stats | null
  const role = ROLES.find(r => r.value === npc.role)
  const icon = npc.class ? CLASS_ICONS[npc.class] : '👤'

  return (
    <Frame>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {role && (
              <span className={`inline-block text-[10px] font-serif tracking-wide px-2 py-0.5 border ${role.color} mb-1`}>
                {role.label}
              </span>
            )}
            {npc.is_hidden && (
              <span className="ml-1 inline-block text-[10px] font-serif tracking-wide px-2 py-0.5 border border-stone-700 text-stone-700 bg-stone-200 mb-1">
                oculto
              </span>
            )}
            <h3 className="text-lg font-display font-bold text-stone-900 leading-tight truncate">{npc.name}</h3>
            {(npc.race || npc.class || npc.level) && (
              <p className="text-xs italic text-stone-600 capitalize">
                {[npc.race, npc.class, `Nv. ${npc.level}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className="text-2xl shrink-0">{icon}</span>
        </div>

        {(npc.max_hp != null || npc.armor_class != null) && (
          <div className="flex items-center gap-3 text-sm font-mono text-stone-800">
            {npc.max_hp != null && <span>❤ {npc.current_hp ?? npc.max_hp}/{npc.max_hp}</span>}
            {npc.armor_class != null && <span>🛡 {npc.armor_class}</span>}
            {npc.attack_bonus != null && <span>⚔ {formatMod(npc.attack_bonus)}</span>}
            {npc.damage && <span className="text-stone-600">{npc.damage}</span>}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-6 gap-1">
            {STAT_KEYS.map(k => (
              <div key={k} className="text-center bg-amber-100/40 border border-stone-400/30 py-0.5">
                <p className="text-[8px] font-display tracking-wider text-stone-700 uppercase">{k}</p>
                <p className="text-[11px] font-mono text-stone-900">{formatMod(abilityMod(stats[k]))}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-400/30">
          {confirmingDelete ? (
            <>
              <span className="text-xs italic text-stone-700 mr-auto">¿Eliminar?</span>
              <button onClick={onCancelDelete} className="text-xs text-stone-600 hover:text-stone-900 font-serif">Cancelar</button>
              <button onClick={onConfirmDelete} className="text-xs px-2.5 py-1 bg-red-900 text-red-100 hover:bg-red-800 font-serif transition-colors">
                Eliminar
              </button>
            </>
          ) : (
            <>
              <button onClick={onDelete} className="text-xs text-stone-500 hover:text-red-800 font-serif">eliminar</button>
              <button onClick={onEdit} className="text-xs px-3 py-1 bg-stone-900 text-amber-100 hover:bg-stone-800 font-serif transition-colors">
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </Frame>
  )
}
