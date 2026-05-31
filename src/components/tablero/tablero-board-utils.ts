import { supabase } from '../../lib/supabase'

const db = supabase as any

export interface TokenUpsertParams {
  id: string
  name: string
  kind: 'player' | 'npc'
  currentHp: number
  maxHp: number
  portraitUrl: string | null
  isActive: boolean
  npcLevel?: number
  spawnGroup?: string
  archetypeLabel?: string
}

export async function upsertTokenToBoard(campaignId: string, token: TokenUpsertParams): Promise<void> {
  await db.from('board_tokens').upsert({
    campaign_id: campaignId,
    entity_id: token.id,
    kind: token.kind,
    label: token.name,
    current_hp: token.currentHp,
    max_hp: token.maxHp,
    portrait_url: token.portraitUrl ?? null,
    npc_level: token.npcLevel ?? null,
    spawn_group: token.spawnGroup ?? null,
    archetype_label: token.archetypeLabel ?? null,
    x: 5, y: 5,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'campaign_id,entity_id', ignoreDuplicates: true })
}

export async function removeTokenFromBoard(campaignId: string, entityId: string): Promise<void> {
  await db.from('board_tokens').delete()
    .eq('campaign_id', campaignId).eq('entity_id', entityId)
}

export async function syncTokenPosition(campaignId: string, entityId: string, x: number, y: number): Promise<void> {
  await db.from('board_tokens')
    .update({ x, y, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaignId).eq('entity_id', entityId)
}

export async function syncNpcHp(campaignId: string, entityId: string, hp: number): Promise<void> {
  await db.from('board_tokens')
    .update({ current_hp: hp, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaignId).eq('entity_id', entityId)
}

export async function syncTokenVisibility(campaignId: string, entityId: string, hidden: boolean): Promise<void> {
  await db.from('board_tokens')
    .update({ hidden, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaignId).eq('entity_id', entityId)
}
