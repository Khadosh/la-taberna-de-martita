export const FIGHTING_STYLES_BY_CLASS: Record<string, { id: string; name: string; desc: string }[]> = {
  ranger: [
    { id: 'archery', name: 'Tiro con arco', desc: '+2 a las tiradas de ataque con armas a distancia.' },
    { id: 'defense', name: 'Defensa', desc: '+1 a la CA mientras llevés armadura.' },
    { id: 'dueling', name: 'Duelo', desc: '+2 al daño con arma a una mano si no tenés otra.' },
    { id: 'two-weapon-fighting', name: 'Combate con dos armas', desc: 'Agregás el mod de característica al daño del ataque secundario.' },
  ],
  fighter: [
    { id: 'archery', name: 'Tiro con arco', desc: '+2 a las tiradas de ataque con armas a distancia.' },
    { id: 'defense', name: 'Defensa', desc: '+1 a la CA mientras llevés armadura.' },
    { id: 'dueling', name: 'Duelo', desc: '+2 al daño con arma a una mano si no tenés otra.' },
    { id: 'great-weapon-fighting', name: 'Arma a dos manos', desc: 'Repetís 1s y 2s en dados de daño con armas de dos manos o versátiles.' },
    { id: 'protection', name: 'Protección', desc: 'Reacción + escudo: impone desventaja en ataques a aliados adyacentes.' },
    { id: 'two-weapon-fighting', name: 'Combate con dos armas', desc: 'Agregás el mod de característica al daño del ataque secundario.' },
  ],
  paladin: [
    { id: 'defense', name: 'Defensa', desc: '+1 a la CA mientras llevés armadura.' },
    { id: 'dueling', name: 'Duelo', desc: '+2 al daño con arma a una mano si no tenés otra.' },
    { id: 'great-weapon-fighting', name: 'Arma a dos manos', desc: 'Repetís 1s y 2s en dados de daño con armas de dos manos o versátiles.' },
    { id: 'protection', name: 'Protección', desc: 'Reacción + escudo: impone desventaja en ataques a aliados adyacentes.' },
  ],
}

export const FAVORED_ENEMIES = [
  'Aberraciones', 'Bestias', 'Celestiales', 'Construcciones', 'Dragones',
  'Elementales', 'Feéricos', 'Fiendos', 'Gigantes', 'Monstruosidades',
  'Cienos', 'No muertos', 'Plantas',
  'Humanoides (elfos)', 'Humanoides (enanos)', 'Humanoides (orcos)',
  'Humanoides (goblins)', 'Humanoides (humanos)',
]

// Classes that pick a fixed set of known spells (not prepared casters)
export const KNOWN_SPELL_CASTERS = ['ranger', 'bard', 'sorcerer', 'warlock']

// Minimum level at which each class gains Fighting Style
export const FIGHTING_STYLE_MIN_LEVEL: Record<string, number> = {
  ranger: 2, fighter: 1, paladin: 2,
}

export const CLASSES_WITH_FAVORED_ENEMY = ['ranger']

// Minimum level at which each class chooses its subclass (archetype/domain/tradition/etc.)
export const SUBCLASS_SELECTION_LEVELS: Record<string, number> = {
  barbarian: 3,
  bard: 3,
  cleric: 1,
  druid: 2,
  fighter: 3,
  monk: 3,
  paladin: 3,
  ranger: 3,
  rogue: 3,
  sorcerer: 1,
  warlock: 1,
  wizard: 2,
}

// Get the total number of expertise choices a class has at a given level
export function getExpertiseCount(classIndex: string, level: number): number {
  const cls = classIndex.toLowerCase()
  if (cls === 'rogue') {
    return level >= 6 ? 4 : level >= 1 ? 2 : 0
  }
  if (cls === 'bard') {
    return level >= 10 ? 4 : level >= 3 ? 2 : 0
  }
  return 0
}

