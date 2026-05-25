export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'misc'

export const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Común',
  uncommon: 'Infrecuente',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
}

export const RARITY_BONUS: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 3,
}

export const RARITY_COLOR: Record<ItemRarity, string> = {
  common: 'text-stone-400',
  uncommon: 'text-green-500',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
}

export const RARITY_BORDER: Record<ItemRarity, string> = {
  common: 'border-stone-500/40',
  uncommon: 'border-green-600/40',
  rare: 'border-blue-500/40',
  epic: 'border-purple-500/40',
  legendary: 'border-amber-500/60',
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  weapon: 'Arma',
  armor: 'Armadura',
  accessory: 'Accesorio',
  consumable: 'Consumible',
  misc: 'Miscelánea',
}

export const DAMAGE_TYPES = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force',
  'lightning', 'necrotic', 'piercing', 'poison',
  'psychic', 'radiant', 'slashing', 'thunder',
] as const

export type DamageType = typeof DAMAGE_TYPES[number]

export const DAMAGE_TYPE_LABELS: Record<DamageType, string> = {
  acid: 'Ácido',
  bludgeoning: 'Contundente',
  cold: 'Frío',
  fire: 'Fuego',
  force: 'Fuerza',
  lightning: 'Relámpago',
  necrotic: 'Necrótico',
  piercing: 'Perforante',
  poison: 'Veneno',
  psychic: 'Psíquico',
  radiant: 'Radiante',
  slashing: 'Cortante',
  thunder: 'Trueno',
}

export type StatKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export const STAT_LABELS: Record<StatKey, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

export type SpellCharge = {
  name: string
  level: number
  charges: number
  recharge: 'dawn' | 'short_rest' | 'long_rest' | 'never'
}

export const RECHARGE_LABELS: Record<SpellCharge['recharge'], string> = {
  dawn: 'Al amanecer',
  short_rest: 'Descanso corto',
  long_rest: 'Descanso largo',
  never: 'Sin recarga',
}

export type CustomItemProperties = {
  attack_bonus?: number
  ac_bonus?: number
  stat_bonuses?: Partial<Record<StatKey, number>>
  spells?: SpellCharge[]
  damage_resistances?: DamageType[]
  speed_bonus?: number
  hp_regen?: number
  max_hp_bonus?: number
  is_cursed?: boolean
  curse_description?: string
}

export type CustomItem = {
  id: string
  campaign_id: string
  created_by: string
  name: string
  description: string | null
  image_url: string | null
  rarity: ItemRarity
  item_type: ItemType
  weight_lbs: number
  properties: CustomItemProperties
  created_at: string
}
