#!/usr/bin/env node
/**
 * Scrapes ALL equipment icons from bg3.wiki/wiki/Category:Equipment_icons
 * The category tree is 2–3 levels deep:
 *   Equipment_icons → Weapon_icons → Dagger_icons → files
 *   Equipment_icons → Amulet_icons → files
 *
 * Also scrapes spells from List_of_all_spells (separate map).
 *
 * Usage:
 *   node scripts/scrape-bg3-icons.mjs           # items + spells
 *   node scripts/scrape-bg3-icons.mjs items     # items only
 *   node scripts/scrape-bg3-icons.mjs spells    # spells only
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://bg3.wiki'
const OUT  = `${__dirname}/../src/lib`

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; taberna-icon-scraper/1.0)' }

// ── Helpers ──────────────────────────────────────────────────────────────────

async function get(path) {
  const url = path.startsWith('http') ? path : BASE + path
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function nameFromFilename(raw) {
  // "Longsword_Unfaded_Icon.png" → "longsword"
  // "Leather_Armour_%2B1_Unfaded_Icon.png" → "leather armour +1"
  const decoded = decodeURIComponent(raw)
  return decoded
    .replace(/_Unfaded_Icon\.(png|webp)$/i, '')
    .replace(/_Faded_Icon\.(png|webp)$/i, '')
    .replace(/_Icon\.(png|webp)$/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .trim()
}

function toTS(items, varName, comment) {
  const lines = [...items.entries()].map(([key, url]) =>
    `  ${JSON.stringify(key)}: ${JSON.stringify(url)},`
  )
  return [
    `// ${comment}`,
    `// ${items.size} items — regenerate: node scripts/scrape-bg3-icons.mjs`,
    `export const ${varName}: Record<string, string> = {`,
    lines.join('\n'),
    `}`,
  ].join('\n')
}

// ── Leaf category scraper: extracts gallery icons (handles pagination) ────────

async function scrapeLeafCategory(path, map, seen) {
  let url = path
  let pageCount = 0

  while (url) {
    const html = await get(url)
    pageCount++

    // Gallery structure:
    // <li class="gallerybox">
    //   <div class="thumb">
    //     <a href="/wiki/File:NAME_Unfaded_Icon.png">
    //       <picture><img src="/w/images/HASH/NAME.png"></picture>
    //     </a>
    //   </div>
    // </li>
    const galleryRegex = /class="gallerybox"[\s\S]*?href="\/wiki\/File:([^"]+)"[\s\S]*?<img[^>]+src="(\/w\/images\/[^"]+)"[^>]*>/g
    let m
    while ((m = galleryRegex.exec(html)) !== null) {
      const fileRef = m[1]
      const imgSrc  = m[2]

      if (fileRef.includes('Faded') && !fileRef.includes('Unfaded')) continue
      if (!fileRef.includes('Icon')) continue

      const name = nameFromFilename(fileRef)
      if (!name || name.length < 2) continue
      if (seen.has(name)) continue
      seen.add(name)

      map.set(name, BASE + imgSrc)
    }

    // Pagination: "next 200" / "next 500" link
    const nextMatch = html.match(/href="(\/wiki\/Category:[^"]+&amp;(?:file)?from=[^"]+)"[^>]*>\s*(?:next\s*\d+|siguiente)/i)
    url = nextMatch ? nextMatch[1].replace(/&amp;/g, '&') : null
  }

  return pageCount
}

// ── Recursive category traversal ─────────────────────────────────────────────

async function traverseCategory(path, map, seen, visited, depth = 0) {
  if (visited.has(path)) return
  visited.add(path)

  const html = await get(path)
  const indent = '  '.repeat(depth)

  // If the page has gallery items, scrape them directly
  if (html.includes('class="gallerybox"')) {
    const before = map.size
    await scrapeLeafCategory(path, map, seen)
    const label = path.split(':').pop().replace(/_/g, ' ')
    process.stderr.write(`${indent}${label}: +${map.size - before} icons (total ${map.size})\n`)
    return
  }

  // Otherwise, find child category links and recurse
  const subCatRegex = /href="(\/wiki\/Category:[^"#?]+)"[^>]*>/gi
  const children = new Set()
  let m
  while ((m = subCatRegex.exec(html)) !== null) {
    const child = m[1].replace(/&amp;/g, '&')
    if (child !== path && !visited.has(child)) children.add(child)
  }

  if (children.size > 0) {
    const label = path.split(':').pop().replace(/_/g, ' ')
    process.stderr.write(`${indent}${label} → ${children.size} subcategories\n`)
    for (const child of children) {
      await traverseCategory(child, map, seen, visited, depth + 1)
    }
  }
}

// ── ITEMS: Category:Equipment_icons ──────────────────────────────────────────

async function scrapeItems() {
  process.stderr.write('Traversing Category:Equipment_icons...\n')

  const map     = new Map()
  const seen    = new Set()
  const visited = new Set()

  await traverseCategory('/wiki/Category:Equipment_icons', map, seen, visited)

  process.stderr.write(`\nItems total: ${map.size}\n`)
  writeFileSync(`${OUT}/bg3-icon-map.ts`,
    toTS(map, 'BG3_ICON_MAP', `Auto-generated ${new Date().toISOString().slice(0,10)} from Category:Equipment_icons`))
  process.stderr.write(`Wrote src/lib/bg3-icon-map.ts\n`)
}

// ── SPELLS: List_of_all_spells (<picture>/<source srcset>) ────────────────────

function bestFromSrcset(srcset) {
  const parts = srcset.split(',').map(s => s.trim())
  const oneAndHalf = parts.find(p => p.includes('1.5x'))
  return (oneAndHalf ?? parts[0]).split(/\s+/)[0]
}

async function scrapeSpells() {
  process.stderr.write('\nFetching List_of_all_spells...\n')
  const html = await get('/wiki/List_of_all_spells')
  const map  = new Map()
  const seen = new Set()

  const liRegex = /<li>([\s\S]*?)<\/li>/gi
  let liM
  while ((liM = liRegex.exec(html)) !== null) {
    const block = liM[1]
    if (!block.includes('bg3wiki-icon')) continue

    const iconM = /<a\s+href="(\/wiki\/[^"#?]+)"[^>]*>\s*<picture>([\s\S]*?)<\/picture>/g.exec(block)
    if (!iconM) continue

    const href = iconM[1]
    if (/\/(Special|Category|File|Help|Template):/.test(href)) continue

    const pictureHtml = iconM[2]
    const srcsetM = pictureHtml.match(/srcset="([^"]+)"/)
    const srcM    = pictureHtml.match(/<img[^>]+src="([^"]+)"/)
    if (!srcsetM && !srcM) continue

    const rawUrl = srcsetM ? bestFromSrcset(srcsetM[1]) : srcM[1]
    const altM   = pictureHtml.match(/alt="([^"]*)"/)
    const name   = (altM?.[1] ?? '').toLowerCase().trim()
    if (!name || name.length < 2 || seen.has(name)) continue
    seen.add(name)
    map.set(name, BASE + rawUrl)
  }

  process.stderr.write(`Spells total: ${map.size}\n`)
  writeFileSync(`${OUT}/bg3-spell-map.ts`,
    toTS(map, 'BG3_SPELL_MAP', `Auto-generated ${new Date().toISOString().slice(0,10)} from List_of_all_spells`))
  process.stderr.write(`Wrote src/lib/bg3-spell-map.ts\n`)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const mode = process.argv[2]
if (!mode || mode === 'items')  await scrapeItems()
if (!mode || mode === 'spells') await scrapeSpells()
