import type { CostUnit } from './currency'
import type { Localized } from '../i18n'

export interface ServiceItem {
  id: string
  name: Localized
  cost: number
  unit: CostUnit
  icon: string
  description: Localized
  benefit: Localized
  applyEffect: (char: { name: string }) => {
    hpGain?: number
    tempHpGain?: number
    triggerLongRest?: boolean
    /**
     * Va al diario de la campaña. Se resuelve al idioma de quien consume, no al
     * de quien lee: la nota queda escrita como la escribió esa persona, igual
     * que las notas que redacta el DM a mano.
     */
    logMsg: Localized
  }
}

export const DRINKS: ServiceItem[] = [
  {
    id: 'beer',
    name: { es: 'Jarra de Cerveza Rústica', en: 'Mug of Rustic Ale' },
    cost: 2,
    unit: 'cp',
    icon: '🍺',
    description: {
      es: 'Bebida rústica y barata de cebada. Algo amarga pero reconfortante.',
      en: 'A cheap, rough barley brew. Bitter, but it warms you up.',
    },
    benefit: {
      es: 'Efecto: Diversión y dolor de cabeza al despertar.',
      en: 'Effect: A good time now, a headache in the morning.',
    },
    applyEffect: (char) => ({
      logMsg: {
        es: `¡${char.name} chocó jarras y bebió una Cerveza Rústica! Siente un leve zumbido en la cabeza.`,
        en: `${char.name} clinked mugs and downed a Rustic Ale! There's a faint buzz behind the eyes.`,
      },
    }),
  },
  {
    id: 'mead',
    name: { es: 'Hidromiel de la Casa (Receta de Martita)', en: "House Mead (Martita's Recipe)" },
    cost: 5,
    unit: 'cp',
    icon: '🍯',
    description: {
      es: 'Fermentada con miel silvestre de los bosques locales. Dulce y espirituosa.',
      en: 'Fermented with wild honey from the local woods. Sweet and spirited.',
    },
    benefit: {
      es: 'Efecto: Restaura 1 PG de forma inmediata al beber.',
      en: 'Effect: Restores 1 HP immediately.',
    },
    applyEffect: (char) => ({
      hpGain: 1,
      logMsg: {
        es: `¡${char.name} bebió la famosa Hidromiel de Martita! Se siente reenergizado (+1 PG).`,
        en: `${char.name} drank Martita's famous mead! Feeling re-energised (+1 HP).`,
      },
    }),
  },
  {
    id: 'wine',
    name: { es: 'Copa de Vino de Alto Hort', en: 'Cup of High Hort Wine' },
    cost: 1,
    unit: 'sp',
    icon: '🍷',
    description: {
      es: 'Cosecha de uvas selectas del valle de Hort. Deja un regusto a moras y especias.',
      en: 'Select grapes from the Hort valley. Leaves an aftertaste of berries and spice.',
    },
    benefit: {
      es: 'Efecto: Otorga +1 a tiradas de Carisma por la siguiente hora.',
      en: 'Effect: +1 to Charisma checks for the next hour.',
    },
    applyEffect: (char) => ({
      logMsg: {
        es: `¡${char.name} saboreó un Vino de Alto Hort! Un calor placentero relaja su lengua (+1 a tiradas de Carisma por 1 hora).`,
        en: `${char.name} savoured a High Hort Wine! A pleasant warmth loosens the tongue (+1 to Charisma checks for 1 hour).`,
      },
    }),
  },
  {
    id: 'dwarf_spirit',
    name: { es: 'Licor de Fuego Enano', en: 'Dwarven Firespirit' },
    cost: 5,
    unit: 'sp',
    icon: '🥃',
    description: {
      es: 'Fuerte como el yunque. Quema la garganta y calienta hasta los huesos más fríos.',
      en: 'Strong as the anvil. Burns the throat and warms the coldest bones.',
    },
    benefit: {
      es: 'Efecto: Ventaja en salvaciones de Fuerza pero desventaja en Destreza por 1 hora.',
      en: 'Effect: Advantage on Strength saves, disadvantage on Dexterity, for 1 hour.',
    },
    applyEffect: (char) => ({
      logMsg: {
        es: `¡${char.name} tragó un Licor de Fuego Enano de un solo golpe! Siente la solidez de la piedra en los músculos (Ventaja en Fuerza, Desventaja en Destreza por 1 hora).`,
        en: `${char.name} threw back a Dwarven Firespirit in one go! Stone-steady muscles, clumsy hands (Advantage on Strength, Disadvantage on Dexterity for 1 hour).`,
      },
    }),
  },
  {
    id: 'holy_water',
    name: { es: 'Agua Sagrada de Manantial', en: 'Blessed Spring Water' },
    cost: 1,
    unit: 'gp',
    icon: '🧪',
    description: {
      es: 'Agua bendecida por clérigos de la luz, destilada en frascos limpios.',
      en: 'Water blessed by clerics of the light, bottled in clean flasks.',
    },
    benefit: {
      es: 'Efecto: Sana 2d4+2 PG (cura heridas como una poción ligera).',
      en: 'Effect: Heals 2d4+2 HP, like a light potion.',
    },
    applyEffect: (char) => {
      const roll = Math.ceil(Math.random() * 4) + Math.ceil(Math.random() * 4) + 2
      return {
        hpGain: roll,
        logMsg: {
          es: `¡${char.name} bebió Agua Sagrada de Manantial! Sus heridas se cierran con un destello brillante (+${roll} PG).`,
          en: `${char.name} drank Blessed Spring Water! Wounds close in a bright flash (+${roll} HP).`,
        },
      }
    },
  },
]

export const FOODS: ServiceItem[] = [
  {
    id: 'broth',
    name: { es: 'Caldo de Sobras de la Olla', en: 'Leftover Pot Broth' },
    cost: 3,
    unit: 'cp',
    icon: '🥣',
    description: {
      es: 'Una mezcla misteriosa hervida a fuego lento. Llena el estómago si no preguntas qué contiene.',
      en: 'A mystery mix on a slow simmer. Filling, as long as you don’t ask what’s in it.',
    },
    benefit: {
      es: 'Efecto: Calienta las entrañas. Sin beneficios adicionales.',
      en: 'Effect: Warms the gut. No further benefit.',
    },
    applyEffect: (char) => ({
      logMsg: {
        es: `¡${char.name} comió un plato de Caldo de Sobras! Está caliente y algo grasoso.`,
        en: `${char.name} ate a bowl of Leftover Broth! Hot, and a little greasy.`,
      },
    }),
  },
  {
    id: 'stew',
    name: { es: 'Estofado de Jabalí Silvestre', en: 'Wild Boar Stew' },
    cost: 1,
    unit: 'sp',
    icon: '🍲',
    description: {
      es: 'Guiso espeso de carne magra de jabalí con tubérculos y hierbas de monte.',
      en: 'A thick stew of lean boar with root vegetables and hill herbs.',
    },
    benefit: {
      es: 'Efecto: Nutritivo. Otorga +2 PG temporales al comer.',
      en: 'Effect: Nourishing. Grants 2 temporary HP.',
    },
    applyEffect: (char) => ({
      tempHpGain: 2,
      logMsg: {
        es: `¡${char.name} disfrutó de un plato de Estofado de Jabalí! Se siente robusto y satisfecho (+2 PG Temporales).`,
        en: `${char.name} enjoyed a bowl of Boar Stew! Sturdy and satisfied (+2 temporary HP).`,
      },
    }),
  },
  {
    id: 'roast',
    name: { es: 'Asado de Quimera Especiado', en: 'Spiced Chimera Roast' },
    cost: 5,
    unit: 'sp',
    icon: '🍖',
    description: {
      es: 'Carne exótica sazonada con especias picantes del desierto y asada a fuego directo.',
      en: 'Exotic meat rubbed with hot desert spices and roasted over open flame.',
    },
    benefit: {
      es: 'Efecto: Otorga +5 PG temporales debido al vigor exótico.',
      en: 'Effect: Grants 5 temporary HP from sheer exotic vigour.',
    },
    applyEffect: (char) => ({
      tempHpGain: 5,
      logMsg: {
        es: `¡${char.name} devoró el Asado de Quimera Especiado! Una explosión de sabor vigorizante (+5 PG Temporales).`,
        en: `${char.name} devoured the Spiced Chimera Roast! A burst of invigorating flavour (+5 temporary HP).`,
      },
    }),
  },
  {
    id: 'feast',
    name: { es: 'Banquete de Héroes del Gremio', en: "Guild Heroes' Feast" },
    cost: 10,
    unit: 'gp',
    icon: '🍽️',
    description: {
      es: 'Una mesa repleta de las mejores carnes, panes, quesos y pasteles, bendecida para dar vigor.',
      en: 'A table piled with the finest meats, breads, cheeses and pastries, blessed for vigour.',
    },
    benefit: {
      es: 'Efecto: Otorga ventaja en salvaciones contra veneno y miedo por 8 horas, y +10 PG temporales.',
      en: 'Effect: Advantage on saves against poison and fear for 8 hours, plus 10 temporary HP.',
    },
    applyEffect: (char) => ({
      tempHpGain: 10,
      logMsg: {
        es: `¡${char.name} celebró con el Banquete de Héroes! La comida mística purifica su cuerpo (+10 PG Temporales y ventaja contra Veneno/Miedo por 8 horas).`,
        en: `${char.name} feasted with the Guild Heroes! The blessed food purifies the body (+10 temporary HP and advantage against Poison/Fear for 8 hours).`,
      },
    }),
  },
]

export const LODGINGS: ServiceItem[] = [
  {
    id: 'stables',
    name: { es: 'Paja junto al Establo', en: 'Straw by the Stable' },
    cost: 2,
    unit: 'cp',
    icon: '🐎',
    description: {
      es: 'Un espacio templado cerca de los animales. Huele a estiércol y hay pulgas, pero es barato.',
      en: 'A warm spot near the animals. Smells of dung and there are fleas, but it’s cheap.',
    },
    benefit: {
      es: 'Efecto: Restaura HP pero no recuperas Dados de Golpe por la incomodidad.',
      en: 'Effect: Restores HP, but no Hit Dice back — you slept badly.',
    },
    applyEffect: (char) => ({
      logMsg: {
        es: `¡${char.name} pasó la noche en las caballerizas! Descansó a medias entre relinchos y picaduras de pulga.`,
        en: `${char.name} spent the night in the stables! Half-rested, between whinnies and flea bites.`,
      },
    }),
  },
  {
    id: 'shared',
    name: { es: 'Catre en Habitación Compartida', en: 'Cot in a Shared Room' },
    cost: 1,
    unit: 'sp',
    icon: '🛏️',
    description: {
      es: 'Habitación ruidosa con otras diez personas roncando. Las camas son algo duras.',
      en: 'A noisy room with ten other people snoring. The beds are on the hard side.',
    },
    benefit: {
      es: 'Efecto: Realiza un Descanso Largo estándar (HP máximo y restaura la mitad de tus Dados de Golpe).',
      en: 'Effect: A standard Long Rest — full HP and half your Hit Dice back.',
    },
    applyEffect: (char) => ({
      triggerLongRest: true,
      logMsg: {
        es: `¡${char.name} durmió en la habitación compartida! Completó un Descanso Largo estándar.`,
        en: `${char.name} slept in the shared room! Completed a standard Long Rest.`,
      },
    }),
  },
  {
    id: 'private',
    name: { es: 'Habitación Privada Confortable', en: 'Comfortable Private Room' },
    cost: 5,
    unit: 'sp',
    icon: '🔑',
    description: {
      es: 'Habitación individual con cerrojo, chimenea y una cama mullida de plumas.',
      en: 'A single room with a bolt on the door, a fireplace and a soft feather bed.',
    },
    benefit: {
      es: 'Efecto: Descanso Largo. Cura un nivel de fatiga / condición simple.',
      en: 'Effect: Long Rest. Clears one level of exhaustion or a simple condition.',
    },
    applyEffect: (char) => ({
      triggerLongRest: true,
      logMsg: {
        es: `¡${char.name} durmió plácidamente en una cómoda habitación privada! Completó un Descanso Largo.`,
        en: `${char.name} slept soundly in a comfortable private room! Completed a Long Rest.`,
      },
    }),
  },
  {
    id: 'suite',
    name: { es: 'Suite Real de la Taberna', en: 'The Tavern Royal Suite' },
    cost: 2,
    unit: 'gp',
    icon: '👑',
    description: {
      es: 'La mejor habitación. Sábanas de seda fina, baño de agua caliente tina y licor de cortesía.',
      en: 'The best room in the house. Fine silk sheets, a hot bath and a complimentary drink.',
    },
    benefit: {
      es: 'Efecto: Descanso Largo. Cura fatiga y condiciones y otorga +5 PG temporales al despertar.',
      en: 'Effect: Long Rest. Clears exhaustion and conditions, and grants 5 temporary HP on waking.',
    },
    applyEffect: (char) => ({
      triggerLongRest: true,
      tempHpGain: 5,
      logMsg: {
        es: `¡${char.name} se hospedó con lujos reales en la Suite de la Taberna! Despierta completamente renovado (+5 PG Temporales).`,
        en: `${char.name} stayed in royal comfort in the Tavern Suite! Wakes fully restored (+5 temporary HP).`,
      },
    }),
  },
]
