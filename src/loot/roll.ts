import type { Archetype } from '../data/encounter-archetypes'
import type { LootItem } from './types'

export type RollCtx = {
  partyLevel: number
  rng?: () => number
}

export type LootResult = {
  gold: number
  items: Array<{ item: LootItem; quantity: number }>
}

export function rollLoot(arch: Archetype, ctx: RollCtx): LootResult {
  const rng = ctx.rng ?? Math.random
  const out: LootResult = { gold: 0, items: [] }
  if (!arch.loot) return out

  const { loot } = arch
  const level = clamp(ctx.partyLevel, arch.levelRange[0], arch.levelRange[1])

  const [gMin, gMax] = loot.goldRange
  const scale = (loot.goldScale ?? defaultGoldScale)(level)
  out.gold = Math.floor((gMin + rng() * (gMax - gMin)) * scale)

  const allDrops = [...loot.commonDrops, ...loot.encounterDrops]
  for (const drop of allDrops) {
    if (drop.minLevel && level < drop.minLevel) continue
    if (rng() > drop.chance) continue
    const [min, max] = drop.rollCount ?? [1, 1]
    const count = min + Math.floor(rng() * (max - min + 1))
    for (let i = 0; i < count; i++) {
      const item = pickWeighted(drop.pool, rng)
      if (item) mergeItem(out.items, item)
    }
  }

  if (loot.signature && rng() < loot.signature.chance) {
    const item = pickWeighted(loot.signature.items, rng)
    if (item) mergeItem(out.items, item)
  }

  return out
}

function defaultGoldScale(level: number): number {
  return 1 + Math.max(0, level - 1) * 0.1
}

function pickWeighted(pool: LootItem[], rng: () => number): LootItem | null {
  if (!pool.length) return null
  const total = pool.reduce((s, i) => s + (i.weight ?? 1), 0)
  let r = rng() * total
  for (const i of pool) {
    r -= i.weight ?? 1
    if (r <= 0) return i
  }
  return pool[pool.length - 1]
}

function mergeItem(arr: LootResult['items'], item: LootItem) {
  const existing = arr.find(e => e.item.index === item.index)
  if (existing) existing.quantity++
  else arr.push({ item, quantity: 1 })
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
