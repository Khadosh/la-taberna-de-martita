import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import {
  type CustomItem, type CustomItemProperties, type DamageType,
  type ItemRarity, type ItemType, type SpellCharge, type StatKey,
  DAMAGE_TYPES, DAMAGE_TYPE_LABELS, ITEM_TYPE_LABELS,
  RARITY_BONUS, RARITY_LABELS, STAT_LABELS, RECHARGE_LABELS,
} from '../../lib/custom-items'

export type ItemFormState = {
  name: string
  description: string
  image_url: string
  rarity: ItemRarity
  item_type: ItemType
  weight_lbs: string
  attack_bonus: string
  ac_bonus: string
  stat_bonuses: Partial<Record<StatKey, string>>
  damage_resistances: DamageType[]
  speed_bonus: string
  hp_regen: string
  max_hp_bonus: string
  is_cursed: boolean
  curse_description: string
  spells: SpellCharge[]
  // toggles
  has_resistances: boolean
  has_spells: boolean
  has_speed: boolean
  has_hp_regen: boolean
  has_max_hp: boolean
}

export const EMPTY_FORM = (): ItemFormState => ({
  name: '', description: '', image_url: '',
  rarity: 'common', item_type: 'misc', weight_lbs: '0',
  attack_bonus: '0', ac_bonus: '0',
  stat_bonuses: { str: '0', dex: '0', con: '0', int: '0', wis: '0', cha: '0' },
  damage_resistances: [], speed_bonus: '10', hp_regen: '1', max_hp_bonus: '10',
  is_cursed: false, curse_description: '', spells: [],
  has_resistances: false, has_spells: false, has_speed: false,
  has_hp_regen: false, has_max_hp: false,
})

export function formToProperties(f: ItemFormState): CustomItemProperties {
  const props: CustomItemProperties = {}
  const attackBonus = parseInt(f.attack_bonus) || 0
  const acBonus = parseInt(f.ac_bonus) || 0
  if (attackBonus !== 0) props.attack_bonus = attackBonus
  if (acBonus !== 0) props.ac_bonus = acBonus

  const statBonuses: Partial<Record<StatKey, number>> = {}
  for (const k of Object.keys(f.stat_bonuses) as StatKey[]) {
    const v = parseInt(f.stat_bonuses[k] ?? '0') || 0
    if (v !== 0) statBonuses[k] = v
  }
  if (Object.keys(statBonuses).length > 0) props.stat_bonuses = statBonuses

  if (f.has_resistances && f.damage_resistances.length > 0)
    props.damage_resistances = f.damage_resistances
  if (f.has_spells && f.spells.length > 0) props.spells = f.spells
  if (f.has_speed) props.speed_bonus = parseInt(f.speed_bonus) || 10
  if (f.has_hp_regen) props.hp_regen = parseInt(f.hp_regen) || 1
  if (f.has_max_hp) props.max_hp_bonus = parseInt(f.max_hp_bonus) || 10
  if (f.is_cursed) {
    props.is_cursed = true
    if (f.curse_description) props.curse_description = f.curse_description
  }
  return props
}

export function itemToForm(item: CustomItem): ItemFormState {
  const p = item.properties
  return {
    name: item.name,
    description: item.description ?? '',
    image_url: item.image_url ?? '',
    rarity: item.rarity,
    item_type: item.item_type,
    weight_lbs: String(item.weight_lbs),
    attack_bonus: String(p.attack_bonus ?? 0),
    ac_bonus: String(p.ac_bonus ?? 0),
    stat_bonuses: {
      str: String(p.stat_bonuses?.str ?? 0),
      dex: String(p.stat_bonuses?.dex ?? 0),
      con: String(p.stat_bonuses?.con ?? 0),
      int: String(p.stat_bonuses?.int ?? 0),
      wis: String(p.stat_bonuses?.wis ?? 0),
      cha: String(p.stat_bonuses?.cha ?? 0),
    },
    damage_resistances: p.damage_resistances ?? [],
    speed_bonus: String(p.speed_bonus ?? 10),
    hp_regen: String(p.hp_regen ?? 1),
    max_hp_bonus: String(p.max_hp_bonus ?? 10),
    is_cursed: p.is_cursed ?? false,
    curse_description: p.curse_description ?? '',
    spells: p.spells ?? [],
    has_resistances: (p.damage_resistances?.length ?? 0) > 0,
    has_spells: (p.spells?.length ?? 0) > 0,
    has_speed: !!p.speed_bonus,
    has_hp_regen: !!p.hp_regen,
    has_max_hp: !!p.max_hp_bonus,
  }
}

type Props = {
  form: ItemFormState
  setForm: React.Dispatch<React.SetStateAction<ItemFormState>>
  saving: boolean
  editingId: string | null
  onSubmit: () => void
  onCancel: () => void
}

const STAT_KEYS: StatKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export function CustomItemForm({ form, setForm, saving, editingId, onSubmit, onCancel }: Props) {
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [spellSearches, setSpellSearches] = useState<Record<number, string>>({})
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: allSpells } = useQuery({
    queryKey: dndKeys.allSpells,
    queryFn: dndApi.allSpells,
    staleTime: Infinity,
    enabled: form.has_spells,
  })

  const openDropdown = (i: number) =>
    setOpenDropdowns(s => new Set(s).add(i))

  const closeDropdown = (i: number) =>
    setOpenDropdowns(s => { const n = new Set(s); n.delete(i); return n })

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

  const generateImage = async () => {
    if (!imagePrompt.trim()) return
    setGeneratingImage(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-portrait', {
        body: { prompt: imagePrompt },
      })
      if (!error && data?.url) {
        try {
          const res = await fetch(data.url)
          const blob = await res.blob()
          const reader = new FileReader()
          reader.onload = () => patch('image_url', reader.result as string)
          reader.readAsDataURL(blob)
        } catch {
          patch('image_url', data.url)
        }
      }
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => patch('image_url', ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const toggleResistance = (dt: DamageType) => {
    patch('damage_resistances',
      form.damage_resistances.includes(dt)
        ? form.damage_resistances.filter(r => r !== dt)
        : [...form.damage_resistances, dt]
    )
  }

  const addSpell = () =>
    patch('spells', [...form.spells, { name: '', level: 1, charges: 1, recharge: 'dawn' }])

  const patchSpell = (i: number, key: keyof SpellCharge, val: string | number) =>
    patch('spells', form.spells.map((s, j) => j === i ? { ...s, [key]: val } : s))

  const removeSpell = (i: number) =>
    patch('spells', form.spells.filter((_, j) => j !== i))

  const inputCls = 'bg-white border border-stone-300 text-stone-800 text-sm rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-600/60 w-full'
  const labelCls = 'text-stone-500 text-xs font-semibold uppercase tracking-wide'
  const checkboxRow = 'flex items-center gap-2 cursor-pointer'

  return (
    <div className="grid grid-cols-[180px_1fr] gap-6 items-start">
      {/* ── LEFT: imagen ── */}
      <div className="flex flex-col gap-2">
        <div className="aspect-square bg-stone-200 border border-stone-300 rounded-md overflow-hidden flex items-center justify-center">
          {form.image_url ? (
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-stone-400 text-5xl select-none">
              {form.item_type === 'weapon' ? '⚔' : form.item_type === 'armor' ? '🛡' : '✦'}
            </span>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xs border border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400 rounded px-2 py-1.5 transition-colors text-center"
        >
          Subir imagen
        </button>

        <div className="flex flex-col gap-1.5 mt-1">
          <textarea
            value={imagePrompt}
            onChange={e => setImagePrompt(e.target.value)}
            placeholder="Descripción para la IA..."
            rows={3}
            className="bg-white border border-stone-300 text-stone-800 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-amber-600/60 resize-none placeholder-stone-400"
          />
          <button
            type="button"
            onClick={generateImage}
            disabled={generatingImage || !imagePrompt.trim()}
            className="text-xs bg-amber-800/15 hover:bg-amber-800/25 text-amber-900 border border-amber-800/30 rounded px-2 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generatingImage ? 'Generando...' : 'Generar con IA'}
          </button>
          {form.image_url && (
            <button
              type="button"
              onClick={() => patch('image_url', '')}
              className="text-xs text-stone-400 hover:text-red-500 transition-colors text-center"
            >
              Quitar imagen
            </button>
          )}
        </div>
      </div>

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
            <label className={labelCls}>Tipo</label>
            <select
              value={form.item_type}
              onChange={e => onTypeChange(e.target.value as ItemType)}
              className={inputCls}
            >
              {(Object.entries(ITEM_TYPE_LABELS) as [ItemType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Rareza</label>
            <select
              value={form.rarity}
              onChange={e => onRarityChange(e.target.value as ItemRarity)}
              className={inputCls}
            >
              {(Object.entries(RARITY_LABELS) as [ItemRarity, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* descripción */}
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Descripción</label>
          <textarea
            value={form.description}
            onChange={e => patch('description', e.target.value)}
            placeholder="Descripción del objeto, historia, apariencia..."
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* bonuses de arma/armadura */}
        {(form.item_type === 'weapon' || form.item_type === 'armor') && (
          <div className="flex flex-col gap-2 border-t border-stone-200 pt-4">
            <label className={labelCls}>
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
          <label className={labelCls}>Modificadores de estadísticas</label>
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
          <label className={labelCls}>Propiedades</label>

          {/* resistencias */}
          <div className="flex flex-col gap-2">
            <label className={checkboxRow}>
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
            <label className={checkboxRow}>
              <input type="checkbox" checked={form.has_spells}
                onChange={e => patch('has_spells', e.target.checked)}
                className="accent-amber-700" />
              <span className="text-stone-700 text-sm">Lanzar hechizo</span>
            </label>
            {form.has_spells && (
              <div className="flex flex-col gap-2 pl-5">
                {/* column headers */}
                {form.spells.length > 0 && (
                  <div className="grid grid-cols-[1fr_56px_56px_1fr_24px] gap-1.5 px-0.5">
                    {['Hechizo', 'Nivel', 'Cargas', 'Recarga', ''].map(h => (
                      <span key={h} className="text-stone-600 text-[10px] uppercase font-semibold">{h}</span>
                    ))}
                  </div>
                )}
                {form.spells.map((spell, i) => {
                  const search = spellSearches[i] ?? spell.name
                  const filtered = openDropdowns.has(i) && search.length >= 2
                    ? (allSpells?.results ?? [])
                        .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
                        .slice(0, 8)
                    : []
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="grid grid-cols-[1fr_56px_56px_1fr_24px] gap-1.5 items-center">
                        {/* nombre con autocomplete */}
                        <div className="relative">
                          <input
                            value={search}
                            onChange={e => {
                              setSpellSearches(s => ({ ...s, [i]: e.target.value }))
                              patchSpell(i, 'name', e.target.value)
                            }}
                            onFocus={() => openDropdown(i)}
                            onBlur={() => setTimeout(() => closeDropdown(i), 150)}
                            placeholder="Buscar hechizo..."
                            className={inputCls}
                            autoComplete="off"
                          />
                          {filtered.length > 0 && (
                            <ul className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-white border border-stone-300 rounded shadow-lg max-h-40 overflow-y-auto">
                              {filtered.map(s => (
                                <li key={s.index}>
                                  <button
                                    type="button"
                                    className="w-full text-left px-2.5 py-1.5 text-sm text-stone-700 hover:bg-amber-50 transition-colors"
                                    onMouseDown={async () => {
                                      closeDropdown(i)
                                      patchSpell(i, 'name', s.name)
                                      setSpellSearches(prev => ({ ...prev, [i]: s.name }))
                                      try {
                                        const detail = await dndApi.spell(s.index)
                                        patchSpell(i, 'level', detail.level)
                                      } catch { /* no-op */ }
                                    }}
                                  >
                                    {s.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <input
                          type="number" min={0} max={9}
                          value={spell.level}
                          onChange={e => patchSpell(i, 'level', parseInt(e.target.value) || 0)}
                          className={inputCls}
                        />
                        <input
                          type="number" min={1}
                          value={spell.charges}
                          onChange={e => patchSpell(i, 'charges', parseInt(e.target.value) || 1)}
                          className={inputCls}
                        />
                        <select
                          value={spell.recharge}
                          onChange={e => patchSpell(i, 'recharge', e.target.value as SpellCharge['recharge'])}
                          className={inputCls}
                        >
                          {(Object.entries(RECHARGE_LABELS) as [SpellCharge['recharge'], string][]).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => removeSpell(i)}
                          className="text-stone-600 hover:text-red-400 text-sm transition-colors">✕</button>
                      </div>
                    </div>
                  )
                })}
                <button type="button" onClick={addSpell}
                  className="text-xs text-stone-500 hover:text-stone-700 transition-colors text-left">
                  + Agregar hechizo
                </button>
              </div>
            )}
          </div>

          {/* velocidad */}
          <div className="flex items-center gap-3">
            <label className={checkboxRow}>
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
            <label className={checkboxRow}>
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
            <label className={checkboxRow}>
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
            <label className={checkboxRow}>
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
            <label className={labelCls}>Peso</label>
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
