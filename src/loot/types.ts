export type LootTier =
  | 'mundane'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'

export type LootCategory =
  | 'weapon'
  | 'armor'
  | 'consumable'
  | 'scroll'
  | 'gem'
  | 'art'
  | 'trinket'
  | 'quest'

export type LootItem = {
  index: string
  name: string
  tier: LootTier
  category: LootCategory
  weight?: number
}

export type LootDrop = {
  pool: LootItem[]
  chance: number
  rollCount?: [number, number]
  minLevel?: number
}

export type LootProfile = {
  goldRange: [number, number]
  goldScale?: (level: number) => number
  commonDrops: LootDrop[]
  encounterDrops: LootDrop[]
  signature?: {
    items: LootItem[]
    chance: number
  }
}
