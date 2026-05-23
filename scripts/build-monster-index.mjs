import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://www.dnd5eapi.co/api/2014'
const OUT = resolve(__dirname, '../src/data/monster-index.json')
const CONCURRENCY = 10

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`)
  return res.json()
}

async function fetchInBatches(items, fn, batchSize) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    process.stdout.write(`\r  ${results.length}/${items.length}`)
  }
  process.stdout.write('\n')
  return results
}

console.log('Fetching monster list...')
const { results: summaries } = await get('/monsters')
console.log(`  ${summaries.length} monsters found`)

console.log('Fetching monster details...')
const details = await fetchInBatches(summaries, async (s) => {
  const d = await get(`/monsters/${s.index}`)
  const ac = d.armor_class?.[0]?.value ?? 10
  const attackBonus = d.actions
    ?.filter(a => a.attack_bonus != null)
    ?.reduce((best, a) => Math.max(best, a.attack_bonus), 0) ?? 0
  return {
    index: d.index,
    name: d.name,
    type: d.type,
    cr: d.challenge_rating,
    xp: d.xp,
    ac,
    attackBonus,
  }
}, CONCURRENCY)

writeFileSync(OUT, JSON.stringify(details, null, 2))
console.log(`Written to src/data/monster-index.json (${details.length} monsters)`)
