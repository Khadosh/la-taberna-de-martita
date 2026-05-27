import type { LootProfile } from '../types'

export const GIGANTES_COLINAS_LOOT: LootProfile = {
  goldRange: [8, 22],
  goldScale: l => 1 + (l - 1) * 0.12,
  commonDrops: [],
  encounterDrops: [
    {
      chance: 0.6,
      rollCount: [1, 2],
      pool: [
        { index: 'gem-large', name: 'Gema grande (tamaño gigante)', tier: 'uncommon', category: 'gem', weight: 2 },
        { index: 'art-object', name: 'Objeto artístico primitivo', tier: 'mundane', category: 'art', weight: 3 },
        { index: 'great-club', name: 'Gran clava de madera de hierro', tier: 'mundane', category: 'weapon', weight: 1 },
      ],
    },
    {
      chance: 0.25,
      minLevel: 6,
      pool: [
        { index: 'belt-of-giant-strength-hill', name: 'Cinturón de fuerza de gigante (colinas)', tier: 'rare', category: 'trinket' },
      ],
    },
  ],
  signature: {
    chance: 0.3,
    items: [
      { index: 'hill-rune', name: 'Runa de colinas gigante', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const VUELO_GRIFFONS_LOOT: LootProfile = {
  goldRange: [0, 15],
  goldScale: () => 1,
  commonDrops: [],
  encounterDrops: [
    {
      chance: 0.35,
      pool: [
        { index: 'gem-small', name: 'Gema de la cima', tier: 'mundane', category: 'gem', weight: 2 },
        { index: 'art-object', name: 'Joya de nido de griffon', tier: 'uncommon', category: 'art', weight: 1 },
      ],
    },
    {
      chance: 0.2,
      minLevel: 5,
      pool: [
        { index: 'wings-of-flying', name: 'Manto de vuelo', tier: 'uncommon', category: 'trinket' },
      ],
    },
  ],
  signature: {
    chance: 0.4,
    items: [
      { index: 'griffon-feather', name: 'Pluma de griffon dorada', tier: 'uncommon', category: 'trinket' },
    ],
  },
}
