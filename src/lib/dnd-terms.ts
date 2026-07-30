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

export const ABILITY_NAMES: Record<StatKey, Localized> = {
  str: { es: 'Fuerza', en: 'Strength' },
  dex: { es: 'Destreza', en: 'Dexterity' },
  con: { es: 'Constitución', en: 'Constitution' },
  int: { es: 'Inteligencia', en: 'Intelligence' },
  wis: { es: 'Sabiduría', en: 'Wisdom' },
  cha: { es: 'Carisma', en: 'Charisma' },
}
