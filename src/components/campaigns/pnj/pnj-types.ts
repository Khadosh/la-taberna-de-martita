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
