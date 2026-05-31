

export type Character = {
  id: string
  name: string
  class: string
  race: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  armor_class: number | null
  portrait_url?: string | null
  user_id: string
  conditions: string[]
  sheet_json: {
    max_hp?: number
    hit_die?: number
    saving_throws?: string[]
    spell_slots_used?: Record<string, number>
    death_saves?: { successes: number; failures: number }
    currency?: { gold: number; silver: number; copper: number }
  }
}

export type BoardToken = {
  campaign_id: string
  entity_id: string
  kind: 'player' | 'npc'
  label: string
  current_hp: number | null
  max_hp: number | null
  portrait_url: string | null
  x: number
  y: number
  hidden?: boolean
  spawn_group?: string | null
  archetype_label?: string | null
}

export type NpcItem = { id: string; name: string; qty: number }

export type Npc = {
  id: string
  name: string
  currentHp: number
  maxHp: number
  initiative: number
  ac?: number
  cr?: number
  attackBonus?: number
  damage?: string
  npcType?: string
  loot?: NpcItem[]
  role?: string
  portraitUrl?: string
  level?: number
  spells?: string[]
  weapons?: { name: string; damage: string }[]
  equipmentNotes?: string
  isHidden?: boolean
}

export type Combatant =
  | { kind: 'player'; characterId: string; initiative: number }
  | { kind: 'npc'; npc: Npc }

export const getInitiative = (c: Combatant) =>
  c.kind === 'player' ? c.initiative : c.npc.initiative

export const formatModInline = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`)

export const maxHpFor = (c: Character) => {
  const sheetMaxHp = c.sheet_json.max_hp
  if (sheetMaxHp) return sheetMaxHp
  const hitDie = c.sheet_json.hit_die ?? 8
  const conMod = Math.floor(((c.stats.con ?? 10) - 10) / 2)
  return hitDie + conMod
}

export const currentHpFor = (c: Character) => c.current_hp ?? maxHpFor(c)

export const acFor = (c: Character) =>
  c.armor_class ?? (10 + Math.floor(((c.stats.dex ?? 10) - 10) / 2))

export type LogEntry = {
  id: string
  attackerName: string
  targetName: string
  hit: boolean
  damage?: number
  isHealing?: boolean
}

export interface CampaignMap {
  name: string
  url: string
  rawName: string
}

const PALETTE = [
  '#f87171', // Red/Coral
  '#fb923c', // Orange/Amber
  '#fbbf24', // Amber/Yellow
  '#34d399', // Emerald/Green
  '#2dd4bf', // Teal
  '#60a5fa', // Blue
  '#818cf8', // Indigo
  '#a78bfa', // Purple
  '#f472b6', // Pink
  '#fb7185', // Rose
]

export function getDeterministicColor(id: string): string {
  if (!id) return '#fbbf24'
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % PALETTE.length
  return PALETTE[idx]
}
