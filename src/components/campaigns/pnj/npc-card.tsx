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
  const sheet = (npc.sheet_json as { spells?: string[]; weapons?: { id: string; name: string; damage: string }[]; equipment_notes?: string } | null) ?? {}

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
          {icon.startsWith('/') ? (
            <img
              src={icon}
              className="w-8 h-8 rounded-full border border-stone-300 bg-stone-950 object-cover object-center shrink-0"
              alt=""
            />
          ) : (
            <span className="text-2xl shrink-0">{icon}</span>
          )}
        </div>

        {(npc.max_hp != null || npc.armor_class != null) && (
          <div className="flex items-center gap-3 text-sm font-mono text-stone-800">
            {npc.max_hp != null && <span>❤ {npc.current_hp ?? npc.max_hp}/{npc.max_hp}</span>}
            {npc.armor_class != null && <span>🛡 {npc.armor_class}</span>}
            {npc.attack_bonus != null && <span>⚔ {formatMod(npc.attack_bonus)}</span>}
            {npc.damage && <span className="text-stone-650 font-bold">{npc.damage}</span>}
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

        {sheet.weapons && sheet.weapons.length > 0 && (
          <div className="text-xs text-stone-850 font-serif border-t border-stone-300/30 pt-1.5 space-y-0.5">
            <span className="font-semibold text-stone-900 block text-[10px] uppercase tracking-wider">Ataques / Armas:</span>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {sheet.weapons.map((w, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 text-[10px] text-stone-800 rounded font-mono">
                  ⚔️ {w.name} ({w.damage})
                </span>
              ))}
            </div>
          </div>
        )}

        {sheet.spells && sheet.spells.length > 0 && (
          <div className="text-xs text-stone-850 font-serif space-y-0.5">
            <span className="font-semibold text-stone-900 block text-[10px] uppercase tracking-wider">Conjuros:</span>
            <div className="flex flex-wrap gap-1">
              {sheet.spells.map((s, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-amber-50 border border-amber-800/30 text-[10px] text-amber-900 rounded capitalize">
                  ✨ {s.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {sheet.equipment_notes && (
          <div className="text-xs text-stone-700 font-serif border-t border-stone-300/30 pt-1.5">
            <span className="font-semibold text-stone-900 text-[10px] uppercase tracking-wider block">Equipamiento:</span>
            <p className="text-[11px] text-stone-600 whitespace-pre-line leading-relaxed">{sheet.equipment_notes}</p>
          </div>
        )}

        {npc.backstory && (
          <div className="text-xs text-stone-700 font-serif border-t border-stone-300/30 pt-1.5">
            <span className="font-semibold text-stone-900 text-[10px] uppercase tracking-wider block">Trasfondo:</span>
            <p className="text-[11px] text-stone-600 leading-relaxed">{npc.backstory}</p>
          </div>
        )}

        {npc.notes && (
          <div className="text-xs text-stone-700 font-serif border-t border-stone-300/30 pt-1.5 bg-yellow-50/20 p-1.5 border border-yellow-200/40 rounded">
            <span className="font-semibold text-stone-900 text-[10px] uppercase tracking-wider block">Notas DM (Privado):</span>
            <p className="text-[11px] text-stone-600 leading-relaxed">{npc.notes}</p>
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
