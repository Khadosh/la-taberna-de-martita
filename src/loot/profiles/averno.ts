import type { LootProfile } from '../types'

export const ELEMENTALES_FUEGO_LOOT: LootProfile = {
  goldRange: [0, 20],
  goldScale: () => 1,
  commonDrops: [],
  encounterDrops: [
    {
      chance: 0.45,
      pool: [
        { index: 'potion-of-fire-resistance', name: 'Poción de resistencia al fuego', tier: 'uncommon', category: 'consumable', weight: 3 },
        { index: 'ring-of-fire-resistance', name: 'Anillo de resistencia al fuego', tier: 'rare', category: 'trinket', weight: 0.5 },
      ],
    },
    {
      chance: 0.3,
      pool: [
        { index: 'fire-opal', name: 'Ópalo de fuego', tier: 'uncommon', category: 'gem', weight: 2 },
        { index: 'obsidian-shard', name: 'Fragmento de obsidiana del plano de fuego', tier: 'mundane', category: 'gem', weight: 3 },
      ],
    },
  ],
  signature: {
    chance: 0.4,
    items: [
      { index: 'ignis-essence', name: 'Esencia ígnea embotellada', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const LEGIONES_INFERNALES_LOOT: LootProfile = {
  goldRange: [4, 15],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.6,
      rollCount: [1, 2],
      pool: [
        { index: 'potion-of-fire-resistance', name: 'Poción de resistencia al fuego', tier: 'uncommon', category: 'consumable', weight: 2 },
        { index: 'fire-opal', name: 'Ópalo de fuego', tier: 'uncommon', category: 'gem', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.35,
      minLevel: 6,
      pool: [
        { index: 'ring-of-fire-resistance', name: 'Anillo de resistencia al fuego', tier: 'rare', category: 'trinket', weight: 0.5 },
        { index: 'vicious-weapon', name: 'Arma viciosa infernal', tier: 'rare', category: 'weapon', weight: 0.7 },
        { index: 'gem-large', name: 'Gema diabólica', tier: 'rare', category: 'gem', weight: 2 },
      ],
    },
    {
      chance: 0.15,
      minLevel: 7,
      pool: [
        { index: 'infernal-warhammer', name: 'Mazo infernal', tier: 'epic', category: 'weapon' },
      ],
    },
  ],
  signature: {
    chance: 0.3,
    items: [
      { index: 'infernal-contract', name: 'Contrato infernal firmado', tier: 'rare', category: 'quest' },
    ],
  },
}
