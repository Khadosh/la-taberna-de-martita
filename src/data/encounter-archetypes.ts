export type Role = 'melee' | 'ranged' | 'magic' | 'support'

export type ArchetypeEntry = {
  index: string
  role: Role
  base: number  // instancias base (dificultad media, nivel mínimo del rango)
  min: number   // mínimo absoluto (0 = opcional)
  max: number   // máximo razonable en este tipo de encuentro
}

export type Archetype = {
  id: string
  name: string
  environment: string
  levelRange: [number, number]
  pool: ArchetypeEntry[]
  loot?: import('../loot/types').LootProfile
}

export const ARCHETYPES: Archetype[] = [
  // ─── Bosque ───────────────────────────────────────────────────────────────
  {
    id: 'emboscada-goblin',
    name: 'Emboscada Goblin',
    environment: 'Bosque',
    levelRange: [1, 4],
    pool: [
      { index: 'goblin',    role: 'melee',  base: 3, min: 2, max: 6 },
      { index: 'goblin',    role: 'ranged', base: 2, min: 1, max: 4 },
      { index: 'hobgoblin', role: 'melee',  base: 1, min: 0, max: 2 },
      { index: 'worg',      role: 'melee',  base: 1, min: 0, max: 2 },
    ],
  },
  {
    id: 'patrulla-bosque',
    name: 'Patrulla del Bosque',
    environment: 'Bosque',
    levelRange: [1, 5],
    pool: [
      { index: 'bandit',         role: 'melee',  base: 3, min: 2, max: 6 },
      { index: 'scout',          role: 'ranged', base: 2, min: 1, max: 4 },
      { index: 'thug',           role: 'melee',  base: 1, min: 0, max: 2 },
      { index: 'bandit-captain', role: 'melee',  base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'nido-aranas',
    name: 'Nido de Arañas',
    environment: 'Bosque',
    levelRange: [2, 5],
    pool: [
      { index: 'giant-spider',    role: 'melee',   base: 3, min: 2, max: 6 },
      { index: 'ettercap',        role: 'melee',   base: 1, min: 0, max: 2 },
      { index: 'swarm-of-spiders', role: 'support', base: 1, min: 0, max: 3 },
    ],
  },
  {
    id: 'manada-lobos',
    name: 'Manada de Lobos',
    environment: 'Bosque',
    levelRange: [1, 3],
    pool: [
      { index: 'wolf',      role: 'melee', base: 4, min: 2, max: 7 },
      { index: 'dire-wolf', role: 'melee', base: 1, min: 0, max: 2 },
    ],
  },
  {
    id: 'depredadores-bosque',
    name: 'Depredadores',
    environment: 'Bosque',
    levelRange: [1, 4],
    pool: [
      { index: 'brown-bear', role: 'melee', base: 2, min: 1, max: 4 },
      { index: 'giant-boar', role: 'melee', base: 2, min: 1, max: 4 },
    ],
  },

  // ─── Subterráneo ──────────────────────────────────────────────────────────
  {
    id: 'tribu-kobold',
    name: 'Tribu Kobold',
    environment: 'Subterráneo',
    levelRange: [1, 2],
    pool: [
      { index: 'kobold',    role: 'melee',  base: 4, min: 3, max: 7 },
      { index: 'kobold',    role: 'ranged', base: 2, min: 1, max: 4 },
      { index: 'giant-rat', role: 'melee',  base: 1, min: 0, max: 3 },
    ],
  },
  {
    id: 'guardia-duergar',
    name: 'Guardia Duergar',
    environment: 'Subterráneo',
    levelRange: [3, 6],
    pool: [
      { index: 'duergar',      role: 'melee',  base: 4, min: 2, max: 7 },
      { index: 'magma-mephit', role: 'ranged', base: 1, min: 0, max: 3 },
    ],
  },
  {
    id: 'guardia-orco',
    name: 'Guardia Orco',
    environment: 'Subterráneo',
    levelRange: [2, 5],
    pool: [
      { index: 'orc',    role: 'melee',   base: 4, min: 2, max: 6 },
      { index: 'orc',    role: 'ranged',  base: 1, min: 0, max: 3 },
      { index: 'ogre',   role: 'melee',   base: 1, min: 0, max: 1 },
      { index: 'priest', role: 'support', base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'cueva-aberrante',
    name: 'Cueva Aberrante',
    environment: 'Subterráneo',
    levelRange: [3, 7],
    pool: [
      { index: 'grick',            role: 'melee',   base: 2, min: 1, max: 5 },
      { index: 'darkmantle',       role: 'melee',   base: 2, min: 1, max: 4 },
      { index: 'gibbering-mouther', role: 'support', base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'nido-murcielagos',
    name: 'Nido de Murciélagos',
    environment: 'Subterráneo',
    levelRange: [1, 2],
    pool: [
      { index: 'giant-bat',     role: 'melee', base: 3, min: 2, max: 5 },
      { index: 'swarm-of-bats', role: 'melee', base: 2, min: 1, max: 4 },
    ],
  },

  // ─── Cripta ───────────────────────────────────────────────────────────────
  {
    id: 'patrulla-no-muerta',
    name: 'Patrulla No-muerta',
    environment: 'Cripta',
    levelRange: [2, 5],
    pool: [
      { index: 'skeleton', role: 'melee',  base: 3, min: 2, max: 6 },
      { index: 'skeleton', role: 'ranged', base: 2, min: 0, max: 4 },
      { index: 'zombie',   role: 'melee',  base: 2, min: 1, max: 4 },
      { index: 'wight',    role: 'melee',  base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'guardia-cripta',
    name: 'Guardia de la Cripta',
    environment: 'Cripta',
    levelRange: [3, 6],
    pool: [
      { index: 'ghoul',   role: 'melee',   base: 3, min: 2, max: 5 },
      { index: 'shadow',  role: 'support', base: 1, min: 0, max: 3 },
      { index: 'specter', role: 'support', base: 1, min: 0, max: 2 },
    ],
  },
  {
    id: 'horda-zombies',
    name: 'Horda de Zombies',
    environment: 'Cripta',
    levelRange: [1, 4],
    pool: [
      { index: 'zombie',      role: 'melee', base: 5, min: 3, max: 7 },
      { index: 'ogre-zombie', role: 'melee', base: 1, min: 0, max: 1 },
    ],
  },
  {
    id: 'culto-oscuro',
    name: 'Culto Oscuro',
    environment: 'Cripta',
    levelRange: [3, 6],
    pool: [
      { index: 'cultist',      role: 'melee',   base: 3, min: 2, max: 5 },
      { index: 'cult-fanatic', role: 'magic',   base: 1, min: 1, max: 2 },
      { index: 'shadow',       role: 'support', base: 1, min: 0, max: 2 },
    ],
  },
  {
    id: 'espectros-umbral',
    name: 'Espectros del Umbral',
    environment: 'Cripta',
    levelRange: [4, 7],
    pool: [
      { index: 'specter',    role: 'ranged', base: 3, min: 2, max: 5 },
      { index: 'will-o-wisp', role: 'support', base: 1, min: 0, max: 2 },
      { index: 'wraith',     role: 'magic',  base: 0, min: 0, max: 1 },
    ],
  },

  // ─── Planicie ─────────────────────────────────────────────────────────────
  {
    id: 'banda-bandoleros',
    name: 'Banda de Bandoleros',
    environment: 'Planicie',
    levelRange: [1, 5],
    pool: [
      { index: 'bandit',         role: 'melee',  base: 3, min: 2, max: 6 },
      { index: 'bandit',         role: 'ranged', base: 2, min: 1, max: 4 },
      { index: 'thug',           role: 'melee',  base: 1, min: 0, max: 3 },
      { index: 'bandit-captain', role: 'melee',  base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'tribu-orco',
    name: 'Tribu Orco',
    environment: 'Planicie',
    levelRange: [2, 5],
    pool: [
      { index: 'orc',       role: 'melee', base: 4, min: 3, max: 7 },
      { index: 'berserker', role: 'melee', base: 1, min: 0, max: 2 },
    ],
  },
  {
    id: 'rastreadores-gnoll',
    name: 'Rastreadores Gnoll',
    environment: 'Planicie',
    levelRange: [2, 5],
    pool: [
      { index: 'gnoll',       role: 'melee',  base: 3, min: 2, max: 5 },
      { index: 'gnoll',       role: 'ranged', base: 1, min: 0, max: 3 },
      { index: 'hyena',       role: 'melee',  base: 2, min: 1, max: 4 },
      { index: 'giant-hyena', role: 'melee',  base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'jinetes-lobos',
    name: 'Jinetes Lobos',
    environment: 'Planicie',
    levelRange: [2, 5],
    pool: [
      { index: 'goblin',    role: 'melee',  base: 2, min: 1, max: 4 },
      { index: 'goblin',    role: 'ranged', base: 1, min: 0, max: 3 },
      { index: 'worg',      role: 'melee',  base: 2, min: 1, max: 4 },
      { index: 'hobgoblin', role: 'melee',  base: 1, min: 0, max: 2 },
    ],
  },
  {
    id: 'mercenarios-elite',
    name: 'Mercenarios Elite',
    environment: 'Planicie',
    levelRange: [4, 8],
    pool: [
      { index: 'veteran', role: 'melee',  base: 2, min: 1, max: 4 },
      { index: 'spy',     role: 'melee',  base: 1, min: 0, max: 3 },
      { index: 'knight',  role: 'melee',  base: 1, min: 0, max: 2 },
    ],
  },

  // ─── Castillo ─────────────────────────────────────────────────────────────
  {
    id: 'guardia-real',
    name: 'Guardia Real',
    environment: 'Castillo',
    levelRange: [3, 7],
    pool: [
      { index: 'guard',  role: 'melee', base: 4, min: 2, max: 6 },
      { index: 'knight', role: 'melee', base: 1, min: 0, max: 2 },
      { index: 'mage',   role: 'magic', base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'espias-infiltrados',
    name: 'Espías Infiltrados',
    environment: 'Castillo',
    levelRange: [4, 8],
    pool: [
      { index: 'spy',      role: 'melee', base: 2, min: 1, max: 4 },
      { index: 'thug',     role: 'melee', base: 2, min: 1, max: 4 },
      { index: 'assassin', role: 'melee', base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'cultistas-torre',
    name: 'Cultistas de la Torre',
    environment: 'Castillo',
    levelRange: [3, 6],
    pool: [
      { index: 'cultist',      role: 'melee',   base: 3, min: 2, max: 5 },
      { index: 'cult-fanatic', role: 'magic',   base: 1, min: 1, max: 2 },
      { index: 'mage',         role: 'magic',   base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'guardianes-magicos',
    name: 'Guardianes Mágicos',
    environment: 'Castillo',
    levelRange: [3, 7],
    pool: [
      { index: 'animated-armor', role: 'melee', base: 2, min: 1, max: 4 },
      { index: 'flying-sword',   role: 'melee', base: 3, min: 1, max: 5 },
      { index: 'gargoyle',       role: 'melee', base: 1, min: 0, max: 2 },
    ],
  },

  // ─── Averno ───────────────────────────────────────────────────────────────
  {
    id: 'elementales-fuego',
    name: 'Elementales de Fuego',
    environment: 'Averno',
    levelRange: [5, 8],
    pool: [
      { index: 'magma-mephit',   role: 'ranged', base: 3, min: 2, max: 5 },
      { index: 'fire-elemental', role: 'melee',  base: 1, min: 1, max: 2 },
    ],
  },
  {
    id: 'legiones-infernales',
    name: 'Legiones Infernales',
    environment: 'Averno',
    levelRange: [5, 9],
    pool: [
      { index: 'imp',          role: 'support', base: 2, min: 1, max: 4 },
      { index: 'bearded-devil', role: 'melee',  base: 2, min: 1, max: 4 },
      { index: 'barbed-devil',  role: 'ranged', base: 1, min: 0, max: 2 },
    ],
  },

  // ─── Costa ────────────────────────────────────────────────────────────────
  {
    id: 'piratas-corsarios',
    name: 'Piratas Corsarios',
    environment: 'Costa',
    levelRange: [1, 4],
    pool: [
      { index: 'bandit',         role: 'melee',  base: 3, min: 2, max: 5 },
      { index: 'bandit',         role: 'ranged', base: 2, min: 1, max: 4 },
      { index: 'thug',           role: 'melee',  base: 1, min: 0, max: 3 },
      { index: 'bandit-captain', role: 'melee',  base: 0, min: 0, max: 1 },
    ],
  },
  {
    id: 'sahuagin-raid',
    name: 'Incursión Sahuagin',
    environment: 'Costa',
    levelRange: [2, 5],
    pool: [
      { index: 'sahuagin',   role: 'melee', base: 4, min: 2, max: 6 },
      { index: 'reef-shark', role: 'melee', base: 2, min: 1, max: 3 },
      { index: 'merrow',     role: 'melee', base: 0, min: 0, max: 1 },
    ],
  },

  // ─── Montaña ──────────────────────────────────────────────────────────────
  {
    id: 'gigantes-colinas',
    name: 'Gigantes de las Colinas',
    environment: 'Montaña',
    levelRange: [5, 9],
    pool: [
      { index: 'ogre',         role: 'melee',  base: 3, min: 1, max: 5 },
      { index: 'hill-giant',   role: 'melee',  base: 1, min: 0, max: 2 },
      { index: 'giant-vulture', role: 'ranged', base: 2, min: 0, max: 3 },
    ],
  },
  {
    id: 'vuelo-griffons',
    name: 'Vuelo de Griffons',
    environment: 'Montaña',
    levelRange: [3, 6],
    pool: [
      { index: 'griffon', role: 'melee',  base: 2, min: 1, max: 4 },
      { index: 'harpy',   role: 'ranged', base: 2, min: 1, max: 4 },
    ],
  },
]

export const ENVIRONMENTS = [...new Set(ARCHETYPES.map(a => a.environment))]
