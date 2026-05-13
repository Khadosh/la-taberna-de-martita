import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useRef, useState, useMemo, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import type { Database } from '../../../lib/database.types'
import {
  dndApi, dndKeys,
  abilityModifier, modifierColor,
  ABILITY_LABELS, ABILITY_FULL,
} from '../../../lib/dnd-api'
import type { SpellDetail, TraitDetail, SkillDetail, FeatureDetail } from '../../../lib/dnd-api'
import { CONDITIONS, XP_THRESHOLDS, getSpellSlots, isWarlock } from '../../../lib/dnd-constants'

export const Route = createFileRoute('/_authenticated/characters/$characterId')({
  component: CharacterSheet,
})

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

type SheetJson = {
  skill_proficiencies?: string[]
  weapon_proficiencies?: string[]
  spells?: string[]
  saving_throws?: string[]
  hit_die?: number
  spell_slots_used?: Record<string, number>
  death_saves?: { successes: number; failures: number }
  hit_dice_used?: number
  subclass?: string
}

type InfoModal =
  | { kind: 'spell'; data: SpellDetail }
  | { kind: 'trait'; data: TraitDetail }
  | { kind: 'skill'; data: SkillDetail }
  | { kind: 'feature'; data: FeatureDetail }

function CharacterSheet() {
  const { characterId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [modal, setModal] = useState<InfoModal | null>(null)
  const [assigningCampaign, setAssigningCampaign] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [generatingPortrait, setGeneratingPortrait] = useState(false)
  const [portraitError, setPortraitError] = useState('')

  // Inventory
  const [newItemName, setNewItemName] = useState('')
  const [newItemWeight, setNewItemWeight] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')
  const [newItemNotes, setNewItemNotes] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [equipSearch, setEquipSearch] = useState('')
  const [showEquipDropdown, setShowEquipDropdown] = useState(false)

  // Combat state editing
  const [editingHp, setEditingHp] = useState(false)
  const [hpInput, setHpInput] = useState('')
  const [editingAc, setEditingAc] = useState(false)
  const [acInput, setAcInput] = useState('')
  const [xpInput, setXpInput] = useState('')
  const [editingXp, setEditingXp] = useState(false)
  const [showConditionPicker, setShowConditionPicker] = useState(false)

  // Rest panel
  const [showRestPanel, setShowRestPanel] = useState(false)
  const [shortRestHd, setShortRestHd] = useState(1)
  const [shortRestHpInput, setShortRestHpInput] = useState('')
  const [showLongRestConfirm, setShowLongRestConfirm] = useState(false)

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: character, isLoading } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('id', characterId).single()
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

  const { data: equipmentList = [] } = useQuery({
    queryKey: dndKeys.equipment,
    queryFn: async () => (await dndApi.equipment()).results,
    staleTime: Infinity,
  })

  const { data: userCampaigns = [] } = useQuery({
    queryKey: ['campaigns', 'all', session.user.id],
    queryFn: async () => {
      const [gm, player] = await Promise.all([
        supabase.from('campaigns').select('id, name').eq('dm_id', session.user.id),
        supabase.from('campaign_players').select('campaigns(id, name)').eq('user_id', session.user.id),
      ])
      const gmList = gm.data ?? []
      const playerList = (player.data ?? []).flatMap(r => r.campaigns ? [r.campaigns as { id: string; name: string }] : [])
      const seen = new Set<string>()
      return [...gmList, ...playerList].filter(c => seen.has(c.id) ? false : (seen.add(c.id), true))
    },
    enabled: !!character && character.user_id === session.user.id,
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

  const filteredEquipment = useMemo(() =>
    equipSearch.length >= 2
      ? equipmentList.filter(e => e.name.toLowerCase().includes(equipSearch.toLowerCase())).slice(0, 8)
      : [],
    [equipmentList, equipSearch]
  )

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

  // ── Mutations ─────────────────────────────────────────────────────────────

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

  const deleteCharacter = async () => {
    await supabase.from('characters').delete().eq('id', characterId)
    await queryClient.invalidateQueries({ queryKey: ['characters'] })
    navigate({ to: '/' })
  }

  const assignToCampaign = async () => {
    const prevCampaignId = character?.campaign_id
    await patchCharacter({ campaign_id: selectedCampaignId || null })
    if (selectedCampaignId) queryClient.invalidateQueries({ queryKey: ['campaign-characters', selectedCampaignId] })
    if (prevCampaignId) queryClient.invalidateQueries({ queryKey: ['campaign-characters', prevCampaignId] })
    setAssigningCampaign(false)
  }

  const saveHp = async () => {
    const val = parseInt(hpInput)
    if (!isNaN(val)) await patchCharacter({ current_hp: val })
    setEditingHp(false)
  }

  const adjustHp = async (delta: number) => {
    const current = character?.current_hp ?? maxHp
    await patchCharacter({ current_hp: Math.max(0, Math.min(maxHp, current + delta)) })
  }

  const saveAc = async () => {
    const val = parseInt(acInput)
    if (!isNaN(val)) await patchCharacter({ armor_class: val })
    setEditingAc(false)
  }

  const saveXp = async () => {
    const val = parseInt(xpInput)
    if (!isNaN(val)) await patchCharacter({ experience_points: val })
    setEditingXp(false)
  }

  const levelUp = async () => {
    if (!character) return
    await patchCharacter({ level: character.level + 1 })
  }

  const toggleCondition = async (cond: string) => {
    if (!character) return
    const current: string[] = (character.conditions as string[]) ?? []
    const next = current.includes(cond) ? current.filter(c => c !== cond) : [...current, cond]
    await patchCharacter({ conditions: next })
  }

  const toggleSlot = async (level: number, slotIndex: number) => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    const slotsUsed = sheet.spell_slots_used ?? {}
    const used = slotsUsed[String(level)] ?? 0
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
    const newHp = Math.min(maxHp, currentHp + hpGained)
    const slotsUpdate = isWarlock(character.class) ? { spell_slots_used: {} } : {}
    await patchSheet({
      hit_dice_used: (sheet.hit_dice_used ?? 0) + shortRestHd,
      ...slotsUpdate,
    })
    await patchCharacter({ current_hp: newHp })
    setShowRestPanel(false)
    setShortRestHd(1)
    setShortRestHpInput('')
  }

  const longRest = async () => {
    if (!character) return
    const sheet = character.sheet_json as SheetJson
    await supabase.from('characters').update({
      current_hp: maxHp,
      sheet_json: { ...sheet, spell_slots_used: {}, death_saves: undefined, hit_dice_used: 0 } as never,
    }).eq('id', characterId)
    queryClient.invalidateQueries({ queryKey: ['character', characterId] })
    setShowLongRestConfirm(false)
  }

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => patchCharacter({ portrait_url: ev.target?.result as string })
    reader.readAsDataURL(file)
  }

  const generatePortrait = async () => {
    if (!character) return
    setGeneratingPortrait(true)
    setPortraitError('')
    try {
      const prompt = `Fantasy portrait of a ${character.race} ${character.class}, D&D 5e illustration, detailed face, dramatic lighting, old school fantasy art, painterly style, parchment background`
      const { data, error } = await supabase.functions.invoke('generate-portrait', { body: { prompt } })
      if (error) throw error
      if (data?.url) await patchCharacter({ portrait_url: data.url })
    } catch {
      setPortraitError('No se pudo generar el retrato.')
    } finally {
      setGeneratingPortrait(false)
    }
  }

  const addInventoryItem = async () => {
    if (!newItemName.trim()) return
    await supabase.from('character_inventory').insert({
      character_id: characterId,
      name: newItemName.trim(),
      weight_lbs: parseFloat(newItemWeight) || 0,
      quantity: parseInt(newItemQty) || 1,
      notes: newItemNotes.trim() || null,
    })
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
    setNewItemName(''); setNewItemWeight(''); setNewItemQty('1'); setNewItemNotes('')
    setAddingItem(false); setEquipSearch(''); setShowEquipDropdown(false)
  }

  const removeInventoryItem = async (id: string) => {
    await supabase.from('character_inventory').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
  }

  const selectEquipmentItem = async (index: string) => {
    const detail = await dndApi.equipmentDetail(index)
    setNewItemName(detail.name)
    setNewItemWeight(String(detail.weight ?? 0))
    setEquipSearch('')
    setShowEquipDropdown(false)
  }

  // ── Loading states ────────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={parchmentStyle}>
      <p className="text-stone-600 font-serif italic">Consultando los pergaminos...</p>
    </div>
  )

  if (!character) return (
    <div className="min-h-screen flex items-center justify-center" style={parchmentStyle}>
      <p className="text-stone-600 font-serif">Personaje no encontrado en los archivos.</p>
    </div>
  )

  // ── Derived values ────────────────────────────────────────────────────────

  const isOwner = character.user_id === session.user.id
  const isGm = campaign?.dm_id === session.user.id
  const stats = character.stats as Record<string, number>
  const sheet = character.sheet_json as SheetJson
  const hitDie = sheet.hit_die ?? classDetail?.hit_die ?? 8
  const conMod = Math.floor(((stats.con ?? 10) - 10) / 2)
  const dexMod = Math.floor(((stats.dex ?? 10) - 10) / 2)
  const maxHp = hitDie + conMod
  const currentHp = character.current_hp ?? maxHp
  const ac = character.armor_class ?? (10 + dexMod)
  const xp = character.experience_points ?? 0
  const conditions: string[] = (character.conditions as string[]) ?? []
  const level = character.level
  const xpForCurrent = XP_THRESHOLDS[level - 1] ?? 0
  const xpForNext = XP_THRESHOLDS[level] ?? null
  const xpPct = xpForNext ? Math.min(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100) : 100
  const canLevelUp = xpForNext !== null && xp >= xpForNext && level < 20
  const hpPct = Math.max(0, Math.min((currentHp / maxHp) * 100, 100))
  const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
  const carryCapacity = (stats.str ?? 10) * 15
  const totalWeight = inventory.reduce((s, i) => s + Number(i.weight_lbs) * i.quantity, 0)
  const weightPct = Math.min((totalWeight / carryCapacity) * 100, 100)
  const weightColor = weightPct > 80 ? 'bg-red-700' : weightPct > 50 ? 'bg-amber-600' : 'bg-green-700'

  // Spell slots
  const maxSlots = getSpellSlots(character.class, level)
  const slotsUsed = sheet.spell_slots_used ?? {}
  const isSpellcaster = maxSlots.some(s => s > 0)

  // Death saves
  const deathSaves = sheet.death_saves ?? { successes: 0, failures: 0 }
  const isDead = currentHp === 0 && deathSaves.failures >= 3
  const isStable = currentHp === 0 && deathSaves.successes >= 3

  // Hit dice
  const hitDiceAvailable = level - (sheet.hit_dice_used ?? 0)

  // Class features unlocked at current level (deduplicated)
  const classFeatures = useMemo(() => {
    if (!classLevels) return []
    const seen = new Set<string>()
    return classLevels
      .filter(l => l.level <= level)
      .flatMap(l => l.features)
      .filter(f => seen.has(f.index) ? false : (seen.add(f.index), true))
  }, [classLevels, level])

  return (
    <div className="min-h-screen text-stone-900" style={parchmentStyle}>

      {/* Header */}
      <header className="border-b-2 border-stone-800 bg-stone-900 px-4 sm:px-8 py-2.5 flex items-center gap-3">
        <Link to="/" className="text-amber-400 hover:text-amber-200 transition-colors text-sm font-serif shrink-0">← La Taberna</Link>
        <div className="w-px h-4 bg-stone-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-amber-200 font-serif font-semibold text-sm leading-tight truncate">{character.name}</p>
          <p className="text-stone-500 font-serif text-xs leading-tight capitalize truncate">{character.race} · {character.class} · Nv. {character.level}</p>
        </div>
        {isOwner && (
          assigningCampaign ? (
            <div className="flex items-center gap-2 shrink-0">
              <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)}
                className="px-2 py-1 text-xs bg-stone-800 border border-stone-600 text-stone-200 focus:outline-none max-w-[120px]">
                <option value="">Sin campaña</option>
                {userCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={assignToCampaign} className="px-2 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-white">OK</button>
              <button onClick={() => setAssigningCampaign(false)} className="text-stone-500 hover:text-stone-300 text-sm">✕</button>
            </div>
          ) : (
            <button onClick={() => { setAssigningCampaign(true); setSelectedCampaignId(character.campaign_id ?? '') }}
              className="text-xs px-2.5 py-1 border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-stone-200 transition-colors shrink-0 font-serif">
              {character.campaign_id ? '✦ Campaña' : '+ Campaña'}
            </button>
          )
        )}
      </header>

      {/* Parchment sheet */}
      <main className="max-w-4xl mx-auto px-4 py-6" style={sheetStyle}>

        {/* Title */}
        <div className="text-center border-4 border-double border-stone-800 px-4 sm:px-8 py-4 sm:py-5 mb-0" style={{ background: 'rgba(200,170,110,0.25)' }}>
          <p className="text-xs tracking-[0.3em] text-stone-500 uppercase font-serif mb-1">Hoja de Personaje · D&D 5ª Edición</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-stone-900" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.04em' }}>{character.name}</h1>
          <p className="text-sm text-stone-500 mt-1 font-serif italic capitalize">
            {character.race} · {character.class}
            {subclassDetail && <span className="text-amber-700"> · {subclassDetail.name}</span>}
            {' '}· Nivel {character.level}
          </p>
        </div>

        {/* Portrait + Stats */}
        <SheetRow>
          <div className="sm:w-1/3 border-b sm:border-b-0 sm:border-r border-stone-600 p-4">
            <SheetLabel>Retrato</SheetLabel>
            {/* Mobile: horizontal row; Desktop: vertical stack */}
            <div className="flex sm:flex-col gap-3 mt-3">
              <div className="relative group w-24 h-24 sm:w-full sm:aspect-square sm:h-auto bg-stone-300/50 border border-stone-500 overflow-hidden flex items-center justify-center shrink-0">
                {character.portrait_url ? (
                  <>
                    <img src={character.portrait_url} alt={character.name} className="w-full h-full object-cover" />
                    {isOwner && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 text-xs bg-stone-900 text-white rounded">Cambiar</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 p-3 text-center">
                    <span className="text-stone-400 text-3xl">⚔</span>
                    <p className="text-xs text-stone-400 font-serif italic hidden sm:block">Sin retrato</p>
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-xs py-1.5 border border-stone-500 text-stone-600 hover:bg-stone-200/50 font-serif transition-colors">
                    Importar imagen
                  </button>
                  <button onClick={generatePortrait} disabled={generatingPortrait}
                    className="w-full text-xs py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-amber-300 font-serif transition-colors">
                    {generatingPortrait ? 'Generando...' : '✦ Generar con IA'}
                  </button>
                  {portraitError && <p className="text-xs text-red-700 font-serif text-center">{portraitError}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-4">
            <SheetLabel>Características</SheetLabel>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {STAT_KEYS.map(k => (
                <div key={k} className="border border-stone-500 text-center py-2 px-1" style={{ background: 'rgba(200,170,110,0.15)' }}>
                  <p className="text-xs text-stone-500 font-serif tracking-widest uppercase">{ABILITY_LABELS[k]}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-stone-900 my-0.5" style={{ fontFamily: 'Georgia, serif' }}>{stats[k] ?? '—'}</p>
                  <div className="border-t border-stone-400 pt-0.5">
                    <p className={`text-sm sm:text-base font-bold font-mono ${stats[k] ? modifierColor(stats[k]) : 'text-stone-400'}`}>{stats[k] ? abilityModifier(stats[k]) : ''}</p>
                  </div>
                  <p className="text-xs text-stone-400 font-serif italic mt-0.5 hidden sm:block">{ABILITY_FULL[k]}</p>
                </div>
              ))}
            </div>
          </div>
        </SheetRow>

        {/* Combat bar */}
        <div className="border-t border-stone-600 bg-stone-900 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-stone-700 text-center">
          <StatBlock label="Dado de Golpe" value={`d${hitDie}`} mono />
          <StatBlock label="PV Máximos" value={String(maxHp)} mono />
          <StatBlock label="CA" value={String(ac)} mono />
          <div className="px-4">
            <p className="text-xs text-stone-400 font-serif tracking-widest uppercase">Salvaciones</p>
            <p className="text-xs text-amber-200 font-serif capitalize mt-1 leading-tight">{sheet.saving_throws?.join(', ') ?? '—'}</p>
          </div>
        </div>

        {/* Combat state */}
        <SheetRow className="border-t-0">
          {/* HP */}
          <div className="flex-1 border-b sm:border-b-0 sm:border-r border-stone-600 p-4">
            <SheetLabel>Puntos de Vida</SheetLabel>
            <div className="mt-3 space-y-2">
              <div className="h-3 border border-stone-500 overflow-hidden bg-stone-200/40">
                <div className={`h-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {isOwner && <button onClick={() => adjustHp(-1)} className="w-6 h-6 text-sm border border-stone-500 text-stone-600 hover:bg-stone-200/50 leading-none font-mono">−</button>}
                  {editingHp ? (
                    <input autoFocus value={hpInput} onChange={e => setHpInput(e.target.value)}
                      onBlur={saveHp} onKeyDown={e => e.key === 'Enter' && saveHp()}
                      className="w-14 text-center text-lg font-bold font-mono border-b border-stone-600 bg-transparent focus:outline-none" />
                  ) : (
                    <button onClick={() => { setEditingHp(true); setHpInput(String(currentHp)) }}
                      className="text-lg font-bold font-mono text-stone-800 px-1 hover:text-amber-800 transition-colors min-w-[2rem]">
                      {currentHp === 0 ? <span className="text-red-700">0</span> : currentHp}
                    </button>
                  )}
                  {isOwner && <button onClick={() => adjustHp(1)} className="w-6 h-6 text-sm border border-stone-500 text-stone-600 hover:bg-stone-200/50 leading-none font-mono">+</button>}
                </div>
                <span className="text-xs text-stone-500 font-serif">/ {maxHp} PV</span>
              </div>
            </div>
          </div>

          {/* AC */}
          <div className="sm:w-32 border-b sm:border-b-0 sm:border-r border-stone-600 p-4 text-center">
            <SheetLabel>CA</SheetLabel>
            <div className="mt-3">
              {editingAc && isOwner ? (
                <input autoFocus value={acInput} onChange={e => setAcInput(e.target.value)}
                  onBlur={saveAc} onKeyDown={e => e.key === 'Enter' && saveAc()}
                  className="w-16 text-center text-3xl font-bold font-mono border-b-2 border-stone-700 bg-transparent focus:outline-none" style={{ fontFamily: 'Georgia, serif' }} />
              ) : (
                <button onClick={() => { if (isOwner) { setEditingAc(true); setAcInput(String(ac)) } }}
                  className="text-3xl font-bold text-stone-900 hover:text-amber-800 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                  {ac}
                </button>
              )}
              <p className="text-xs text-stone-400 font-serif italic mt-1">Clase de Armadura</p>
            </div>
          </div>

          {/* XP */}
          <div className="flex-1 p-4">
            <SheetLabel>Experiencia</SheetLabel>
            <div className="mt-3 space-y-2">
              <div className="h-3 border border-stone-500 overflow-hidden bg-stone-200/40">
                <div className="h-full bg-amber-700 transition-all" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {editingXp && isGm ? (
                    <input autoFocus value={xpInput} onChange={e => setXpInput(e.target.value)}
                      onBlur={saveXp} onKeyDown={e => e.key === 'Enter' && saveXp()}
                      className="w-20 text-sm font-mono border-b border-stone-600 bg-transparent focus:outline-none" />
                  ) : (
                    <button onClick={() => { if (isGm) { setEditingXp(true); setXpInput(String(xp)) } }}
                      className={`text-sm font-mono text-stone-700 transition-colors ${isGm ? 'hover:text-amber-800 cursor-pointer' : 'cursor-default'}`}>
                      {xp.toLocaleString()} XP
                    </button>
                  )}
                </div>
                {xpForNext && <span className="text-xs text-stone-400 font-serif">→ {xpForNext.toLocaleString()}</span>}
              </div>
              {!isGm && character.campaign_id && (
                <p className="text-[10px] text-stone-500 font-serif italic">Solo el GM puede otorgar XP</p>
              )}
              {canLevelUp && isGm && (
                <button onClick={levelUp}
                  className="w-full text-xs py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors animate-pulse">
                  ⬆ Subir al nivel {level + 1}
                </button>
              )}
            </div>
          </div>
        </SheetRow>

        {/* Death saves — only when at 0 HP */}
        {currentHp === 0 && (
          <SheetRow className="border-t border-stone-600 bg-red-950/20">
            <div className="flex-1 p-4">
              <SheetLabel>Tiradas de Muerte</SheetLabel>
              <div className="mt-3 flex items-start gap-8">
                <div>
                  <p className="text-xs text-stone-500 font-serif mb-2">Éxitos</p>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <button key={i}
                        onClick={() => isOwner && toggleDeathSave('successes', i)}
                        className={`w-7 h-7 border-2 rounded-full transition-colors ${i < deathSaves.successes ? 'bg-green-600 border-green-500' : 'bg-transparent border-stone-500 hover:border-green-700'}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-500 font-serif mb-2">Fallos</p>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <button key={i}
                        onClick={() => isOwner && toggleDeathSave('failures', i)}
                        className={`w-7 h-7 border-2 rounded-full transition-colors ${i < deathSaves.failures ? 'bg-red-700 border-red-600' : 'bg-transparent border-stone-500 hover:border-red-700'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="self-end pb-0.5">
                  {isStable && <p className="text-sm text-green-700 font-serif">✓ Estable</p>}
                  {isDead && <p className="text-sm text-red-700 font-serif">✕ Muerto</p>}
                  {!isStable && !isDead && <p className="text-xs text-stone-500 font-serif italic">Inconsciente</p>}
                </div>
              </div>
            </div>
          </SheetRow>
        )}

        {/* Conditions + Descanso */}
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4 space-y-3">
            {/* Conditions */}
            {(conditions.length > 0 || isOwner) && (
              <div>
                <SheetLabel>Condiciones activas</SheetLabel>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {conditions.map(c => (
                    <span key={c} className="flex items-center gap-1 px-2 py-0.5 text-xs border border-red-700 bg-red-100/60 text-red-800 font-serif">
                      {c}
                      {isOwner && <button onClick={() => toggleCondition(c)} className="text-red-600 hover:text-red-900 ml-0.5">✕</button>}
                    </span>
                  ))}
                  {isOwner && (
                    <div className="relative">
                      <button onClick={() => setShowConditionPicker(v => !v)}
                        className="px-2 py-0.5 text-xs border border-stone-400 text-stone-500 hover:border-amber-700 hover:text-amber-800 font-serif transition-colors">
                        + condición
                      </button>
                      {showConditionPicker && (
                        <div className="absolute left-0 top-7 z-20 w-48 border border-stone-500 bg-amber-50 shadow-lg max-h-52 overflow-y-auto">
                          {CONDITIONS.filter(c => !conditions.includes(c)).map(c => (
                            <button key={c} onClick={() => { toggleCondition(c); setShowConditionPicker(false) }}
                              className="block w-full text-left px-3 py-1.5 text-xs font-serif text-stone-700 hover:bg-amber-200 transition-colors">
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descanso */}
            {isOwner && (
              <div>
                <SheetLabel>Descanso</SheetLabel>
                <div className="mt-3">
                  {showLongRestConfirm ? (
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-stone-500 font-serif italic flex-1">¿Descanso largo? Se recuperan todos los PV, conjuros y dados de golpe.</p>
                      <button onClick={longRest} className="px-3 py-1 text-xs bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif">Confirmar</button>
                      <button onClick={() => setShowLongRestConfirm(false)} className="text-xs text-stone-500 font-serif">✕</button>
                    </div>
                  ) : showRestPanel ? (
                    <div className="border border-stone-400 p-3 space-y-2" style={{ background: 'rgba(200,170,110,0.2)' }}>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-stone-600 font-serif">DG disponibles: <span className="font-bold">{hitDiceAvailable}</span> d{hitDie}</p>
                        <div className="flex items-center gap-1 ml-auto">
                          <button onClick={() => setShortRestHd(Math.max(1, shortRestHd - 1))} className="w-5 h-5 border border-stone-400 text-stone-600 text-xs leading-none">−</button>
                          <span className="text-sm font-mono w-5 text-center">{shortRestHd}</span>
                          <button onClick={() => setShortRestHd(Math.min(hitDiceAvailable, shortRestHd + 1))} className="w-5 h-5 border border-stone-400 text-stone-600 text-xs leading-none">+</button>
                          <span className="text-xs text-stone-500 font-serif ml-1">DG a gastar</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-stone-600 font-serif">PV recuperados (tirás físicamente):</label>
                        <input type="number" min="0" value={shortRestHpInput} onChange={e => setShortRestHpInput(e.target.value)}
                          className="w-16 px-2 py-0.5 text-sm border border-stone-400 bg-amber-50/80 font-mono focus:outline-none" placeholder="0" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={shortRest} disabled={hitDiceAvailable === 0}
                          className="px-3 py-1 text-xs bg-stone-700 hover:bg-stone-600 disabled:opacity-40 text-amber-300 font-serif">
                          Descansar
                        </button>
                        <button onClick={() => setShowRestPanel(false)} className="text-xs text-stone-500 font-serif">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setShowRestPanel(true)} disabled={hitDiceAvailable === 0}
                        className="px-3 py-1 text-xs border border-stone-400 text-stone-600 hover:bg-stone-200/50 disabled:opacity-40 font-serif transition-colors">
                        ☽ Descanso corto
                      </button>
                      <button onClick={() => setShowLongRestConfirm(true)}
                        className="px-3 py-1 text-xs border border-amber-700 text-amber-800 hover:bg-amber-100/50 font-serif transition-colors">
                        ☀ Descanso largo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetRow>

        {/* Proficiencies + Skills */}
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 border-b sm:border-b-0 sm:border-r border-stone-600 p-4">
            <SheetLabel>Competencias</SheetLabel>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(sheet.weapon_proficiencies ?? []).map(p => (
                <span key={p} className="px-2 py-0.5 text-xs border border-stone-400 text-stone-600 font-serif capitalize" style={{ background: 'rgba(200,170,110,0.15)' }}>
                  {p.replace(/-/g, ' ')}
                </span>
              ))}
              {!(sheet.weapon_proficiencies?.length) && <p className="text-stone-400 text-sm font-serif italic">—</p>}
            </div>
          </div>
          <div className="flex-1 p-4">
            <SheetLabel>Pericias</SheetLabel>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(sheet.skill_proficiencies ?? []).map(p => (
                <SkillBadge key={p} index={p} onInfo={data => setModal({ kind: 'skill', data })} />
              ))}
              {!(sheet.skill_proficiencies?.length) && <p className="text-stone-400 text-sm font-serif italic">—</p>}
            </div>
          </div>
        </SheetRow>

        {/* Spells */}
        {(sheet.spells ?? []).length > 0 && (
          <SheetRow className="border-t border-stone-600">
            <div className="flex-1 p-4">
              <SheetLabel>Conjuros</SheetLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {sheet.spells!.map(idx => (
                  <SpellBadge key={idx} index={idx} onInfo={data => setModal({ kind: 'spell', data })} />
                ))}
              </div>
            </div>
          </SheetRow>
        )}

        {/* Spell slots */}
        {isSpellcaster && (
          <SheetRow className="border-t border-stone-600">
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-3">
                <SheetLabel>Espacios de Conjuro</SheetLabel>
              </div>
              <div className="space-y-2">
                {maxSlots.map((max, idx) => {
                  if (max === 0) return null
                  const slotLevel = idx + 1
                  const used = slotsUsed[String(slotLevel)] ?? 0
                  const available = max - used
                  return (
                    <div key={slotLevel} className="flex items-center gap-3">
                      <span className="text-xs text-stone-500 font-serif w-10">Nv. {slotLevel}</span>
                      <div className="flex gap-1.5">
                        {Array.from({ length: max }, (_, i) => (
                          <button key={i}
                            onClick={() => isOwner && toggleSlot(slotLevel, i)}
                            title={i < available ? 'Usar espacio' : 'Recuperar espacio'}
                            className={`w-5 h-5 border-2 rounded-full transition-colors ${
                              i < available
                                ? 'bg-amber-700 border-amber-600 hover:bg-amber-600'
                                : 'bg-transparent border-stone-500 hover:border-amber-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-stone-400 font-serif">{available}/{max}</span>
                    </div>
                  )
                })}
              </div>
              {isWarlock(character.class) && (
                <p className="text-xs text-stone-500 font-serif italic mt-2">Magia de pacto — se recupera con descanso corto</p>
              )}
            </div>
          </SheetRow>
        )}

        {/* Racial traits */}
        {raceDetail && raceDetail.traits.length > 0 && (
          <SheetRow className="border-t border-stone-600">
            <div className="flex-1 p-4">
              <SheetLabel>Rasgos raciales</SheetLabel>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {raceDetail.traits.map(t => (
                  <TraitBadge key={t.index} index={t.index} name={t.name} onInfo={data => setModal({ kind: 'trait', data })} />
                ))}
              </div>
            </div>
          </SheetRow>
        )}

        {/* Class features + subclass */}
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4">
            <SheetLabel>
              Habilidades de clase
              {subclassDetail && <span className="font-serif normal-case tracking-normal ml-1">· {subclassDetail.subclass_flavor}: {subclassDetail.name}</span>}
            </SheetLabel>
            <div className="mt-3">
              {classFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {classFeatures.map(f => (
                    <FeatureBadge key={f.index} index={f.index} name={f.name} onInfo={data => setModal({ kind: 'feature', data })} />
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-xs font-serif italic">Cargando habilidades...</p>
              )}
              {subclassFeatureList && subclassFeatureList.results.length > 0 && (
                <div className="mt-4 pt-3 border-t border-stone-400/40">
                  <p className="text-xs text-stone-500 font-serif italic mb-2">{subclassDetail?.subclass_flavor ?? 'Subclase'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subclassFeatureList.results.map(f => (
                      <FeatureBadge key={f.index} index={f.index} name={f.name} onInfo={data => setModal({ kind: 'feature', data })} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetRow>

        {/* Inventory */}
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4">
            <div className="flex items-center gap-3 mb-3">
              <SheetLabel>Inventario</SheetLabel>
              <div className="flex-1" />
              <span className="text-xs font-serif text-stone-500">{totalWeight.toFixed(1)} / {carryCapacity} lb</span>
            </div>
            <div className="h-2 border border-stone-400 overflow-hidden mb-4" style={{ background: 'rgba(200,170,110,0.2)' }}>
              <div className={`h-full transition-all ${weightColor}`} style={{ width: `${weightPct}%` }} />
            </div>

            {inventory.length > 0 && (
              <table className="w-full text-sm font-serif mb-3">
                <thead>
                  <tr className="border-b border-stone-400 text-xs text-stone-400 uppercase tracking-wider">
                    <th className="text-left py-1 font-normal">Objeto</th>
                    <th className="text-center py-1 font-normal w-12">Cant.</th>
                    <th className="text-center py-1 font-normal w-16">Peso</th>
                    <th className="text-center py-1 font-normal w-16">Total</th>
                    {isOwner && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id} className="border-b border-stone-200/80 hover:bg-amber-100/40 group">
                      <td className="py-1.5 text-stone-700">
                        {item.name}
                        {item.notes && <span className="ml-1 text-xs text-stone-400 italic">· {item.notes}</span>}
                      </td>
                      <td className="text-center text-stone-600">{item.quantity}</td>
                      <td className="text-center text-stone-500">{Number(item.weight_lbs)} lb</td>
                      <td className="text-center text-stone-600 font-medium">{(Number(item.weight_lbs) * item.quantity).toFixed(1)} lb</td>
                      {isOwner && (
                        <td className="text-center">
                          <button onClick={() => removeInventoryItem(item.id)} className="text-stone-300 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {isOwner && (
              addingItem ? (
                <div className="border border-stone-400 p-3 space-y-2" style={{ background: 'rgba(200,170,110,0.2)' }}>
                  <div className="relative">
                    <input
                      placeholder="Buscar en catálogo de equipo..."
                      value={equipSearch}
                      onChange={e => { setEquipSearch(e.target.value); setShowEquipDropdown(true) }}
                      onFocus={() => setShowEquipDropdown(true)}
                      className="w-full px-2 py-1 text-sm border border-stone-400 bg-amber-50/80 font-serif focus:outline-none focus:border-amber-700"
                    />
                    {showEquipDropdown && filteredEquipment.length > 0 && (
                      <div className="absolute z-20 w-full border border-stone-400 bg-amber-50 shadow-lg max-h-40 overflow-y-auto top-full">
                        {filteredEquipment.map(e => (
                          <button key={e.index} onClick={() => selectEquipmentItem(e.index)}
                            className="block w-full text-left px-3 py-1.5 text-xs font-serif text-stone-700 hover:bg-amber-200 transition-colors border-b border-stone-200 last:border-0">
                            {e.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Nombre" value={newItemName} onChange={e => setNewItemName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addInventoryItem()}
                      className="col-span-3 px-2 py-1 text-sm border border-stone-400 bg-amber-50/80 font-serif focus:outline-none focus:border-amber-700" />
                    <input placeholder="Peso (lb)" type="number" min="0" step="0.5" value={newItemWeight} onChange={e => setNewItemWeight(e.target.value)}
                      className="px-2 py-1 text-sm border border-stone-400 bg-amber-50/80 font-serif focus:outline-none focus:border-amber-700" />
                    <input placeholder="Cant." type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(e.target.value)}
                      className="px-2 py-1 text-sm border border-stone-400 bg-amber-50/80 font-serif focus:outline-none focus:border-amber-700" />
                    <input placeholder="Notas" value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)}
                      className="px-2 py-1 text-sm border border-stone-400 bg-amber-50/80 font-serif focus:outline-none focus:border-amber-700" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addInventoryItem} className="px-3 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-amber-300 font-serif transition-colors">Agregar</button>
                    <button onClick={() => { setAddingItem(false); setEquipSearch('') }} className="px-3 py-1 text-xs border border-stone-400 text-stone-500 hover:bg-stone-100/50 font-serif transition-colors">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingItem(true)} className="text-xs text-stone-400 hover:text-amber-800 transition-colors font-serif italic">
                  + Agregar objeto
                </button>
              )
            )}
          </div>
        </SheetRow>

        {/* Backstory */}
        {character.backstory && (
          <SheetRow className="border-t border-stone-600">
            <div className="flex-1 p-4">
              <SheetLabel>Historia</SheetLabel>
              <p className="text-stone-700 text-sm leading-relaxed font-serif mt-3 italic">{character.backstory}</p>
            </div>
          </SheetRow>
        )}

        {/* Delete */}
        {isOwner && !character.campaign_id && (
          <div className="border-t border-stone-600 px-4 py-3">
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-stone-500 flex-1 font-serif italic">¿Seguro? Esta acción no se puede deshacer.</p>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm border border-stone-400 text-stone-500 hover:bg-stone-100/50 font-serif">Cancelar</button>
                <button onClick={deleteCharacter} className="px-3 py-1.5 text-sm bg-red-900 hover:bg-red-800 text-red-100 font-serif">Eliminar</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-sm text-stone-400 hover:text-red-700 font-serif italic transition-colors">
                Eliminar personaje
              </button>
            )}
          </div>
        )}

      </main>

      {/* Modal */}
      {modal && <InfoModal modal={modal} onClose={() => setModal(null)} />}
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const parchmentStyle: React.CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 30%, #f2e6c8 0%, #e8d5a8 40%, #d4b87a 100%)',
}

const sheetStyle: React.CSSProperties = {
  background: 'rgba(244, 232, 190, 0.6)',
  border: '1px solid #78603a',
  boxShadow: `
    inset 0 0 80px rgba(90, 45, 5, 0.35),
    inset 0 0 30px rgba(70, 30, 0, 0.2),
    0 8px 32px rgba(0,0,0,0.35),
    0 2px 8px rgba(0,0,0,0.2)
  `,
}

// ── Small components ──────────────────────────────────────────────────────────

function SheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-px bg-stone-500/40" />
      <p className="text-xs tracking-widest text-stone-500 uppercase font-serif whitespace-nowrap">{children}</p>
      <div className="flex-1 h-px bg-stone-500/40" />
    </div>
  )
}

function SheetRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col sm:flex-row border-x border-stone-600 ${className}`}>{children}</div>
}

function StatBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-2 sm:px-4 py-1 sm:py-0">
      <p className="text-[10px] sm:text-xs text-stone-400 font-serif tracking-widest uppercase">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold text-amber-300 mt-0.5 ${mono ? 'font-mono' : 'font-serif'}`}>{value}</p>
    </div>
  )
}

function InfoModal({ modal, onClose }: { modal: InfoModal; onClose: () => void }) {
  let title = '', subtitle = '', body = ''
  if (modal.kind === 'spell') {
    const s = modal.data
    title = s.name; subtitle = `Nivel ${s.level} · ${s.school.name} · ${s.casting_time}`; body = s.desc[0] ?? ''
  } else if (modal.kind === 'trait') {
    title = modal.data.name; subtitle = 'Rasgo racial'; body = modal.data.desc.join('\n\n')
  } else if (modal.kind === 'feature') {
    const f = modal.data
    title = f.name
    subtitle = `Nivel ${f.level} · ${f.subclass ? f.subclass.name : f.class.name}`
    body = f.desc.join('\n\n')
  } else {
    const sk = modal.data; title = sk.name; subtitle = `Pericia · ${sk.ability_score.name}`; body = sk.desc.join('\n\n')
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="border-4 border-double border-stone-700 max-w-md w-full p-6 space-y-3" style={{ ...parchmentStyle, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-stone-400 pb-3">
          <div>
            <h3 className="font-bold text-stone-800 font-serif text-lg">{title}</h3>
            <p className="text-xs text-stone-500 font-serif italic mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-lg font-serif">✕</button>
        </div>
        {modal.kind === 'spell' && (
          <div className="grid grid-cols-2 gap-1 text-xs text-stone-500 font-serif">
            <span>Alcance: {modal.data.range}</span>
            <span>Duración: {modal.data.duration}</span>
            <span>Componentes: {modal.data.components.join(', ')}</span>
          </div>
        )}
        <p className="text-sm text-stone-700 leading-relaxed font-serif max-h-52 overflow-y-auto italic whitespace-pre-line">{body}</p>
      </div>
    </div>
  )
}

function SpellBadge({ index, onInfo }: { index: string; onInfo: (s: SpellDetail) => void }) {
  const { data: spell } = useQuery({ queryKey: dndKeys.spell(index), queryFn: () => dndApi.spell(index) })
  return (
    <div className="flex items-center gap-1 border border-stone-400 px-3 py-2" style={{ background: 'rgba(200,170,110,0.15)' }}>
      <span className="text-sm text-stone-700 flex-1 capitalize font-serif">{index.replace(/-/g, ' ')}</span>
      {spell && <button onClick={() => onInfo(spell)} className="text-stone-400 hover:text-amber-700 text-xs ml-1">ℹ</button>}
    </div>
  )
}

function TraitBadge({ index, name, onInfo }: { index: string; name: string; onInfo: (t: TraitDetail) => void }) {
  const { data: trait } = useQuery({ queryKey: dndKeys.trait(index), queryFn: () => dndApi.trait(index) })
  return (
    <div className="flex items-center gap-1 border border-stone-400 px-2 py-0.5" style={{ background: 'rgba(200,170,110,0.15)' }}>
      <span className="text-xs text-stone-600 font-serif">{name}</span>
      {trait && <button onClick={() => onInfo(trait)} className="text-stone-400 hover:text-amber-700 text-xs ml-0.5">ℹ</button>}
    </div>
  )
}

function FeatureBadge({ index, name, onInfo }: { index: string; name: string; onInfo: (f: FeatureDetail) => void }) {
  const { data: feature } = useQuery({
    queryKey: dndKeys.feature(index),
    queryFn: () => dndApi.feature(index),
    staleTime: Infinity,
  })
  return (
    <div className="flex items-center gap-1 border border-stone-400 px-2 py-0.5" style={{ background: 'rgba(200,170,110,0.15)' }}>
      <span className="text-xs text-stone-600 font-serif capitalize">{name.replace(/-/g, ' ')}</span>
      {feature && feature.desc.length > 0 && (
        <button onClick={() => onInfo(feature)} className="text-stone-400 hover:text-amber-700 text-xs ml-0.5">ℹ</button>
      )}
    </div>
  )
}

function SkillBadge({ index, onInfo }: { index: string; onInfo: (s: SkillDetail) => void }) {
  const skillIndex = index.replace('skill-', '')
  const { data: skill } = useQuery({ queryKey: dndKeys.skill(skillIndex), queryFn: () => dndApi.skill(skillIndex) })
  return (
    <div className="flex items-center gap-1 border border-amber-700/60 px-2 py-0.5 bg-amber-100/40">
      <span className="text-xs text-amber-800 font-serif capitalize">{skillIndex.replace(/-/g, ' ')}</span>
      {skill && <button onClick={() => onInfo(skill)} className="text-amber-500 hover:text-amber-900 text-xs ml-0.5">ℹ</button>}
    </div>
  )
}
