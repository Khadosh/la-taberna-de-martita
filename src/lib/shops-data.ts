export interface ShopDef {
  id: 'armeria' | 'provisiones' | 'alquimia' | 'artesanos'
  label: string
  icon: string
  flavor: string
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
    label: 'Armería',
    icon: '⚔️',
    flavor: 'El martilleo de la forja resuena mientras observas hileras de espadas templadas, escudos de acero y cotas de malla relucientes.',
    categories: ['weapon', 'armor'],
  },
  {
    id: 'provisiones',
    label: 'Provisiones',
    icon: '🎒',
    flavor: 'Cuerdas de cáñamo, antorchas, raciones secas y todo el equipo esencial que un explorador necesita para adentrarse en las ruinas.',
    categories: ['adventuring-gear'],
    filter: (name: string) => !isMagicOrAlchemy(name),
  },
  {
    id: 'alquimia',
    label: 'Alquimia y Magia',
    icon: '🧪',
    flavor: 'Frascos con líquidos luminiscentes, ungüentos extraños y pergaminos cargados con leves rastros de energía arcana.',
    categories: ['adventuring-gear'],
    filter: (name: string) => isMagicOrAlchemy(name),
  },
  {
    id: 'artesanos',
    label: 'Gremio de Artesanos',
    icon: '🛠️',
    flavor: 'Herramientas de precisión para toda clase de oficios, desde ganzúas de ladrón hasta instrumentos musicales de fina madera.',
    categories: ['tools'],
  },
]
