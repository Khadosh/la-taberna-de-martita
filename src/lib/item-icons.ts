import { BG3_ICON_MAP } from './bg3-icon-map'
import { BG3_SPELL_MAP } from './bg3-spell-map'

// Normalize: lowercase, no accents, collapse whitespace
const n = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

// Custom icon overrides generated for D&D 5e items using public/assets/icons/custom/
const CUSTOM_ICON_MAP: Record<string, string> = {
  'thieves tools': '/assets/icons/custom/thieves_tools.png',
  'alchemists supplies': '/assets/icons/custom/alchemists_supplies.png',
  'poisoners kit': '/assets/icons/custom/poisoners_kit.png',
  'herbalism kit': '/assets/icons/custom/herbalism_kit.png',
  'caltrops': '/assets/icons/custom/caltrops.png',
  'tinderbox': '/assets/icons/custom/tinderbox.png',
  'rope hempen 50 feet': '/assets/icons/custom/hempen_rope.png',
  'rope hempen': '/assets/icons/custom/hempen_rope.png',
  'hempen rope': '/assets/icons/custom/hempen_rope.png'
}

// Build all candidate lookup strings for a raw name.
function candidates(raw: string): string[] {
  const base = n(raw)
  const uk   = base.replace(/\barmo(u?)r/g, 'armour')
  const us   = base.replace(/\barmo(u?)r/g, 'armor')
  const set  = new Set<string>([base, uk, us])

  if (base.includes(',')) {
    const parts    = base.split(',').map(p => p.trim()).filter(Boolean)
    const reversed = [...parts].reverse().join(' ')
    const noComma  = parts.join(' ')
    for (const v of [reversed, noComma]) {
      set.add(v)
      set.add(v.replace(/\barmo(u?)r/g, 'armour'))
      set.add(v.replace(/\barmo(u?)r/g, 'armor'))
    }
  }

  return [...set]
}

function wordSetMatch(needle: string, haystack: string): boolean {
  const hw = new Set(haystack.split(' '))
  return needle.split(' ').every(w => hw.has(w))
}

function getMapIcon(key: string): string | null {
  return BG3_ICON_MAP[key] ?? null
}

function hasWords(s: string, ...terms: string[]): boolean {
  return terms.some(term => {
    const norm = n(term)
    return ` ${s} `.includes(` ${norm} `)
  })
}

export function getItemIconUrl(name: string): string | null {
  const s  = n(name)

  // 0. Custom high-fidelity overrides
  if (CUSTOM_ICON_MAP[s]) return CUSTOM_ICON_MAP[s]

  const cs = candidates(name)

  // 1. Exact match on any candidate
  for (const c of cs) {
    if (BG3_ICON_MAP[c]) return BG3_ICON_MAP[c]
  }

  // 2. Key starts with candidate + space OR candidate contains key OR word-set match
  let wordSetResult: string | null = null
  for (const [key, url] of Object.entries(BG3_ICON_MAP)) {
    for (const c of cs) {
      if (key.startsWith(c + ' ')) return url
      if (c.includes(key))          return url
      if (!wordSetResult && wordSetMatch(c, key)) wordSetResult = url
    }
  }
  if (wordSetResult) return wordSetResult

  // ── WEAPONS ──────────────────────────────────────────────────────────────
  if (hasWords(s, 'longsword', 'longswords', 'espada larga')) return getMapIcon('longsword')
  if (hasWords(s, 'greatsword', 'greatswords', 'espadon', 'espadón')) return getMapIcon('greatsword b')
  if (hasWords(s, 'shortsword', 'shortswords', 'espada corta')) return getMapIcon('shortsword')
  if (hasWords(s, 'rapier', 'rapiers')) return getMapIcon('rapier')
  if (hasWords(s, 'scimitar', 'scimitars', 'cimitarra')) return getMapIcon('scimitar')
  if (hasWords(s, 'dagger', 'daggers', 'daga', 'cuchillo', 'knife')) return getMapIcon('dagger')
  if (hasWords(s, 'greataxe', 'greataxes', 'hacha grande')) return getMapIcon('greataxe')
  if (hasWords(s, 'battleaxe', 'battleaxes', 'hacha de batalla')) return getMapIcon('battleaxe')
  if (hasWords(s, 'handaxe', 'handaxes', 'hacha de mano')) return getMapIcon('handaxe')
  if (hasWords(s, 'warhammer', 'warhammers', 'martillo de guerra')) return getMapIcon('warhammer')
  if (hasWords(s, 'maul', 'mauls', 'mallo')) return getMapIcon('maul')
  if (hasWords(s, 'morningstar', 'morningstars', 'lucero del alba')) return getMapIcon('morningstar')
  if (hasWords(s, 'flail', 'flails', 'mangual')) return getMapIcon('flail')
  if (hasWords(s, 'mace', 'maces', 'maza')) return getMapIcon('mace')
  if (hasWords(s, 'halberd', 'halberds', 'alabarda')) return getMapIcon('halberd')
  if (hasWords(s, 'glaive', 'glaives')) return getMapIcon('glaive')
  if (hasWords(s, 'pike', 'pikes', 'pica')) return getMapIcon('pike')
  if (hasWords(s, 'spear', 'spears', 'lanza', 'javelin', 'javelins', 'jabalina', 'pole')) return getMapIcon('spear')
  if (hasWords(s, 'lance', 'lances')) return getMapIcon('pike')
  if (hasWords(s, 'trident', 'tridents', 'tridente')) return getMapIcon('trident')
  if (hasWords(s, 'war pick', 'pico de guerra')) return getMapIcon('war pick')
  if (hasWords(s, 'quarterstaff', 'quarterstaffs', 'baston', 'bastón', 'staff', 'staves', 'staffs')) return getMapIcon('quarterstaff')
  if (hasWords(s, 'whip', 'whips', 'latigo', 'látigo')) return getMapIcon('duergar whipping cane')
  if (hasWords(s, 'sickle', 'sickles', 'hoz')) return getMapIcon('sickle')
  if (hasWords(s, 'club', 'clubs', 'garrote')) return getMapIcon('club')
  if (hasWords(s, 'dart', 'darts', 'dardo', 'blowgun', 'blowguns', 'cerbatana')) return getMapIcon('dart')
  if (hasWords(s, 'hand crossbow')) return getMapIcon('hand crossbow')
  if (hasWords(s, 'heavy crossbow')) return getMapIcon('heavy crossbow')
  if (hasWords(s, 'light crossbow')) return getMapIcon('light crossbow')
  if (hasWords(s, 'crossbow', 'crossbows', 'ballesta')) return getMapIcon('light crossbow')
  if (hasWords(s, 'longbow', 'longbows', 'arco largo')) return getMapIcon('longbow')
  if (hasWords(s, 'shortbow', 'shortbows', 'arco corto')) return getMapIcon('shortbow')
  if (hasWords(s, 'bow', 'bows', 'arco')) return getMapIcon('longbow')
  if (hasWords(s, 'arrow', 'arrows', 'flecha', 'bolt', 'bolts', 'virote', 'needle', 'needles', 'bullet', 'bullets', 'proyectil')) return getMapIcon('misc arrow')
  if (hasWords(s, 'net', 'nets', 'red de pesca')) return getMapIcon('supply pack')

  // ── ARMOR ─────────────────────────────────────────────────────────────────
  if (hasWords(s, 'plate armor', 'full plate', 'placas completas', 'plate')) return getMapIcon('plate armour')
  if (hasWords(s, 'half plate', 'media placa')) return getMapIcon('half plate')
  if (hasWords(s, 'splint', 'laminar')) return getMapIcon('splint mail')
  if (hasWords(s, 'chain mail', 'cota de malla')) return getMapIcon('chain mail')
  if (hasWords(s, 'ring mail', 'cota de anillas')) return getMapIcon('ring mail')
  if (hasWords(s, 'breastplate', 'pectoral')) return getMapIcon('breastplate')
  if (hasWords(s, 'scale mail', 'escamas')) return getMapIcon('scale mail')
  if (hasWords(s, 'chain shirt', 'camisote')) return getMapIcon('chain shirt')
  if (hasWords(s, 'studded leather', 'cuero tachonado')) return getMapIcon('studded leather')
  if (hasWords(s, 'leather', 'cuero')) return getMapIcon('leather armour')
  if (hasWords(s, 'padded', 'acolchada')) return getMapIcon('padded armour')
  if (hasWords(s, 'hide', 'pieles')) return getMapIcon('hide armour')
  if (hasWords(s, 'shield', 'shields', 'escudo')) return getMapIcon('wooden shield')
  if (hasWords(s, 'helmet', 'helmets', 'casco', 'celada')) return getMapIcon('helmet')
  if (hasWords(s, 'gauntlet', 'gauntlets', 'guantelete', 'glove', 'gloves', 'guantes')) return getMapIcon('leather gloves')
  if (hasWords(s, 'greave', 'greaves', 'grebas', 'boot', 'boots', 'botas')) return getMapIcon('boots leather')

  // ── POTIONS / LIQUIDS ─────────────────────────────────────────────────────
  if (hasWords(s, 'healing', 'curacion', 'curación')) return getMapIcon('potion of healing cloud')
  if (hasWords(s, 'antitoxin', 'antidoto', 'antídoto')) return getMapIcon('generic poison')
  if (hasWords(s, 'poison', 'poisons', 'veneno', 'toxico')) return getMapIcon('generic poison')
  if (hasWords(s, 'acid', 'acido', 'ácido')) return getMapIcon('generic acid')
  if (hasWords(s, 'elixir', 'elixirs', 'potion', 'potions', 'pocion', 'poción', 'oil', 'oils', 'aceite')) return getMapIcon('elixir')
  if (hasWords(s, 'vial', 'vials', 'flask', 'flasks', 'frasco', 'bottle', 'bottles', 'jug', 'jugs', 'jarra', 'mug', 'mugs', 'cup', 'cups', 'taza', 'waterskin', 'odre', 'bucket', 'buckets', 'balde')) return getMapIcon('bottle a')

  // ── SCROLLS / PAPER ───────────────────────────────────────────────────────
  if (hasWords(s, 'scroll', 'scrolls', 'pergamino', 'paper', 'papers', 'papel', 'parchment', 'parchments', 'map', 'maps', 'mapa', 'pen', 'pens', 'pluma', 'ink', 'inks', 'tinta')) return getMapIcon('letter paper a')

  // ── STAVES / WANDS / RODS ─────────────────────────────────────────────────
  if (hasWords(s, 'staff', 'staves', 'baculo', 'báculo')) return getMapIcon('quarterstaff')
  if (hasWords(s, 'wand', 'wands', 'varita', 'rod', 'rods', 'vara')) return getMapIcon('item wpn hum wand a 0')

  // ── RINGS ─────────────────────────────────────────────────────────────────
  if (hasWords(s, 'ring', 'rings', 'anillo')) return getMapIcon('common ring')

  // ── CLOAKS ────────────────────────────────────────────────────────────────
  if (hasWords(s, 'cloak', 'cloaks', 'capa', 'mantle', 'mantles', 'manto')) return getMapIcon('cloak')

  // ── BAGS / CONTAINERS ─────────────────────────────────────────────────────
  if (hasWords(s, 'bag', 'bags', 'bolsa', 'sack', 'sacks', 'saco', 'pouch', 'pouches', 'bolsillo', 'backpack', 'backpacks', 'mochila', 'quiver', 'quivers', 'carcaj', 'chest', 'chests', 'cofre', 'barrel', 'barrels', 'barril', 'basket', 'baskets', 'canasta', 'box', 'boxes', 'caja', 'case', 'cases', 'pack', 'packs', 'paquete', 'tackle', 'fishing', 'pesca', 'wax', 'cera', 'saddlebag', 'saddlebags')) return getMapIcon('supply pack')

  // ── LIGHT SOURCES ────────────────────────────────────────────────────────
  if (hasWords(s, 'lantern', 'lanterns', 'linterna')) return getMapIcon('lantern weapon')
  if (hasWords(s, 'torch', 'torches', 'antorcha')) return getMapIcon('torch')
  if (hasWords(s, 'candle', 'candles', 'vela')) return getMapIcon('candle')

  // ── ADVENTURING GEAR ─────────────────────────────────────────────────────
  if (hasWords(s, 'rations', 'ration', 'raciones', 'provision', 'food', 'comida', 'feed')) return getMapIcon('food dried beef sausage')
  if (hasWords(s, 'bedroll', 'bedrolls', 'blanket', 'blankets', 'tent', 'tents', 'tienda', 'sleeping bag', 'soap', 'jabon', 'jabón')) return getMapIcon('supply pack')
  if (hasWords(s, 'spyglass', 'spyglasses', 'magnifying glass', 'lupa', 'lens', 'lenses', 'lente', 'mirror', 'mirrors', 'espejo')) return getMapIcon('crystalline lens item')
  if (hasWords(s, 'caltrop', 'caltrops')) return getMapIcon('spike growth surface')
  if (hasWords(s, 'trap', 'traps', 'trampa')) return getMapIcon('supply pack')
  if (hasWords(s, 'rope', 'ropes', 'cuerda', 'soga', 'chain', 'chains', 'cadena', 'string', 'strings', 'hilo', 'manacles', 'manacle', 'esposas', 'grilletes')) return getMapIcon('champions chain')
  if (hasWords(s, 'hourglass', 'hourglasses', 'reloj', 'clock', 'clocks', 'abacus', 'abacuses', 'abaco', 'ábaco')) return getMapIcon('rich clock')
  if (hasWords(s, 'whistle', 'whistles', 'silbato', 'bell', 'bells', 'campana')) return getMapIcon('summon golem bell')
  if (hasWords(s, 'lock', 'locks', 'cerradura', 'candado')) return getMapIcon('forgery kit')
  if (hasWords(s, 'scale', 'scales', 'balanza')) return getMapIcon('item dec gen kitcheninstrument scale a copper a')
  if (hasWords(s, 'pot', 'pots', 'olla')) return getMapIcon('item dec gen kitcheninstrument scale a copper a')
  if (hasWords(s, 'whetstone', 'whetstones', 'stone', 'stones', 'piedra', 'flint', 'yesca', 'chalk', 'tiza')) return getMapIcon('heavy stone')
  if (hasWords(s, 'tinderbox')) return getMapIcon('generic fire')
  if (hasWords(s, 'incense')) return getMapIcon('incense a')
  if (hasWords(s, 'crowbar', 'crowbars', 'shovel', 'shovels', 'pala', 'ladder', 'ladders', 'escalera', 'hammer', 'hammers', 'martillo', 'piton', 'pitons', 'pitón', 'spike', 'spikes', 'pick', 'pico', 'axe', 'axes', 'hacha')) return getMapIcon('pickaxe')
  if (hasWords(s, 'symbol', 'symbols', 'simbolo', 'reliquary', 'relicario', 'emblem', 'emblema', 'amulet', 'amulets', 'amuleto', 'pendant', 'pendants', 'necklace', 'necklaces', 'collar', 'brooch', 'brooches', 'broche', 'talisman', 'talismán', 'censer', 'incensario')) return getMapIcon('envoys amulet')
  if (hasWords(s, 'mistletoe', 'muérdago', 'totem', 'tótem')) return getMapIcon('wood bark item')

  // ── VEHICLES / MOUNTS ────────────────────────────────────────────────────
  if (hasWords(s, 'horse', 'horses', 'warhorse', 'warhorses', 'caballo', 'camel', 'camells', 'camello', 'donkey', 'donkeys', 'mule', 'mules', 'mula', 'pony', 'ponies', 'mastiff', 'mastiffs', 'dog', 'dogs', 'perro', 'animal', 'beast', 'elephant', 'elephants', 'elefante', 'saddle', 'saddles', 'montura', 'bit and bridle', 'bocado', 'stabling', 'establo')) return getMapIcon('animal handling')
  if (hasWords(s, 'carriage', 'carriages', 'cart', 'carts', 'chariot', 'chariots', 'wagon', 'wagons', 'sled', 'sleds', 'carro', 'ship', 'ships', 'boat', 'boats', 'barco', 'rowboat', 'galley', 'keelboat', 'longship', 'warship', 'sailing')) return getMapIcon('supply pack')

  // ── CLOTHES ──────────────────────────────────────────────────────────────
  if (hasWords(s, 'clothes', 'clothing', 'ropa', 'vestment', 'vestments', 'vestidura', 'robe', 'robes', 'tunica', 'túnica')) return getMapIcon('clothes')

  // ── TOOLS / SUPPLIES ─────────────────────────────────────────────────────
  if (hasWords(s, 'supplies', 'suministros', 'tools', 'herramientas', 'kit', 'kits', 'utensils', 'utensil')) {
    if (hasWords(s, 'disguise')) return getMapIcon('disguise kit')
    if (hasWords(s, 'forgery')) return getMapIcon('forgery kit')
    return getMapIcon('forgery kit')
  }

  // ── MUSICAL INSTRUMENTS ───────────────────────────────────────────────────
  if (hasWords(s, 'lute', 'lutes', 'laud', 'laúd')) return getMapIcon('instrument lute')
  if (hasWords(s, 'flute', 'flutes', 'flauta')) return getMapIcon('instrument flute')
  if (hasWords(s, 'drum', 'drums', 'tambor')) return getMapIcon('instrument drum big')
  if (hasWords(s, 'horn', 'horns', 'cuerno')) return getMapIcon('instrument horn')
  if (hasWords(s, 'viol', 'viols', 'violin', 'violins')) return getMapIcon('instrument violin')
  if (hasWords(s, 'bagpipe', 'bagpipes', 'gaita')) return getMapIcon('instrument bagpipes')
  if (hasWords(s, 'lyre', 'lyres', 'lira')) return getMapIcon('instrument lyre')
  if (hasWords(s, 'dulcimer')) return getMapIcon('instrument dulcimer')
  if (hasWords(s, 'shawm')) return getMapIcon('instrument shawm')
  if (hasWords(s, 'pan flute')) return getMapIcon('instrument panflute')

  // ── GAMING SETS ───────────────────────────────────────────────────────────
  if (hasWords(s, 'dice', 'dados', 'playing card', 'playing cards', 'naipes', 'cartas', 'chess', 'ajedrez', 'gaming set')) return getMapIcon('misc weathered chisel set')

  return null
}

export function getSpellIconUrl(name: string): string | null {
  const s = n(name)
  return BG3_SPELL_MAP[s] ?? null
}

// Category emoji fallback when no URL matches
export function getItemFallbackEmoji(name: string): string {
  const s = n(name)
  if (hasWords(s, 'sword', 'axe', 'bow', 'dagger', 'espada', 'hacha', 'arco', 'daga', 'spear', 'lance', 'mace', 'staff', 'lanza', 'maza', 'weapon', 'arma'))
    return '⚔️'
  if (hasWords(s, 'armor', 'armadura', 'shield', 'escudo', 'leather', 'cuero', 'plate', 'mail'))
    return '🛡️'
  if (hasWords(s, 'potion', 'pocion', 'elixir', 'antitoxin', 'philter'))
    return '🧪'
  if (hasWords(s, 'scroll', 'pergamino')) return '📜'
  if (hasWords(s, 'wand', 'varita', 'ring', 'anillo', 'amulet', 'staff', 'baculo', 'rod'))
    return '✨'
  if (hasWords(s, 'tool', 'herramienta', 'kit')) return '🔧'
  if (hasWords(s, 'bag', 'bolsa', 'backpack', 'mochila', 'pouch', 'chest', 'cofre'))
    return '🎒'
  if (hasWords(s, 'torch', 'lantern', 'antorcha', 'linterna'))
    return '🕯️'
  if (hasWords(s, 'food', 'ration', 'comida', 'racion'))
    return '🍖'
  if (hasWords(s, 'gold', 'coin', 'oro', 'moneda'))
    return '💰'
  return '📦'
}
