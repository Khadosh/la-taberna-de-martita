/**
 * Pobla src/loot/items.json desde dnd5eapi.co.
 * Correr con: npx tsx scripts/ingest-loot.ts
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://www.dnd5eapi.co/api/2014'

type LootTier = 'mundane' | 'uncommon' | 'rare' | 'epic' | 'legendary'
type LootCategory = 'weapon' | 'armor' | 'consumable' | 'scroll' | 'gem' | 'art' | 'trinket' | 'quest'

type LootItem = {
  index: string
  name: string
  tier: LootTier
  category: LootCategory
}

const RARITY_TO_TIER: Record<string, LootTier> = {
  'Common': 'mundane',
  'Uncommon': 'uncommon',
  'Rare': 'rare',
  'Very Rare': 'epic',
  'Legendary': 'legendary',
  'Artifact': 'legendary',
}

const EQUIPMENT_CATEGORIES: Array<{ slug: string; category: LootCategory }> = [
  { slug: 'weapon', category: 'weapon' },
  { slug: 'armor', category: 'armor' },
  { slug: 'potion', category: 'consumable' },
  { slug: 'scroll', category: 'scroll' },
]

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json() as Promise<T>
}

async function ingestEquipment(): Promise<LootItem[]> {
  const items: LootItem[] = []
  for (const { slug, category } of EQUIPMENT_CATEGORIES) {
    const data = await fetchJson<{ equipment: Array<{ index: string; name: string }> }>(
      `${BASE}/equipment-categories/${slug}`,
    )
    for (const e of data.equipment) {
      items.push({ index: e.index, name: e.name, tier: 'mundane', category })
    }
  }
  return items
}

async function ingestMagicItems(): Promise<LootItem[]> {
  const list = await fetchJson<{ results: Array<{ index: string; name: string }> }>(
    `${BASE}/magic-items`,
  )

  const items: LootItem[] = []
  const CONCURRENCY = 8
  for (let i = 0; i < list.results.length; i += CONCURRENCY) {
    const batch = list.results.slice(i, i + CONCURRENCY)
    const detailed = await Promise.all(
      batch.map(r =>
        fetchJson<{ index: string; name: string; rarity?: { name: string }; equipment_category?: { index: string } }>(
          `${BASE}/magic-items/${r.index}`,
        ),
      ),
    )
    for (const d of detailed) {
      const tier = RARITY_TO_TIER[d.rarity?.name ?? 'Common'] ?? 'uncommon'
      const category = mapMagicCategory(d.equipment_category?.index)
      items.push({ index: d.index, name: d.name, tier, category })
    }
    process.stdout.write(`  ${i + batch.length}/${list.results.length}\r`)
  }
  return items
}

function mapMagicCategory(catIndex?: string): LootCategory {
  switch (catIndex) {
    case 'weapon': return 'weapon'
    case 'armor': return 'armor'
    case 'potion': return 'consumable'
    case 'scroll': return 'scroll'
    case 'wondrous-items': return 'trinket'
    default: return 'trinket'
  }
}

async function main() {
  console.log('Ingesting equipment...')
  const equipment = await ingestEquipment()
  console.log(`  -> ${equipment.length} items`)

  console.log('Ingesting magic items...')
  const magic = await ingestMagicItems()
  console.log(`\n  -> ${magic.length} items`)

  const all = [...equipment, ...magic]
  const map = new Map<string, LootItem>()
  for (const i of all) map.set(i.index, i)
  const out = Array.from(map.values()).sort((a, b) => a.index.localeCompare(b.index))

  const target = resolve('src/loot/items.json')
  writeFileSync(target, JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.length} items -> ${target}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
