import {
  type CustomItem, type CustomItemProperties, type DamageType,
  type ItemRarity, type ItemType, type SpellCharge, type StatKey,
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

export const STAT_KEYS: StatKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const INPUT_CLS = 'bg-white border border-stone-300 text-stone-800 text-sm rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-600/60 w-full'
export const LABEL_CLS = 'text-stone-500 text-xs font-semibold uppercase tracking-wide'
export const CHECKBOX_ROW = 'flex items-center gap-2 cursor-pointer'

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
