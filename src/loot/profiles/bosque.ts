import type { LootProfile } from '../types'

export const EMBOSCADA_GOBLIN_LOOT: LootProfile = {
  goldRange: [2, 8],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.85,
      rollCount: [1, 3],
      pool: [
        { index: 'shortbow', name: 'Arco corto', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'scimitar', name: 'Cimitarra', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Armadura de cuero', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.4,
      pool: [
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable' },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.25,
      minLevel: 2,
      pool: [
        { index: 'spell-scroll-1st-level', name: 'Pergamino de conjuro (nivel 1)', tier: 'uncommon', category: 'scroll' },
        { index: 'cloak-of-elvenkind', name: 'Capa élfica', tier: 'rare', category: 'armor', weight: 0.3 },
      ],
    },
  ],
  signature: {
    chance: 0.15,
    items: [
      { index: 'goblin-totem', name: 'Tótem goblin tallado', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const PATRULLA_BOSQUE_LOOT: LootProfile = {
  goldRange: [4, 14],
  commonDrops: [
    {
      chance: 0.9,
      rollCount: [1, 2],
      pool: [
        { index: 'longsword', name: 'Espada larga', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'shortsword', name: 'Espada corta', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'studded-leather-armor', name: 'Armadura de cuero tachonado', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.35,
      pool: [
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable' },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.3,
      minLevel: 3,
      pool: [
        { index: 'boots-of-striding-and-springing', name: 'Botas de zancada', tier: 'uncommon', category: 'trinket' },
        { index: 'spell-scroll-2nd-level', name: 'Pergamino (nivel 2)', tier: 'uncommon', category: 'scroll' },
      ],
    },
  ],
  signature: {
    chance: 0.1,
    items: [
      { index: 'patrol-map', name: 'Mapa de patrullaje marcado', tier: 'mundane', category: 'quest' },
    ],
  },
}

export const NIDO_ARANAS_LOOT: LootProfile = {
  goldRange: [1, 5],
  goldScale: () => 1,
  commonDrops: [
    {
      chance: 0.5,
      pool: [
        { index: 'antitoxin', name: 'Antitoxina', tier: 'uncommon', category: 'consumable', weight: 2 },
        { index: 'potion-of-poison', name: 'Poción de veneno', tier: 'uncommon', category: 'consumable', weight: 3 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.4,
      minLevel: 3,
      pool: [
        { index: 'web-weaving-tools', name: 'Hilo de seda de araña gigante', tier: 'uncommon', category: 'trinket' },
      ],
    },
    {
      chance: 0.2,
      minLevel: 4,
      pool: [
        { index: 'cloak-of-arachnida', name: 'Capa de arácnida', tier: 'rare', category: 'armor' },
      ],
    },
  ],
  signature: {
    chance: 0.2,
    items: [
      { index: 'giant-spider-fang', name: 'Colmillo de araña gigante', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const MANADA_LOBOS_LOOT: LootProfile = {
  goldRange: [0, 3],
  goldScale: () => 1,
  commonDrops: [],
  encounterDrops: [],
  signature: {
    chance: 0.3,
    items: [
      { index: 'wolf-pelt', name: 'Piel de lobo', tier: 'mundane', category: 'trinket' },
      { index: 'dire-wolf-fang', name: 'Colmillo de lobo terrible', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const DEPREDADORES_BOSQUE_LOOT: LootProfile = {
  goldRange: [0, 3],
  goldScale: () => 1,
  commonDrops: [],
  encounterDrops: [],
  signature: {
    chance: 0.35,
    items: [
      { index: 'bear-pelt', name: 'Piel de oso pardo', tier: 'mundane', category: 'trinket' },
      { index: 'boar-tusk', name: 'Colmillo de jabalí gigante', tier: 'mundane', category: 'trinket' },
    ],
  },
}
