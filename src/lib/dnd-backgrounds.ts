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
  artisan: {
    name: 'Artesano',
    abilities: ['str', 'dex', 'int'],
    skills: ['Investigation', 'Persuasion'],
    tool: 'Herramientas de artesano (a elegir)',
    desc: 'Aprendiste un oficio artesanal y sabes el valor del trabajo bien hecho.',
  },
  charlatan: {
    name: 'Charlatán',
    abilities: ['dex', 'con', 'cha'],
    skills: ['Deception', 'Sleight of Hand'],
    tool: 'Kit de falsificación',
    desc: 'Siempre supiste que la gente quiere creer lo mejor (y lo peor) de sí misma.',
  },
  criminal: {
    name: 'Criminal',
    abilities: ['dex', 'int', 'cha'],
    skills: ['Deception', 'Stealth'],
    tool: 'Herramientas de ladrón',
    desc: 'Tenés historial en el lado oscuro de la sociedad y sabés cómo moverte sin ser visto.',
  },
  entertainer: {
    name: 'Artista',
    abilities: ['str', 'dex', 'cha'],
    skills: ['Acrobatics', 'Performance'],
    tool: 'Instrumento musical (a elegir)',
    desc: 'Prosperás frente al público. Tu arte cautiva multitudes.',
  },
  farmer: {
    name: 'Labrador',
    abilities: ['str', 'con', 'wis'],
    skills: ['Animal Handling', 'Nature'],
    tool: 'Herramientas de carpintero',
    desc: 'Creciste conectado a la tierra y a los ciclos de la naturaleza.',
  },
  guard: {
    name: 'Guardián',
    abilities: ['str', 'int', 'cha'],
    skills: ['Athletics', 'Perception'],
    tool: 'Juego de mesa (a elegir)',
    desc: 'Tu vida ha estado dedicada a proteger personas, lugares o intereses importantes.',
  },
  guide: {
    name: 'Guía',
    abilities: ['dex', 'con', 'wis'],
    skills: ['Stealth', 'Survival'],
    tool: 'Herramientas de cartografía',
    desc: 'Conocés los caminos y senderos de las tierras salvajes como pocos.',
  },
  hermit: {
    name: 'Ermitaño',
    abilities: ['con', 'wis', 'cha'],
    skills: ['Medicine', 'Religion'],
    tool: 'Herramientas de herboristería',
    desc: 'Viviste en reclusión, en un monasterio, en el bosque o en las montañas.',
  },
  merchant: {
    name: 'Mercader',
    abilities: ['con', 'int', 'cha'],
    skills: ['Animal Handling', 'Persuasion'],
    tool: 'Herramientas de navegante',
    desc: 'Conocés el valor de las cosas y el arte del trato comercial.',
  },
  noble: {
    name: 'Noble',
    abilities: ['str', 'int', 'cha'],
    skills: ['History', 'Persuasion'],
    tool: 'Juego de mesa (a elegir)',
    desc: 'Entendés la riqueza, el poder y el privilegio que vienen con el linaje.',
  },
  sage: {
    name: 'Sabio',
    abilities: ['con', 'int', 'wis'],
    skills: ['Arcana', 'History'],
    tool: 'Suministros de calígrafo',
    desc: 'Pasaste años aprendiendo los secretos del mundo: runas antiguas, textos prohibidos y magia.',
  },
  sailor: {
    name: 'Marinero',
    abilities: ['str', 'dex', 'wis'],
    skills: ['Athletics', 'Perception'],
    tool: 'Herramientas de navegante',
    desc: 'Recorriste mares y ríos durante años. Tu experiencia en el agua es incomparable.',
  },
  scribe: {
    name: 'Escriba',
    abilities: ['dex', 'int', 'wis'],
    skills: ['Investigation', 'Perception'],
    tool: 'Suministros de calígrafo',
    desc: 'Pasaste tu juventud copiando documentos y aprendiendo los secretos de las palabras.',
  },
  soldier: {
    name: 'Soldado',
    abilities: ['str', 'dex', 'con'],
    skills: ['Athletics', 'Intimidation'],
    tool: 'Juego de mesa (a elegir)',
    desc: 'La guerra fue tu oficio. Entrenaste, combatiste y sobreviviste.',
  },
  wayfarer: {
    name: 'Viajero',
    abilities: ['dex', 'wis', 'cha'],
    skills: ['Insight', 'Stealth'],
    tool: 'Herramientas de ladrón',
    desc: 'Llevas toda tu vida en movimiento, de ciudad en ciudad, de tierra en tierra.',
  },
}

export const ABILITY_LABELS_ES: Record<StatKey, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}
