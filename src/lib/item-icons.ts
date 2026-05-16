import { BG3_ICON_MAP } from './bg3-icon-map'
import { BG3_SPELL_MAP } from './bg3-spell-map'

// URL format: https://game-icons.net/icons/{fg}/{bg}/1x1/{author}/{icon}.svg
const G = (path: string) => `https://game-icons.net/icons/ffffff/000000/1x1/${path}.svg`

// Normalize for matching: lowercase, no accents
const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function getItemIconUrl(name: string): string | null {
  const s = n(name)

  // BG3 exact match (highest priority — real game art)
  if (BG3_ICON_MAP[s]) return BG3_ICON_MAP[s]
  // BG3 partial match: find a BG3 key that's contained in the item name
  for (const [key, url] of Object.entries(BG3_ICON_MAP)) {
    if (s.includes(key) || key.includes(s)) return url
  }

  // ── WEAPONS ──────────────────────────────────────────────────────────────
  if (s.includes('longsword') || s.includes('espada larga')) return G('lorc/broadsword')
  if (s.includes('greatsword') || s.includes('espadon') || s.includes('espadón')) return G('lorc/greatsword')
  if (s.includes('shortsword') || s.includes('espada corta')) return G('lorc/gladius')
  if (s.includes('rapier')) return G('lorc/rapier')
  if (s.includes('scimitar') || s.includes('cimitarra')) return G('lorc/scimitar')
  if (s.includes('dagger') || s.includes('daga') || s.includes('cuchillo')) return G('lorc/stiletto')
  if (s.includes('greataxe') || s.includes('hacha grande')) return G('lorc/war-axe')
  if (s.includes('battleaxe') || s.includes('hacha de batalla')) return G('lorc/battle-axe')
  if (s.includes('handaxe') || s.includes('hacha de mano')) return G('lorc/hand-axe')
  if (s.includes('warhammer') || s.includes('martillo de guerra')) return G('lorc/war-hammer')
  if (s.includes('maul') || s.includes('mallo')) return G('lorc/maul')
  if (s.includes('morningstar') || s.includes('lucero del alba')) return G('lorc/morning-star')
  if (s.includes('flail') || s.includes('mangual')) return G('lorc/flail')
  if (s.includes('mace') || s.includes('maza')) return G('lorc/mace-head')
  if (s.includes('halberd') || s.includes('alabarda')) return G('lorc/halberd')
  if (s.includes('glaive')) return G('lorc/glaive')
  if (s.includes('pike') || s.includes('pica')) return G('lorc/pike')
  if (s.includes('spear') || s.includes('lanza')) return G('lorc/spear-head')
  if (s.includes('lance')) return G('lorc/cavalry-lance')
  if (s.includes('trident') || s.includes('tridente')) return G('lorc/trident')
  if (s.includes('war pick') || s.includes('pico de guerra')) return G('lorc/war-pick')
  if (s.includes('quarterstaff') || s.includes('baston') || s.includes('bastón')) return G('lorc/bo')
  if (s.includes('whip') || s.includes('latigo') || s.includes('látigo')) return G('lorc/whip')
  if (s.includes('sickle') || s.includes('hoz')) return G('lorc/sickle')
  if (s.includes('club') || s.includes('garrote')) return G('lorc/wood-club')
  if (s.includes('javelin') || s.includes('jabalina')) return G('lorc/thrown-spear')
  if (s.includes('dart') || s.includes('dardo')) return G('lorc/dart')
  if (s.includes('hand crossbow') || s.includes('heavy crossbow') || s.includes('light crossbow')) return G('lorc/crossbow')
  if (s.includes('crossbow') || s.includes('ballesta')) return G('lorc/crossbow')
  if (s.includes('longbow') || s.includes('arco largo')) return G('lorc/longbow')
  if (s.includes('shortbow') || s.includes('arco corto')) return G('lorc/high-shot')
  if (s.includes('bow') || s.includes('arco')) return G('lorc/longbow')
  if (s.includes('blowgun') || s.includes('cerbatana')) return G('lorc/blowpipe')
  if (s.includes('net') || s.includes('red de pesca')) return G('lorc/fishing-net')

  // ── ARMOR ─────────────────────────────────────────────────────────────────
  if (s.includes('plate armor') || s.includes('full plate') || s.includes('placas completas')) return G('lorc/full-metal-body')
  if (s.includes('half plate') || s.includes('media placa')) return G('lorc/breastplate')
  if (s.includes('splint') || s.includes('laminar')) return G('lorc/lamellar')
  if (s.includes('chain mail') || s.includes('cota de malla')) return G('lorc/chain-mail')
  if (s.includes('ring mail') || s.includes('cota de anillas')) return G('lorc/ring-mail')
  if (s.includes('breastplate') || s.includes('pectoral')) return G('lorc/breastplate')
  if (s.includes('scale mail') || s.includes('escamas')) return G('lorc/scale-mail')
  if (s.includes('chain shirt') || s.includes('camisote')) return G('lorc/chain-mail')
  if (s.includes('studded leather') || s.includes('cuero tachonado')) return G('lorc/leather-vest')
  if (s.includes('leather') || s.includes('cuero') || s.includes('padded') || s.includes('acolchada')) return G('lorc/leather-vest')
  if (s.includes('hide') || s.includes('pieles')) return G('lorc/lamellar')
  if (s.includes('shield') || s.includes('escudo')) return G('lorc/round-shield')
  if (s.includes('helmet') || s.includes('casco') || s.includes('celada')) return G('lorc/open-face-minelift')
  if (s.includes('gauntlet') || s.includes('guantelete')) return G('lorc/gauntlet')
  if (s.includes('greaves') || s.includes('grebas')) return G('lorc/leg-armor')

  // ── POTIONS ───────────────────────────────────────────────────────────────
  if (s.includes('potion of supreme healing')) return G('lorc/health-increase')
  if (s.includes('potion of superior healing')) return G('lorc/health-increase')
  if (s.includes('potion of greater healing')) return G('lorc/health-increase')
  if (s.includes('potion of healing') || s.includes('pocion de curacion') || s.includes('poción de curación')) return G('lorc/health-potion')
  if (s.includes('potion of invisibility') || s.includes('pocion de invisibilidad')) return G('lorc/invisible')
  if (s.includes('potion of speed') || s.includes('pocion de velocidad')) return G('lorc/sprint')
  if (s.includes('potion of fire resistance')) return G('lorc/fire-shield')
  if (s.includes('potion of giant strength')) return G('lorc/stone-pile')
  if (s.includes('potion of flying') || s.includes('pocion de vuelo')) return G('lorc/fly')
  if (s.includes('potion of gaseous form')) return G('lorc/smoke')
  if (s.includes('potion of mind reading')) return G('lorc/third-eye')
  if (s.includes('potion of water breathing')) return G('lorc/bubbling-potion')
  if (s.includes('potion of climbing')) return G('lorc/bouldering')
  if (s.includes('antitoxin') || s.includes('antidoto') || s.includes('antídoto')) return G('lorc/drop')
  if (s.includes('elixir') || s.includes('filtro') || s.includes('philter')) return G('lorc/drink-me')
  if (s.includes('potion') || s.includes('pocion') || s.includes('poción')) return G('lorc/potion-ball')

  // ── SCROLLS ───────────────────────────────────────────────────────────────
  if (s.includes('scroll') || s.includes('pergamino')) return G('delapouite/scroll-unfurled')

  // ── STAVES / WANDS / RODS ─────────────────────────────────────────────────
  if (s.includes('staff of fire')) return G('lorc/fire-staff')
  if (s.includes('staff of healing')) return G('lorc/healing-shield')
  if (s.includes('staff of the magi') || s.includes('staff of power')) return G('lorc/wizard-staff')
  if (s.includes('staff') || s.includes('baculo') || s.includes('báculo')) return G('lorc/wizard-staff')
  if (s.includes('wand of fireballs')) return G('lorc/fire-ray')
  if (s.includes('wand of lightning')) return G('lorc/lightning-storm')
  if (s.includes('wand of magic missiles')) return G('lorc/magic-swirl')
  if (s.includes('wand') || s.includes('varita')) return G('lorc/crystal-wand')
  if (s.includes('rod') || s.includes('vara magica')) return G('lorc/shard-sword')

  // ── RINGS ─────────────────────────────────────────────────────────────────
  if (s.includes('ring of protection')) return G('lorc/shield-reflect')
  if (s.includes('ring of invisibility')) return G('lorc/invisible')
  if (s.includes('ring of regeneration') || s.includes('ring of spell storing')) return G('lorc/health-increase')
  if (s.includes('ring') || s.includes('anillo')) return G('lorc/ring')

  // ── CLOAKS ────────────────────────────────────────────────────────────────
  if (s.includes('cloak of the bat')) return G('lorc/bat-wing')
  if (s.includes('cloak') || s.includes('capa')) return G('lorc/cloak')
  if (s.includes('mantle') || s.includes('manto')) return G('lorc/cloak')

  // ── BOOTS ─────────────────────────────────────────────────────────────────
  if (s.includes('winged boots') || s.includes('boots of elvenkind')) return G('lorc/angel-wings')
  if (s.includes('boots of speed') || s.includes('botas de velocidad')) return G('lorc/sprint')
  if (s.includes('slippers') || s.includes('zapatillas')) return G('lorc/spider-face')
  if (s.includes('boots') || s.includes('botas')) return G('lorc/boots')

  // ── BAGS / CONTAINERS ─────────────────────────────────────────────────────
  if (s.includes('bag of holding') || s.includes('bolsa de contener')) return G('lorc/bag')
  if (s.includes('bag of tricks') || s.includes('bolsa de trucos')) return G('lorc/bag')
  if (s.includes('portable hole') || s.includes('agujero portatil')) return G('lorc/hole')
  if (s.includes('chest') || s.includes('cofre')) return G('lorc/chest')
  if (s.includes('backpack') || s.includes('mochila')) return G('lorc/knapsack')
  if (s.includes('bag') || s.includes('bolsa') || s.includes('sack') || s.includes('saco')) return G('lorc/bag')
  if (s.includes('pouch') || s.includes('bolsillo') || s.includes('bolsita')) return G('delapouite/swap-bag')
  if (s.includes('quiver') || s.includes('carcaj')) return G('delapouite/arrow-cluster')

  // ── LIGHT SOURCES ────────────────────────────────────────────────────────
  if (s.includes('lantern') || s.includes('linterna')) return G('delapouite/lantern-flame')
  if (s.includes('torch') || s.includes('antorcha')) return G('lorc/torch')
  if (s.includes('candle') || s.includes('vela')) return G('delapouite/candle')

  // ── ADVENTURING GEAR ─────────────────────────────────────────────────────
  if (s.includes('rope of climbing') || s.includes('rope of entanglement')) return G('lorc/rope-coil')
  if (s.includes('rope') || s.includes('cuerda') || s.includes('soga')) return G('lorc/rope-coil')
  if (s.includes('grappling hook') || s.includes('garfio')) return G('delapouite/grappling-hook')
  if (s.includes('rations') || s.includes('raciones') || s.includes('provision')) return G('delapouite/corn')
  if (s.includes('waterskin') || s.includes('odre') || s.includes('cantimplora')) return G('delapouite/water-flask')
  if (s.includes('bedroll') || s.includes('saco de dormir')) return G('delapouite/bedroll')
  if (s.includes('blanket') || s.includes('manta')) return G('lorc/covered')
  if (s.includes('caltrops') || s.includes('abrojos')) return G('lorc/caltrops')
  if (s.includes('bear trap') || s.includes('hunting trap') || s.includes('trampa')) return G('lorc/bear-trap')
  if (s.includes('tinderbox') || s.includes('yesca') || s.includes('pedernal')) return G('lorc/flint-spark')
  if (s.includes('crowbar') || s.includes('palanca')) return G('delapouite/crowbar')
  if (s.includes('pickaxe') || s.includes('pico de miner')) return G('delapouite/pickaxe')
  if (s.includes('shovel') || s.includes('pala')) return G('delapouite/shovel')
  if (s.includes('ladder') || s.includes('escalera')) return G('delapouite/ladder')
  if (s.includes('mirror') || s.includes('espejo')) return G('delapouite/hand-mirror')
  if (s.includes('hourglass') || s.includes('reloj de arena')) return G('lorc/sand-timer')
  if (s.includes('spyglass') || s.includes('catalejo')) return G('delapouite/telescope')
  if (s.includes('magnifying glass') || s.includes('lupa')) return G('delapouite/magnifying-glass')
  if (s.includes('manacles') || s.includes('esposas') || s.includes('grilletes')) return G('lorc/shackles')
  if (s.includes('lock') || s.includes('cerradura') || s.includes('candado')) return G('delapouite/padlock')
  if (s.includes('tent') || s.includes('tienda de campana') || s.includes('campamento')) return G('delapouite/tent')
  if (s.includes('alchemist') && s.includes('fire')) return G('lorc/fire-bottle')
  if (s.includes('holy water') || s.includes('agua bendita')) return G('delapouite/holy-grail')
  if (s.includes('acid') || s.includes('acido') || s.includes('ácido')) return G('lorc/acid')
  if (s.includes('poison') || s.includes('veneno') || s.includes('toxico')) return G('lorc/poison-bottle')
  if (s.includes('oil') && !s.includes('anillo')) return G('lorc/oil-drum')
  if (s.includes('vial') || s.includes('frasco pequeno')) return G('lorc/corked-tube')
  if (s.includes('flask') || s.includes('frasco')) return G('lorc/drink-me')
  if (s.includes('bottle') || s.includes('botella')) return G('lorc/drink-me')
  if (s.includes('jug') || s.includes('jarra')) return G('delapouite/beer-stein')
  if (s.includes('ink') || s.includes('tinta')) return G('delapouite/quill-ink')
  if (s.includes('spellbook') || s.includes('grimorio') || s.includes('libro de hechizos')) return G('delapouite/spell-book')
  if (s.includes('book') || s.includes('libro') || s.includes('tomo')) return G('delapouite/book-cover')
  if (s.includes('map') || s.includes('mapa')) return G('delapouite/treasure-map')
  if (s.includes('compass') || s.includes('brujula') || s.includes('brújula')) return G('delapouite/compass')
  if (s.includes('whistle') || s.includes('silbato') || s.includes('pito')) return G('delapouite/whistle')
  if (s.includes('spike') || s.includes('estaca') || s.includes('piton') || s.includes('pitón')) return G('lorc/nail')
  if (s.includes('chalk') || s.includes('tiza')) return G('delapouite/chalk-outline-murder')
  if (s.includes('soap') || s.includes('jabon') || s.includes('jabón')) return G('delapouite/soap')
  if (s.includes('scale') || s.includes('balanza') || s.includes('bascula')) return G('delapouite/scales')
  if (s.includes('whetstone') || s.includes('piedra de afilar')) return G('delapouite/whetstone')
  if (s.includes('arrow') || s.includes('flecha')) return G('lorc/arrow-flights')
  if (s.includes('bolt') || s.includes('virote')) return G('lorc/arrow-flights')
  if (s.includes('bullet') || s.includes('proyectil de honda')) return G('lorc/stone-sphere')
  if (s.includes('holy symbol') || s.includes('simbolo sagrado')) return G('delapouite/holy-grail')

  // ── TOOLS ─────────────────────────────────────────────────────────────────
  if (s.includes('thieves') || s.includes('ganzua') || s.includes('ganzúa') || s.includes('ladron')) return G('lorc/lockpicks')
  if (s.includes('healer') || s.includes('curandero') || s.includes('botiquin')) return G('delapouite/first-aid-kit')
  if (s.includes('herbalism') || s.includes('herbolario')) return G('lorc/herbs')
  if (s.includes('alchemist') || s.includes('alquimia')) return G('lorc/chemical-bolt')
  if (s.includes('smith') || s.includes('herrero') || s.includes('forja')) return G('lorc/anvil-impact')
  if (s.includes('cook') || s.includes('cocinero') || s.includes('cocina')) return G('lorc/kitchen-knives')
  if (s.includes('carpenter') || s.includes('carpintero')) return G('lorc/wood-axe')
  if (s.includes('mason') || s.includes('albanil') || s.includes('albañil')) return G('lorc/trowel')
  if (s.includes('painter') || s.includes('pintor')) return G('lorc/paintbrush')
  if (s.includes('tinker') || s.includes('relojero') || s.includes('artesano')) return G('lorc/tinker')
  if (s.includes('navigator') || s.includes('navegante')) return G('lorc/compass')
  if (s.includes('disguise') || s.includes('disfraz')) return G('lorc/domino-mask')
  if (s.includes('forgery') || s.includes('falsificacion') || s.includes('falsificación')) return G('delapouite/quill-ink')
  if (s.includes('poisoner') || s.includes('envenenador')) return G('lorc/poison-bottle')

  // ── MUSICAL INSTRUMENTS ───────────────────────────────────────────────────
  if (s.includes('lute') || s.includes('laud') || s.includes('laúd')) return G('lorc/lute')
  if (s.includes('flute') || s.includes('flauta')) return G('lorc/pan-flute')
  if (s.includes('drum') || s.includes('tambor')) return G('lorc/war-drums')
  if (s.includes('horn') || s.includes('cuerno') || s.includes('bugle')) return G('lorc/bugle')
  if (s.includes('viol') || s.includes('violin')) return G('lorc/violin')
  if (s.includes('bagpipe') || s.includes('gaita')) return G('lorc/bagpipe')
  if (s.includes('lyre') || s.includes('lira')) return G('lorc/lute')

  // ── GAMING SETS ───────────────────────────────────────────────────────────
  if (s.includes('dice set') || s.includes('juego de dados') || s.includes('dados')) return G('lorc/dice-twenty-faces-twenty')
  if (s.includes('playing card') || s.includes('naipes') || s.includes('cartas')) return G('lorc/card-play')
  if (s.includes('chess') || s.includes('ajedrez')) return G('lorc/chess-knight')

  // ── JEWELRY / ACCESSORIES ─────────────────────────────────────────────────
  if (s.includes('amulet') || s.includes('amuleto')) return G('lorc/amulet')
  if (s.includes('necklace') || s.includes('collar')) return G('lorc/necklace-display')
  if (s.includes('pendant') || s.includes('colgante') || s.includes('periapt')) return G('lorc/pendant')
  if (s.includes('brooch') || s.includes('broche') || s.includes('broche')) return G('lorc/brooch')
  if (s.includes('bracer') || s.includes('brazal') || s.includes('vambrace')) return G('lorc/forearm-armor')
  if (s.includes('bracelet') || s.includes('pulsera')) return G('lorc/forearm-armor')
  if (s.includes('gloves') || s.includes('guantes')) return G('lorc/gloves')
  if (s.includes('crown') || s.includes('corona')) return G('lorc/crown')
  if (s.includes('tiara') || s.includes('diadema')) return G('lorc/crown')
  if (s.includes('circlet') || s.includes('aro de cabeza')) return G('lorc/circlet')
  if (s.includes('hat') || s.includes('sombrero')) return G('lorc/top-hat')
  if (s.includes('headband') || s.includes('cintillo')) return G('lorc/thinking')
  if (s.includes('goggles') || s.includes('gafas')) return G('lorc/night-vision')
  if (s.includes('ioun stone') || s.includes('piedra ioun')) return G('lorc/gem-chain')
  if (s.includes('pearl') || s.includes('perla')) return G('lorc/pearl')
  if (s.includes('gem') || s.includes('gema') || s.includes('crystal') || s.includes('cristal')) return G('lorc/gemstone')

  // ── WONDROUS ITEMS ────────────────────────────────────────────────────────
  if (s.includes('broom of flying') || s.includes('escoba voladora')) return G('lorc/witch-flight')
  if (s.includes('carpet of flying') || s.includes('alfombra voladora')) return G('lorc/magic-carpet')
  if (s.includes('crystal ball') || s.includes('bola de cristal')) return G('lorc/crystal-ball')
  if (s.includes('sending stone') || s.includes('piedra de envio')) return G('lorc/flat-platform')
  if (s.includes('stone of good luck') || s.includes('piedra de buena suerte')) return G('lorc/four-leaf-clover')
  if (s.includes('wings') || s.includes('alas')) return G('lorc/angel-wings')
  if (s.includes('saddle') || s.includes('silla de montar')) return G('lorc/saddle')
  if (s.includes('robe') || s.includes('tunica') || s.includes('túnica') || s.includes('toga')) return G('lorc/robe')
  if (s.includes('talisman') || s.includes('talismán')) return G('lorc/ankh')
  if (s.includes('cube of force')) return G('lorc/magic-shield')

  return null
}

export function getSpellIconUrl(name: string): string | null {
  const s = n(name)
  return BG3_SPELL_MAP[s] ?? null
}

// Category emoji fallback when no URL matches
export function getItemFallbackEmoji(name: string): string {
  const s = n(name)
  if (s.includes('sword') || s.includes('axe') || s.includes('bow') || s.includes('dagger') ||
      s.includes('espada') || s.includes('hacha') || s.includes('arco') || s.includes('daga') ||
      s.includes('spear') || s.includes('lance') || s.includes('mace') || s.includes('staff') ||
      s.includes('lanza') || s.includes('maza') || s.includes('weapon') || s.includes('arma'))
    return '⚔️'
  if (s.includes('armor') || s.includes('armadura') || s.includes('shield') || s.includes('escudo') ||
      s.includes('leather') || s.includes('cuero') || s.includes('plate') || s.includes('mail'))
    return '🛡️'
  if (s.includes('potion') || s.includes('pocion') || s.includes('elixir') || s.includes('antitoxin') ||
      s.includes('philter'))
    return '🧪'
  if (s.includes('scroll') || s.includes('pergamino')) return '📜'
  if (s.includes('wand') || s.includes('varita') || s.includes('ring') || s.includes('anillo') ||
      s.includes('amulet') || s.includes('staff') || s.includes('baculo') || s.includes('rod'))
    return '✨'
  if (s.includes('tool') || s.includes('herramienta') || s.includes('kit')) return '🔧'
  if (s.includes('bag') || s.includes('bolsa') || s.includes('backpack') || s.includes('mochila') ||
      s.includes('pouch') || s.includes('chest') || s.includes('cofre'))
    return '🎒'
  if (s.includes('torch') || s.includes('lantern') || s.includes('antorcha') || s.includes('linterna'))
    return '🕯️'
  if (s.includes('food') || s.includes('ration') || s.includes('comida') || s.includes('racion'))
    return '🍖'
  if (s.includes('gold') || s.includes('coin') || s.includes('oro') || s.includes('moneda'))
    return '💰'
  return '📦'
}
