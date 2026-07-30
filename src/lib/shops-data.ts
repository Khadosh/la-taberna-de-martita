import type { Localized } from '../i18n'

export interface ShopDef {
  id: 'armeria' | 'provisiones' | 'alquimia' | 'artesanos'
  label: Localized
  icon: string
  flavor: Localized
  categories: readonly string[]
  filter?: (name: string) => boolean
}

export type ShopId = ShopDef['id']

function isMagicOrAlchemy(name: string): boolean {
  const n = name.toLowerCase()
  return (
    n.includes('potion') || n.includes('scroll') || n.includes('oil') ||
    n.includes('vial') || n.includes('acid') || n.includes('poison') ||
    n.includes('antitoxin') || n.includes('ink') || n.includes('alchemist') ||
    n.includes('herbalism') || n.includes('holy water') || n.includes('perfume')
  )
}

export const SHOPS: readonly ShopDef[] = [
  {
    id: 'armeria',
    label: { es: 'Armería', en: 'Armoury' },
    icon: '⚔️',
    flavor: {
      es: 'El martilleo de la forja resuena mientras observas hileras de espadas templadas, escudos de acero y cotas de malla relucientes.',
      en: 'The hammering of the forge echoes while you take in rows of tempered swords, steel shields and gleaming chain mail.',
    },
    categories: ['weapon', 'armor'],
  },
  {
    id: 'provisiones',
    label: { es: 'Provisiones', en: 'Provisions' },
    icon: '🎒',
    flavor: {
      es: 'Cuerdas de cáñamo, antorchas, raciones secas y todo el equipo esencial que un explorador necesita para adentrarse en las ruinas.',
      en: 'Hempen rope, torches, dried rations and every essential a delver needs before heading into the ruins.',
    },
    categories: ['adventuring-gear'],
    filter: (name: string) => !isMagicOrAlchemy(name),
  },
  {
    id: 'alquimia',
    label: { es: 'Alquimia y Magia', en: 'Alchemy & Magic' },
    icon: '🧪',
    flavor: {
      es: 'Frascos con líquidos luminiscentes, ungüentos extraños y pergaminos cargados con leves rastros de energía arcana.',
      en: 'Flasks of luminescent liquid, strange salves and scrolls humming with faint traces of arcane energy.',
    },
    categories: ['adventuring-gear'],
    filter: (name: string) => isMagicOrAlchemy(name),
  },
  {
    id: 'artesanos',
    label: { es: 'Gremio de Artesanos', en: "Artisans' Guild" },
    icon: '🛠️',
    flavor: {
      es: 'Herramientas de precisión para toda clase de oficios, desde ganzúas de ladrón hasta instrumentos musicales de fina madera.',
      en: 'Precision tools for every trade, from thieves’ picks to musical instruments of fine wood.',
    },
    categories: ['tools'],
  },
]
