#!/usr/bin/env node
/**
 * Genera el set de íconos de la app a partir del archivo oficial de game-icons.net.
 *
 * game-icons.net publica ~4.180 SVGs bajo CC-BY-3.0. Acá se copian únicamente los
 * que la app referencia (ver CONCEPTS / SCHOOLS), se les quita el rectángulo de
 * fondo y se dejan sin `fill`, de modo que sirvan como máscara CSS y hereden el
 * color del texto (ver `ItemIcon`). Eso permite que el mismo ícono lea bien sobre
 * pergamino claro y sobre madera oscura.
 *
 * Uso:
 *   node scripts/build-game-icons.mjs                 # descarga el archivo
 *   node scripts/build-game-icons.mjs --src <carpeta> # reusa una copia extraída
 *
 * Escribe:
 *   public/assets/icons/game-icons/*.svg
 *   src/lib/game-icons-map.ts
 */

import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs'
import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { tmpdir } from 'os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_SVG = join(ROOT, 'public/assets/icons/game-icons')
const OUT_TS = join(ROOT, 'src/lib/game-icons-map.ts')

const ARCHIVE_URL = 'https://game-icons.net/archives/svg/zip/ffffff/000000/game-icons.net.svg.zip'

// ── Mapeo concepto → ícono de game-icons ─────────────────────────────────────
// La clave es el concepto que usa la cascada semántica de `item-icons.ts`.
// El valor es el nombre del archivo en el archivo de game-icons (sin autor ni .svg).

const CONCEPTS = {
  // ── Armas cuerpo a cuerpo ──
  longsword: 'broadsword',
  greatsword: 'two-handed-sword',
  shortsword: 'pointy-sword',
  rapier: 'piercing-sword',
  scimitar: 'sparkling-sabre',
  dagger: 'plain-dagger',
  greataxe: 'war-axe',
  battleaxe: 'battle-axe',
  handaxe: 'sharp-axe',
  warhammer: 'warhammer',
  maul: 'thor-hammer',
  morningstar: 'spiked-mace',
  flail: 'flail',
  mace: 'flanged-mace',
  halberd: 'halberd',
  glaive: 'glaive',
  pike: 'spear-hook',
  spear: 'thrown-spear',
  trident: 'trident',
  'war-pick': 'war-pick',
  quarterstaff: 'wizard-staff',
  whip: 'whip',
  sickle: 'sickle',
  club: 'wood-club',

  // ── Armas a distancia ──
  dart: 'dart',
  crossbow: 'crossbow',
  longbow: 'bow-arrow',
  shortbow: 'pocket-bow',
  ammunition: 'quiver',
  net: 'fishing-net',

  // ── Armaduras ──
  'plate-armor': 'chest-armor',
  'half-plate': 'armor-vest',
  'splint-mail': 'layered-armor',
  'chain-mail': 'chain-mail',
  'ring-mail': 'mail-shirt',
  breastplate: 'breastplate',
  'scale-mail': 'scale-mail',
  'chain-shirt': 'mail-shirt',
  'studded-leather': 'spiked-armor',
  'leather-armor': 'leather-armor',
  'padded-armor': 'leather-vest',
  shield: 'shield',
  helmet: 'helmet',
  gloves: 'gloves',
  boots: 'leather-boot',

  // ── Pociones y líquidos ──
  'potion-healing': 'health-potion',
  poison: 'poison-bottle',
  acid: 'acid-tube',
  elixir: 'standing-potion',
  bottle: 'water-flask',

  // ── Papel y arcano ──
  scroll: 'tied-scroll',
  book: 'spell-book',
  wand: 'crystal-wand',
  ring: 'ring',
  amulet: 'holy-symbol',
  cloak: 'cloak',

  // ── Contenedores ──
  pack: 'backpack',
  chest: 'locked-chest',
  pouch: 'swap-bag',

  // ── Luz ──
  lantern: 'lantern',
  torch: 'torch',
  candle: 'candle-holder',

  // ── Equipo de aventura ──
  food: 'meat',
  spyglass: 'spyglass',
  caltrops: 'caltrops',
  rope: 'rope-coil',
  chain: 'crossed-chains',
  hourglass: 'hourglass',
  bell: 'ringing-bell',
  lock: 'padlock',
  lockpicks: 'lockpicks',
  scales: 'weight-scale',
  pot: 'cooking-pot',
  stone: 'stone-sphere',
  fire: 'fire',
  incense: 'incense',
  pickaxe: 'mining',
  crowbar: 'crowbar',
  ladder: 'ladder',
  key: 'key',
  bedroll: 'sleeping-bag',
  tent: 'camping-tent',
  soap: 'soap',
  herbs: 'herbs-bundle',
  alchemy: 'bubbling-flask',
  trap: 'wolf-trap',
  totem: 'totem',
  quill: 'quill-ink',
  disguise: 'drama-masks',
  clothes: 'clothes',
  mirror: 'mirror-mirror',
  abacus: 'abacus',

  // ── Monturas y vehículos ──
  mount: 'horse-head',
  saddle: 'saddle',
  cart: 'old-wagon',
  boat: 'sailboat',

  // ── Instrumentos ──
  lute: 'banjo',
  flute: 'flute',
  drum: 'drum',
  horn: 'hunting-horn',
  violin: 'violin',
  bagpipes: 'bagpipes',
  lyre: 'lyre',
  dulcimer: 'harp',
  panflute: 'pan-flute',

  // ── Sets de juego ──
  gaming: 'poker-hand',
  dice: 'dice-six-faces-one',
  chess: 'chess-knight',

  // ── Genéricos ──
  coins: 'coins',
  gem: 'gems',
  misc: 'swap-bag',
}

// Trasfondos del wizard de creación → ícono. Las claves son las del SRD que usa
// `step1-basic-info.tsx`; varios trasfondos comparten arquetipo a propósito.
const BACKGROUNDS = {
  acolyte: 'prayer',
  artisan: 'anvil',
  charlatan: 'jester-hat',
  criminal: 'bandit',
  entertainer: 'theater',
  farmer: 'pitchfork',
  guard: 'helmet',
  guide: 'compass',
  hermit: 'cowled',
  merchant: 'anvil',
  noble: 'crown',
  sage: 'scroll-unfurled',
  sailor: 'sailboat',
  scribe: 'quill-ink',
  soldier: 'swordman',
  wayfarer: 'hood',
}

// Escuelas de magia del SRD → ícono. Los conjuros se resuelven por escuela y no
// uno por uno: son 300+ hechizos y el ícono por escuela comunica mejor que un
// match aproximado por nombre.
const SCHOOLS = {
  abjuration: 'magic-shield',
  conjuration: 'fairy-wand',
  divination: 'third-eye',
  enchantment: 'gooey-eyed-sun',
  evocation: 'fire-ray',
  illusion: 'curly-mask',
  necromancy: 'candle-skull',
  transmutation: 'stone-crafting',
}

// ── Ejecución ────────────────────────────────────────────────────────────────

/**
 * Devuelve la carpeta con los SVGs de game-icons. `--src` permite apuntar a una
 * copia ya extraída; si no, descarga el archivo y lo cachea en el temporal del
 * sistema para no bajar 4 MB en cada corrida.
 */
function resolveSource() {
  const flag = process.argv.indexOf('--src')
  if (flag !== -1 && process.argv[flag + 1]) {
    const dir = process.argv[flag + 1]
    if (!existsSync(dir)) throw new Error(`--src no existe: ${dir}`)
    return dir
  }

  const work = join(tmpdir(), 'game-icons-build')
  const extracted = join(work, 'x')
  if (existsSync(extracted)) {
    console.log('Usando el archivo cacheado en', extracted)
    return extracted
  }

  mkdirSync(work, { recursive: true })
  const zip = join(work, 'icons.zip')
  console.log('Descargando game-icons.net…')
  execSync(`curl -sL -o "${zip}" "${ARCHIVE_URL}"`, { stdio: 'inherit' })
  execSync(`unzip -q -o "${zip}" -d "${extracted}"`, { stdio: 'inherit' })
  return extracted
}

/** Indexa nombre-de-ícono → ruta absoluta, ignorando la carpeta de autor. */
function indexIcons(root) {
  const index = new Map()
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.svg')) {
        const key = entry.name.replace(/\.svg$/, '')
        if (!index.has(key)) index.set(key, full)
      }
    }
  }
  walk(root)
  return index
}

/**
 * Quita el rect de fondo y el `fill` blanco. Sin fondo, el alpha del SVG queda
 * limitado a la silueta del ícono, que es lo que `mask-image` necesita.
 */
function clean(svg) {
  return svg
    .replace(/<path d="M0 0h512v512H0z"\s*\/>/g, '')
    .replace(/\sfill="#fff"/g, '')
}

const src = resolveSource()
const index = indexIcons(src)

rmSync(OUT_SVG, { recursive: true, force: true })
mkdirSync(OUT_SVG, { recursive: true })

const missing = []

/** Copia los SVGs de un grupo y devuelve el mapa clave → ruta pública. */
function emitGroup(group, label) {
  const out = new Map()
  for (const [key, iconName] of Object.entries(group)) {
    const path = index.get(iconName)
    if (!path) { missing.push(`${label}:${key} → ${iconName}`); continue }
    const file = `${iconName}.svg`
    if (!existsSync(join(OUT_SVG, file))) {
      writeFileSync(join(OUT_SVG, file), clean(readFileSync(path, 'utf8')))
    }
    out.set(key, `/assets/icons/game-icons/${file}`)
  }
  return out
}

const emitted = emitGroup(CONCEPTS, 'concepto')
const backgroundEntries = emitGroup(BACKGROUNDS, 'trasfondo')
const schoolEntries = emitGroup(SCHOOLS, 'escuela')

if (missing.length) {
  console.error(`\n⚠️  ${missing.length} íconos no encontrados en el archivo:`)
  for (const m of missing) console.error(`   ${m}`)
}

const toRecord = (map, name, comment) => [
  `// ${comment}`,
  `export const ${name}: Record<string, string> = {`,
  [...map.entries()].map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n'),
  `}`,
].join('\n')

writeFileSync(OUT_TS, [
  '// Auto-generado por scripts/build-game-icons.mjs — no editar a mano.',
  '// Íconos de game-icons.net, CC-BY-3.0. Ver ATTRIBUTIONS.md.',
  '',
  toRecord(emitted, 'GAME_ICONS', `${emitted.size} conceptos de equipo`),
  '',
  toRecord(backgroundEntries, 'BACKGROUND_ICONS', `${backgroundEntries.size} trasfondos`),
  '',
  toRecord(schoolEntries, 'SCHOOL_ICONS', `${schoolEntries.size} escuelas de magia`),
  '',
].join('\n'))

const files = readdirSync(OUT_SVG)
console.log(`\n✅ ${emitted.size} conceptos + ${backgroundEntries.size} trasfondos + ${schoolEntries.size} escuelas → ${files.length} SVGs únicos`)
console.log(`   ${OUT_SVG}`)
console.log(`   ${OUT_TS}`)
