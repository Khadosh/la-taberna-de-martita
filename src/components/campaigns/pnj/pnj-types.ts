export type Stats = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

export type NpcForm = {
  name: string
  race: string
  class: string
  level: number
  role: 'antagonist' | 'ally' | 'neutral'
  stats: Stats
  max_hp: string
  current_hp: string
  armor_class: string
  attack_bonus: string
  damage: string
  backstory: string
  notes: string
  is_hidden: boolean
  spells: string[]
  weapons: { id: string; name: string; damage: string }[]
  equipment_notes: string
}

export const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export const STAT_LABELS: Record<typeof STAT_KEYS[number], string> = {
  str: 'Fuerza', dex: 'Destreza', con: 'Constitución',
  int: 'Inteligencia', wis: 'Sabiduría', cha: 'Carisma',
}

export const ROLES = [
  { value: 'antagonist' as const, label: 'Antagonista', color: 'bg-red-900/30 border-red-800/40 text-red-900' },
  { value: 'ally' as const,       label: 'Aliado',       color: 'bg-green-900/20 border-green-800/40 text-green-900' },
  { value: 'neutral' as const,    label: 'Neutral',      color: 'bg-stone-200 border-stone-400 text-stone-700' },
]

export const DEFAULT_STATS: Stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }

export const EMPTY_FORM = (): NpcForm => ({
  name: '', race: '', class: '', level: 1, role: 'antagonist',
  stats: { ...DEFAULT_STATS },
  max_hp: '', current_hp: '', armor_class: '',
  attack_bonus: '', damage: '',
  backstory: '', notes: '', is_hidden: false,
  spells: [],
  weapons: [],
  equipment_notes: '',
})

export const abilityMod = (score: number) => Math.floor((score - 10) / 2)
export const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`)

export function toIntOrNull(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const n = parseInt(t, 10)
  return isNaN(n) ? null : n
}

export function rollAllStats(): Stats {
  const roll = () => {
    const rolls = [0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6))
    rolls.sort((a, b) => a - b)
    return rolls[1] + rolls[2] + rolls[3]
  }
  return { str: roll(), dex: roll(), con: roll(), int: roll(), wis: roll(), cha: roll() }
}

export const CLASS_HIT_DIE: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  bard: 8,
  wizard: 6,
  sorcerer: 6,
}

export function calculateSuggestedHp(level: number, className: string, conScore: number): number {
  const hitDie = CLASS_HIT_DIE[className.toLowerCase()] ?? 8
  const conMod = abilityMod(conScore)
  const firstLevel = Math.max(1, hitDie + conMod)
  if (level <= 1) return firstLevel
  const subsequentLevelHp = Math.max(1, Math.floor(hitDie / 2) + 1 + conMod)
  return firstLevel + (level - 1) * subsequentLevelHp
}
