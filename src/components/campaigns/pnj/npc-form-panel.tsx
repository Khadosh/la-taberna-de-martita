import { CLASS_ICONS } from '../../../lib/class-meta'
import { Frame, Block, Field, inputClass } from './pnj-primitives'
import { type NpcForm, type Stats, STAT_KEYS, STAT_LABELS, ROLES, abilityMod, formatMod, rollAllStats } from './pnj-types'

interface NpcFormPanelProps {
  form: NpcForm
  patchForm: <K extends keyof NpcForm>(k: K, v: NpcForm[K]) => void
  patchStat: (k: keyof Stats, v: number) => void
  editingId: string | null
  resetForm: () => void
  submit: () => void
  saving: boolean
  races?: { results: { index: string; name: string }[] }
  classes?: { results: { index: string; name: string }[] }
}

export function NpcFormPanel({ form, patchForm, patchStat, editingId, resetForm, submit, saving, races, classes }: NpcFormPanelProps) {
  return (
    <Frame>
      <div className="p-5 space-y-5">

        {/* Identidad */}
        <Block label="Identidad">
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
            <Field label="Nombre *" required>
              <input
                value={form.name}
                onChange={e => patchForm('name', e.target.value)}
                placeholder="Lord Vekrath"
                className={inputClass}
              />
            </Field>
            <Field label="Raza">
              <select value={form.race} onChange={e => patchForm('race', e.target.value)} className={inputClass}>
                <option value="">— ninguna —</option>
                {races?.results.map(r => <option key={r.index} value={r.index}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Nivel">
              <input
                type="number" min={1} max={20}
                value={form.level}
                onChange={e => patchForm('level', Math.max(1, parseInt(e.target.value) || 1))}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3 mt-3">
            <Field label="Clase">
              <select value={form.class} onChange={e => patchForm('class', e.target.value)} className={inputClass}>
                <option value="">— ninguna —</option>
                {classes?.results.map(c => (
                  <option key={c.index} value={c.index}>
                    {CLASS_ICONS[c.index] ?? ''} {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Rol">
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => patchForm('role', r.value)}
                    className={`flex-1 px-3 py-2 text-sm font-serif border transition-colors ${
                      form.role === r.value ? r.color : 'bg-amber-50 border-stone-300/50 text-stone-500 hover:border-stone-500'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Block>

        {/* Stats */}
        <Block
          label="Características"
          right={
            <button
              type="button"
              onClick={() => patchForm('stats', rollAllStats())}
              className="text-xs px-3 py-1 bg-stone-900 text-amber-100 hover:bg-stone-800 transition-colors font-serif"
            >
              🎲 Tirar (4d6dl)
            </button>
          }
        >
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STAT_KEYS.map(k => (
              <div key={k} className="flex flex-col items-center bg-amber-100/60 border border-stone-400/40 py-2 px-1">
                <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase">{k}</p>
                <input
                  type="number" min={1} max={30}
                  value={form.stats[k]}
                  onChange={e => patchStat(k, Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-12 text-center bg-transparent text-lg font-bold text-stone-900 focus:outline-none focus:bg-amber-200/60"
                />
                <p className="text-[10px] font-mono text-stone-700">{formatMod(abilityMod(form.stats[k]))}</p>
                <p className="text-[8px] italic text-stone-500 mt-0.5 leading-none">{STAT_LABELS[k]}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* Combate */}
        <Block label="Combate">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="HP máx.">
              <input value={form.max_hp} onChange={e => patchForm('max_hp', e.target.value)}
                placeholder="—" inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="CA">
              <input value={form.armor_class} onChange={e => patchForm('armor_class', e.target.value)}
                placeholder="—" inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="Bono ataque">
              <input value={form.attack_bonus} onChange={e => patchForm('attack_bonus', e.target.value)}
                placeholder="—" inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="Daño">
              <input value={form.damage} onChange={e => patchForm('damage', e.target.value)}
                placeholder="1d8+2" className={inputClass} />
            </Field>
          </div>
        </Block>

        {/* Notas */}
        <Block label="Notas">
          <div className="space-y-3">
            <Field label="Trasfondo (visible al party si no está oculto)">
              <textarea value={form.backstory} onChange={e => patchForm('backstory', e.target.value)}
                rows={2} placeholder="Capitán de la guardia del duque..."
                className={`${inputClass} resize-none`} />
            </Field>
            <Field label="Notas privadas del DM">
              <textarea value={form.notes} onChange={e => patchForm('notes', e.target.value)}
                rows={2} placeholder="Recordar que tiene una hermana en la ciudad..."
                className={`${inputClass} resize-none`} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_hidden}
                onChange={e => patchForm('is_hidden', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-serif text-stone-700">Oculto al party (villano sorpresa)</span>
            </label>
          </div>
        </Block>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-400/30">
          {editingId && (
            <button type="button" onClick={resetForm}
              className="px-4 py-2 text-sm font-serif text-stone-600 hover:text-stone-900 transition-colors">
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!form.name.trim() || saving}
            className="px-5 py-2 text-sm font-serif bg-stone-900 text-amber-100 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando…' : editingId ? 'Actualizar PNJ' : 'Crear PNJ'}
          </button>
        </div>

      </div>
    </Frame>
  )
}
