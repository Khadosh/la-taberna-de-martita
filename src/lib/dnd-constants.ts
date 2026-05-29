export const CONDITIONS = [
  'Cegado', 'Hechizado', 'Ensordecido', 'Asustado', 'Agarrado',
  'Incapacitado', 'Invisible', 'Paralizado', 'Petrificado',
  'Envenenado', 'Derribado', 'Restringido', 'Aturdido', 'Inconsciente',
  'Agotamiento I', 'Agotamiento II', 'Agotamiento III',
]

export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
]

// Full caster slot table [character level 1-20][slot level 1-9]
const FULL_CASTER: number[][] = [
  [2,0,0,0,0,0,0,0,0],[3,0,0,0,0,0,0,0,0],[4,2,0,0,0,0,0,0,0],[4,3,0,0,0,0,0,0,0],
  [4,3,2,0,0,0,0,0,0],[4,3,3,0,0,0,0,0,0],[4,3,3,1,0,0,0,0,0],[4,3,3,2,0,0,0,0,0],
  [4,3,3,3,1,0,0,0,0],[4,3,3,3,2,0,0,0,0],[4,3,3,3,2,1,0,0,0],[4,3,3,3,2,1,0,0,0],
  [4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,0,0],[4,3,3,3,2,1,1,1,0],[4,3,3,3,2,1,1,1,0],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]

// Half caster slot table (paladin/ranger)
const HALF_CASTER: number[][] = [
  [0,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[4,2,0,0,0],
  [4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],[4,3,2,0,0],[4,3,2,0,0],
  [4,3,3,0,0],[4,3,3,0,0],[4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],
  [4,3,3,2,0],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2],
]

// Warlock pact magic: [slots, slot_level] per character level
const WARLOCK_PACT: [number, number][] = [
  [1,1],[2,1],[2,2],[2,2],[2,3],[2,3],[2,4],[2,4],[2,5],[2,5],
  [3,5],[3,5],[3,5],[3,5],[3,5],[3,5],[4,5],[4,5],[4,5],[4,5],
]

const FULL_CASTERS = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard'])
const HALF_CASTERS = new Set(['paladin', 'ranger'])

export function getSpellSlots(className: string, level: number): number[] {
  const cls = className.toLowerCase()
  const i = Math.min(Math.max(level - 1, 0), 19)
  if (FULL_CASTERS.has(cls)) return FULL_CASTER[i]
  if (HALF_CASTERS.has(cls)) return [...HALF_CASTER[i], ...Array(9 - HALF_CASTER[i].length).fill(0)]
  if (cls === 'warlock') {
    const [slots, slotLevel] = WARLOCK_PACT[i]
    return Array.from({ length: 9 }, (_, idx) => idx === slotLevel - 1 ? slots : 0)
  }
  return Array(9).fill(0)
}

export const isWarlock = (className: string) => className.toLowerCase() === 'warlock'

// Classes that prepare a daily subset of spells (limit: ability mod + level)
export const PREPARED_CASTERS = new Set(['wizard', 'cleric', 'druid', 'paladin'])

// Max daily prepared spells for prepared casters; null = known caster (all spells always available)
export function getMaxPreparedSpells(
  className: string, level: number, stats: Record<string, number>
): number | null {
  const cls = className.toLowerCase()
  const mod = (v: number) => Math.floor((v - 10) / 2)
  if (cls === 'wizard') return Math.max(1, level + mod(stats.int ?? 10))
  if (cls === 'cleric' || cls === 'druid') return Math.max(1, level + mod(stats.wis ?? 10))
  if (cls === 'paladin') return Math.max(1, Math.floor(level / 2) + mod(stats.cha ?? 10))
  return null
}
