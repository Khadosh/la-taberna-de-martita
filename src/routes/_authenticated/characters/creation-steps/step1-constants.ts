export const CLASS_FLAVOR: Record<string, { desc: string; tags: string[] }> = {
  barbarian: { desc: 'Un guerrero feroz de trasfondo salvaje que entra en furia.', tags: ['Fuerza'] },
  bard: { desc: 'Un maestro del canto, la oratoria y la magia de apoyo.', tags: ['Carisma'] },
  cleric: { desc: 'Un campeón sacerdotal que maneja magia divina.', tags: ['Sabiduría'] },
  druid: { desc: 'Un sacerdote de la naturaleza que adopta formas salvajes.', tags: ['Sabiduría'] },
  fighter: { desc: 'Un especialista en combate experto en armas y armaduras.', tags: ['Fuerza/DES'] },
  monk: { desc: 'Un artista marcial que canaliza su energía física y Ki.', tags: ['Destreza'] },
  paladin: { desc: 'Un guerrero santo ligado a un juramento sagrado.', tags: ['Fuerza/CAR'] },
  ranger: { desc: 'Un cazador y rastreador en las fronteras del mundo.', tags: ['Destreza/SAB'] },
  rogue: { desc: 'Un combatiente sigiloso que usa la astucia y el ataque furtivo.', tags: ['Destreza'] },
  sorcerer: { desc: 'Un lanzador de conjuros con magia innata heredada.', tags: ['Carisma'] },
  warlock: { desc: 'Un mago que pacta con entidades de otros mundos.', tags: ['Carisma'] },
  wizard: { desc: 'Un erudito arcano que domina conjuros por estudio.', tags: ['Inteligencia'] },
}

export const RACE_FLAVOR: Record<string, { desc: string; traits: string }> = {
  dragonborn: { desc: 'Descendientes de dragones con aliento elemental.', traits: 'Aliento dragón, Resistencia' },
  dwarf: { desc: 'Minadores y guerreros robustos de reinos montañosos.', traits: 'Resistencia, Visión nocturna' },
  elf: { desc: 'Seres mágicos y gráciles de vida longeva.', traits: 'Sentidos agudos, Ancestros feéricos' },
  gnome: { desc: 'Inventores ingeniosos y magos sumamente curiosos.', traits: 'Astucia gnómica, Visión nocturna' },
  'half-elf': { desc: 'Combinan la gracia élfica con la adaptabilidad humana.', traits: 'Versatilidad de pericias' },
  'half-orc': { desc: 'Criaturas robustas de gran fuerza física y furia.', traits: 'Resistencia incansable, Brutal' },
  halfling: { desc: 'Personas amables, hogareñas y afortunadas.', traits: 'Afortunado, Escurridizo' },
  human: { desc: 'La raza más adaptable y ambiciosa del multiverso.', traits: 'Versatilidad' },
  tiefling: { desc: 'Humanos con herencia demoníaca y afinidad al fuego.', traits: 'Resistencia fuego, Legado infernal' },
}
