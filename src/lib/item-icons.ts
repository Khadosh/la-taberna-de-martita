import { GAME_ICONS, SCHOOL_ICONS } from './game-icons-map'

// Normaliza: minúsculas, sin acentos, espacios colapsados
const n = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

function icon(concept: string): string | null {
  return GAME_ICONS[concept] ?? null
}

function hasWords(s: string, ...terms: string[]): boolean {
  return terms.some(term => ` ${s} `.includes(` ${n(term)} `))
}

/**
 * Resuelve el ícono de un ítem por categoría semántica.
 *
 * No hay tabla de nombre-exacto → ícono: los nombres llegan libres (del SRD en
 * inglés, o escritos a mano por el DM en español) y mantener miles de entradas
 * era inviable. La cascada va de lo más específico a lo más general; el orden
 * importa — `half plate` tiene que evaluarse antes que `plate`.
 */
export function getItemIconUrl(name: string): string | null {
  const s = n(name)

  // ── ARMAS CUERPO A CUERPO ────────────────────────────────────────────────
  if (hasWords(s, 'longsword', 'longswords', 'espada larga')) return icon('longsword')
  if (hasWords(s, 'greatsword', 'greatswords', 'espadon', 'mandoble')) return icon('greatsword')
  if (hasWords(s, 'shortsword', 'shortswords', 'espada corta')) return icon('shortsword')
  if (hasWords(s, 'rapier', 'rapiers', 'estoque')) return icon('rapier')
  if (hasWords(s, 'scimitar', 'scimitars', 'cimitarra')) return icon('scimitar')
  if (hasWords(s, 'dagger', 'daggers', 'daga', 'cuchillo', 'knife')) return icon('dagger')
  if (hasWords(s, 'greataxe', 'greataxes', 'hacha grande')) return icon('greataxe')
  if (hasWords(s, 'battleaxe', 'battleaxes', 'hacha de batalla')) return icon('battleaxe')
  if (hasWords(s, 'handaxe', 'handaxes', 'hacha de mano')) return icon('handaxe')
  if (hasWords(s, 'warhammer', 'warhammers', 'martillo de guerra')) return icon('warhammer')
  if (hasWords(s, 'maul', 'mauls', 'mallo')) return icon('maul')
  if (hasWords(s, 'morningstar', 'morningstars', 'lucero del alba')) return icon('morningstar')
  if (hasWords(s, 'flail', 'flails', 'mangual')) return icon('flail')
  if (hasWords(s, 'mace', 'maces', 'maza')) return icon('mace')
  if (hasWords(s, 'halberd', 'halberds', 'alabarda')) return icon('halberd')
  if (hasWords(s, 'glaive', 'glaives')) return icon('glaive')
  if (hasWords(s, 'pike', 'pikes', 'pica', 'lance', 'lances')) return icon('pike')
  if (hasWords(s, 'spear', 'spears', 'lanza', 'javelin', 'javelins', 'jabalina', 'pole')) return icon('spear')
  if (hasWords(s, 'trident', 'tridents', 'tridente')) return icon('trident')
  if (hasWords(s, 'war pick', 'pico de guerra')) return icon('war-pick')
  if (hasWords(s, 'whip', 'whips', 'latigo')) return icon('whip')
  if (hasWords(s, 'sickle', 'sickles', 'hoz')) return icon('sickle')
  if (hasWords(s, 'club', 'clubs', 'garrote')) return icon('club')

  // ── ARMAS A DISTANCIA ────────────────────────────────────────────────────
  if (hasWords(s, 'dart', 'darts', 'dardo', 'blowgun', 'blowguns', 'cerbatana')) return icon('dart')
  if (hasWords(s, 'crossbow', 'crossbows', 'ballesta')) return icon('crossbow')
  if (hasWords(s, 'longbow', 'longbows', 'arco largo')) return icon('longbow')
  if (hasWords(s, 'shortbow', 'shortbows', 'arco corto')) return icon('shortbow')
  if (hasWords(s, 'bow', 'bows', 'arco')) return icon('longbow')
  if (hasWords(s, 'arrow', 'arrows', 'flecha', 'bolt', 'bolts', 'virote', 'needle', 'needles', 'bullet', 'bullets', 'proyectil', 'quiver', 'carcaj')) return icon('ammunition')
  if (hasWords(s, 'net', 'nets', 'red de pesca')) return icon('net')

  // ── ARMADURAS ────────────────────────────────────────────────────────────
  if (hasWords(s, 'half plate', 'media placa')) return icon('half-plate')
  if (hasWords(s, 'plate armor', 'plate armour', 'full plate', 'placas completas', 'plate')) return icon('plate-armor')
  if (hasWords(s, 'splint', 'laminar')) return icon('splint-mail')
  if (hasWords(s, 'chain mail', 'cota de malla')) return icon('chain-mail')
  if (hasWords(s, 'ring mail', 'cota de anillas')) return icon('ring-mail')
  if (hasWords(s, 'breastplate', 'pectoral')) return icon('breastplate')
  if (hasWords(s, 'scale mail', 'escamas')) return icon('scale-mail')
  if (hasWords(s, 'chain shirt', 'camisote')) return icon('chain-shirt')
  if (hasWords(s, 'studded leather', 'cuero tachonado')) return icon('studded-leather')
  if (hasWords(s, 'leather', 'cuero')) return icon('leather-armor')
  if (hasWords(s, 'padded', 'acolchada')) return icon('padded-armor')
  if (hasWords(s, 'hide', 'pieles')) return icon('leather-armor')
  if (hasWords(s, 'shield', 'shields', 'escudo')) return icon('shield')
  if (hasWords(s, 'helmet', 'helmets', 'casco', 'celada')) return icon('helmet')
  if (hasWords(s, 'gauntlet', 'gauntlets', 'guantelete', 'glove', 'gloves', 'guantes')) return icon('gloves')
  if (hasWords(s, 'greave', 'greaves', 'grebas', 'boot', 'boots', 'botas')) return icon('boots')

  // ── POCIONES Y LÍQUIDOS ──────────────────────────────────────────────────
  if (hasWords(s, 'healing', 'curacion')) return icon('potion-healing')
  if (hasWords(s, 'antitoxin', 'antidoto', 'poison', 'poisons', 'veneno', 'toxico')) return icon('poison')
  if (hasWords(s, 'acid', 'acido')) return icon('acid')
  if (hasWords(s, 'alchemist', 'alquimista', 'alchemy', 'alquimia')) return icon('alchemy')
  if (hasWords(s, 'elixir', 'elixirs', 'potion', 'potions', 'pocion', 'oil', 'oils', 'aceite')) return icon('elixir')
  if (hasWords(s, 'vial', 'vials', 'flask', 'flasks', 'frasco', 'bottle', 'bottles', 'jug', 'jugs', 'jarra', 'mug', 'mugs', 'cup', 'cups', 'taza', 'waterskin', 'odre', 'bucket', 'buckets', 'balde')) return icon('bottle')

  // ── PAPEL Y ARCANO ───────────────────────────────────────────────────────
  if (hasWords(s, 'spellbook', 'grimoire', 'grimorio', 'book', 'books', 'libro', 'tome', 'tomo')) return icon('book')
  if (hasWords(s, 'scroll', 'scrolls', 'pergamino', 'paper', 'papers', 'papel', 'parchment', 'parchments', 'map', 'maps', 'mapa')) return icon('scroll')
  if (hasWords(s, 'pen', 'pens', 'pluma', 'quill', 'ink', 'inks', 'tinta', 'forgery', 'falsificacion')) return icon('quill')
  if (hasWords(s, 'staff', 'staves', 'staffs', 'quarterstaff', 'quarterstaffs', 'baston', 'baculo')) return icon('quarterstaff')
  if (hasWords(s, 'wand', 'wands', 'varita', 'rod', 'rods', 'vara')) return icon('wand')
  if (hasWords(s, 'ring', 'rings', 'anillo')) return icon('ring')
  if (hasWords(s, 'cloak', 'cloaks', 'capa', 'mantle', 'mantles', 'manto')) return icon('cloak')
  if (hasWords(s, 'symbol', 'symbols', 'simbolo', 'reliquary', 'relicario', 'emblem', 'emblema', 'amulet', 'amulets', 'amuleto', 'pendant', 'pendants', 'necklace', 'necklaces', 'collar', 'brooch', 'brooches', 'broche', 'talisman', 'censer', 'incensario')) return icon('amulet')
  if (hasWords(s, 'mistletoe', 'muerdago', 'totem')) return icon('totem')

  // ── CONTENEDORES ─────────────────────────────────────────────────────────
  if (hasWords(s, 'chest', 'chests', 'cofre', 'barrel', 'barrels', 'barril', 'box', 'boxes', 'caja', 'case', 'cases')) return icon('chest')
  if (hasWords(s, 'pouch', 'pouches', 'bolsillo', 'sack', 'sacks', 'saco', 'bag', 'bags', 'bolsa')) return icon('pouch')
  if (hasWords(s, 'backpack', 'backpacks', 'mochila', 'pack', 'packs', 'paquete', 'basket', 'baskets', 'canasta', 'saddlebag', 'saddlebags')) return icon('pack')

  // ── LUZ Y FUEGO ──────────────────────────────────────────────────────────
  if (hasWords(s, 'lantern', 'lanterns', 'linterna')) return icon('lantern')
  if (hasWords(s, 'torch', 'torches', 'antorcha')) return icon('torch')
  if (hasWords(s, 'candle', 'candles', 'vela')) return icon('candle')
  if (hasWords(s, 'tinderbox', 'yesca', 'flint', 'pedernal')) return icon('fire')
  if (hasWords(s, 'incense', 'incienso')) return icon('incense')

  // ── EQUIPO DE AVENTURA ───────────────────────────────────────────────────
  if (hasWords(s, 'rations', 'ration', 'raciones', 'provision', 'food', 'comida', 'feed')) return icon('food')
  if (hasWords(s, 'herbalism', 'herbalist', 'herboristeria', 'herb', 'herbs', 'hierbas')) return icon('herbs')
  if (hasWords(s, 'spyglass', 'spyglasses', 'catalejo', 'magnifying glass', 'lupa', 'lens', 'lenses', 'lente')) return icon('spyglass')
  if (hasWords(s, 'mirror', 'mirrors', 'espejo')) return icon('mirror')
  if (hasWords(s, 'caltrop', 'caltrops', 'abrojos')) return icon('caltrops')
  if (hasWords(s, 'trap', 'traps', 'trampa')) return icon('trap')
  if (hasWords(s, 'thieves', 'ladron', 'lockpick', 'lockpicks', 'ganzua')) return icon('lockpicks')
  if (hasWords(s, 'lock', 'locks', 'cerradura', 'candado')) return icon('lock')
  if (hasWords(s, 'key', 'keys', 'llave')) return icon('key')
  if (hasWords(s, 'rope', 'ropes', 'cuerda', 'soga', 'string', 'strings', 'hilo')) return icon('rope')
  if (hasWords(s, 'chain', 'chains', 'cadena', 'manacles', 'manacle', 'esposas', 'grilletes')) return icon('chain')
  if (hasWords(s, 'hourglass', 'hourglasses', 'reloj', 'clock', 'clocks')) return icon('hourglass')
  if (hasWords(s, 'abacus', 'abacuses', 'abaco')) return icon('abacus')
  if (hasWords(s, 'whistle', 'whistles', 'silbato', 'bell', 'bells', 'campana')) return icon('bell')
  if (hasWords(s, 'scale', 'scales', 'balanza')) return icon('scales')
  if (hasWords(s, 'pot', 'pots', 'olla', 'cauldron', 'caldero', 'kettle')) return icon('pot')
  if (hasWords(s, 'whetstone', 'whetstones', 'stone', 'stones', 'piedra', 'chalk', 'tiza')) return icon('stone')
  if (hasWords(s, 'bedroll', 'bedrolls', 'blanket', 'blankets', 'manta', 'sleeping bag')) return icon('bedroll')
  if (hasWords(s, 'tent', 'tents', 'tienda', 'carpa')) return icon('tent')
  if (hasWords(s, 'soap', 'jabon')) return icon('soap')
  if (hasWords(s, 'ladder', 'ladders', 'escalera')) return icon('ladder')
  if (hasWords(s, 'crowbar', 'crowbars', 'palanca')) return icon('crowbar')
  if (hasWords(s, 'shovel', 'shovels', 'pala', 'hammer', 'hammers', 'martillo', 'piton', 'pitons', 'spike', 'spikes', 'pick', 'pico', 'axe', 'axes', 'hacha', 'pickaxe')) return icon('pickaxe')
  if (hasWords(s, 'disguise', 'disfraz')) return icon('disguise')

  // ── MONTURAS Y VEHÍCULOS ─────────────────────────────────────────────────
  if (hasWords(s, 'saddle', 'saddles', 'montura', 'bit and bridle', 'bocado', 'stabling', 'establo')) return icon('saddle')
  if (hasWords(s, 'horse', 'horses', 'warhorse', 'warhorses', 'caballo', 'camel', 'camels', 'camello', 'donkey', 'donkeys', 'mule', 'mules', 'mula', 'pony', 'ponies', 'mastiff', 'mastiffs', 'dog', 'dogs', 'perro', 'animal', 'beast', 'elephant', 'elephants', 'elefante')) return icon('mount')
  if (hasWords(s, 'ship', 'ships', 'boat', 'boats', 'barco', 'rowboat', 'galley', 'keelboat', 'longship', 'warship', 'sailing')) return icon('boat')
  if (hasWords(s, 'carriage', 'carriages', 'cart', 'carts', 'chariot', 'chariots', 'wagon', 'wagons', 'sled', 'sleds', 'carro')) return icon('cart')

  // ── ROPA ─────────────────────────────────────────────────────────────────
  if (hasWords(s, 'clothes', 'clothing', 'ropa', 'vestment', 'vestments', 'vestidura', 'robe', 'robes', 'tunica')) return icon('clothes')

  // ── INSTRUMENTOS ─────────────────────────────────────────────────────────
  if (hasWords(s, 'lute', 'lutes', 'laud')) return icon('lute')
  if (hasWords(s, 'pan flute', 'panflute')) return icon('panflute')
  if (hasWords(s, 'flute', 'flutes', 'flauta', 'shawm')) return icon('flute')
  if (hasWords(s, 'drum', 'drums', 'tambor')) return icon('drum')
  if (hasWords(s, 'horn', 'horns', 'cuerno')) return icon('horn')
  if (hasWords(s, 'viol', 'viols', 'violin', 'violins')) return icon('violin')
  if (hasWords(s, 'bagpipe', 'bagpipes', 'gaita')) return icon('bagpipes')
  if (hasWords(s, 'lyre', 'lyres', 'lira')) return icon('lyre')
  if (hasWords(s, 'dulcimer')) return icon('dulcimer')

  // ── SETS DE JUEGO ────────────────────────────────────────────────────────
  if (hasWords(s, 'dice', 'dados')) return icon('dice')
  if (hasWords(s, 'chess', 'ajedrez')) return icon('chess')
  if (hasWords(s, 'playing card', 'playing cards', 'naipes', 'cartas', 'gaming set')) return icon('gaming')

  // ── VALORES ──────────────────────────────────────────────────────────────
  if (hasWords(s, 'gem', 'gems', 'gema', 'jewel', 'jewels', 'joya', 'pearl', 'perla')) return icon('gem')
  if (hasWords(s, 'coin', 'coins', 'moneda', 'monedas', 'gold', 'oro')) return icon('coins')

  // ── HERRAMIENTAS GENÉRICAS (última red: 'kit', 'tools', 'supplies') ──────
  if (hasWords(s, 'supplies', 'suministros', 'tools', 'herramientas', 'kit', 'kits', 'utensils', 'utensil')) return icon('misc')

  return null
}

/** Ícono por escuela de magia: el SRD tiene 300+ conjuros pero solo 8 escuelas. */
export function getSpellIconUrl(school: string | null | undefined): string | null {
  if (!school) return null
  return SCHOOL_ICONS[n(school)] ?? null
}

// Emoji de respaldo cuando ninguna categoría matchea
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
