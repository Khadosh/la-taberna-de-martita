import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { dndApi } from '../../../lib/dnd-api'
import { type Currency, type CostUnit, UNIT_MAP, toCp, formatCost } from '../../../lib/currency'
import { type ServiceItem, DRINKS, FOODS, LODGINGS } from '../../../lib/tavern-services-data'

export type TabernaCategory = 'drinks' | 'foods' | 'lodging' | 'stables'

export type Character = {
  id: string
  name: string
  class: string
  race: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  user_id: string
  sheet_json: {
    max_hp?: number
    hit_die?: number
    currency?: Currency
    spell_slots_used?: Record<string, number>
    death_saves?: any
    hit_dice_used?: number
  }
}

const EMPTY_CURRENCY: Currency = { gold: 0, silver: 0, copper: 0 }

export function currencyOf(char: Pick<Character, 'sheet_json'>): Currency {
  return char.sheet_json.currency ?? EMPTY_CURRENCY
}

export function totalCp(currency: Currency): number {
  return toCp(currency.gold, 'gp') + toCp(currency.silver, 'sp') + toCp(currency.copper, 'cp')
}

/** Reconstruye el HP máximo cuando la ficha no lo tiene persistido (personajes viejos). */
export function maxHpFor(c: Character): number {
  const sheet = c.sheet_json
  if (sheet.max_hp != null) return sheet.max_hp
  const conMod = Math.floor(((c.stats?.con ?? 10) - 10) / 2)
  const hitDie = sheet.hit_die ?? 8
  const level = c.level ?? 1
  return hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
}

const SERVICES_BY_CATEGORY: Record<Exclude<TabernaCategory, 'stables'>, ServiceItem[]> = {
  drinks: DRINKS,
  foods: FOODS,
  lodging: LODGINGS,
}

export function useTaberna(campaignId: string, session: Session) {
  const queryClient = useQueryClient()

  const [activeCategory, setActiveCategory] = useState<TabernaCategory>('drinks')
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedStablesItem, setSelectedStablesItem] = useState<{ index: string; name: string } | null>(null)
  const [consumeCharId, setConsumeCharId] = useState<string>('')

  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('campaigns').select('dm_id').eq('id', campaignId).single()
      return data
    },
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, class, race, level, stats, current_hp, user_id, sheet_json, campaign_id')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
  })

  const stablesQuery = useQuery({
    queryKey: ['stables-categories'],
    queryFn: async () => {
      const results = await Promise.all([
        dndApi.equipmentCategory('mounts-and-other-animals'),
        dndApi.equipmentCategory('tack-harness-and-drawn-vehicles'),
      ])
      const merged = results.flatMap(r => r.equipment)
      return Array.from(new Map(merged.map(item => [item.index, item])).values())
    },
    enabled: activeCategory === 'stables',
  })

  const { data: stablesItemDetail, isLoading: loadingStablesDetail } = useQuery({
    queryKey: ['dnd', 'equipment', selectedStablesItem?.index],
    queryFn: () => dndApi.equipmentDetail(selectedStablesItem!.index),
    enabled: activeCategory === 'stables' && !!selectedStablesItem,
  })

  const isGm = campaign?.dm_id === session.user.id
  const ownChar = characters.find(c => c.user_id === session.user.id)
  const buyableChars = isGm ? characters : (ownChar ? [ownChar] : [])

  const currentServices = useMemo(
    () => activeCategory === 'stables' ? [] : SERVICES_BY_CATEGORY[activeCategory],
    [activeCategory],
  )

  const logToJournal = (title: string, body: string) =>
    supabase.from('session_notes').insert({
      campaign_id: campaignId,
      author_id: session.user.id,
      title,
      body,
      is_private: false,
    })

  const selectService = (serv: ServiceItem) => {
    setSelectedService(serv)
    setSelectedStablesItem(null)
    setConsumeCharId(buyableChars[0]?.id ?? '')
    setError(null)
    setSuccessMsg(null)
  }

  const selectStablesItem = (item: { index: string; name: string }) => {
    setSelectedStablesItem(item)
    setSelectedService(null)
    setConsumeCharId(buyableChars[0]?.id ?? '')
    setError(null)
    setSuccessMsg(null)
  }

  const switchCategory = (cat: TabernaCategory) => {
    setActiveCategory(cat)
    setSelectedService(null)
    setSelectedStablesItem(null)
    setError(null)
  }

  const clearSelection = () => {
    setSelectedService(null)
    setSelectedStablesItem(null)
    setError(null)
  }

  const handleOrder = async () => {
    if (!selectedService || !consumeCharId) return
    const char = characters.find(c => c.id === consumeCharId)
    if (!char) return

    const currency = currencyOf(char)
    if (totalCp(currency) < toCp(selectedService.cost, selectedService.unit)) {
      setError(`${char.name} no tiene suficientes fondos (necesita ${formatCost(selectedService.cost, selectedService.unit)}).`)
      return
    }

    setLoading(true)
    setError(null)

    const currencyKey = UNIT_MAP[selectedService.unit]
    const maxHp = maxHpFor(char)
    const currentHp = char.current_hp ?? maxHp
    const effect = selectedService.applyEffect(char)

    let finalHp = effect.hpGain ? Math.min(maxHp, currentHp + effect.hpGain) : currentHp

    const nextSheetJson = {
      ...char.sheet_json,
      currency: { ...currency, [currencyKey]: (currency[currencyKey] ?? 0) - selectedService.cost },
    }

    if (effect.triggerLongRest) {
      finalHp = maxHp
      nextSheetJson.spell_slots_used = {}
      nextSheetJson.death_saves = undefined
      nextSheetJson.hit_dice_used = 0
    }

    const { error: dbErr } = await supabase
      .from('characters')
      .update({ current_hp: finalHp, sheet_json: nextSheetJson as any })
      .eq('id', consumeCharId)

    if (dbErr) { setError('Error al actualizar la ficha del personaje.'); setLoading(false); return }

    await logToJournal('🍺 Consumo en Taberna', effect.logMsg)

    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['character', consumeCharId] })

    setSuccessMsg(effect.logMsg)
    setSelectedService(null)
    setLoading(false)
  }

  const handleStablesBuy = async () => {
    if (!stablesItemDetail || !consumeCharId) return
    const char = characters.find(c => c.id === consumeCharId)
    if (!char) return

    const cost = stablesItemDetail.cost
    if (!cost || cost.quantity === 0) return

    const unit = cost.unit as CostUnit
    const currencyKey = UNIT_MAP[unit] ?? 'gold'
    const currency = currencyOf(char)

    if (totalCp(currency) < toCp(cost.quantity, unit)) {
      setError(`${char.name} no tiene suficiente dinero (necesita ${formatCost(cost.quantity, unit)}).`)
      return
    }

    setLoading(true)
    setError(null)

    const newCurrency = { ...currency, [currencyKey]: (currency[currencyKey] ?? 0) - cost.quantity }
    const { error: sheetErr } = await supabase
      .from('characters')
      .update({ sheet_json: { ...(char.sheet_json as object), currency: newCurrency } as never })
      .eq('id', consumeCharId)

    if (sheetErr) { setError('Error al descontar el dinero.'); setLoading(false); return }

    const { error: invErr } = await supabase.from('character_inventory').insert({
      character_id: consumeCharId,
      name: stablesItemDetail.name,
      quantity: 1,
      weight_lbs: stablesItemDetail.weight ?? 0,
      notes: stablesItemDetail.desc?.[0] ?? 'Comprado en los Establos de la Taberna.',
    })

    if (invErr) { setError('Error al agregar al inventario.'); setLoading(false); return }

    const logMsg = `🐴 ${char.name} compró ${stablesItemDetail.name} por ${formatCost(cost.quantity, unit)} en los establos.`
    await logToJournal('🐴 Compra en Establo', logMsg)

    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['inventory', consumeCharId] })
    queryClient.invalidateQueries({ queryKey: ['campaign-inventory', campaignId] })

    setSuccessMsg(logMsg)
    setSelectedStablesItem(null)
    setLoading(false)
  }

  /** Costo activo, unificando servicio de taberna y montura del establo. */
  const activeCost = (): { qty: number; unit: CostUnit } => {
    if (activeCategory === 'stables' && stablesItemDetail?.cost) {
      return { qty: stablesItemDetail.cost.quantity, unit: stablesItemDetail.cost.unit as CostUnit }
    }
    if (selectedService) return { qty: selectedService.cost, unit: selectedService.unit }
    return { qty: 0, unit: 'gp' }
  }

  return {
    activeCategory, switchCategory,
    currentServices, selectedService, selectService,
    stablesItems: stablesQuery.data ?? [], loadingStables: stablesQuery.isLoading,
    selectedStablesItem, selectStablesItem, stablesItemDetail, loadingStablesDetail,
    clearSelection,
    buyableChars, consumeCharId, setConsumeCharId,
    activeCost, handleOrder, handleStablesBuy,
    error, setError, successMsg, setSuccessMsg, loading,
  }
}
