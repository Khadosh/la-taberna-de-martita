import { localSubclassMap, localFeatureMap, localSubclassFeaturesMap } from './local-subclass-store'

const BASE = 'https://www.dnd5eapi.co/api'
const BASE_2014 = 'https://www.dnd5eapi.co/api/2014'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`DnD API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

async function get2014<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_2014}${path}`)
  if (!res.ok) throw new Error(`DnD API 2014 ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export interface ApiRef {
  index: string
  name: string
  url: string
}

export interface RaceDetail {
  index: string
  name: string
  speed: number
  ability_bonuses: { ability_score: ApiRef; bonus: number }[]
  traits: ApiRef[]
}

export interface ClassDetail {
  index: string
  name: string
  hit_die: number
  proficiency_choices: {
    desc: string
    choose: number
    from: { options: { item: ApiRef }[] }
  }[]
  proficiencies: ApiRef[]
  saving_throws: ApiRef[]
  spellcasting?: { spellcasting_ability: ApiRef }
}

export interface SpellDetail {
  index: string
  name: string
  level: number
  school: ApiRef
  desc: string[]
  casting_time: string
  range: string
  components: string[]
  duration: string
}

export interface TraitDetail {
  index: string
  name: string
  desc: string[]
}

export interface FeatureDetail {
  index: string
  name: string
  level: number
  desc: string[]
  class: ApiRef
  subclass?: ApiRef
}

export interface ClassLevel {
  level: number
  features: ApiRef[]
  ability_score_bonuses: number
  prof_bonus: number
  spellcasting?: {
    spells_known?: number
    spell_slots_level_1?: number
    spell_slots_level_2?: number
    spell_slots_level_3?: number
    spell_slots_level_4?: number
    spell_slots_level_5?: number
    spell_slots_level_6?: number
    spell_slots_level_7?: number
    spell_slots_level_8?: number
    spell_slots_level_9?: number
  }
}

export interface SubclassDetail {
  index: string
  name: string
  subclass_flavor: string
  class: ApiRef
  desc: string
}

export interface SkillDetail {
  index: string
  name: string
  desc: string[]
  ability_score: ApiRef
}

export interface EquipmentItem {
  index: string
  name: string
  weight: number
  cost: { quantity: number; unit: string }
  equipment_category: ApiRef
  // Armor
  armor_category?: string
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number }
  desc?: string[]
  // Weapon
  weapon_category?: string                        // 'Simple' | 'Martial'
  weapon_range?: string                           // 'Melee' | 'Ranged'
  category_range?: string                         // 'Simple Melee', etc.
  properties?: { index: string; name: string }[]  // 'finesse', 'thrown', 'light', …
  damage?: { damage_dice: string; damage_type: ApiRef }
}

export interface BackgroundDetail {
  index: string
  name: string
  starting_proficiencies: ApiRef[]
  feature: { name: string; desc: string[] }
  language_options?: { choose: number; type?: string }
}

export interface MonsterSummary {
  index: string
  name: string
}

export interface MonsterAction {
  name: string
  desc: string
  attack_bonus?: number
  damage?: { damage_dice: string; damage_type: ApiRef }[]
  dc?: { dc_type: ApiRef; dc_value: number; success_type: string }
  multiattack_type?: string
  actions?: { action_name: string; count: number; type: string }[]
}

export interface MonsterDetail {
  index: string
  name: string
  size: string
  type: string
  alignment: string
  armor_class: { type: string; value: number }[]
  hit_points: number
  hit_points_roll: string
  speed: Record<string, string>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  proficiencies: { value: number; proficiency: ApiRef }[]
  damage_vulnerabilities: string[]
  damage_resistances: string[]
  damage_immunities: string[]
  condition_immunities: ApiRef[]
  senses: Record<string, string | number>
  languages: string
  challenge_rating: number
  xp: number
  special_abilities?: { name: string; desc: string }[]
  actions?: MonsterAction[]
  legendary_actions?: { name: string; desc: string }[]
  reactions?: { name: string; desc: string }[]
  image?: string  // e.g. "/api/2014/images/monsters/goblin.png"
}

export const dndApi = {
  races: () => get<{ results: ApiRef[] }>('/races'),
  race: (i: string) => get<RaceDetail>(`/races/${i}`),
  classes: () => get<{ results: ApiRef[] }>('/classes'),
  klass: (i: string) => get<ClassDetail>(`/classes/${i}`),
  classSpells: (i: string) => get<{ results: ApiRef[] }>(`/classes/${i}/spells`),
  classLevels: (i: string) => get<ClassLevel[]>(`/classes/${i}/levels`),
  classSubclasses: (i: string) => get<{ results: ApiRef[] }>(`/classes/${i}/subclasses`),
  spell: (i: string) => get<SpellDetail>(`/spells/${i}`),
  trait: (i: string) => get<TraitDetail>(`/traits/${i}`),
  feature: (i: string) => localFeatureMap.has(i) ? Promise.resolve(localFeatureMap.get(i)!) : get<FeatureDetail>(`/features/${i}`),
  subclass: (i: string) => localSubclassMap.has(i) ? Promise.resolve(localSubclassMap.get(i)!) : get<SubclassDetail>(`/subclasses/${i}`),
  subclassFeatures: (i: string) => localSubclassFeaturesMap.has(i) ? Promise.resolve(localSubclassFeaturesMap.get(i)!) : get<{ results: ApiRef[] }>(`/subclasses/${i}/features`),
  skill: (i: string) => get<SkillDetail>(`/skills/${i}`),
  equipment: () => get<{ count: number; results: ApiRef[] }>('/equipment'),
  equipmentDetail: (i: string) => get2014<EquipmentItem>(`/equipment/${i}`),
  equipmentCategories: () => get<{ results: ApiRef[] }>('/equipment-categories'),
  equipmentCategory: (i: string) => get<{ index: string; name: string; equipment: ApiRef[] }>(`/equipment-categories/${i}`),
  monsters: () => get<{ count: number; results: MonsterSummary[] }>('/monsters'),
  monster: (i: string) => get2014<MonsterDetail>(`/monsters/${i}`),
  backgroundList: () => get2014<{ results: ApiRef[] }>('/backgrounds'),
  background: (i: string) => get2014<BackgroundDetail>(`/backgrounds/${i}`),
  allSpells: () => get<{ count: number; results: ApiRef[] }>('/spells'),
}

export const dndKeys = {
  races: ['dnd', 'races'] as const,
  race: (i: string) => ['dnd', 'races', i] as const,
  classes: ['dnd', 'classes'] as const,
  klass: (i: string) => ['dnd', 'classes', i] as const,
  classSpells: (i: string) => ['dnd', 'classes', i, 'spells'] as const,
  classLevels: (i: string) => ['dnd', 'classes', i, 'levels'] as const,
  classSubclasses: (i: string) => ['dnd', 'classes', i, 'subclasses'] as const,
  spell: (i: string) => ['dnd', 'spells', i] as const,
  trait: (i: string) => ['dnd', 'traits', i] as const,
  feature: (i: string) => ['dnd', 'features', i] as const,
  subclass: (i: string) => ['dnd', 'subclasses', i] as const,
  subclassFeatures: (i: string) => ['dnd', 'subclasses', i, 'features'] as const,
  skill: (i: string) => ['dnd', 'skills', i] as const,
  equipment: ['dnd', 'equipment'] as const,
  equipmentDetail: (i: string) => ['dnd', 'equipment', i] as const,
  equipmentCategory: (i: string) => ['dnd', 'equipment-category', i] as const,
  monsters: ['dnd', 'monsters'] as const,
  monster: (i: string) => ['dnd', 'monsters', i] as const,
  allSpells: ['dnd', 'spells'] as const,
  backgrounds: ['dnd', 'backgrounds'] as const,
  background: (i: string) => ['dnd', 'backgrounds', i] as const,
}

export function rollStat(): number {
  const rolls = Array.from({ length: 4 }, () => Math.ceil(Math.random() * 6))
  return rolls.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0)
}

export function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function modifierColor(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod > 0 ? 'text-green-400' : mod < 0 ? 'text-red-400' : 'text-stone-400'
}

export const ABILITY_LABELS: Record<string, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
}

export const ABILITY_FULL: Record<string, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
}

// Map D&D API ability score indices to our stat keys
export const ABILITY_INDEX_MAP: Record<string, string> = {
  str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha',
}
