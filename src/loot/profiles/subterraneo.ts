import type { LootProfile } from '../types'

export const TRIBU_KOBOLD_LOOT: LootProfile = {
  goldRange: [3, 15],
  commonDrops: [
    {
      chance: 0.75,
      rollCount: [1, 2],
      pool: [
        { index: 'dagger', name: 'Daga', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'sling', name: 'Honda', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'light-crossbow', name: 'Ballesta ligera', tier: 'mundane', category: 'weapon', weight: 1 },
      ],
    },
    {
      chance: 0.45,
      pool: [
        { index: 'antitoxin', name: 'Antitoxina', tier: 'uncommon', category: 'consumable' },
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable' },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.2,
      minLevel: 2,
      pool: [
        { index: 'trap-components', name: 'Componentes de trampa', tier: 'mundane', category: 'quest' },
        { index: 'gem-small', name: 'Piedra semipreciosa', tier: 'mundane', category: 'gem' },
      ],
    },
  ],
  signature: {
    chance: 0.2,
    items: [
      { index: 'kobold-scale', name: 'Escama de kobold pintada', tier: 'mundane', category: 'trinket' },
    ],
  },
}

export const GUARDIA_DUERGAR_LOOT: LootProfile = {
  goldRange: [6, 20],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.9,
      rollCount: [1, 2],
      pool: [
        { index: 'warhammer', name: 'Mazo de guerra', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'war-pick', name: 'Pico de guerra', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'chain-mail', name: 'Cota de malla', tier: 'mundane', category: 'armor', weight: 2 },
        { index: 'shield', name: 'Escudo', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.35,
      minLevel: 4,
      pool: [
        { index: 'ring-of-fire-resistance', name: 'Anillo de resistencia al fuego', tier: 'rare', category: 'trinket' },
        { index: 'potion-of-fire-resistance', name: 'Poción de resistencia al fuego', tier: 'uncommon', category: 'consumable', weight: 2 },
      ],
    },
    {
      chance: 0.5,
      pool: [
        { index: 'dwarven-gem', name: 'Gema enana tallada', tier: 'mundane', category: 'gem', weight: 2 },
        { index: 'mithral-ore', name: 'Mineral de mitral (bruto)', tier: 'uncommon', category: 'gem', weight: 1 },
      ],
    },
  ],
  signature: {
    chance: 0.25,
    items: [
      { index: 'duergar-rune', name: 'Runa enana enloquecedora', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const GUARDIA_ORCO_LOOT: LootProfile = {
  goldRange: [3, 10],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.9,
      rollCount: [1, 3],
      pool: [
        { index: 'greataxe', name: 'Hacha grande', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'javelin', name: 'Jabalina', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'hide-armor', name: 'Armadura de pieles', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.4,
      pool: [
        { index: 'potion-of-giant-strength', name: 'Poción de fuerza de gigante', tier: 'uncommon', category: 'consumable' },
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable', weight: 2 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.2,
      minLevel: 3,
      pool: [
        { index: 'gauntlets-of-ogre-power', name: 'Guanteletes de poder del ogro', tier: 'uncommon', category: 'trinket' },
      ],
    },
  ],
  signature: {
    chance: 0.2,
    items: [
      { index: 'orc-totem', name: 'Tótem orco de batalla', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const CUEVA_ABERRANTE_LOOT: LootProfile = {
  goldRange: [2, 8],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [],
  encounterDrops: [
    {
      chance: 0.3,
      minLevel: 4,
      pool: [
        { index: 'spell-scroll-3rd-level', name: 'Pergamino de conjuro (nivel 3)', tier: 'rare', category: 'scroll' },
        { index: 'aberrant-eye-gem', name: 'Gema de ojo aberrante', tier: 'rare', category: 'gem', weight: 0.5 },
      ],
    },
    {
      chance: 0.5,
      pool: [
        { index: 'strange-crystal', name: 'Cristal pulsante', tier: 'uncommon', category: 'gem' },
      ],
    },
  ],
  signature: {
    chance: 0.25,
    items: [
      { index: 'aberrant-eye', name: 'Ojo aberrante disecado', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const NIDO_MURCIELAGOS_LOOT: LootProfile = {
  goldRange: [0, 5],
  goldScale: () => 1,
  commonDrops: [],
  encounterDrops: [],
  signature: {
    chance: 0.25,
    items: [
      { index: 'giant-bat-wing', name: 'Ala de murciélago gigante', tier: 'mundane', category: 'trinket' },
    ],
  },
}
