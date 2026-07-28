#!/usr/bin/env node
/**
 * Optimiza las imágenes de `public/assets/images/`.
 *
 * Las ilustraciones son arte generado y se guardaron como PNG, que para imagen
 * fotográfica pesa ~1 byte por píxel. Las que no tienen canal alfa se recomprimen
 * a JPEG (≈25% del peso original) y se reescriben las referencias en el código.
 * Las que sí lo tienen se dejan intactas: JPEG no soporta transparencia y `sips`
 * —la única herramienta disponible sin sumar dependencias— no escribe WebP.
 *
 * Uso:
 *   node scripts/optimize-images.mjs --dry     # solo reporta
 *   node scripts/optimize-images.mjs           # aplica
 */

import { readdirSync, statSync, readFileSync, writeFileSync, rmSync, renameSync } from 'fs'
import { execFileSync } from 'child_process'
import { join, dirname, relative, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const IMAGES = join(ROOT, 'public/assets/images')
const QUALITY = '82'
const DRY = process.argv.includes('--dry')

// Assets sin ninguna referencia en el código. Se listan explícitamente en vez de
// detectarlos por grep para que borrar un archivo sea siempre una decisión leída.
const DEAD = [
  'races/miniaturas.png',
  'pnj_bg.png',
  'tavern_bg.png',
  'comercio_bg.png',
  'Fondo DM.png',
]

// Archivos con espacios o paréntesis en el nombre: rompen URLs y obligan a
// escapar en cada uso.
const RENAMES = { 'wax seal (1).png': 'wax-seal.png' }

const SOURCE_GLOBS = ['src', 'index.html']

/**
 * Referencias construidas con template literal (`races/${r.index}.png`), que no
 * se pueden reescribir por ruta concreta. El negative lookahead protege a los
 * `_avatar`, que conservan alfa y siguen siendo PNG.
 */
const TEMPLATE_REWRITES = [
  [/(\/assets\/images\/(?:races|classes|backgrounds)\/\$\{[^}]+\})(?!_avatar)\.png/g, '$1.jpg'],
]

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e => {
  const full = join(dir, e.name)
  return e.isDirectory() ? walk(full) : [full]
})

const kb = bytes => `${Math.round(bytes / 1024)} KB`

const hasAlpha = file =>
  execFileSync('sips', ['-g', 'hasAlpha', file], { encoding: 'utf8' }).trim().endsWith('yes')

// ── 1. Borrar assets muertos ─────────────────────────────────────────────────

let freed = 0
for (const rel of DEAD) {
  const full = join(IMAGES, rel)
  try {
    freed += statSync(full).size
    if (!DRY) rmSync(full)
    console.log(`  borrado  ${rel}`)
  } catch { console.log(`  (ya no está) ${rel}`) }
}
console.log(`\nAssets muertos: ${kb(freed)} liberados\n`)

// ── 2. Renombrar archivos con nombres problemáticos ──────────────────────────

const rewrites = new Map() // ruta pública vieja → nueva

for (const [from, to] of Object.entries(RENAMES)) {
  try {
    statSync(join(IMAGES, from))
    if (!DRY) renameSync(join(IMAGES, from), join(IMAGES, to))
    rewrites.set(`/assets/images/${from}`, `/assets/images/${to}`)
    console.log(`  renombrado  ${from} → ${to}`)
  } catch { /* ya renombrado */ }
}

// ── 3. Recomprimir a JPEG lo que no tiene alfa ───────────────────────────────

let before = 0, after = 0, converted = 0, kept = 0

for (const file of walk(IMAGES)) {
  if (extname(file).toLowerCase() !== '.png') continue

  const size = statSync(file).size
  if (hasAlpha(file)) {
    kept++
    before += size; after += size
    continue
  }

  const out = file.replace(/\.png$/i, '.jpg')
  if (!DRY) {
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', QUALITY, file, '--out', out])
    rmSync(file)
  }
  const newSize = DRY ? Math.round(size * 0.26) : statSync(out).size

  const pub = p => '/assets/images/' + relative(IMAGES, p).split('/').join('/')
  rewrites.set(pub(file), pub(out))

  before += size; after += newSize; converted++
  console.log(`  ${basename(file).padEnd(28)} ${kb(size).padStart(8)} → ${kb(newSize).padStart(8)}`)
}

// ── 4. Reescribir referencias en el código ───────────────────────────────────

const sources = SOURCE_GLOBS.flatMap(g => {
  const full = join(ROOT, g)
  return statSync(full).isDirectory() ? walk(full) : [full]
}).filter(f => /\.(tsx?|css|html)$/.test(f))

let touched = 0
for (const file of sources) {
  const original = readFileSync(file, 'utf8')
  let next = original
  for (const [from, to] of rewrites) next = next.split(from).join(to)
  for (const [pattern, replacement] of TEMPLATE_REWRITES) next = next.replace(pattern, replacement)
  if (next !== original) {
    if (!DRY) writeFileSync(file, next)
    touched++
    console.log(`  actualizado  ${relative(ROOT, file)}`)
  }
}

console.log(`\n${DRY ? '[DRY RUN] ' : ''}${converted} convertidas a JPEG, ${kept} conservadas como PNG (tienen alfa)`)
console.log(`Imágenes: ${kb(before)} → ${kb(after)}  ·  ${touched} archivos de código actualizados`)
console.log(`Total liberado: ${kb(freed + before - after)}`)
