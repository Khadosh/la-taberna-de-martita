import type { LootProfile } from '../types'

export const PIRATAS_CORSARIOS_LOOT: LootProfile = {
  goldRange: [10, 30],
  goldScale: l => 1 + (l - 1) * 0.12,
  commonDrops: [
    {
      chance: 0.9,
      rollCount: [1, 3],
      pool: [
        { index: 'scimitar', name: 'Sable corsario', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'hand-crossbow', name: 'Ballesta de mano', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'dagger', name: 'Daga de abordaje', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Armadura de cuero de marino', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.7,
      rollCount: [1, 3],
      pool: [
        { index: 'gem-small', name: 'Gema robada', tier: 'mundane', category: 'gem', weight: 3 },
        { index: 'gem-medium', name: 'Gema valiosa', tier: 'uncommon', category: 'gem', weight: 1 },
        { index: 'art-object', name: 'Objeto de arte saqueado', tier: 'mundane', category: 'art', weight: 2 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.4,
      minLevel: 3,
      pool: [
        { index: 'cloak-of-protection', name: 'Capa de protección', tier: 'uncommon', category: 'armor' },
        { index: 'potion-of-water-breathing', name: 'Poción de respiración acuática', tier: 'uncommon', category: 'consumable', weight: 2 },
      ],
    },
    {
      chance: 0.15,
      minLevel: 4,
      pool: [
        { index: 'luck-blade', name: 'Hoja de la suerte', tier: 'legendary', category: 'weapon', weight: 0.1 },
        { index: 'sword-of-sharpness', name: 'Espada de filo eterno', tier: 'epic', category: 'weapon', weight: 0.5 },
      ],
    },
  ],
  signature: {
    chance: 0.35,
    items: [
      { index: 'treasure-map', name: 'Mapa del tesoro manchado de sal', tier: 'uncommon', category: 'quest' },
    ],
  },
}

export const SAHUAGIN_RAID_LOOT: LootProfile = {
  goldRange: [2, 10],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.75,
      rollCount: [1, 2],
      pool: [
        { index: 'trident', name: 'Tridente sahuagin', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'net', name: 'Red de guerra', tier: 'mundane', category: 'weapon', weight: 2 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.35,
      pool: [
        { index: 'potion-of-water-breathing', name: 'Poción de respiración acuática', tier: 'uncommon', category: 'consumable', weight: 2 },
        { index: 'pearl-small', name: 'Perla del mar', tier: 'mundane', category: 'gem', weight: 3 },
        { index: 'gem-aquamarine', name: 'Aguamarina', tier: 'uncommon', category: 'gem', weight: 1 },
      ],
    },
    {
      chance: 0.2,
      minLevel: 4,
      pool: [
        { index: 'trident-of-fish-command', name: 'Tridente de mando de peces', tier: 'uncommon', category: 'weapon' },
      ],
    },
  ],
  signature: {
    chance: 0.3,
    items: [
      { index: 'black-pearl', name: 'Perla negra sahuagin', tier: 'uncommon', category: 'gem' },
    ],
  },
}
