import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { getSpellSlots, isWarlock } from '../../lib/dnd-constants'
import { inferSlot, type SlotKey } from '../../lib/equip-slots'
import { guessWeaponSlug } from '../../lib/weapon-utils'
import type { SheetJson, InfoModalData } from './types'

export function useCharacterSheet(characterId: string) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI State
  const [activeTab, setActiveTab] = useState<'resumen' | 'pericias' | 'hechizos' | 'historia'>('resumen')
  const [mobileSection, setMobileSection] = useState<'personaje' | 'inventario'>('personaje')
  const [modal, setModal] = useState<InfoModalData | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [generatingPortrait, setGeneratingPortrait] = useState(false)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [showDice, setShowDice] = useState(false)

  // Level up state
  const [levelUpHpInput, setLevelUpHpInput] = useState('')
  const [levelUpSubclass, setLevelUpSubclass] = useState('')
  const [levelUpAsi, setLevelUpAsi] = useState<Record<string, number>>({})
  const [levelUpFightingStyle, setLevelUpFightingStyle] = useState('')
  const [levelUpFavoredEnemy, setLevelUpFavoredEnemy] = useState('')
  const [levelUpNewSpells, setLevelUpNewSpells] = useState<string[]>([])
  const [levelUpExpertise, setLevelUpExpertise] = useState<string[]>([])

  // Inline editing state
  const [editingHp, setEditingHp] = useState(false)
  const [hpInput, setHpInput] = useState('')
  const [editingMaxHp, setEditingMaxHp] = useState(false)
  const [maxHpInput, setMaxHpInput] = useState('')
  const [editingAc, setEditingAc] = useState(false)
  const [acInput, setAcInput] = useState('')
  const [editingXp, setEditingXp] = useState(false)
  const [xpInput, setXpInput] = useState('')
  const [showConditionPicker, setShowConditionPicker] = useState(false)

  // Rest state
  const [showRestPanel, setShowRestPanel] = useState(false)
  const [shortRestHd, setShortRestHd] = useState(1)
  const [shortRestHpInput, setShortRestHpInput] = useState('')
  const [showLongRestConfirm, setShowLongRestConfirm] = useState(false)

  // Queries
  const { data: character, isLoading } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*, profiles(username)').eq('id', characterId).single()
      if (error) throw error
      return data
    },
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_inventory')
        .select('*, custom_items(image_url)')
        .eq('character_id', characterId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data.map(item => ({
        ...item,
        image_url: (item.custom_items as { image_url: string | null } | null)?.image_url ?? undefined,
        custom_items: undefined,
      }))
    },
    enabled: !!character,
  })

  const { data: campaign } = useQuery({
    queryKey: ['campaign', character?.campaign_id],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('dm_id').eq('id', character!.campaign_id!).single()
      if (error) throw error
      return data
    },
    enabled: !!character?.campaign_id,
  })

  const { data: raceDetail } = useQuery({
    queryKey: dndKeys.race(character?.race ?? ''),
    queryFn: () => dndApi.race(character!.race),
    enabled: !!character?.race,
  })

  const { data: classDetail } = useQuery({
    queryKey: dndKeys.klass(character?.class ?? ''),
    queryFn: () => dndApi.klass(character!.class),
    enabled: !!character?.class,
  })

  const { data: classLevels } = useQuery({
    queryKey: dndKeys.classLevels(character?.class ?? ''),
    queryFn: () => dndApi.classLevels(character!.class),
    enabled: !!character?.class,
    staleTime: Infinity,
  })

  const sheetSubclass = (character?.sheet_json as SheetJson | null)?.subclass
  const { data: subclassDetail } = useQuery({
    queryKey: dndKeys.subclass(sheetSubclass ?? ''),
    queryFn: () => dndApi.subclass(sheetSubclass!),
    enabled: !!sheetSubclass,
    staleTime: Infinity,
  })

  const { data: subclassFeatureList } = useQuery({
    queryKey: dndKeys.subclassFeatures(sheetSubclass ?? ''),
    queryFn: () => dndApi.subclassFeatures(sheetSubclass!),
    enabled: !!sheetSubclass,
    staleTime: Infinity,
  })

  const _rawSlots = (character?.sheet_json as SheetJson | undefined)?.equipped_slots ?? {}
  const _weaponId = _rawSlots.main_hand ?? _rawSlots.ranged
  const _weaponName = _weaponId ? inventory.find(i => i.id === _weaponId)?.name : undefined
  const _weaponSlug = _weaponName ? guessWeaponSlug(_weaponName) : null

  const { data: weaponApiData } = useQuery({
    queryKey: dndKeys.equipmentDetail(_weaponSlug ?? ''),
    queryFn: () => dndApi.equipmentDetail(_weaponSlug!),
    enabled: !!_weaponSlug,
    staleTime: Infinity,
    retry: false,
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`character-${characterId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['character', characterId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [characterId, queryClient])

  // Handlers
  const patchCharacter = async (patch: Database['public']['Tables']['characters']['Update']) => {
    queryClient.setQueryData(['character', characterId], (old: typeof character | undefined) =>
      old ? { ...old, ...patch } : old
    )
    await supabase.from('characters').update(patch).eq('id', characterId)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
  }

  const patchSheet = async (sheetPatch: Partial<SheetJson>) => {
    if (!character) return
    const current = character.sheet_json as SheetJson
    const newSheet = { ...current, ...sheetPatch }

    queryClient.setQueryData(['character', characterId], (old: typeof character | undefined) =>
      old ? { ...old, sheet_json: newSheet } : old
    )

    await supabase.from('characters').update({ sheet_json: newSheet as never }).eq('id', characterId)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
  }

  const adjustHp = async (delta: number) => {
    if (!character) return
    const maxHpVal = maxHp()
    const current = character.current_hp ?? maxHpVal
    const newHp = delta > 0 ? Math.min(maxHpVal, current + delta) : current + delta
    await patchCharacter({ current_hp: Math.max(0, newHp) })
  }

  const saveHp = async () => {
    const val = parseInt(hpInput)
    if (!isNaN(val)) await patchCharacter({ current_hp: val })
    setEditingHp(false)
  }

  const saveMaxHp = async () => {
    const val = parseInt(maxHpInput)
    if (!isNaN(val) && val > 0) {
      await patchSheet({ max_hp: val })
      const current = character?.current_hp ?? val
      if (current > val) await patchCharacter({ current_hp: val })
    }
    setEditingMaxHp(false)
  }

  const saveAc = async () => {
    const val = parseInt(acInput)
    if (!isNaN(val)) await patchCharacter({ armor_class: val })
    setEditingAc(false)
  }

  const saveXp = async () => {
    const val = parseInt(xpInput)
    if (!isNaN(val) && val > 0 && character) {
      await patchCharacter({ experience_points: (character.experience_points ?? 0) + val })
    }
    setEditingXp(false)
    setXpInput('')
  }

  const levelUp = async () => {
    if (!character) return
    const hpGain = parseInt(levelUpHpInput) || 0
    const currentMaxHp = maxHp()
    const newMaxHp = currentMaxHp + hpGain
    const patch: Record<string, any> = { level: character.level + 1, current_hp: (character.current_hp ?? currentMaxHp) + hpGain }
    const sheetPatches: Partial<SheetJson> = { max_hp: newMaxHp }

    if (levelUpSubclass) sheetPatches.subclass = levelUpSubclass
    if (levelUpFightingStyle) sheetPatches.fighting_style = levelUpFightingStyle
    if (levelUpFavoredEnemy) {
      const current = (character.sheet_json as SheetJson)?.favored_enemy ?? []
      sheetPatches.favored_enemy = [...current, levelUpFavoredEnemy]
    }
    if (levelUpNewSpells.length > 0) {
      const current = (character.sheet_json as SheetJson)?.spells ?? []
      sheetPatches.spells = [...current, ...levelUpNewSpells]
    }
    if (levelUpExpertise.length > 0) {
      const current = (character.sheet_json as SheetJson)?.expertise ?? []
      sheetPatches.expertise = [...current, ...levelUpExpertise]
    }
    if (Object.keys(levelUpAsi).length > 0) {
      const newStats = { ...(character.stats as Record<string, number>) }
      for (const [key, val] of Object.entries(levelUpAsi)) {
        newStats[key] = (newStats[key] ?? 10) + val
      }
      patch.stats = newStats
    }

    await patchSheet(sheetPatches)
    await patchCharacter(patch)
    setShowLevelUpModal(false)
    setLevelUpHpInput('')
    setLevelUpSubclass('')
    setLevelUpAsi({})
    setLevelUpFightingStyle('')
    setLevelUpFavoredEnemy('')
    setLevelUpNewSpells([])
    setLevelUpExpertise([])
  }

  const toggleCondition = async (cond: string) => {
    const current = (character?.conditions as string[]) ?? []
    const next = current.includes(cond) ? current.filter(c => c !== cond) : [...current, cond]
    await patchCharacter({ conditions: next })
  }

  const toggleSlot = async (level: number, slotIndex: number) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const slotsUsed = sheet.spell_slots_used ?? {}
    const used = slotsUsed[String(level)] ?? 0
    const maxSlots = getSpellSlots(character.class, character.level)
    const available = maxSlots[level - 1] - used
    const newUsed = slotIndex < available ? used + 1 : Math.max(0, used - 1)
    await patchSheet({ spell_slots_used: { ...slotsUsed, [String(level)]: newUsed } })
  }

  const toggleDeathSave = async (kind: 'successes' | 'failures', i: number) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const current = sheet.death_saves ?? { successes: 0, failures: 0 }
    const next = i < current[kind] ? i : Math.min(i + 1, 3)
    await patchSheet({ death_saves: { ...current, [kind]: next } })
  }

  const shortRest = async () => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const hpGained = parseInt(shortRestHpInput) || 0
    const slotsUpdate = isWarlock(character.class) ? { spell_slots_used: {} } : {}
    const maxHpVal = maxHp()
    await patchSheet({ hit_dice_used: (sheet.hit_dice_used ?? 0) + shortRestHd, ...slotsUpdate })
    await patchCharacter({ current_hp: Math.min(maxHpVal, (character.current_hp ?? maxHpVal) + hpGained) })
    setShowRestPanel(false)
  }

  const longRest = async () => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const maxHpVal = maxHp()
    await supabase.from('characters').update({
      current_hp: maxHpVal,
      sheet_json: { ...sheet, spell_slots_used: {}, death_saves: undefined, hit_dice_used: 0 } as never,
    }).eq('id', characterId)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
    setShowLongRestConfirm(false)
  }

  const generatePortrait = async () => {
    if (!character) return
    setGeneratingPortrait(true)
    try {
      const prompt = `Fantasy portrait of a ${character.race} ${character.class}, D&D 5e illustration, parchment background`
      const { data, error } = await supabase.functions.invoke('generate-portrait', { body: { prompt } })
      if (!error && data?.url) await patchCharacter({ portrait_url: data.url })
    } catch (e) {
      console.error('Error generating portrait', e)
    } finally {
      setGeneratingPortrait(false)
    }
  }

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => patchCharacter({ portrait_url: ev.target?.result as string })
    reader.readAsDataURL(file)
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

    let newEquipped = isEquipping
      ? [...current, itemId]
      : current.filter(id => id !== itemId)

    // Determine the slot the item occupies (equip) or occupied (unequip)
    const targetSlot: SlotKey | null = isEquipping
      ? (item ? inferSlot(item.name, currentSlots) : null)
      : (Object.entries(currentSlots).find(([, v]) => v === itemId)?.[0] as SlotKey ?? null)

    if (isEquipping && !targetSlot) return

    let newSlots: Partial<Record<SlotKey, string>>
    if (isEquipping) {
      const displaced = currentSlots[targetSlot!]
      if (displaced && displaced !== itemId) {
        newEquipped = newEquipped.filter(id => id !== displaced)
      }
      newSlots = { ...currentSlots, [targetSlot!]: itemId }
    } else {
      newSlots = Object.fromEntries(
        Object.entries(currentSlots).filter(([, v]) => v !== itemId)
      ) as Partial<Record<SlotKey, string>>
    }

    // UNEQUIP: armor (tracked in equipped_armor)
    if (!isEquipping && sheet.equipped_armor && item?.name === sheet.equipped_armor.name) {
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, equipped_armor: undefined })
      await patchCharacter({ armor_class: 10 + dexMod })
      return
    }

    // UNEQUIP: shield (detect by off_hand slot — inferSlot only assigns off_hand to shields)
    if (!isEquipping && targetSlot === 'off_hand' && sheet.shield_bonus != null) {
      const acVal = character.armor_class ?? (10 + dexMod)
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, shield_bonus: undefined })
      await patchCharacter({ armor_class: Math.max(10 + dexMod, acVal - sheet.shield_bonus) })
      return
    }

    // EQUIP: armor (notes start with "CA " — encoded at purchase time or manually)
    if (isEquipping && item?.notes?.startsWith('CA ')) {
      const match = item.notes.match(/CA (\d+)/)
      if (match) {
        const base = parseInt(match[1])
        const hasDex = item.notes.includes('DES')
        const maxBonusMatch = item.notes.match(/máx (\d+)/)
        const maxBonus = maxBonusMatch ? parseInt(maxBonusMatch[1]) : undefined
        const dexBonus = hasDex ? (maxBonus ? Math.min(dexMod, maxBonus) : dexMod) : 0
        await patchSheet({
          equipped_items: newEquipped,
          equipped_slots: newSlots,
          equipped_armor: { name: item.name, base, dex_bonus: hasDex, max_bonus: maxBonus, category: !hasDex ? 'Pesada' : maxBonus ? 'Media' : 'Ligera' },
        })
        await patchCharacter({ armor_class: base + dexBonus })
        return
      }
    }

    // EQUIP: shield (detect by off_hand slot — more reliable than checking notes format)
    if (isEquipping && targetSlot === 'off_hand') {
      const shieldMatch = item?.notes?.match(/\+(\d+)/)
      const shieldBonus = shieldMatch ? parseInt(shieldMatch[1]) : 2
      const acVal = character.armor_class ?? (10 + dexMod)
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, shield_bonus: shieldBonus })
      await patchCharacter({ armor_class: acVal + shieldBonus })
      return
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
    if (displaced && displaced !== itemId) {
      newEquipped = newEquipped.filter(id => id !== displaced)
    }

    const newSlots: Partial<Record<SlotKey, string>> = {}
    for (const [k, v] of Object.entries(currentSlots)) {
      if (v !== itemId && v !== displaced) newSlots[k as SlotKey] = v
    }
    newSlots[slot] = itemId

    await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots })
  }

  const moveEquipSlot = async (itemId: string, fromSlot: SlotKey, toSlot: SlotKey) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const currentSlots = (sheet.equipped_slots ?? {}) as Partial<Record<SlotKey, string>>
    const newSlots: Partial<Record<SlotKey, string>> = { ...currentSlots }

    const displaced = currentSlots[toSlot]
    delete newSlots[fromSlot]
    if (displaced && displaced !== itemId) newSlots[fromSlot] = displaced
    newSlots[toSlot] = itemId

    await patchSheet({ equipped_slots: newSlots })
  }

  // Helpers
  const maxHp = () => {
    if (!character) return 10
    const sheet = character.sheet_json as SheetJson
    const level = character.level
    const stats = (character.stats as Record<string, number>) ?? {}
    const hitDie = sheet.hit_die ?? classDetail?.hit_die ?? 8
    const conMod = Math.floor(((stats.con ?? 10) - 10) / 2)
    return sheet.max_hp ?? (hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod))
  }

  return {
    character, isLoading, inventory, campaign, raceDetail, classDetail, classLevels, subclassDetail, subclassFeatureList, weaponApiData,
    activeTab, setActiveTab, mobileSection, setMobileSection, modal, setModal, confirmDelete, setConfirmDelete, generatingPortrait, showLevelUpModal, setShowLevelUpModal, showDice, setShowDice,
    levelUpHpInput, setLevelUpHpInput, levelUpSubclass, setLevelUpSubclass, levelUpAsi, setAsi: setLevelUpAsi, levelUpFightingStyle, setFightingStyle: setLevelUpFightingStyle, levelUpFavoredEnemy, setFavoredEnemy: setLevelUpFavoredEnemy, levelUpNewSpells, setNewSpells: setLevelUpNewSpells, levelUpExpertise, setLevelUpExpertise,
    editingHp, setEditingHp, hpInput, setHpInput, editingMaxHp, setEditingMaxHp, maxHpInput, setMaxHpInput, editingAc, setEditingAc, acInput, setAcInput, editingXp, setEditingXp, xpInput, setXpInput, showConditionPicker, setShowConditionPicker,
    showRestPanel, setShowRestPanel, shortRestHd, setShortRestHd, shortRestHpInput, setShortRestHpInput, showLongRestConfirm, setShowLongRestConfirm, fileInputRef,
    patchCharacter, patchSheet, adjustHp, saveHp, saveMaxHp, saveAc, saveXp, levelUp, toggleCondition, toggleSlot, toggleDeathSave, shortRest, longRest, generatePortrait, handlePortraitUpload, toggleEquip, equipToSlot, moveEquipSlot, maxHp
  }
}
