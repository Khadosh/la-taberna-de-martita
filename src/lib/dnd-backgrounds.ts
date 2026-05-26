export type StatKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface Background {
  name: string
  abilities: readonly [StatKey, StatKey, StatKey]
  skills: string[]
  tool: string
  desc: string
}

export const BACKGROUNDS: Record<string, Background> = {
  acolyte: {
    name: 'Acólito',
    abilities: ['int', 'wis', 'cha'],
    skills: ['Insight', 'Religion'],
    tool: 'Suministros de calígrafo',
    desc: 'Pasaste tu vida al servicio de un templo, ya sea como sacerdote, curador o devoto.',
  },
  criminal: {
    name: 'Criminal',
    abilities: ['dex', 'int', 'cha'],
    skills: ['Deception', 'Stealth'],
    tool: 'Herramientas de ladrón',
    desc: 'Tenés historial en el lado oscuro de la sociedad y sabés cómo moverte sin ser visto.',
  },
  sage: {
    name: 'Sabio',
    abilities: ['con', 'int', 'wis'],
    skills: ['Arcana', 'History'],
    tool: 'Suministros de calígrafo',
    desc: 'Pasaste años aprendiendo los secretos del mundo: runas antiguas, textos prohibidos y magia.',
  },
  soldier: {
    name: 'Soldado',
    abilities: ['str', 'dex', 'con'],
    skills: ['Athletics', 'Intimidation'],
    tool: 'Juego de mesa (a elegir)',
    desc: 'La guerra fue tu oficio. Entrenaste, combatiste y sobreviviste.',
  },
}

export const ABILITY_LABELS_ES: Record<StatKey, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}
