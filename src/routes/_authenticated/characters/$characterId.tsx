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
import { parchmentStyle, sheetStyle, SheetLabel, SheetRow, SheetTabBar, type SheetTab } from '../../../components/character-sheet/sheet-primitives'
import { InfoModal } from '../../../components/character-sheet/sheet-badges'
import { LevelUpModal } from '../../../components/character-sheet/level-up-modal'
import { TabResumen } from '../../../components/character-sheet/tab-resumen'
import { TabPericias } from '../../../components/character-sheet/tab-pericias'
import { TabCombate } from '../../../components/character-sheet/tab-combate'
import { TabHechizos } from '../../../components/character-sheet/tab-hechizos'
import { InventoryPanel } from '../../../components/character-sheet/inventory-panel'

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
    await supabase.from('characters').update({ sheet_json: { ...current, ...sheetPatch } as never }).eq('id', characterId)
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
    const current = sheet.equipped_items ?? []
    const isEquipping = !current.includes(itemId)
    const newEquipped = isEquipping ? [...current, itemId] : current.filter(id => id !== itemId)
    const item = inventory.find(i => i.id === itemId)

    if (!isEquipping && sheet.equipped_armor && item?.name === sheet.equipped_armor.name) {
      await patchSheet({ equipped_items: newEquipped, equipped_armor: undefined })
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
          equipped_armor: { name: item.name, base, dex_bonus: hasDex, max_bonus: maxBonus, category: !hasDex ? 'Pesada' : maxBonus ? 'Media' : 'Ligera' },
        })
        await patchCharacter({ armor_class: base + dexBonus })
        return
      }
    }

    if (isEquipping && item?.notes?.startsWith('Escudo')) {
      const shieldMatch = item.notes.match(/\+(\d+)/)
      const shieldBonus = shieldMatch ? parseInt(shieldMatch[1]) : 2
      await patchSheet({ equipped_items: newEquipped })
      await patchCharacter({ armor_class: ac + shieldBonus })
      return
    }

    await patchSheet({ equipped_items: newEquipped })
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

  const equippedItemIds = new Set(sheet.equipped_items ?? [])
  const equippedItems = inventory.filter(item => equippedItemIds.has(item.id))
  const isSpellcaster = maxSlots.some(s => s > 0)

  return (
    <div className="min-h-screen text-stone-900 pb-12" style={parchmentStyle}>
      {/* Header */}
      <header className="border-b-2 border-stone-800 bg-stone-900 px-4 sm:px-8 py-2.5 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => window.history.back()} className="text-amber-400 hover:text-amber-200 text-sm font-serif">← Volver</button>
        <div className="w-px h-4 bg-stone-700 mx-2" />
        <div className="flex-1 truncate">
          <p className="text-amber-200 font-serif font-semibold text-sm truncate">{character.name}</p>
          <p className="text-stone-500 font-serif text-xs truncate capitalize">{character.race} · {character.class} · Nv. {level}</p>
        </div>
        <button onClick={() => setShowDice(true)} className="px-3 py-1 border border-amber-800 text-amber-500 text-xs font-serif bg-amber-900/20">🎲 Dados</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content Area */}
          <div className="lg:col-span-7 space-y-0" style={sheetStyle}>
            {/* Title Section */}
            <div className="p-6 text-center border-b border-stone-600 bg-stone-800/5">
              <h1 className="text-3xl font-bold text-stone-900 font-serif">{character.name}</h1>
              <p className="text-sm text-stone-500 font-serif italic mt-1 capitalize">
                {character.race} · {character.class} {subclassDetail && `(${subclassDetail.name})`} · Nivel {level}
              </p>
            </div>

            {/* Tabs Bar */}
            <SheetTabBar active={activeTab} onChange={setActiveTab} />

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'resumen' && (
                <TabResumen
                  {...{
                    stats, sheet, character, raceDetail, isOwner, isGm, currentHp, maxHp, hitDie, hpPct, hpColor,
                    editingHp, hpInput, setHpInput, setEditingHp, editingMaxHp, maxHpInput, setMaxHpInput, setEditingMaxHp,
                    ac, xp, xpPct, level, xpForCurrent, xpForNext, canLevelUp, editingAc, acInput, setAcInput, setEditingAc,
                    editingXp, xpInput, setXpInput, setEditingXp, dexMod, profBonus, passivePerception, hitDiceAvailable,
                    conditions: (character.conditions as string[]) ?? [], deathSaves, isStable: currentHp === 0 && deathSaves.successes >= 3,
                    isDead: currentHp === 0 && deathSaves.failures >= 3, currency: sheet.currency ?? { gold: 0, silver: 0, copper: 0 },
                    showRestPanel, setShowRestPanel, showLongRestConfirm, setShowLongRestConfirm, shortRestHd, setShortRestHd,
                    shortRestHpInput, setShortRestHpInput, showConditionPicker, setShowConditionPicker,
                    adjustHp, saveHp, saveAc, saveXp, shortRest, longRest, toggleCondition, toggleDeathSave,
                    setShowLevelUpModal, setLevelUpHpInput, setModal, classDetail, raceDetailSpeed: raceDetail?.speed
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
              {activeTab === 'combate' && (
                <TabCombate
                  ac={ac} dexMod={dexMod} strMod={strMod} profBonus={profBonus}
                  raceDetailSpeed={raceDetail?.speed} hitDie={hitDie} hitDiceAvailable={hitDiceAvailable}
                  level={level} equippedItems={equippedItems} equippedArmor={sheet.equipped_armor}
                  classFeaturesByLevel={classFeaturesByLevel} subclassDetail={subclassDetail}
                  subclassFeatureList={subclassFeatureList} setModal={setModal}
                />
              )}
              {activeTab === 'hechizos' && (
                <TabHechizos
                  spells={sheet.spells ?? []} maxSlots={maxSlots} slotsUsed={sheet.spell_slots_used ?? {}}
                  characterClass={character.class} isOwner={isOwner} isSpellcaster={isSpellcaster}
                  setModal={setModal} toggleSlot={toggleSlot}
                />
              )}
            </div>

            {/* Portrait Section (at bottom of main sheet) */}
            <SheetRow className="border-t border-stone-600">
               <div className="flex-1 p-4 flex gap-4 items-center">
                  <div className="w-20 h-20 bg-stone-300/50 border border-stone-500 overflow-hidden shrink-0">
                    {character.portrait_url ? <img src={character.portrait_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-400">⚔</div>}
                  </div>
                  <div className="flex-1">
                    <SheetLabel>Retrato</SheetLabel>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => fileInputRef.current?.click()} className="text-[10px] px-2 py-1 border border-stone-400 font-serif">Subir</button>
                      <button onClick={generatePortrait} disabled={generatingPortrait} className="text-[10px] px-2 py-1 bg-stone-800 text-amber-300 font-serif">{generatingPortrait ? '...' : 'Generar IA'}</button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
                    </div>
                  </div>
               </div>
            </SheetRow>
          </div>

          {/* Sidebar Area: Inventory */}
          <div className="lg:col-span-5 space-y-4">
            <div style={sheetStyle} className="p-1">
               <InventoryPanel
                 characterId={characterId}
                 inventory={inventory}
                 sheet={sheet}
                 isOwner={isOwner}
                 ac={ac}
                 dexMod={dexMod}
                 toggleEquip={toggleEquip}
                 patchCurrency={(p) => patchSheet({ currency: { ...(sheet.currency ?? { gold: 0, silver: 0, copper: 0 }), ...p } })}
                 currency={sheet.currency ?? { gold: 0, silver: 0, copper: 0 }}
                 strScore={stats.str ?? 10}
               />
            </div>

            {/* Backstory (if exists) */}
            {character.backstory && (
              <div style={sheetStyle} className="p-4">
                <SheetLabel>Historia</SheetLabel>
                <p className="text-xs text-stone-600 font-serif italic mt-3 leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
              </div>
            )}
            
            {/* Delete button */}
            {isOwner && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} className="w-full py-2 text-xs text-stone-400 hover:text-red-700 font-serif italic transition-colors">Eliminar personaje</button>
            )}
            {confirmDelete && (
              <div className="p-3 border border-red-900/30 bg-red-900/5 text-center space-y-2">
                <p className="text-xs text-red-900 font-serif">¿Seguro?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1 text-xs border border-stone-400 font-serif">No</button>
                  <button onClick={async () => { await supabase.from('characters').delete().eq('id', characterId); navigate({ to: '/' }) }} className="flex-1 py-1 text-xs bg-red-900 text-white font-serif">Sí, borrar</button>
                </div>
              </div>
            )}
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
