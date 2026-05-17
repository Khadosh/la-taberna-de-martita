import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useRef, useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import type { Database } from '../../../lib/database.types'
import {
  dndApi, dndKeys,
} from '../../../lib/dnd-api'
import { XP_THRESHOLDS, getSpellSlots, isWarlock } from '../../../lib/dnd-constants'
import { DiceModule } from '../../../lib/dice'

// Components
import { type SheetJson, type InfoModalData } from '../../../components/character-sheet/types'
import { parchmentStyle, mapBgStyle, sheetStyle, darkFrameStyle, SheetTabBar, type SheetTab } from '../../../components/character-sheet/sheet-primitives'
import { InfoModal } from '../../../components/character-sheet/sheet-badges'
import { LevelUpModal } from '../../../components/character-sheet/level-up-modal'
import { TabResumen } from '../../../components/character-sheet/tab-resumen'
import { TabPericias } from '../../../components/character-sheet/tab-pericias'
import { TabHechizos } from '../../../components/character-sheet/tab-hechizos'
import { TabHistoria } from '../../../components/character-sheet/tab-historia'
import { InventoryPanel } from '../../../components/character-sheet/inventory-panel'
import { inferSlot, type SlotKey } from '../../../lib/equip-slots'

export const Route = createFileRoute('/_authenticated/characters/$characterId')({
  component: CharacterSheet,
})

function CharacterSheet() {
  const { characterId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UI State
  const [activeTab, setActiveTab] = useState<SheetTab>('resumen')
  const [modal, setModal] = useState<InfoModalData | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [generatingPortrait, setGeneratingPortrait] = useState(false)
  const [showLevelUpModal, setShowLevelUpModal] = useState(false)
  const [showDice, setShowDice] = useState(false)

  // Level up state
  const [levelUpHpInput, setLevelUpHpInput] = useState('')
  const [levelUpSubclass, setLevelUpSubclass] = useState('')
  const [levelUpAsi, setLevelUpAsi] = useState<Record<string, number>>({})

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

  // ── Queries ───────────────────────────────────────────────────────────────

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
        .from('character_inventory').select('*')
        .eq('character_id', characterId).order('created_at', { ascending: true })
      if (error) throw error
      return data
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

  // ── Handlers ──────────────────────────────────────────────────────────────

  const patchCharacter = async (patch: Database['public']['Tables']['characters']['Update']) => {
    await supabase.from('characters').update(patch).eq('id', characterId)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
  }

  const patchSheet = async (sheetPatch: Partial<SheetJson>) => {
    if (!character) return
    const current = character.sheet_json as SheetJson
    const newSheet = { ...current, ...sheetPatch }

    // Optimistic update — instant UI response before DB roundtrip
    queryClient.setQueryData(['character', characterId], (old: typeof character | undefined) =>
      old ? { ...old, sheet_json: newSheet } : old
    )

    await supabase.from('characters').update({ sheet_json: newSheet as never }).eq('id', characterId)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
  }

  const adjustHp = async (delta: number) => {
    const current = character?.current_hp ?? maxHp
    const newHp = delta > 0 ? Math.min(maxHp, current + delta) : current + delta
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
      if (currentHp > val) await patchCharacter({ current_hp: val })
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
    if (!isNaN(val) && val > 0) await patchCharacter({ experience_points: (character?.experience_points ?? 0) + val })
    setEditingXp(false)
    setXpInput('')
  }

  const levelUp = async () => {
    if (!character) return
    const hpGain = parseInt(levelUpHpInput) || 0
    const newMaxHp = maxHp + hpGain
    const patch: Record<string, any> = { level: character.level + 1, current_hp: currentHp + hpGain }
    const sheetPatches: Partial<SheetJson> = { max_hp: newMaxHp }
    if (levelUpSubclass) sheetPatches.subclass = levelUpSubclass
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
  }

  const toggleCondition = async (cond: string) => {
    const current = (character?.conditions as string[]) ?? []
    const next = current.includes(cond) ? current.filter(c => c !== cond) : [...current, cond]
    await patchCharacter({ conditions: next })
  }

  const toggleSlot = async (level: number, slotIndex: number) => {
    const slotsUsed = sheet.spell_slots_used ?? {}
    const used = slotsUsed[String(level)] ?? 0
    const available = maxSlots[level - 1] - used
    const newUsed = slotIndex < available ? used + 1 : Math.max(0, used - 1)
    await patchSheet({ spell_slots_used: { ...slotsUsed, [String(level)]: newUsed } })
  }

  const toggleDeathSave = async (kind: 'successes' | 'failures', i: number) => {
    const current = sheet.death_saves ?? { successes: 0, failures: 0 }
    const next = i < current[kind] ? i : Math.min(i + 1, 3)
    await patchSheet({ death_saves: { ...current, [kind]: next } })
  }

  const shortRest = async () => {
    const hpGained = parseInt(shortRestHpInput) || 0
    const slotsUpdate = isWarlock(character!.class) ? { spell_slots_used: {} } : {}
    await patchSheet({ hit_dice_used: (sheet.hit_dice_used ?? 0) + shortRestHd, ...slotsUpdate })
    await patchCharacter({ current_hp: Math.min(maxHp, currentHp + hpGained) })
    setShowRestPanel(false)
  }

  const longRest = async () => {
    await supabase.from('characters').update({
      current_hp: maxHp,
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
    const current      = sheet.equipped_items ?? []
    const currentSlots = (sheet.equipped_slots ?? {}) as Partial<Record<SlotKey, string>>
    const isEquipping  = !current.includes(itemId)
    const item         = inventory.find(i => i.id === itemId)

    const newEquipped = isEquipping
      ? [...current, itemId]
      : current.filter(id => id !== itemId)

    // Update slot map
    let newSlots: Partial<Record<SlotKey, string>>
    if (isEquipping && item) {
      const slot = inferSlot(item.name, currentSlots)
      if (!slot) return  // can't infer slot — caller must use equipToSlot with explicit slot
      newSlots = { ...currentSlots, [slot]: itemId }
    } else {
      newSlots = Object.fromEntries(
        Object.entries(currentSlots).filter(([, v]) => v !== itemId)
      ) as Partial<Record<SlotKey, string>>
    }

    if (!isEquipping && sheet.equipped_armor && item?.name === sheet.equipped_armor.name) {
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots, equipped_armor: undefined })
      await patchCharacter({ armor_class: 10 + dexMod })
      return
    }

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

    if (isEquipping && item?.notes?.startsWith('Escudo')) {
      const shieldMatch = item.notes.match(/\+(\d+)/)
      const shieldBonus = shieldMatch ? parseInt(shieldMatch[1]) : 2
      await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots })
      await patchCharacter({ armor_class: ac + shieldBonus })
      return
    }

    await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots })
  }

  const equipToSlot = async (itemId: string, slot: SlotKey) => {
    const currentSlots = (sheet.equipped_slots ?? {}) as Partial<Record<SlotKey, string>>
    const current = sheet.equipped_items ?? []

    // Add to equipped list if not already there
    let newEquipped = current.includes(itemId) ? current : [...current, itemId]

    // Displace item already occupying this slot
    const displaced = currentSlots[slot]
    if (displaced && displaced !== itemId) {
      newEquipped = newEquipped.filter(id => id !== displaced)
    }

    // Build new slot map: remove item from any previous slot, set in new slot
    const newSlots: Partial<Record<SlotKey, string>> = {}
    for (const [k, v] of Object.entries(currentSlots)) {
      if (v !== itemId && v !== displaced) newSlots[k as SlotKey] = v
    }
    newSlots[slot] = itemId

    await patchSheet({ equipped_items: newEquipped, equipped_slots: newSlots })
  }

  const moveEquipSlot = async (itemId: string, fromSlot: SlotKey, toSlot: SlotKey) => {
    const currentSlots = (sheet.equipped_slots ?? {}) as Partial<Record<SlotKey, string>>
    const newSlots: Partial<Record<SlotKey, string>> = { ...currentSlots }

    // Swap: what's in toSlot goes back to fromSlot
    const displaced = currentSlots[toSlot]
    delete newSlots[fromSlot]
    if (displaced && displaced !== itemId) newSlots[fromSlot] = displaced
    newSlots[toSlot] = itemId

    await patchSheet({ equipped_slots: newSlots })
  }

  // ── Realtime ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel(`character-${characterId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['character', characterId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [characterId, queryClient])

  // ── Derived ───────────────────────────────────────────────────────────────

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={parchmentStyle}><p className="text-stone-600 font-serif italic">Consultando los pergaminos...</p></div>
  if (!character) return <div className="min-h-screen flex items-center justify-center" style={parchmentStyle}><p className="text-stone-600 font-serif">Personaje no encontrado.</p></div>

  const isOwner = character.user_id === session.user.id
  const isGm = campaign?.dm_id === session.user.id
  const stats = (character.stats as Record<string, number>) ?? {}
  const sheet = character.sheet_json as SheetJson
  const level = character.level
  const hitDie = sheet.hit_die ?? classDetail?.hit_die ?? 8
  const conMod = Math.floor(((stats.con ?? 10) - 10) / 2)
  const dexMod = Math.floor(((stats.dex ?? 10) - 10) / 2)
  const strMod = Math.floor(((stats.str ?? 10) - 10) / 2)
  const profBonus = Math.ceil(level / 4) + 1
  const passivePerception = 10 + Math.floor(((stats.wis ?? 10) - 10) / 2)
  const maxHp = sheet.max_hp ?? (hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod))
  const currentHp = character.current_hp ?? maxHp
  const ac = character.armor_class ?? (10 + dexMod)
  const xp = character.experience_points ?? 0
  const xpForCurrent = XP_THRESHOLDS[level - 1] ?? 0
  const xpForNext = XP_THRESHOLDS[level] ?? null
  const xpPct = xpForNext ? Math.min(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100) : 100
  const canLevelUp = xpForNext !== null && xp >= xpForNext && level < 20
  const hpPct = Math.max(0, Math.min((currentHp / maxHp) * 100, 100))
  const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
  const maxSlots = getSpellSlots(character.class, level)
  const deathSaves = sheet.death_saves ?? { successes: 0, failures: 0 }
  const hitDiceAvailable = level - (sheet.hit_dice_used ?? 0)
  const classFeaturesByLevel = classLevels ? Array.from({ length: level }, (_, i) => ({
    level: i + 1,
    features: classLevels.filter(l => l.level === i + 1).flatMap(l => l.features),
  })).filter(l => l.features.length > 0) : []

  const isSpellcaster = maxSlots.some(s => s > 0)

  return (
    <div className="h-screen flex flex-col overflow-hidden text-stone-900" style={mapBgStyle}>
      {/* Header */}
      <header className="flex-shrink-0 border-b-2 border-stone-800 bg-stone-900 px-4 sm:px-8 py-2.5 flex items-center gap-3 z-30">
        <button onClick={() => window.history.back()} className="text-amber-400 hover:text-amber-200 text-sm font-serif">← Volver</button>
        <div className="w-px h-4 bg-stone-700 mx-2" />
        <div className="flex-1 truncate">
          <p className="text-amber-200 font-serif font-semibold text-sm truncate">{character.name}</p>
          <p className="text-stone-500 font-serif text-xs truncate capitalize">{character.race} · {character.class} · Nv. {level}</p>
        </div>
        <button onClick={() => setShowDice(true)} className="px-3 py-1 border border-amber-800 text-amber-500 text-xs font-serif bg-amber-900/20">🎲 Dados</button>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-6 py-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">

          {/* Main Content Area */}
          <div className="lg:col-span-7 overflow-y-auto" style={sheetStyle}>
            {/* Header: Identity + Portrait — Image #6 style */}
            <div className="flex items-stretch relative overflow-hidden" style={{ minHeight: '120px', borderBottom: '1px solid rgba(109,85,48,0.4)' }}>
              {/* Portrait */}
              <div className="w-[108px] flex-shrink-0 relative overflow-hidden group" style={{ background: 'rgba(60,40,15,0.15)' }}>
                {character.portrait_url ? (
                  <img src={character.portrait_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-4xl">⚔</div>
                )}
                {/* Gradiente sutil en el borde derecho */}
                <div className="absolute inset-y-0 right-0 w-4 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, rgba(244,232,190,0.4))' }} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button onClick={() => fileInputRef.current?.click()} className="text-[10px] text-white/90 font-serif underline">Subir</button>
                </div>
              </div>

              {/* Identity */}
              <div className="flex-1 px-5 py-4 flex flex-col justify-center min-w-0">
                <h1 className="text-[26px] font-bold text-stone-900 font-serif leading-none truncate">{character.name}</h1>
                <p className="text-sm font-serif text-stone-600 mt-2 capitalize">
                  {character.race}
                  <span className="mx-1.5 text-amber-700 font-bold">•</span>
                  {character.class}{subclassDetail ? ` (${subclassDetail.name})` : ''}
                </p>
                <p className="text-[11px] text-stone-400 font-serif tracking-widest uppercase mt-1">Nivel {level}</p>
                <button
                  onClick={generatePortrait}
                  disabled={generatingPortrait}
                  className="mt-3 self-start text-[10px] px-2.5 py-1 bg-amber-900/10 border border-amber-900/25 text-amber-900 hover:bg-amber-900/20 transition-colors font-serif disabled:opacity-50"
                >
                  {generatingPortrait ? 'Hechizando...' : 'Retrato IA'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
              </div>

              {/* Decorativo */}
              <span className="absolute top-3 right-4 text-amber-600/25 text-xl select-none pointer-events-none">◆</span>
            </div>

            {/* Tabs Bar */}
            <SheetTabBar active={activeTab} onChange={setActiveTab} />

            {/* Tab Content */}
            <div className="min-h-[500px] relative">
              {activeTab === 'resumen' && (
                <TabResumen
                  {...{
                    stats, sheet, character, raceDetail, isOwner, isGm, currentHp, maxHp, hitDie, hpPct, hpColor,
                    editingHp, hpInput, setHpInput, setEditingHp, editingMaxHp, maxHpInput, setMaxHpInput, setEditingMaxHp,
                    ac, xp, xpPct, level, xpForCurrent, xpForNext, canLevelUp, editingAc, acInput, setAcInput, setEditingAc,
                    editingXp, xpInput, setXpInput, setEditingXp, dexMod, strMod, profBonus, passivePerception, hitDiceAvailable,
                    conditions: (character.conditions as string[]) ?? [], deathSaves, isStable: currentHp === 0 && deathSaves.successes >= 3,
                    isDead: currentHp === 0 && deathSaves.failures >= 3, currency: sheet.currency ?? { gold: 0, silver: 0, copper: 0 },
                    showRestPanel, setShowRestPanel, showLongRestConfirm, setShowLongRestConfirm, shortRestHd, setShortRestHd,
                    shortRestHpInput, setShortRestHpInput, showConditionPicker, setShowConditionPicker,
                    adjustHp, saveHp, saveMaxHp, saveAc, saveXp, shortRest, longRest, toggleCondition, toggleDeathSave,
                    setShowLevelUpModal, setLevelUpHpInput, setModal, classDetail, raceDetailSpeed: raceDetail?.speed,
                    classFeaturesByLevel, subclassDetail, subclassFeatureList,
                  }}
                  patchSheet={patchSheet}
                  patchCharacter={patchCharacter}
                />
              )}
              {activeTab === 'pericias' && (
                <TabPericias
                  stats={stats}
                  skillProficiencies={sheet.skill_proficiencies ?? []}
                  weaponProficiencies={sheet.weapon_proficiencies ?? []}
                  profBonus={profBonus}
                  savingThrows={sheet.saving_throws ?? []}
                  setModal={setModal}
                />
              )}
              {activeTab === 'hechizos' && (
                <TabHechizos
                  spells={sheet.spells ?? []} maxSlots={maxSlots} slotsUsed={sheet.spell_slots_used ?? {}}
                  characterClass={character.class} isOwner={isOwner} isSpellcaster={isSpellcaster}
                  setModal={setModal} toggleSlot={toggleSlot}
                />
              )}
              {activeTab === 'historia' && (
                <TabHistoria
                  backstory={character.backstory}
                  isOwner={isOwner}
                  confirmDelete={confirmDelete}
                  setConfirmDelete={setConfirmDelete}
                  onDelete={async () => { await supabase.from('characters').delete().eq('id', characterId); navigate({ to: '/' }) }}
                />
              )}
            </div>
          </div>

          {/* Sidebar Area: Inventory */}
          <div className="lg:col-span-5 h-full min-h-0 overflow-hidden" style={darkFrameStyle}>
            <InventoryPanel
              characterId={characterId}
              inventory={inventory}
              sheet={sheet}
              isOwner={isOwner}
              ac={ac}
              toggleEquip={toggleEquip}
              equipToSlot={equipToSlot}
              moveEquipSlot={moveEquipSlot}
              patchCurrency={(p) => patchSheet({ currency: { ...(sheet.currency ?? { gold: 0, silver: 0, copper: 0 }), ...p } })}
              currency={sheet.currency ?? { gold: 0, silver: 0, copper: 0 }}
              strScore={stats.str ?? 10}
            />
          </div>

        </div>
      </main>

      <DiceModule isOpen={showDice} onClose={() => setShowDice(false)} />
      {showLevelUpModal && (
        <LevelUpModal
          character={character} level={level} hitDie={hitDie} conMod={conMod} stats={stats}
          hpInput={levelUpHpInput} setHpInput={setLevelUpHpInput} subclass={levelUpSubclass} setSubclass={setLevelUpSubclass}
          asi={levelUpAsi} setAsi={setLevelUpAsi} currentSubclass={sheet.subclass} onConfirm={levelUp}
          onCancel={() => setShowLevelUpModal(false)}
        />
      )}
      {modal && <InfoModal modal={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
