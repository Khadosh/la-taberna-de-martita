import { rollStat } from '../../../lib/dnd-api'
import type { StatKey } from '../../../lib/dnd-backgrounds'

export type Stats = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

export interface Draft {
  name: string
  raceIndex: string
  classIndex: string
  subclassIndex: string
  level: number
  rolledValues: number[]
  stats: Stats
  backgroundKey: string
  bgBonus2: StatKey | ''
  bgBonus1: StatKey | ''
  skillProficiencies: string[]
  spells: string[]
  expertise?: string[]
  backstory: string
  campaignId: string
}

export const EMPTY_STATS: Stats = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
export const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export function rollAll(): number[] {
  return Array.from({ length: 6 }, rollStat).sort((a, b) => b - a)
}
