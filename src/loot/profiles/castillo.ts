import type { LootProfile } from '../types'

export const GUARDIA_REAL_LOOT: LootProfile = {
  goldRange: [6, 20],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.95,
      rollCount: [1, 2],
      pool: [
        { index: 'longsword', name: 'Espada larga real', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'shield', name: 'Escudo con emblema', tier: 'mundane', category: 'armor', weight: 2 },
        { index: 'chain-mail', name: 'Cota de malla real', tier: 'mundane', category: 'armor', weight: 3 },
        { index: 'plate', name: 'Armadura de placas', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.35,
      minLevel: 4,
      pool: [
        { index: 'ring-of-protection', name: 'Anillo de protección', tier: 'uncommon', category: 'trinket' },
        { index: 'insignia-of-claws', name: 'Insignia de mando', tier: 'uncommon', category: 'trinket', weight: 0.7 },
        { index: 'gem-medium', name: 'Gema noble', tier: 'uncommon', category: 'gem', weight: 2 },
      ],
    },
    {
      chance: 0.15,
      minLevel: 6,
      pool: [
        { index: 'defenders-longsword', name: 'Espada larga defensora', tier: 'rare', category: 'weapon' },
      ],
    },
  ],
  signature: {
    chance: 0.4,
    items: [
      { index: 'royal-seal', name: 'Sello real', tier: 'uncommon', category: 'quest' },
    ],
  },
}

export const ESPIAS_INFILTRADOS_LOOT: LootProfile = {
  goldRange: [8, 25],
  goldScale: l => 1 + (l - 1) * 0.12,
  commonDrops: [
    {
      chance: 0.9,
      rollCount: [1, 2],
      pool: [
        { index: 'dagger', name: 'Daga envenenada', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'hand-crossbow', name: 'Ballesta de mano', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Armadura de cuero negra', tier: 'mundane', category: 'armor', weight: 2 },
      ],
    },
    {
      chance: 0.6,
      rollCount: [1, 2],
      pool: [
        { index: 'potion-of-invisibility', name: 'Poción de invisibilidad', tier: 'rare', category: 'consumable', weight: 0.5 },
        { index: 'potion-of-poison', name: 'Poción de veneno', tier: 'uncommon', category: 'consumable', weight: 2 },
        { index: 'antitoxin', name: 'Antitoxina', tier: 'uncommon', category: 'consumable', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.4,
      minLevel: 5,
      pool: [
        { index: 'cloak-of-invisibility', name: 'Capa de invisibilidad', tier: 'legendary', category: 'armor', weight: 0.1 },
        { index: 'cloak-of-elvenkind', name: 'Capa élfica', tier: 'rare', category: 'armor', weight: 1 },
        { index: 'boots-of-elvenkind', name: 'Botas élficas', tier: 'uncommon', category: 'trinket', weight: 2 },
      ],
    },
  ],
  signature: {
    chance: 0.4,
    items: [
      { index: 'sealed-document', name: 'Documento sellado con información sensible', tier: 'uncommon', category: 'quest' },
    ],
  },
}

export const CULTISTAS_TORRE_LOOT: LootProfile = {
  goldRange: [5, 18],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.8,
      rollCount: [1, 2],
      pool: [
        { index: 'dagger', name: 'Daga ceremonial arcana', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'quarterstaff', name: 'Báculo', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'leather-armor', name: 'Túnica de cuero', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
    {
      chance: 0.55,
      rollCount: [1, 2],
      pool: [
        { index: 'spell-scroll-1st-level', name: 'Pergamino arcano (nivel 1)', tier: 'uncommon', category: 'scroll', weight: 3 },
        { index: 'spell-scroll-2nd-level', name: 'Pergamino arcano (nivel 2)', tier: 'uncommon', category: 'scroll', weight: 2 },
        { index: 'spell-scroll-3rd-level', name: 'Pergamino arcano (nivel 3)', tier: 'rare', category: 'scroll', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.3,
      minLevel: 4,
      pool: [
        { index: 'staff-of-fire', name: 'Bastón de fuego', tier: 'rare', category: 'weapon', weight: 0.5 },
        { index: 'wand-of-magic-missiles', name: 'Varita de proyectiles mágicos', tier: 'uncommon', category: 'weapon', weight: 2 },
      ],
    },
    {
      chance: 0.2,
      minLevel: 5,
      pool: [
        { index: 'robe-of-eyes', name: 'Túnica de los ojos', tier: 'rare', category: 'armor' },
      ],
    },
  ],
  signature: {
    chance: 0.35,
    items: [
      { index: 'cult-grimoire', name: 'Grimorio del culto', tier: 'rare', category: 'quest' },
    ],
  },
}

export const GUARDIANES_MAGICOS_LOOT: LootProfile = {
  goldRange: [0, 15],
  goldScale: () => 1,
  commonDrops: [],
  encounterDrops: [
    {
      chance: 0.5,
      pool: [
        { index: 'gem-medium', name: 'Gema imbuida de magia', tier: 'uncommon', category: 'gem', weight: 2 },
        { index: 'strange-crystal', name: 'Cristal arcano', tier: 'uncommon', category: 'gem', weight: 1 },
      ],
    },
    {
      chance: 0.3,
      minLevel: 5,
      pool: [
        { index: 'ioun-stone-reserve', name: 'Piedra de Ioun (reserva)', tier: 'rare', category: 'trinket' },
        { index: 'brooch-of-shielding', name: 'Broche de escudo', tier: 'uncommon', category: 'trinket', weight: 2 },
      ],
    },
  ],
  signature: {
    chance: 0.4,
    items: [
      { index: 'arcane-core', name: 'Núcleo arcano de guardián', tier: 'uncommon', category: 'trinket' },
    ],
  },
}
