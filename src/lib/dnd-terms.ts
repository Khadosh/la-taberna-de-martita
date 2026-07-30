/**
 * Nombres de términos del SRD que la interfaz muestra tal cual: pericias y
 * características.
 *
 * No viven en el catálogo de `src/i18n/` porque no son texto de interfaz sino
 * contenido de juego indexado por la clave del SRD (`animal-handling`,
 * `sleight-of-hand`), igual que los trasfondos o los servicios de la taberna.
 * Se resuelven con `useLoc()`.
 */

import type { Localized } from '../i18n'
import type { StatKey } from './dnd-backgrounds'

export const SKILL_NAMES: Record<string, Localized> = {
  acrobatics: { es: 'Acrobacias', en: 'Acrobatics' },
  'animal-handling': { es: 'Trato con animales', en: 'Animal Handling' },
  arcana: { es: 'Conocimiento arcano', en: 'Arcana' },
  athletics: { es: 'Atletismo', en: 'Athletics' },
  deception: { es: 'Engaño', en: 'Deception' },
  history: { es: 'Historia', en: 'History' },
  insight: { es: 'Perspicacia', en: 'Insight' },
  intimidation: { es: 'Intimidación', en: 'Intimidation' },
  investigation: { es: 'Investigación', en: 'Investigation' },
  medicine: { es: 'Medicina', en: 'Medicine' },
  nature: { es: 'Naturaleza', en: 'Nature' },
  perception: { es: 'Percepción', en: 'Perception' },
  performance: { es: 'Actuación', en: 'Performance' },
  persuasion: { es: 'Persuasión', en: 'Persuasion' },
  religion: { es: 'Religión', en: 'Religion' },
  'sleight-of-hand': { es: 'Juego de manos', en: 'Sleight of Hand' },
  stealth: { es: 'Sigilo', en: 'Stealth' },
  survival: { es: 'Supervivencia', en: 'Survival' },
  'thieves-tools': { es: 'Herramientas de ladrón', en: "Thieves' Tools" },
}

/**
 * Solo las razas jugables del SRD. Los monstruos que el DM puede usar como raza
 * de un PNJ llegan por API y se muestran con el nombre que devuelve — traducir
 * 300+ criaturas a mano no se sostiene.
 */
export const RACE_NAMES: Record<string, Localized> = {
  human: { es: 'Humano', en: 'Human' },
  elf: { es: 'Elfo', en: 'Elf' },
  dwarf: { es: 'Enano', en: 'Dwarf' },
  halfling: { es: 'Mediano', en: 'Halfling' },
  dragonborn: { es: 'Dracónido', en: 'Dragonborn' },
  gnome: { es: 'Gnomo', en: 'Gnome' },
  'half-elf': { es: 'Semielfo', en: 'Half-Elf' },
  'half-orc': { es: 'Semiorco', en: 'Half-Orc' },
  tiefling: { es: 'Tiflin', en: 'Tiefling' },
}

export const CLASS_NAMES: Record<string, Localized> = {
  barbarian: { es: 'Bárbaro', en: 'Barbarian' },
  bard: { es: 'Bardo', en: 'Bard' },
  cleric: { es: 'Clérigo', en: 'Cleric' },
  druid: { es: 'Druida', en: 'Druid' },
  fighter: { es: 'Guerrero', en: 'Fighter' },
  monk: { es: 'Monje', en: 'Monk' },
  paladin: { es: 'Paladín', en: 'Paladin' },
  ranger: { es: 'Explorador', en: 'Ranger' },
  rogue: { es: 'Pícaro', en: 'Rogue' },
  sorcerer: { es: 'Hechicero', en: 'Sorcerer' },
  warlock: { es: 'Brujo', en: 'Warlock' },
  wizard: { es: 'Mago', en: 'Wizard' },
}

/** Los dos rasgos de nivel 1 de cada clase, para la vista rápida de party. */
export const CLASS_BASE_FEATURES: Record<string, Localized[]> = {
  barbarian: [{ es: 'Furia', en: 'Rage' }, { es: 'Defensa sin armadura', en: 'Unarmored Defense' }],
  bard: [{ es: 'Inspiración bárdica', en: 'Bardic Inspiration' }, { es: 'Magia bárdica', en: 'Spellcasting' }],
  cleric: [{ es: 'Magia divina', en: 'Spellcasting' }, { es: 'Dominio divino', en: 'Divine Domain' }],
  druid: [{ es: 'Magia druídica', en: 'Spellcasting' }, { es: 'Druídico', en: 'Druidic' }],
  fighter: [{ es: 'Estilo de combate', en: 'Fighting Style' }, { es: 'Recuperación', en: 'Second Wind' }],
  monk: [{ es: 'Defensa sin armadura', en: 'Unarmored Defense' }, { es: 'Artes marciales', en: 'Martial Arts' }],
  paladin: [{ es: 'Sentido divino', en: 'Divine Sense' }, { es: 'Imposición de manos', en: 'Lay on Hands' }],
  ranger: [{ es: 'Enemigo predilecto', en: 'Favored Enemy' }, { es: 'Explorador natural', en: 'Natural Explorer' }],
  rogue: [{ es: 'Ataque furtivo 1d6', en: 'Sneak Attack 1d6' }, { es: 'Acción astuta', en: 'Cunning Action' }],
  sorcerer: [{ es: 'Hechicería', en: 'Spellcasting' }, { es: 'Origen de hechicería', en: 'Sorcerous Origin' }],
  warlock: [{ es: 'Magia de pacto', en: 'Pact Magic' }, { es: 'Patrón de otro mundo', en: 'Otherworldly Patron' }],
  wizard: [{ es: 'Recuperación arcana', en: 'Arcane Recovery' }, { es: 'Magia arcana', en: 'Spellcasting' }],
}

/**
 * Resuelve un nombre de raza o clase que puede venir como índice del SRD
 * (`half-orc`), como nombre ya formateado (`Half-Orc`) o como algo que no está
 * en la tabla —un monstruo usado como raza de PNJ—, en cuyo caso se devuelve tal
 * cual.
 */
export function localizedTerm(
  table: Record<string, Localized>,
  raw: string | null | undefined,
  locale: 'es' | 'en',
): string {
  if (!raw) return ''
  const entry = table[raw.toLowerCase().replace(/\s+/g, '-')]
  return entry ? entry[locale] : raw
}

export const ABILITY_NAMES: Record<StatKey, Localized> = {
  str: { es: 'Fuerza', en: 'Strength' },
  dex: { es: 'Destreza', en: 'Dexterity' },
  con: { es: 'Constitución', en: 'Constitution' },
  int: { es: 'Inteligencia', en: 'Intelligence' },
  wis: { es: 'Sabiduría', en: 'Wisdom' },
  cha: { es: 'Carisma', en: 'Charisma' },
}
