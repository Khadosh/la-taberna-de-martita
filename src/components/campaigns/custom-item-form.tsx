import {
  type DamageType, type ItemRarity, type ItemType,
  DAMAGE_TYPES, DAMAGE_TYPE_LABELS, ITEM_TYPE_LABELS,
  RARITY_BONUS, RARITY_LABELS, STAT_LABELS,
} from '../../lib/custom-items'
import {
  type ItemFormState,
  CHECKBOX_ROW, INPUT_CLS, LABEL_CLS, STAT_KEYS,
} from './custom-item-form-state'
import { CustomItemImagePanel } from './custom-item-image-panel'
import { CustomItemSpellsEditor } from './custom-item-spells-editor'

type Props = {
  form: ItemFormState
  setForm: React.Dispatch<React.SetStateAction<ItemFormState>>
  saving: boolean
  editingId: string | null
  onSubmit: () => void
  onCancel: () => void
}

export function CustomItemForm({ form, setForm, saving, editingId, onSubmit, onCancel }: Props) {
  const patch = <K extends keyof ItemFormState>(k: K, v: ItemFormState[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const onRarityChange = (rarity: ItemRarity) => {
    const bonus = RARITY_BONUS[rarity]
    setForm(f => ({
      ...f,
      rarity,
      attack_bonus: f.item_type === 'weapon' ? String(bonus) : f.attack_bonus,
      ac_bonus: f.item_type === 'armor' ? String(bonus) : f.ac_bonus,
    }))
  }

  const onTypeChange = (item_type: ItemType) => {
    const bonus = RARITY_BONUS[form.rarity]
    setForm(f => ({
      ...f,
      item_type,
      attack_bonus: item_type === 'weapon' ? String(bonus) : '0',
      ac_bonus: item_type === 'armor' ? String(bonus) : '0',
    }))
  }

  const toggleResistance = (dt: DamageType) => {
    patch('damage_resistances',
      form.damage_resistances.includes(dt)
        ? form.damage_resistances.filter(r => r !== dt)
        : [...form.damage_resistances, dt]
    )
  }

  return (
    <div className="grid grid-cols-[180px_1fr] gap-6 items-start">
      <CustomItemImagePanel
        imageUrl={form.image_url}
        itemType={form.item_type}
        onChange={url => patch('image_url', url)}
      />

      {/* ── RIGHT: campos ── */}
      <div className="flex flex-col gap-5">
        {/* nombre */}
        <div>
          <input
            value={form.name}
            onChange={e => patch('name', e.target.value)}
            placeholder="Nombre del objeto"
            className="bg-transparent border-b border-stone-300 text-stone-800 text-xl font-semibold font-serif w-full pb-1 focus:outline-none focus:border-amber-700/60 placeholder-stone-400"
          />
        </div>

        {/* tipo + rareza */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className={LABEL_CLS}>Tipo</label>
            <select
              value={form.item_type}
              onChange={e => onTypeChange(e.target.value as ItemType)}
              className={INPUT_CLS}
            >
              {(Object.entries(ITEM_TYPE_LABELS) as [ItemType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={LABEL_CLS}>Rareza</label>
            <select
              value={form.rarity}
              onChange={e => onRarityChange(e.target.value as ItemRarity)}
              className={INPUT_CLS}
            >
              {(Object.entries(RARITY_LABELS) as [ItemRarity, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* descripción */}
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLS}>Descripción</label>
          <textarea
            value={form.description}
            onChange={e => patch('description', e.target.value)}
            placeholder="Descripción del objeto, historia, apariencia..."
            rows={3}
            className={`${INPUT_CLS} resize-none`}
          />
        </div>

        {/* bonuses de arma/armadura */}
        {(form.item_type === 'weapon' || form.item_type === 'armor') && (
          <div className="flex flex-col gap-2 border-t border-stone-200 pt-4">
            <label className={LABEL_CLS}>
              {form.item_type === 'weapon' ? 'Bonus de ataque y daño' : 'Bonus de CA'}
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => form.item_type === 'weapon'
                    ? patch('attack_bonus', String(n))
                    : patch('ac_bonus', String(n))
                  }
                  className={`w-10 h-10 rounded-md border text-sm font-bold transition-colors ${
                    (form.item_type === 'weapon' ? form.attack_bonus : form.ac_bonus) === String(n)
                      ? 'bg-amber-800/20 border-amber-700/60 text-amber-900'
                      : 'border-stone-300 text-stone-500 hover:border-stone-400'
                  }`}
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* stat bonuses */}
        <div className="flex flex-col gap-2 border-t border-stone-200 pt-4">
          <label className={LABEL_CLS}>Modificadores de estadísticas</label>
          <div className="grid grid-cols-6 gap-2">
            {STAT_KEYS.map(k => (
              <div key={k} className="flex flex-col items-center gap-1">
                <span className="text-stone-500 text-[10px] font-bold uppercase">{STAT_LABELS[k]}</span>
                <input
                  type="number"
                  value={form.stat_bonuses[k] ?? '0'}
                  onChange={e => patch('stat_bonuses', { ...form.stat_bonuses, [k]: e.target.value })}
                  className="w-full text-center bg-white border border-stone-300 text-stone-800 text-sm rounded px-1 py-1.5 focus:outline-none focus:border-amber-600/60"
                />
              </div>
            ))}
          </div>
        </div>

        {/* propiedades adicionales */}
        <div className="flex flex-col gap-3 border-t border-stone-200 pt-4">
          <label className={LABEL_CLS}>Propiedades</label>

          {/* resistencias */}
          <div className="flex flex-col gap-2">
            <label className={CHECKBOX_ROW}>
              <input type="checkbox" checked={form.has_resistances}
                onChange={e => patch('has_resistances', e.target.checked)}
                className="accent-amber-700" />
              <span className="text-stone-700 text-sm">Resistencia al daño</span>
            </label>
            {form.has_resistances && (
              <div className="flex flex-wrap gap-1.5 pl-5">
                {DAMAGE_TYPES.map(dt => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => toggleResistance(dt)}
                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                      form.damage_resistances.includes(dt)
                        ? 'bg-amber-800/20 border-amber-700/50 text-amber-900 font-medium'
                        : 'border-stone-300 text-stone-500 hover:border-stone-400'
                    }`}
                  >
                    {DAMAGE_TYPE_LABELS[dt]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* hechizos */}
          <div className="flex flex-col gap-2">
            <label className={CHECKBOX_ROW}>
              <input type="checkbox" checked={form.has_spells}
                onChange={e => patch('has_spells', e.target.checked)}
                className="accent-amber-700" />
              <span className="text-stone-700 text-sm">Lanzar hechizo</span>
            </label>
            {form.has_spells && (
              <CustomItemSpellsEditor
                spells={form.spells}
                onChange={spells => patch('spells', spells)}
              />
            )}
          </div>

          {/* velocidad */}
          <div className="flex items-center gap-3">
            <label className={CHECKBOX_ROW}>
              <input type="checkbox" checked={form.has_speed}
                onChange={e => patch('has_speed', e.target.checked)}
                className="accent-amber-700" />
              <span className="text-stone-700 text-sm">Bonus de velocidad</span>
            </label>
            {form.has_speed && (
              <div className="flex items-center gap-1.5">
                <input type="number" value={form.speed_bonus}
                  onChange={e => patch('speed_bonus', e.target.value)}
                  className="w-16 bg-white border border-stone-300 text-stone-800 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-amber-600/60" />
                <span className="text-stone-500 text-sm">ft</span>
              </div>
            )}
          </div>

          {/* regen HP */}
          <div className="flex items-center gap-3">
            <label className={CHECKBOX_ROW}>
              <input type="checkbox" checked={form.has_hp_regen}
                onChange={e => patch('has_hp_regen', e.target.checked)}
                className="accent-amber-700" />
              <span className="text-stone-700 text-sm">Regeneración de HP</span>
            </label>
            {form.has_hp_regen && (
              <div className="flex items-center gap-1.5">
                <input type="number" min={1} value={form.hp_regen}
                  onChange={e => patch('hp_regen', e.target.value)}
                  className="w-16 bg-white border border-stone-300 text-stone-800 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-amber-600/60" />
                <span className="text-stone-500 text-sm">HP/turno</span>
              </div>
            )}
          </div>

          {/* HP máximo */}
          <div className="flex items-center gap-3">
            <label className={CHECKBOX_ROW}>
              <input type="checkbox" checked={form.has_max_hp}
                onChange={e => patch('has_max_hp', e.target.checked)}
                className="accent-amber-700" />
              <span className="text-stone-700 text-sm">Aumento de HP máximo</span>
            </label>
            {form.has_max_hp && (
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 text-sm">+</span>
                <input type="number" min={1} value={form.max_hp_bonus}
                  onChange={e => patch('max_hp_bonus', e.target.value)}
                  className="w-16 bg-white border border-stone-300 text-stone-800 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-amber-600/60" />
                <span className="text-stone-500 text-sm">HP</span>
              </div>
            )}
          </div>

          {/* maldición */}
          <div className="flex flex-col gap-2">
            <label className={CHECKBOX_ROW}>
              <input type="checkbox" checked={form.is_cursed}
                onChange={e => patch('is_cursed', e.target.checked)}
                className="accent-red-600" />
              <span className="text-red-700 text-sm font-medium">Objeto maldito</span>
            </label>
            {form.is_cursed && (
              <textarea
                value={form.curse_description}
                onChange={e => patch('curse_description', e.target.value)}
                placeholder="Descripción del efecto de la maldición (ej: La mano te agarra y no te suelta. Requiere Remove Curse para desequipar.)"
                rows={2}
                className="pl-5 bg-white border border-red-300 text-stone-800 text-sm rounded px-2.5 py-1.5 focus:outline-none focus:border-red-400 resize-none placeholder-stone-400 w-full"
              />
            )}
          </div>
        </div>

        {/* peso + acciones */}
        <div className="flex items-center gap-4 pt-2 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <label className={LABEL_CLS}>Peso</label>
            <input
              type="number" min={0} step={0.1}
              value={form.weight_lbs}
              onChange={e => patch('weight_lbs', e.target.value)}
              className="w-20 bg-white border border-stone-300 text-stone-800 text-sm rounded px-2 py-1.5 focus:outline-none focus:border-amber-600/60"
            />
            <span className="text-stone-500 text-sm">lbs</span>
          </div>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onCancel}
              className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 transition-colors">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving || !form.name.trim()}
              className="text-sm bg-amber-800 hover:bg-amber-700 text-amber-50 rounded px-4 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar objeto' : 'Crear objeto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
