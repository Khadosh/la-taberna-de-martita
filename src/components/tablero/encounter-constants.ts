import { type Difficulty } from '../../lib/encounter-generator'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil', medium: 'Medio', hard: 'Difícil', deadly: 'Mortal',
}

export const ROLE_COL_HEADER: Record<string, { label: string; color: string }> = {
  melee: { label: 'Melee', color: 'text-red-400' },
  ranged: { label: 'Distancia', color: 'text-emerald-400' },
  magic: { label: 'Magia', color: 'text-purple-400' },
  support: { label: 'Soporte', color: 'text-amber-400' },
}

export const ROLE_BADGE: Record<string, string> = {
  melee: 'border-[#852a2a] bg-[#f8d7d7] text-[#852a2a]',
  ranged: 'border-[#2a6b4c] bg-[#d7f8e7] text-[#2a6b4c]',
  magic: 'border-[#552a85] bg-[#ebd7f8] text-[#552a85]',
  support: 'border-[#6b552a] bg-[#f8ebd7] text-[#6b552a]',
}

export const DND_IMG_BASE = 'https://www.dnd5eapi.co'

export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export type AbilityKey = typeof ABILITY_KEYS[number]

export function abMod(score: number): string {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}
