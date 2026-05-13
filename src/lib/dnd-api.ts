const BASE = 'https://www.dnd5eapi.co/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`DnD API ${res.status}: ${path}`)
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

export const dndApi = {
  races: () => get<{ results: ApiRef[] }>('/races'),
  race: (i: string) => get<RaceDetail>(`/races/${i}`),
  classes: () => get<{ results: ApiRef[] }>('/classes'),
  klass: (i: string) => get<ClassDetail>(`/classes/${i}`),
  classSpells: (i: string) => get<{ results: ApiRef[] }>(`/classes/${i}/spells`),
  spell: (i: string) => get<SpellDetail>(`/spells/${i}`),
}

export const dndKeys = {
  races: ['dnd', 'races'] as const,
  race: (i: string) => ['dnd', 'races', i] as const,
  classes: ['dnd', 'classes'] as const,
  klass: (i: string) => ['dnd', 'classes', i] as const,
  classSpells: (i: string) => ['dnd', 'classes', i, 'spells'] as const,
  spell: (i: string) => ['dnd', 'spells', i] as const,
}

export function rollStat(): number {
  const rolls = Array.from({ length: 4 }, () => Math.ceil(Math.random() * 6))
  return rolls.sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0)
}

export function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
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
