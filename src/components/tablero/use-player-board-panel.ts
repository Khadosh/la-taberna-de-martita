import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { getSpellSlots } from '../../lib/dnd-constants'
import { inferSlot, type SlotKey } from '../../lib/equip-slots'
import type { SheetJson } from '../character-sheet/types'
import type { Database } from '../../lib/database.types'

export type PanelNote = { id: string; title: string; body: string; is_private: boolean; author_id: string; created_at: string }

export function usePlayerBoardPanel(characterId: string | undefined, campaignId: string) {
  const queryClient = useQueryClient()

  // Same cache keys as use-character-sheet → data stays in sync
  const { data: character } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*, profiles(username)').eq('id', characterId!).single()
      if (error) throw error
      return data
    },
    enabled: !!characterId,
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_inventory').select('*, custom_items(image_url)')
        .eq('character_id', characterId!).order('created_at', { ascending: true })
      if (error) throw error
      return data.map(item => ({
        ...item,
        image_url: (item.custom_items as { image_url: string | null } | null)?.image_url ?? undefined,
        custom_items: undefined,
      }))
    },
    enabled: !!characterId && !!character,
  })

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['campaign-notes', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_notes').select('*').eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PanelNote[]
    },
  })

  const patchCharacter = async (patch: Database['public']['Tables']['characters']['Update']) => {
    if (!characterId) return
    queryClient.setQueryData(['character', characterId], (old: typeof character | undefined) =>
      old ? { ...old, ...patch } : old
    )
    await supabase.from('characters').update(patch).eq('id', characterId)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
  }

  const patchSheet = async (sheetPatch: Partial<SheetJson>) => {
    if (!character) return
    const newSheet = { ...(character.sheet_json as SheetJson), ...sheetPatch }
    queryClient.setQueryData(['character', characterId], (old: typeof character | undefined) =>
      old ? { ...old, sheet_json: newSheet } : old
    )
    await supabase.from('characters').update({ sheet_json: newSheet as never }).eq('id', characterId!)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
  }

  const adjustHp = async (delta: number) => {
    if (!character) return
    const maxHpVal = (character.sheet_json as SheetJson).max_hp ?? 10
    const cur = character.current_hp ?? maxHpVal
    const newHp = delta > 0 ? Math.min(maxHpVal, cur + delta) : cur + delta
    await patchCharacter({ current_hp: Math.max(0, newHp) })
  }

  const toggleCondition = async (cond: string) => {
    if (!character) return
    const current = (character.conditions as string[]) ?? []
    await patchCharacter({ conditions: current.includes(cond) ? current.filter(c => c !== cond) : [...current, cond] })
  }

  const toggleSlot = async (level: number, slotIndex: number) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const slotsUsed = sheet.spell_slots_used ?? {}
    const used = slotsUsed[String(level)] ?? 0
    const max = getSpellSlots(character.class, character.level)[level - 1]
    const available = max - used
    await patchSheet({ spell_slots_used: { ...slotsUsed, [String(level)]: slotIndex < available ? used + 1 : Math.max(0, used - 1) } })
  }

  const togglePreparedSpell = async (index: string) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const cur = sheet.prepared_spells ?? []
    await patchSheet({ prepared_spells: cur.includes(index) ? cur.filter(s => s !== index) : [...cur, index] })
  }

  const addKnownSpell = async (index: string) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const cur = sheet.spells ?? []
    if (!cur.includes(index)) await patchSheet({ spells: [...cur, index] })
  }

  const removeKnownSpell = async (index: string) => {
    if (!character) return
    await patchSheet({ spells: ((character.sheet_json as SheetJson).spells ?? []).filter(s => s !== index) })
  }

  const patchCurrency = (patch: Partial<{ gold: number; silver: number; copper: number }>) => {
    if (!character) return
    const cur = (character.sheet_json as SheetJson).currency ?? { gold: 0, silver: 0, copper: 0 }
    patchSheet({ currency: { ...cur, ...patch } })
  }

  const toggleEquip = async (itemId: string) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const current = sheet.equipped_items ?? []
    const currentSlots = (sheet.equipped_slots ?? {}) as Partial<Record<SlotKey, string>>
    const isEquipping = !current.includes(itemId)
    const item = inventory.find(i => i.id === itemId)
    const stats = (character.stats as Record<string, number>) ?? {}
    const dexMod = Math.floor(((stats.dex ?? 10) - 10) / 2)

    let newEquipped = isEquipping ? [...current, itemId] : current.filter(id => id !== itemId)
    const targetSlot: SlotKey | null = isEquipping
      ? (item ? inferSlot(item.name, currentSlots) : null)
      : (Object.entries(currentSlots).find(([, v]) => v === itemId)?.[0] as SlotKey ?? null)
    if (isEquipping && !targetSlot) return

    let newSlots: Partial<Record<SlotKey, string>>
    if (isEquipping) {
      const displaced = currentSlots[targetSlot!]
      if (displaced && displaced !== itemId) newEquipped = newEquipped.filter(id => id !== displaced)
      newSlots = { ...currentSlots, [targetSlot!]: itemId }
    } else {
      newSlots = Object.fromEntries(Object.entries(currentSlots).filter(([, v]) => v !== itemId)) as Partial<Record<SlotKey, string>>
    }

    if (!isEquipping && sheet.equipped_armor && item?.name === sheet.equipped_armor.name) {
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, equipped_armor: undefined })
      await patchCharacter({ armor_class: 10 + dexMod }); return
    }
    if (!isEquipping && targetSlot === 'off_hand' && sheet.shield_bonus != null) {
      const acVal = character.armor_class ?? (10 + dexMod)
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, shield_bonus: undefined })
      await patchCharacter({ armor_class: Math.max(10 + dexMod, acVal - sheet.shield_bonus) }); return
    }
    if (isEquipping && item?.notes?.startsWith('CA ')) {
      const match = item.notes.match(/CA (\d+)/)
      if (match) {
        const base = parseInt(match[1]); const hasDex = item.notes.includes('DES')
        const maxBonusMatch = item.notes.match(/máx (\d+)/); const maxBonus = maxBonusMatch ? parseInt(maxBonusMatch[1]) : undefined
        const dexBonus = hasDex ? (maxBonus ? Math.min(dexMod, maxBonus) : dexMod) : 0
        await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, equipped_armor: { name: item.name, base, dex_bonus: hasDex, max_bonus: maxBonus, category: !hasDex ? 'Pesada' : maxBonus ? 'Media' : 'Ligera' } })
        await patchCharacter({ armor_class: base + dexBonus }); return
      }
    }
    if (isEquipping && targetSlot === 'off_hand') {
      const shieldBonus = parseInt(item?.notes?.match(/\+(\d+)/)?.[1] ?? '2')
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, shield_bonus: shieldBonus })
      await patchCharacter({ armor_class: (character.armor_class ?? 10 + dexMod) + shieldBonus }); return
    }
    await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots })
  }

  const equipToSlot = async (itemId: string, slot: SlotKey) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const currentSlots = (sheet.equipped_slots ?? {}) as Partial<Record<SlotKey, string>>
    const current = sheet.equipped_items ?? []
    let newEquipped = current.includes(itemId) ? current : [...current, itemId]
    const displaced = currentSlots[slot]
    if (displaced && displaced !== itemId) newEquipped = newEquipped.filter(id => id !== displaced)
    const newSlots: Partial<Record<SlotKey, string>> = {}
    for (const [k, v] of Object.entries(currentSlots)) { if (v !== itemId && v !== displaced) newSlots[k as SlotKey] = v }
    newSlots[slot] = itemId
    await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots })
  }

  const moveEquipSlot = async (itemId: string, fromSlot: SlotKey, toSlot: SlotKey) => {
    if (!character) return
    const currentSlots = ((character.sheet_json as SheetJson).equipped_slots ?? {}) as Partial<Record<SlotKey, string>>
    const newSlots: Partial<Record<SlotKey, string>> = { ...currentSlots }
    const displaced = currentSlots[toSlot]
    delete newSlots[fromSlot]
    if (displaced && displaced !== itemId) newSlots[fromSlot] = displaced
    newSlots[toSlot] = itemId
    await patchSheet({ equipped_slots: newSlots })
  }

  const addNote = async (title: string, body: string, userId: string) => {
    await supabase.from('session_notes').insert({ campaign_id: campaignId, author_id: userId, title, body, is_private: false } as never)
    refetchNotes()
  }

  return {
    character, inventory, notes,
    adjustHp, toggleCondition, toggleSlot,
    togglePreparedSpell, addKnownSpell, removeKnownSpell,
    patchCurrency, toggleEquip, equipToSlot, moveEquipSlot, addNote,
  }
}
