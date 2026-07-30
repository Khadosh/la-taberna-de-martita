import type { Localized } from '../../../../i18n'

export const CLASS_FLAVOR: Record<string, { desc: Localized; tags: Localized[] }> = {
  barbarian: {
    desc: { es: 'Un guerrero feroz de trasfondo salvaje que entra en furia.', en: 'A fierce warrior of primal background who can enter a rage.' },
    tags: [{ es: 'Fuerza', en: 'Strength' }],
  },
  bard: {
    desc: { es: 'Un maestro del canto, la oratoria y la magia de apoyo.', en: 'A master of song, speech and supporting magic.' },
    tags: [{ es: 'Carisma', en: 'Charisma' }],
  },
  cleric: {
    desc: { es: 'Un campeón sacerdotal que maneja magia divina.', en: 'A priestly champion who wields divine magic.' },
    tags: [{ es: 'Sabiduría', en: 'Wisdom' }],
  },
  druid: {
    desc: { es: 'Un sacerdote de la naturaleza que adopta formas salvajes.', en: 'A priest of nature who takes on wild shapes.' },
    tags: [{ es: 'Sabiduría', en: 'Wisdom' }],
  },
  fighter: {
    desc: { es: 'Un especialista en combate experto en armas y armaduras.', en: 'A combat specialist skilled with weapons and armour.' },
    tags: [{ es: 'Fuerza/DES', en: 'STR/DEX' }],
  },
  monk: {
    desc: { es: 'Un artista marcial que canaliza su energía física y Ki.', en: 'A martial artist who channels physical energy and Ki.' },
    tags: [{ es: 'Destreza', en: 'Dexterity' }],
  },
  paladin: {
    desc: { es: 'Un guerrero santo ligado a un juramento sagrado.', en: 'A holy warrior bound to a sacred oath.' },
    tags: [{ es: 'Fuerza/CAR', en: 'STR/CHA' }],
  },
  ranger: {
    desc: { es: 'Un cazador y rastreador en las fronteras del mundo.', en: 'A hunter and tracker at the edges of the world.' },
    tags: [{ es: 'Destreza/SAB', en: 'DEX/WIS' }],
  },
  rogue: {
    desc: { es: 'Un combatiente sigiloso que usa la astucia y el ataque furtivo.', en: 'A stealthy fighter who relies on cunning and sneak attacks.' },
    tags: [{ es: 'Destreza', en: 'Dexterity' }],
  },
  sorcerer: {
    desc: { es: 'Un lanzador de conjuros con magia innata heredada.', en: 'A spellcaster with innate, inherited magic.' },
    tags: [{ es: 'Carisma', en: 'Charisma' }],
  },
  warlock: {
    desc: { es: 'Un mago que pacta con entidades de otros mundos.', en: 'A caster who bargains with otherworldly entities.' },
    tags: [{ es: 'Carisma', en: 'Charisma' }],
  },
  wizard: {
    desc: { es: 'Un erudito arcano que domina conjuros por estudio.', en: 'An arcane scholar who masters spells through study.' },
    tags: [{ es: 'Inteligencia', en: 'Intelligence' }],
  },
}

export const RACE_FLAVOR: Record<string, { desc: Localized; traits: Localized }> = {
  dragonborn: {
    desc: { es: 'Descendientes de dragones con aliento elemental.', en: 'Dragon-descended folk with elemental breath.' },
    traits: { es: 'Aliento dragón, Resistencia', en: 'Breath weapon, Resistance' },
  },
  dwarf: {
    desc: { es: 'Minadores y guerreros robustos de reinos montañosos.', en: 'Hardy miners and warriors of mountain realms.' },
    traits: { es: 'Resistencia, Visión nocturna', en: 'Resilience, Darkvision' },
  },
  elf: {
    desc: { es: 'Seres mágicos y gráciles de vida longeva.', en: 'Graceful, magical beings of long life.' },
    traits: { es: 'Sentidos agudos, Ancestros feéricos', en: 'Keen senses, Fey ancestry' },
  },
  gnome: {
    desc: { es: 'Inventores ingeniosos y magos sumamente curiosos.', en: 'Ingenious inventors and endlessly curious mages.' },
    traits: { es: 'Astucia gnómica, Visión nocturna', en: 'Gnome cunning, Darkvision' },
  },
  'half-elf': {
    desc: { es: 'Combinan la gracia élfica con la adaptabilidad humana.', en: 'Elven grace paired with human adaptability.' },
    traits: { es: 'Versatilidad de pericias', en: 'Skill versatility' },
  },
  'half-orc': {
    desc: { es: 'Criaturas robustas de gran fuerza física y furia.', en: 'Powerful folk of great physical strength and fury.' },
    traits: { es: 'Resistencia incansable, Brutal', en: 'Relentless endurance, Savage attacks' },
  },
  halfling: {
    desc: { es: 'Personas amables, hogareñas y afortunadas.', en: 'Kind, homely and remarkably lucky folk.' },
    traits: { es: 'Afortunado, Escurridizo', en: 'Lucky, Nimble' },
  },
  human: {
    desc: { es: 'La raza más adaptable y ambiciosa del multiverso.', en: 'The most adaptable and ambitious people of the multiverse.' },
    traits: { es: 'Versatilidad', en: 'Versatility' },
  },
  tiefling: {
    desc: { es: 'Humanos con herencia demoníaca y afinidad al fuego.', en: 'Humans of infernal heritage with an affinity for fire.' },
    traits: { es: 'Resistencia fuego, Legado infernal', en: 'Fire resistance, Infernal legacy' },
  },
}
