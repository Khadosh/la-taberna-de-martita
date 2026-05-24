import type { CostUnit } from './currency'

export interface ServiceItem {
  id: string
  name: string
  cost: number
  unit: CostUnit
  icon: string
  description: string
  benefit: string
  applyEffect: (char: { name: string }) => {
    hpGain?: number
    tempHpGain?: number
    triggerLongRest?: boolean
    logMsg: string
  }
}

export const DRINKS: ServiceItem[] = [
  {
    id: 'beer',
    name: 'Jarra de Cerveza Rústica',
    cost: 2,
    unit: 'cp',
    icon: '🍺',
    description: 'Bebida rústica y barata de cebada. Algo amarga pero reconfortante.',
    benefit: 'Efecto: Diversión y dolor de cabeza al despertar.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} chocó jarras y bebió una Cerveza Rústica! Siente un leve zumbido en la cabeza.`
    })
  },
  {
    id: 'mead',
    name: 'Hidromiel de la Casa (Receta de Martita)',
    cost: 5,
    unit: 'cp',
    icon: '🍯',
    description: 'Fermentada con miel silvestre de los bosques locales. Dulce y espirituosa.',
    benefit: 'Efecto: Restaura 1 PG de forma inmediata al beber.',
    applyEffect: (char) => ({
      hpGain: 1,
      logMsg: `¡${char.name} bebió la famosa Hidromiel de Martita! Se siente reenergizado (+1 PG).`
    })
  },
  {
    id: 'wine',
    name: 'Copa de Vino de Alto Hort',
    cost: 1,
    unit: 'sp',
    icon: '🍷',
    description: 'Cosecha de uvas selectas del valle de Hort. Deja un regusto a moras y especias.',
    benefit: 'Efecto: Otorga +1 a tiradas de Carisma por la siguiente hora.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} saboreó un Vino de Alto Hort! Un calor placentero relaja su lengua (+1 a tiradas de Carisma por 1 hora).`
    })
  },
  {
    id: 'dwarf_spirit',
    name: 'Licor de Fuego Enano',
    cost: 5,
    unit: 'sp',
    icon: '🥃',
    description: 'Fuerte como el yunque. Quema la garganta y calienta hasta los huesos más fríos.',
    benefit: 'Efecto: Ventaja en salvaciones de Fuerza pero desventaja en Destreza por 1 hora.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} tragó un Licor de Fuego Enano de un solo golpe! Siente la solidez de la piedra en los músculos (Ventaja en Fuerza, Desventaja en Destreza por 1 hora).`
    })
  },
  {
    id: 'holy_water',
    name: 'Agua Sagrada de Manantial',
    cost: 1,
    unit: 'gp',
    icon: '🧪',
    description: 'Agua bendecida por clérigos de la luz, destilada en frascos limpios.',
    benefit: 'Efecto: Sana 2d4+2 PG (cura heridas como una poción ligera).',
    applyEffect: (char) => {
      const roll = Math.ceil(Math.random() * 4) + Math.ceil(Math.random() * 4) + 2
      return {
        hpGain: roll,
        logMsg: `¡${char.name} bebió Agua Sagrada de Manantial! Sus heridas se cierran con un destello brillante (+${roll} PG).`
      }
    }
  }
]

export const FOODS: ServiceItem[] = [
  {
    id: 'broth',
    name: 'Caldo de Sobras de la Olla',
    cost: 3,
    unit: 'cp',
    icon: '🥣',
    description: 'Una mezcla misteriosa hervida a fuego lento. Llena el estómago si no preguntas qué contiene.',
    benefit: 'Efecto: Calienta las entrañas. Sin beneficios adicionales.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} comió un plato de Caldo de Sobras! Está caliente y algo grasoso.`
    })
  },
  {
    id: 'stew',
    name: 'Estofado de Jabalí Silvestre',
    cost: 1,
    unit: 'sp',
    icon: '🍲',
    description: 'Guiso espeso de carne magra de jabalí con tubérculos y hierbas de monte.',
    benefit: 'Efecto: Nutritivo. Otorga +2 PG temporales al comer.',
    applyEffect: (char) => ({
      tempHpGain: 2,
      logMsg: `¡${char.name} disfrutó de un plato de Estofado de Jabalí! Se siente robusto y satisfecho (+2 PG Temporales).`
    })
  },
  {
    id: 'roast',
    name: 'Asado de Quimera Especiado',
    cost: 5,
    unit: 'sp',
    icon: '🍖',
    description: 'Carne exótica sazonada con especias picantes del desierto y asada a fuego directo.',
    benefit: 'Efecto: Otorga +5 PG temporales debido al vigor exótico.',
    applyEffect: (char) => ({
      tempHpGain: 5,
      logMsg: `¡${char.name} devoró el Asado de Quimera Especiado! Una explosión de sabor vigorizante (+5 PG Temporales).`
    })
  },
  {
    id: 'feast',
    name: 'Banquete de Héroes del Gremio',
    cost: 10,
    unit: 'gp',
    icon: '🍽️',
    description: 'Una mesa repleta de las mejores carnes, panes, quesos y pasteles, bendecida para dar vigor.',
    benefit: 'Efecto: Otorga ventaja en salvaciones contra veneno y miedo por 8 horas, y +10 PG temporales.',
    applyEffect: (char) => ({
      tempHpGain: 10,
      logMsg: `¡${char.name} celebró con el Banquete de Héroes! La comida mística purifica su cuerpo (+10 PG Temporales y ventaja contra Veneno/Miedo por 8 horas).`
    })
  }
]

export const LODGINGS: ServiceItem[] = [
  {
    id: 'stables',
    name: 'Paja junto al Establo',
    cost: 2,
    unit: 'cp',
    icon: '🐎',
    description: 'Un espacio templado cerca de los animales. Huele a estiércol y hay pulgas, pero es barato.',
    benefit: 'Efecto: Restaura HP pero no recuperas Dados de Golpe por la incomodidad.',
    applyEffect: (char) => ({
      logMsg: `¡${char.name} pasó la noche en las caballerizas! Descansó a medias entre relinchos y picaduras de pulga.`
    })
  },
  {
    id: 'shared',
    name: 'Catre en Habitación Compartida',
    cost: 1,
    unit: 'sp',
    icon: '🛏️',
    description: 'Habitación ruidosa con otras diez personas roncando. Las camas son algo duras.',
    benefit: 'Efecto: Realiza un Descanso Largo estándar (HP máximo y restaura la mitad de tus Dados de Golpe).',
    applyEffect: (char) => ({
      triggerLongRest: true,
      logMsg: `¡${char.name} durmió en la habitación compartida! Completó un Descanso Largo estándar.`
    })
  },
  {
    id: 'private',
    name: 'Habitación Privada Confortable',
    cost: 5,
    unit: 'sp',
    icon: '🔑',
    description: 'Habitación individual con cerrojo, chimenea y una cama mullida de plumas.',
    benefit: 'Efecto: Descanso Largo. Cura un nivel de fatiga / condición simple.',
    applyEffect: (char) => ({
      triggerLongRest: true,
      logMsg: `¡${char.name} durmió plácidamente en una cómoda habitación privada! Completó un Descanso Largo.`
    })
  },
  {
    id: 'suite',
    name: 'Suite Real de la Taberna',
    cost: 2,
    unit: 'gp',
    icon: '👑',
    description: 'La mejor habitación. Sábanas de seda fina, baño de agua caliente tina y licor de cortesía.',
    benefit: 'Efecto: Descanso Largo. Cura fatiga y condiciones y otorga +5 PG temporales al despertar.',
    applyEffect: (char) => ({
      triggerLongRest: true,
      tempHpGain: 5,
      logMsg: `¡${char.name} se hospedó con lujos reales en la Suite de la Taberna! Despierta completamente renovado (+5 PG Temporales).`
    })
  }
]
