import type { SheetJson } from '../character-sheet/types'

export type TokenData = {
  id: string
  name: string
  kind: 'player' | 'npc'
  currentHp: number
  maxHp: number
  portraitUrl?: string | null
  isActive: boolean
  showHp?: boolean
  role?: string
  level?: number
  spells?: string[]
  weapons?: { name: string; damage: string }[]
  equipmentNotes?: string
  damage?: string
  isHidden?: boolean
  spawnGroup?: string
}

export type AttackEntity = {
  id: string
  name: string
  ac: number
  attackBonus: number
}

export type BoardCharacter = {
  id: string
  name: string
  class: string
  race: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  armor_class: number | null
  portrait_url?: string | null
  user_id: string
  conditions: string[]
  sheet_json: SheetJson
}

export type Pos = { x: number; y: number }
