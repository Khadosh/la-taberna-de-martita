import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { dndApi } from '../../../lib/dnd-api'
import { SHOPS, type ShopId } from '../../../lib/shops-data'
import { type CostUnit, type Currency, UNIT_MAP, toCp, formatCost } from '../../../lib/currency'

export type Character = {
  id: string
  name: string
  user_id: string
  sheet_json: { currency?: Currency }
}

export type InventoryRow = {
  id: string
  name: string
  quantity: number
  weight_lbs: number
  notes: string | null
  character_id: string
}

export type SellConfirm = {
  id: string
  name: string
  qty: number
  charId: string
  resaleQty: number
  resaleUnit: CostUnit
}

export type TabMode = 'comprar' | 'vender' | 'creaciones'

const EMPTY_CURRENCY: Currency = { gold: 0, silver: 0, copper: 0 }

export function totalCp(currency: Currency): number {
  return toCp(currency.gold, 'gp') + toCp(currency.silver, 'sp') + toCp(currency.copper, 'cp')
}

export function currencyOf(char: Pick<Character, 'sheet_json'>): Currency {
  return char.sheet_json.currency ?? EMPTY_CURRENCY
}

export function useComercio(campaignId: string, session: Session) {
  const queryClient = useQueryClient()

  const [activeShopId, setActiveShopId] = useState<ShopId>('armeria')
  const [tabMode, setTabMode] = useState<TabMode>('comprar')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ index: string; name: string } | null>(null)
  const [buyCharId, setBuyCharId] = useState<string>('')

  const [sellCharId, setSellCharId] = useState<string>('')
  const [sellConfirm, setSellConfirm] = useState<SellConfirm | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeShop = useMemo(() => SHOPS.find(s => s.id === activeShopId)!, [activeShopId])

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
        .select('id, name, user_id, sheet_json')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
  })

  const { data: allInventory = [] } = useQuery({
    queryKey: ['campaign-inventory', campaignId],
    queryFn: async () => {
      if (characters.length === 0) return []
      const { data, error } = await supabase
        .from('character_inventory')
        .select('*')
        .in('character_id', characters.map(c => c.id))
      if (error) throw error
      return data as InventoryRow[]
    },
    enabled: characters.length > 0,
  })

  const categoryQuery = useQuery({
    queryKey: ['shop-categories', activeShop.id],
    queryFn: async () => {
      const results = await Promise.all(
        activeShop.categories.map(cat => dndApi.equipmentCategory(cat))
      )
      const merged = results.flatMap(r => r.equipment)
      return Array.from(new Map(merged.map(item => [item.index, item])).values())
    },
  })

  const { data: itemDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['dnd', 'equipment', selected?.index],
    queryFn: () => dndApi.equipmentDetail(selected!.index),
    enabled: !!selected,
  })

  const isGm = campaign?.dm_id === session.user.id
  const ownChar = characters.find(c => c.user_id === session.user.id)
  const buyableChars = isGm ? characters : (ownChar ? [ownChar] : [])

  const items = useMemo(() => {
    let list = categoryQuery.data ?? []
    if (activeShop.filter) list = list.filter(i => activeShop.filter!(i.name))
    return list.filter(i => !search.trim() || i.name.toLowerCase().includes(search.toLowerCase()))
  }, [categoryQuery.data, activeShop, search])

  const invalidateTrade = (charId: string) => {
    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['inventory', charId] })
    queryClient.invalidateQueries({ queryKey: ['campaign-inventory', campaignId] })
  }

  const resetMessages = () => { setError(null); setSuccessMsg(null) }

  const selectItem = (item: { index: string; name: string }) => {
    setSelected(item)
    setBuyCharId(buyableChars[0]?.id ?? '')
    resetMessages()
  }

  const switchTab = (mode: TabMode) => {
    setTabMode(mode)
    resetMessages()
    setSelected(null)
  }

  const switchShop = (id: ShopId) => {
    setActiveShopId(id)
    setSearch('')
    setSelected(null)
    setError(null)
  }

  const handleBuy = async () => {
    if (!itemDetail || !buyCharId) return
    const char = characters.find(c => c.id === buyCharId)
    if (!char) return

    const cost = itemDetail.cost
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
      .eq('id', buyCharId)

    if (sheetErr) { setError('Error al descontar el dinero.'); setLoading(false); return }

    const { error: invErr } = await supabase.from('character_inventory').insert({
      character_id: buyCharId,
      name: itemDetail.name,
      quantity: 1,
      weight_lbs: itemDetail.weight ?? 0,
      notes: buildItemNotes(itemDetail),
    })

    if (invErr) { setError('Error al agregar al inventario.'); setLoading(false); return }

    invalidateTrade(buyCharId)
    setSuccessMsg(`¡${itemDetail.name} adquirido por ${char.name}! (−${formatCost(cost.quantity, unit)})`)
    setLoading(false)
    setSelected(null)
  }

  const handleSellConfirm = async () => {
    if (!sellConfirm) return
    const char = characters.find(c => c.id === sellConfirm.charId)
    if (!char) return

    setLoading(true)
    setError(null)

    if (sellConfirm.qty > 1) {
      await supabase.from('character_inventory').update({ quantity: sellConfirm.qty - 1 }).eq('id', sellConfirm.id)
    } else {
      await supabase.from('character_inventory').delete().eq('id', sellConfirm.id)
    }

    const currencyKey = UNIT_MAP[sellConfirm.resaleUnit]
    const currency = currencyOf(char)
    const newCurrency = { ...currency, [currencyKey]: (currency[currencyKey] ?? 0) + sellConfirm.resaleQty }

    await supabase
      .from('characters')
      .update({ sheet_json: { ...(char.sheet_json as object), currency: newCurrency } as never })
      .eq('id', sellConfirm.charId)

    invalidateTrade(sellConfirm.charId)
    setSuccessMsg(`Vendido: ${sellConfirm.name} por ${formatCost(sellConfirm.resaleQty, sellConfirm.resaleUnit)} para ${char.name}.`)
    setSellConfirm(null)
    setLoading(false)
  }

  return {
    // shop / catálogo
    activeShop, activeShopId, switchShop,
    items, isLoadingItems: categoryQuery.isLoading,
    search, setSearch,
    // selección y compra
    selected, setSelected, selectItem,
    itemDetail, loadingDetail,
    buyCharId, setBuyCharId, buyableChars, handleBuy,
    // venta
    sellCharId, setSellCharId,
    sellConfirm, setSellConfirm, handleSellConfirm,
    charInventory: allInventory.filter(i => i.character_id === sellCharId),
    // general
    characters, isGm, tabMode, switchTab,
    error, setError, successMsg, setSuccessMsg, loading,
  }
}

type EquipmentDetail = NonNullable<Awaited<ReturnType<typeof dndApi.equipmentDetail>>>

/**
 * Prefija la CA en las notas del ítem porque `toggleEquip` parsea ese texto
 * para recalcular la armadura al equipar. Sin el prefijo, la CA no se aplica.
 */
function buildItemNotes(detail: EquipmentDetail): string | null {
  const base = detail.desc?.[0] ?? null
  if (!detail.armor_class) return base

  const { base: acBase, dex_bonus, max_bonus } = detail.armor_class
  let armorNote: string
  if (detail.armor_category === 'Shield') {
    armorNote = `Escudo +${acBase}`
  } else {
    armorNote = `CA ${acBase}`
    if (dex_bonus) {
      armorNote += ' + DES'
      if (max_bonus != null) armorNote += ` (máx ${max_bonus})`
    }
  }
  return base ? `${armorNote} · ${base}` : armorNote
}
