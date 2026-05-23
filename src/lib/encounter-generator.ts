import type { Character } from '../components/tablero/tablero-types'
import type { Archetype, ArchetypeEntry, Role } from '../data/encounter-archetypes'

export type { Role } from '../data/encounter-archetypes'

export type MonsterIndexEntry = {
  index: string
  name: string
  type: string
  cr: number
  xp: number
  ac: number
  attackBonus: number
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'deadly'

// One row per creature type in the encounter table. Source of truth for editing.
export type CreatureRow = {
  id: string
  monsterIndex: string
  name: string
  cr: number
  xp: number
  ac: number
  attackBonus: number
  level: number
  // Loaded async from API (undefined until fetched)
  hp?: number
  hitDice?: string
  damageStr?: string
  // Ability scores (loaded async)
  str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number
  speed?: string
  specialAbilities?: { name: string; desc: string }[]
  // DM-editable counts per role
  counts: Record<Role, number>
  // Per-unit level overrides: key = "${role}-${index}", value = level
  unitLevels?: Record<string, number>
}

// Derived from rows for XP math and spawn
export type EncounterUnit = {
  id: string
  monsterIndex: string
  name: string
  role: Role
  cr: number
  xp: number
  level: number
}

export type LootItemEntry = {
  id: string
  name: string
  qty: number
}

export type LootCurrency = { gp: number; sp: number; cp: number }

export type Loot = {
  currency: LootCurrency
  items: LootItemEntry[]
}

export type EncounterResult = {
  rows: CreatureRow[]
  loot: Loot
}

export const LOOT_ITEM_OPTIONS = [
  'Gema semipreciosa',
  'Gema valiosa',
  'Poción de curación',
  'Poción de curación superior',
  'Arma cuerpo a cuerpo usada',
  'Escudo deteriorado',
  'Flechas',
  'Pergamino de conjuro',
  'Símbolo sagrado',
  'Objeto mágico menor',
] as const

export type LootItemName = (typeof LOOT_ITEM_OPTIONS)[number]

// XP thresholds per character level (index = level - 1)
const XP_THRESHOLDS: [number, number, number, number][] = [
  [25,  50,   75,   100],  // 1
  [50,  100,  150,  200],  // 2
  [75,  150,  225,  400],  // 3
  [125, 250,  375,  500],  // 4
  [250, 500,  750,  1100], // 5
  [300, 600,  900,  1400], // 6
  [350, 750,  1100, 1700], // 7
  [450, 900,  1400, 2100], // 8
  [550, 1100, 1600, 2400], // 9
  [600, 1200, 1900, 2800], // 10
]

export function calculateXpThresholds(characters: Character[]): Record<Difficulty, number> {
  const totals = [0, 0, 0, 0]
  for (const ch of characters) {
    const level = Math.max(1, Math.min(10, ch.level))
    const row = XP_THRESHOLDS[level - 1]
    row.forEach((v, i) => { totals[i] += v })
  }
  return { easy: totals[0], medium: totals[1], hard: totals[2], deadly: totals[3] }
}

export function xpMultiplier(count: number): number {
  if (count === 1)   return 1.0
  if (count === 2)   return 1.5
  if (count <= 6)    return 2.0
  if (count <= 10)   return 2.5
  if (count <= 14)   return 3.0
  return 4.0
}

export function xpAtLevel(baseXp: number, level: number): number {
  return Math.floor(baseXp * Math.max(1, level))
}

export function hpAtLevel(baseHp: number, level: number): number {
  return Math.floor(baseHp * Math.max(1, level))
}

export function unitsFromRows(rows: CreatureRow[]): EncounterUnit[] {
  const units: EncounterUnit[] = []
  for (const row of rows) {
    const level = row.level ?? 1
    for (const [role, count] of Object.entries(row.counts) as [Role, number][]) {
      if (count <= 0) continue
      for (let i = 0; i < count; i++) {
        const unitLevel = row.unitLevels?.[`${role}-${i}`] ?? level
        units.push({
          id: `${row.id}-${role}-${i}`,
          monsterIndex: row.monsterIndex,
          name: row.name,
          role,
          cr: row.cr,
          xp: xpAtLevel(row.xp, unitLevel),
          level: unitLevel,
        })
      }
    }
  }
  return units
}

export function calcAdjustedXp(units: EncounterUnit[]): number {
  const total = units.reduce((s, u) => s + u.xp, 0)
  return Math.round(total * xpMultiplier(units.length))
}

export function difficultyForXp(adjustedXp: number, thresholds: Record<Difficulty, number>): Difficulty | 'trivial' {
  if (adjustedXp >= thresholds.deadly) return 'deadly'
  if (adjustedXp >= thresholds.hard)   return 'hard'
  if (adjustedXp >= thresholds.medium) return 'medium'
  if (adjustedXp >= thresholds.easy)   return 'easy'
  return 'trivial'
}

export function crLabel(cr: number): string {
  if (cr === 0)     return '0'
  if (cr === 0.125) return '⅛'
  if (cr === 0.25)  return '¼'
  if (cr === 0.5)   return '½'
  return String(cr)
}

function roll(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

function rollDice(count: number, sides: number): number {
  let total = 0
  for (let i = 0; i < count; i++) total += roll(sides)
  return total
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function generateLoot(rows: CreatureRow[]): Loot {
  const units = unitsFromRows(rows)
  const totalCr = units.reduce((s, u) => s + u.cr, 0)

  let gp = 0, sp = 0, cp = 0
  const items: LootItemEntry[] = []

  if (totalCr < 2) {
    gp = rollDice(1, 6)
    sp = rollDice(2, 6)
    cp = rollDice(3, 6)
  } else if (totalCr < 6) {
    gp = rollDice(2, 6)
    sp = rollDice(1, 8)
  } else if (totalCr < 12) {
    gp = rollDice(3, 8)
    sp = rollDice(1, 4)
  } else if (totalCr < 18) {
    gp = rollDice(4, 10)
  } else {
    gp = rollDice(6, 10)
  }

  const gemChance = totalCr < 2 ? 0.10 : totalCr < 6 ? 0.20 : totalCr < 12 ? 0.30 : 0.50
  if (Math.random() < gemChance) {
    items.push({ id: uid(), name: 'Gema semipreciosa', qty: totalCr < 6 ? 1 : rollDice(1, 3) })
  }

  const potionChance = totalCr < 2 ? 0.15 : totalCr < 6 ? 0.25 : 0.35
  if (Math.random() < potionChance) {
    items.push({ id: uid(), name: 'Poción de curación', qty: 1 })
  }

  if (units.some(u => u.role === 'ranged') && Math.random() < 0.35) {
    items.push({ id: uid(), name: 'Flechas', qty: rollDice(1, 4) * 5 })
  }

  return { currency: { gp, sp, cp }, items }
}

// "swarm of Tiny beasts" → beast for compatibility
export function normalizeType(type: string): string {
  return type.startsWith('swarm') ? 'beast' : type
}

export function generateRowsFromArchetype(params: {
  archetype: Archetype
  monsterIndex: MonsterIndexEntry[]
  difficulty: Difficulty
  characters: Character[]
}): EncounterResult | null {
  const { archetype, monsterIndex, difficulty, characters } = params

  const avgLevel = characters.length
    ? Math.round(characters.reduce((s, c) => s + c.level, 0) / characters.length)
    : 1

  const thresholds = calculateXpThresholds(characters)
  const budget = thresholds[difficulty]

  const lookup = new Map(monsterIndex.map(m => [m.index, m]))

  const available = archetype.pool.filter(entry => {
    const m = lookup.get(entry.index)
    return m && m.cr <= Math.max(avgLevel + 1, 1) && m.xp > 0
  })

  if (available.length === 0) return null

  type Inst = { entry: ArchetypeEntry; monster: MonsterIndexEntry }
  const instances: Inst[] = []

  for (const entry of available) {
    const monster = lookup.get(entry.index)!
    const count = Math.max(entry.min, Math.min(entry.base, entry.max))
    for (let i = 0; i < count; i++) instances.push({ entry, monster })
  }

  const MAX = 8
  const totalXpOf = (arr: Inst[]) => arr.reduce((s, i) => s + i.monster.xp, 0)
  const adjustedOf = (arr: Inst[]) => Math.round(totalXpOf(arr) * xpMultiplier(arr.length))

  const byXpAsc  = [...available].sort((a, b) => lookup.get(a.index)!.xp - lookup.get(b.index)!.xp)
  const byXpDesc = [...available].sort((a, b) => lookup.get(b.index)!.xp - lookup.get(a.index)!.xp)

  // Add cheapest while under 80% of budget
  let addChanged = true
  while (addChanged && instances.length < MAX) {
    addChanged = false
    if (adjustedOf(instances) >= budget * 0.8) break
    for (const entry of byXpAsc) {
      if (instances.length >= MAX) break
      const monster = lookup.get(entry.index)!
      if (instances.filter(i => i.entry === entry).length >= entry.max) continue
      const newAdj = Math.round((totalXpOf(instances) + monster.xp) * xpMultiplier(instances.length + 1))
      if (newAdj > budget * 1.2) continue
      instances.push({ entry, monster })
      addChanged = true
      break
    }
  }

  // Remove costliest while over 120% of budget
  let removeChanged = true
  while (removeChanged) {
    removeChanged = false
    if (adjustedOf(instances) <= budget * 1.2) break
    for (const entry of byXpDesc) {
      if (instances.filter(i => i.entry === entry).length <= entry.min) continue
      let idx = -1
      for (let i = instances.length - 1; i >= 0; i--) {
        if (instances[i].entry === entry) { idx = i; break }
      }
      if (idx >= 0) { instances.splice(idx, 1); removeChanged = true; break }
    }
  }

  if (instances.length === 0) return null

  // Default monster level range relative to party avg level per difficulty
  const LEVEL_OFFSET: Record<Difficulty, [number, number]> = {
    easy:   [-2, -1],
    medium: [-1,  0],
    hard:   [ 0,  1],
    deadly: [ 0,  2],
  }
  const [minOff, maxOff] = LEVEL_OFFSET[difficulty]
  const rollLevel = () => {
    const lo = Math.max(1, avgLevel + minOff)
    const hi = Math.max(1, avgLevel + maxOff)
    return lo === hi ? lo : Math.floor(Math.random() * (hi - lo + 1)) + lo
  }

  // Group by monsterIndex → one row per creature type
  const rowMap = new Map<string, CreatureRow>()
  for (const { entry, monster } of instances) {
    if (!rowMap.has(monster.index)) {
      rowMap.set(monster.index, {
        id: uid(),
        monsterIndex: monster.index,
        name: monster.name,
        cr: monster.cr,
        xp: monster.xp,
        ac: monster.ac,
        attackBonus: monster.attackBonus,
        level: rollLevel(),
        counts: { melee: 0, ranged: 0, magic: 0, support: 0 },
      })
    }
    rowMap.get(monster.index)!.counts[entry.role] += 1
  }

  const rows = [...rowMap.values()]
  return { rows, loot: generateLoot(rows) }
}
