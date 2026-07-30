import type { Localized } from '../i18n'

export type StatKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface Background {
  name: Localized
  abilities: readonly [StatKey, StatKey, StatKey]
  /** Índices de habilidad del SRD: van en inglés porque son claves, no texto. */
  skills: string[]
  tool: Localized
  desc: Localized
}

export const BACKGROUNDS: Record<string, Background> = {
  acolyte: {
    name: { es: 'Acólito', en: 'Acolyte' },
    abilities: ['int', 'wis', 'cha'],
    skills: ['Insight', 'Religion'],
    tool: { es: 'Suministros de calígrafo', en: "Calligrapher's supplies" },
    desc: {
      es: 'Pasaste tu vida al servicio de un templo, ya sea como sacerdote, curador o devoto.',
      en: 'You spent your life in service to a temple, whether as priest, healer or devotee.',
    },
  },
  criminal: {
    name: { es: 'Criminal', en: 'Criminal' },
    abilities: ['dex', 'int', 'cha'],
    skills: ['Deception', 'Stealth'],
    tool: { es: 'Herramientas de ladrón', en: "Thieves' tools" },
    desc: {
      es: 'Tenés historial en el lado oscuro de la sociedad y sabés cómo moverte sin ser visto.',
      en: 'You have a history on the wrong side of the law and know how to move unseen.',
    },
  },
  sage: {
    name: { es: 'Sabio', en: 'Sage' },
    abilities: ['con', 'int', 'wis'],
    skills: ['Arcana', 'History'],
    tool: { es: 'Suministros de calígrafo', en: "Calligrapher's supplies" },
    desc: {
      es: 'Pasaste años aprendiendo los secretos del mundo: runas antiguas, textos prohibidos y magia.',
      en: "You spent years learning the world's secrets: ancient runes, forbidden texts and magic.",
    },
  },
  soldier: {
    name: { es: 'Soldado', en: 'Soldier' },
    abilities: ['str', 'dex', 'con'],
    skills: ['Athletics', 'Intimidation'],
    tool: { es: 'Juego de mesa (a elegir)', en: 'Gaming set (your choice)' },
    desc: {
      es: 'La guerra fue tu oficio. Entrenaste, combatiste y sobreviviste.',
      en: 'War was your trade. You trained, you fought, and you survived.',
    },
  },
}

export const ABILITY_LABELS_ES: Record<StatKey, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

/** Abreviaturas de característica por idioma: el SRD usa STR/DEX/CON/INT/WIS/CHA. */
export const ABILITY_ABBR: Record<'es' | 'en', Record<StatKey, string>> = {
  es: ABILITY_LABELS_ES,
  en: { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' },
}
