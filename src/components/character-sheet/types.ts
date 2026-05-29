// Shared types for the character sheet module

export type SheetJson = {
  skill_proficiencies?: string[]
  expertise?: string[]
  tool_proficiencies?: string[]
  background_skills?: string[]
  weapon_proficiencies?: string[]
  spells?: string[]
  saving_throws?: string[]
  hit_die?: number
  spell_slots_used?: Record<string, number>
  death_saves?: { successes: number; failures: number }
  hit_dice_used?: number
  subclass?: string
  equipped_items?: string[]
  equipped_slots?: Partial<Record<import('../../lib/equip-slots').SlotKey, string>>
  equipped_armor?: {
    name: string
    base: number
    dex_bonus: boolean
    max_bonus?: number
    category: string
  }
  shield_bonus?: number
  currency?: { gold: number; silver: number; copper: number }
  max_hp?: number
  fighting_style?: string
  favored_enemy?: string[]
  background?: string
}

export type InfoModalData =
  | { kind: 'spell'; data: import('../../lib/dnd-api').SpellDetail }
  | { kind: 'trait'; data: import('../../lib/dnd-api').TraitDetail }
  | { kind: 'skill'; data: import('../../lib/dnd-api').SkillDetail }
  | { kind: 'feature'; data: import('../../lib/dnd-api').FeatureDetail }

export const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export type StatKey = typeof STAT_KEYS[number]
