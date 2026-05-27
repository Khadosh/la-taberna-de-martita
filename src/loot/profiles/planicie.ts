import type { LootProfile } from '../types'

export const BANDA_BANDOLEROS_LOOT: LootProfile = {
  goldRange: [6, 22],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.9,
      rollCount: [1, 3],
      pool: [
        { index: 'longsword', name: 'Espada larga', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'hand-crossbow', name: 'Ballesta de mano', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'shortsword', name: 'Espada corta', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Armadura de cuero', tier: 'mundane', category: 'armor', weight: 2 },
        { index: 'studded-leather-armor', name: 'Cuero tachonado', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.5,
      pool: [
        { index: 'gem-small', name: 'Gema robada', tier: 'mundane', category: 'gem', weight: 3 },
        { index: 'art-object', name: 'Objeto de arte robado', tier: 'mundane', category: 'art', weight: 2 },
        { index: 'stolen-chest', name: 'Cofre con monedas', tier: 'uncommon', category: 'quest', weight: 1 },
      ],
    },
    {
      chance: 0.2,
      minLevel: 3,
      pool: [
        { index: 'boots-of-elvenkind', name: 'Botas élficas', tier: 'uncommon', category: 'trinket' },
        { index: 'cloak-of-protection', name: 'Capa de protección', tier: 'uncommon', category: 'armor', weight: 0.7 },
      ],
    },
  ],
  signature: {
    chance: 0.25,
    items: [
      { index: 'bandit-treasure-map', name: 'Mapa al tesoro de la banda', tier: 'uncommon', category: 'quest' },
    ],
  },
}

export const TRIBU_ORCO_LOOT: LootProfile = {
  goldRange: [4, 14],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.85,
      rollCount: [1, 3],
      pool: [
        { index: 'greataxe', name: 'Hacha grande', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'javelin', name: 'Jabalina', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'hide-armor', name: 'Armadura de pieles', tier: 'mundane', category: 'armor', weight: 2 },
      ],
    },
    {
      chance: 0.3,
      pool: [
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable' },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.25,
      pool: [
        { index: 'war-trophy', name: 'Trofeo de guerra', tier: 'mundane', category: 'trinket', weight: 3 },
        { index: 'gem-small', name: 'Piedra preciosa bruta', tier: 'mundane', category: 'gem', weight: 1 },
      ],
    },
  ],
  signature: {
    chance: 0.2,
    items: [
      { index: 'orc-war-trophy', name: 'Trofeo de guerra orco', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const RASTREADORES_GNOLL_LOOT: LootProfile = {
  goldRange: [3, 10],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.8,
      rollCount: [1, 2],
      pool: [
        { index: 'longbow', name: 'Arco largo', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'scimitar', name: 'Cimitarra', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Armadura de cuero', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.4,
      rollCount: [1, 2],
      pool: [
        { index: 'potion-of-poison', name: 'Poción de veneno', tier: 'uncommon', category: 'consumable', weight: 2 },
        { index: 'antitoxin', name: 'Antitoxina', tier: 'uncommon', category: 'consumable', weight: 1 },
      ],
    },
  ],
  encounterDrops: [],
  signature: {
    chance: 0.25,
    items: [
      { index: 'gnoll-bone-necklace', name: 'Collar de huesos de gnoll', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const JINETES_LOBOS_LOOT: LootProfile = {
  goldRange: [3, 12],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.8,
      rollCount: [1, 3],
      pool: [
        { index: 'spear', name: 'Lanza', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'shortbow', name: 'Arco corto', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Armadura de cuero', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.35,
      pool: [
        { index: 'potion-of-speed', name: 'Poción de velocidad', tier: 'rare', category: 'consumable', weight: 0.5 },
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable', weight: 2 },
      ],
    },
  ],
  encounterDrops: [],
  signature: {
    chance: 0.2,
    items: [
      { index: 'goblin-wolf-banner', name: 'Estandarte goblin de lobo', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const MERCENARIOS_ELITE_LOOT: LootProfile = {
  goldRange: [12, 35],
  goldScale: l => 1 + (l - 1) * 0.12,
  commonDrops: [
    {
      chance: 0.95,
      rollCount: [1, 2],
      pool: [
        { index: 'longsword', name: 'Espada larga de calidad', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'rapier', name: 'Estoque', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'chain-mail', name: 'Cota de malla', tier: 'mundane', category: 'armor', weight: 2 },
        { index: 'half-plate', name: 'Media armadura', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.5,
      rollCount: [1, 2],
      pool: [
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable', weight: 3 },
        { index: 'potion-of-greater-healing', name: 'Poción de curación superior', tier: 'uncommon', category: 'consumable', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.4,
      minLevel: 5,
      pool: [
        { index: 'ring-of-protection', name: 'Anillo de protección', tier: 'uncommon', category: 'trinket' },
        { index: 'bracers-of-archery', name: 'Brazales de arquería', tier: 'uncommon', category: 'armor', weight: 0.7 },
        { index: '+1-longsword', name: 'Espada larga +1', tier: 'uncommon', category: 'weapon', weight: 0.5 },
      ],
    },
  ],
  signature: {
    chance: 0.35,
    items: [
      { index: 'mercenary-guild-seal', name: 'Sello de gremio de mercenarios', tier: 'uncommon', category: 'quest' },
    ],
  },
}
