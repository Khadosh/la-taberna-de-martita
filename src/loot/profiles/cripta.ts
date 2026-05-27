import type { LootProfile } from '../types'

export const PATRULLA_NO_MUERTA_LOOT: LootProfile = {
  goldRange: [2, 8],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.7,
      rollCount: [1, 3],
      pool: [
        { index: 'shortsword', name: 'Espada corta (oxidada)', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'longsword', name: 'Espada larga (oxidada)', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'light-crossbow', name: 'Ballesta ligera decrépita', tier: 'mundane', category: 'weapon', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.25,
      minLevel: 3,
      pool: [
        { index: 'spell-scroll-animate-dead', name: 'Pergamino: Animar muertos', tier: 'uncommon', category: 'scroll' },
        { index: 'spell-scroll-inflict-wounds', name: 'Pergamino: Infligir heridas', tier: 'uncommon', category: 'scroll', weight: 2 },
      ],
    },
  ],
  signature: {
    chance: 0.2,
    items: [
      { index: 'runic-bone', name: 'Hueso rúnico grabado', tier: 'uncommon', category: 'trinket' },
    ],
  },
}

export const GUARDIA_CRIPTA_LOOT: LootProfile = {
  goldRange: [4, 14],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.6,
      rollCount: [1, 2],
      pool: [
        { index: 'longsword', name: 'Espada antigua', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'mace', name: 'Maza ceremonial', tier: 'mundane', category: 'weapon', weight: 2 },
        { index: 'chain-mail', name: 'Cota de malla antigua', tier: 'mundane', category: 'armor', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.3,
      minLevel: 4,
      pool: [
        { index: 'ring-of-protection', name: 'Anillo de protección', tier: 'uncommon', category: 'trinket' },
        { index: 'periapt-of-wound-closure', name: 'Amuleto de cierre de heridas', tier: 'uncommon', category: 'trinket', weight: 0.7 },
      ],
    },
  ],
  signature: {
    chance: 0.25,
    items: [
      { index: 'funeral-seal', name: 'Sello funerario de la cripta', tier: 'uncommon', category: 'quest' },
    ],
  },
}

export const HORDA_ZOMBIES_LOOT: LootProfile = {
  goldRange: [2, 10],
  goldScale: () => 1,
  commonDrops: [
    {
      chance: 0.5,
      rollCount: [1, 2],
      pool: [
        { index: 'club', name: 'Garrote (degradado)', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'handaxe', name: 'Hacha de mano rota', tier: 'mundane', category: 'weapon', weight: 1 },
      ],
    },
  ],
  encounterDrops: [],
  signature: {
    chance: 0.3,
    items: [
      { index: 'shroud-strip', name: 'Jirón de mortaja maldita', tier: 'mundane', category: 'trinket' },
    ],
  },
}

export const CULTO_OSCURO_LOOT: LootProfile = {
  goldRange: [5, 18],
  goldScale: l => 1 + (l - 1) * 0.1,
  commonDrops: [
    {
      chance: 0.85,
      rollCount: [1, 3],
      pool: [
        { index: 'dagger', name: 'Daga ceremonial', tier: 'mundane', category: 'weapon', weight: 3 },
        { index: 'mace', name: 'Maza oscura', tier: 'mundane', category: 'weapon', weight: 1 },
        { index: 'leather-armor', name: 'Túnica de cuero', tier: 'mundane', category: 'armor', weight: 2 },
      ],
    },
    {
      chance: 0.5,
      rollCount: [1, 2],
      pool: [
        { index: 'potion-of-healing', name: 'Poción de curación', tier: 'uncommon', category: 'consumable', weight: 2 },
        { index: 'potion-of-necrotic-resistance', name: 'Poción de resistencia necrótica', tier: 'uncommon', category: 'consumable', weight: 1 },
      ],
    },
  ],
  encounterDrops: [
    {
      chance: 0.4,
      minLevel: 3,
      pool: [
        { index: 'spell-scroll-animate-dead', name: 'Pergamino: Animar muertos', tier: 'uncommon', category: 'scroll', weight: 2 },
        { index: 'spell-scroll-inflict-wounds', name: 'Pergamino: Infligir heridas', tier: 'uncommon', category: 'scroll', weight: 3 },
        { index: 'spell-scroll-blindness-deafness', name: 'Pergamino: Ceguera/Sordera', tier: 'uncommon', category: 'scroll', weight: 2 },
      ],
    },
    {
      chance: 0.2,
      minLevel: 5,
      pool: [
        { index: 'staff-of-withering', name: 'Bastón marchitante', tier: 'rare', category: 'weapon' },
      ],
    },
  ],
  signature: {
    chance: 0.3,
    items: [
      { index: 'cult-seal', name: 'Sello del culto oscuro', tier: 'uncommon', category: 'quest' },
    ],
  },
}

export const ESPECTROS_UMBRAL_LOOT: LootProfile = {
  goldRange: [0, 10],
  goldScale: () => 1,
  commonDrops: [],
  encounterDrops: [
    {
      chance: 0.35,
      minLevel: 4,
      pool: [
        { index: 'gem-of-seeing', name: 'Gema espectral', tier: 'rare', category: 'gem' },
        { index: 'necklace-of-prayer-beads', name: 'Collar de cuentas de rezo', tier: 'uncommon', category: 'trinket', weight: 2 },
      ],
    },
  ],
  signature: {
    chance: 0.3,
    items: [
      { index: 'phantom-gem', name: 'Gema fantasmal parpadeante', tier: 'uncommon', category: 'gem' },
    ],
  },
}
