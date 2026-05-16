#!/usr/bin/env node
/**
 * Downloads all BG3 wiki thumbnails locally into public/assets/icons/bg3/
 * and rewrites bg3-icon-map.ts + bg3-spell-map.ts to use local paths.
 *
 * Usage: node scripts/download-bg3-icons.mjs
 * Safe to re-run: skips already-downloaded files.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { fileURLToPath } from 'url'
import { dirname, basename } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT     = `${__dirname}/..`
const OUT_DIR  = `${ROOT}/public/assets/icons/bg3`
const LIB_DIR  = `${ROOT}/src/lib`

mkdirSync(OUT_DIR, { recursive: true })

// ── Load both maps from source ───────────────────────────────────────────────

function extractMap(ts) {
  const entries = {}
  const re = /^\s+"([^"]+)":\s+"(https?:\/\/[^"]+)"/gm
  let m
  while ((m = re.exec(ts)) !== null) entries[m[1]] = m[2]
  return entries
}

const itemTs  = readFileSync(`${LIB_DIR}/bg3-icon-map.ts`,   'utf8')
const spellTs = readFileSync(`${LIB_DIR}/bg3-spell-map.ts`,  'utf8')

const itemMap  = extractMap(itemTs)
const spellMap = extractMap(spellTs)

// Deduplicate: same URL may appear in both maps
const allUrls = new Map() // url → local filename
for (const url of [...Object.values(itemMap), ...Object.values(spellMap)]) {
  if (!allUrls.has(url)) {
    // Use the filename from the URL, decoded
    const raw = url.split('/').pop()           // "50px-Longsword_Unfaded_Icon.png.webp"
    const filename = decodeURIComponent(raw)   // safe filename
    allUrls.set(url, filename)
  }
}

// ── Download ─────────────────────────────────────────────────────────────────

const CONCURRENCY = 8
let done = 0, skipped = 0, failed = 0
const total = allUrls.size

async function downloadOne(url, filename) {
  const dest = `${OUT_DIR}/${filename}`
  if (existsSync(dest)) { skipped++; return }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; taberna-icon-downloader/1.0)' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await pipeline(res.body, createWriteStream(dest))
    done++
    if (done % 50 === 0) process.stderr.write(`  ${done + skipped}/${total}\n`)
  } catch (e) {
    failed++
    process.stderr.write(`  FAIL: ${filename} — ${e.message}\n`)
  }
}

process.stderr.write(`Downloading ${total} icons to public/assets/icons/bg3/ ...\n`)

const entries = [...allUrls.entries()]
for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const batch = entries.slice(i, i + CONCURRENCY)
  await Promise.all(batch.map(([url, fname]) => downloadOne(url, fname)))
}

process.stderr.write(`Done: ${done} downloaded, ${skipped} already existed, ${failed} failed\n\n`)

// ── Rewrite TS maps ───────────────────────────────────────────────────────────

function rewriteMap(original, map, varName, comment) {
  const lines = Object.entries(map).map(([key, url]) => {
    const filename = allUrls.get(url)
    const local = `/assets/icons/bg3/${filename}`
    return `  ${JSON.stringify(key)}: ${JSON.stringify(local)},`
  })
  return [
    `// ${comment}`,
    `// Local copy — run scripts/download-bg3-icons.mjs to refresh`,
    `export const ${varName}: Record<string, string> = {`,
    lines.join('\n'),
    `}`,
  ].join('\n')
}

const itemHeader  = itemTs.split('\n').slice(0, 2).join('\n')
const spellHeader = spellTs.split('\n').slice(0, 2).join('\n')

writeFileSync(
  `${LIB_DIR}/bg3-icon-map.ts`,
  rewriteMap(itemTs,  itemMap,  'BG3_ICON_MAP',   itemHeader)
)
writeFileSync(
  `${LIB_DIR}/bg3-spell-map.ts`,
  rewriteMap(spellTs, spellMap, 'BG3_SPELL_MAP', spellHeader)
)

process.stderr.write(`Rewrote src/lib/bg3-icon-map.ts → local paths\n`)
process.stderr.write(`Rewrote src/lib/bg3-spell-map.ts → local paths\n`)
process.stderr.write(`\nAdd to .gitignore if you don't want images in the repo:\n`)
process.stderr.write(`  public/assets/icons/bg3/\n`)
