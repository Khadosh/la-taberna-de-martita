import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi } from '../../../lib/dnd-api'
import { getItemIconUrl } from '../../../lib/item-icons'
import { SHOPS, type ShopId } from '../../../lib/shops-data'
import { type CostUnit, type Currency, UNIT_MAP, UNIT_LABEL, toCp, formatCost, getResaleValue } from '../../../lib/currency'
import { CustomItemsTab } from '../../../components/campaigns/custom-items-tab'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/comercio')({
  component: Comercio,
})

// ── Types ─────────────────────────────────────────────────────────────────────

type Character = {
  id: string
  name: string
  user_id: string
  sheet_json: { currency?: Currency }
}

type TabMode = 'comprar' | 'vender' | 'creaciones'

function Comercio() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()

  const [activeShopId, setActiveShopId] = useState<ShopId>('armeria')
  const [tabMode, setTabMode] = useState<TabMode>('comprar')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ index: string; name: string } | null>(null)
  const [buyCharId, setBuyCharId] = useState<string>('')

  // Resell tab state
  const [sellCharId, setSellCharId] = useState<string>('')
  const [sellConfirm, setSellConfirm] = useState<{ id: string; name: string; qty: number; charId: string; resaleQty: number; resaleUnit: CostUnit } | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeShop = useMemo(() => SHOPS.find(s => s.id === activeShopId)!, [activeShopId])

  // Queries
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
      return data as { id: string; name: string; quantity: number; weight_lbs: number; notes: string | null; character_id: string }[]
    },
    enabled: characters.length > 0,
  })

  // Fetch items for each category in active shop
  const categoryQueries = useQuery({
    queryKey: ['shop-categories', activeShop.id],
    queryFn: async () => {
      const results = await Promise.all(
        activeShop.categories.map(cat => dndApi.equipmentCategory(cat))
      )
      // Merge all items from all categories in the shop
      const merged = results.flatMap(r => r.equipment)
      // Filter duplicates by index
      const unique = Array.from(new Map(merged.map(item => [item.index, item])).values())
      return unique
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
    let list = categoryQueries.data ?? []
    if (activeShop.filter) {
      list = list.filter(i => activeShop.filter!(i.name))
    }
    return list.filter(i =>
      !search.trim() || i.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [categoryQueries.data, activeShop, search])

  const handleSelect = (item: { index: string; name: string }) => {
    setSelected(item)
    setBuyCharId(buyableChars[0]?.id ?? '')
    setError(null)
    setSuccessMsg(null)
  }

  // ── BUY ACTION ─────────────────────────────────────────────────────────────

  const handleBuy = async () => {
    if (!itemDetail || !buyCharId) return
    const char = characters.find(c => c.id === buyCharId)
    if (!char) return

    const cost = itemDetail.cost
    if (!cost || cost.quantity === 0) return

    const unit = cost.unit as CostUnit
    const currencyKey = UNIT_MAP[unit] ?? 'gold'
    const currency = char.sheet_json.currency ?? { gold: 0, silver: 0, copper: 0 }
    const charTotalCp = toCp(currency.gold, 'gp') + toCp(currency.silver, 'sp') + toCp(currency.copper, 'cp')
    const costCp = toCp(cost.quantity, unit)

    if (charTotalCp < costCp) {
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

    // Encode armor/shield CA into notes prefix so toggleEquip can auto-calculate AC
    let itemNotes = itemDetail.desc?.[0] ?? null
    if (itemDetail.armor_class) {
      const { base, dex_bonus, max_bonus } = itemDetail.armor_class
      let armorNote: string
      if (itemDetail.armor_category === 'Shield') {
        armorNote = `Escudo +${base}`
      } else {
        armorNote = `CA ${base}`
        if (dex_bonus) {
          armorNote += ' + DES'
          if (max_bonus != null) armorNote += ` (máx ${max_bonus})`
        }
      }
      itemNotes = itemNotes ? `${armorNote} · ${itemNotes}` : armorNote
    }

    const { error: invErr } = await supabase.from('character_inventory').insert({
      character_id: buyCharId,
      name: itemDetail.name,
      quantity: 1,
      weight_lbs: itemDetail.weight ?? 0,
      notes: itemNotes,
    })

    if (invErr) { setError('Error al agregar al inventario.'); setLoading(false); return }

    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['inventory', buyCharId] })
    queryClient.invalidateQueries({ queryKey: ['campaign-inventory', campaignId] })

    setSuccessMsg(`¡${itemDetail.name} adquirido por ${char.name}! (−${formatCost(cost.quantity, unit)})`)
    setLoading(false)
    setSelected(null)
  }

  // ── RESELL ACTION ──────────────────────────────────────────────────────────

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
    const currency = char.sheet_json.currency ?? { gold: 0, silver: 0, copper: 0 }
    const newCurrency = { ...currency, [currencyKey]: (currency[currencyKey] ?? 0) + sellConfirm.resaleQty }

    await supabase
      .from('characters')
      .update({ sheet_json: { ...(char.sheet_json as object), currency: newCurrency } as never })
      .eq('id', sellConfirm.charId)

    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['inventory', sellConfirm.charId] })
    queryClient.invalidateQueries({ queryKey: ['campaign-inventory', campaignId] })

    setSuccessMsg(`Vendido: ${sellConfirm.name} por ${formatCost(sellConfirm.resaleQty, sellConfirm.resaleUnit)} para ${char.name}.`)
    setSellConfirm(null)
    setLoading(false)
  }

  const selectedCharInventory = allInventory.filter(i => i.character_id === sellCharId)

  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-10 my-4 relative">
        <span className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-2 border-l-2 border-stone-900" />
        <span className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-2 border-r-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-2 border-l-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-2 border-r-2 border-stone-900" />
      
      {/* Commerce Header banner */}
      <div className="relative h-44 sm:h-52 w-full mb-8 overflow-hidden rounded-lg border border-stone-800 shadow-2xl bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-950/30 via-stone-950 to-stone-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,90,40,0.04)_1px,_transparent_1px)_0_0_/_16px_16px]" />
        <div className="absolute bottom-6 left-6 z-10 space-y-1">
          <span className="text-[10px] tracking-widest text-amber-500 font-serif uppercase font-bold">Mercado de la Campaña</span>
          <h2 className="text-3xl font-display tracking-widest text-stone-100 uppercase">Comercio General</h2>
          <p className="text-xs font-serif italic text-stone-400">
            Adquiere pertrechos de aventura o vende botín a los gremios locales.
          </p>
        </div>
        <span className="absolute right-8 bottom-4 text-7xl opacity-10 pointer-events-none">⚖️</span>
      </div>

      {successMsg && (
        <div className="mb-6 px-4 py-3 border border-green-800 bg-green-900/10 text-green-800 text-sm font-serif rounded flex items-center justify-between gap-3 shadow-md">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-lg leading-none text-green-850 hover:text-green-600 transition-colors">&times;</button>
        </div>
      )}

      {/* Main Trade Mode Selectors */}
      <div className="flex gap-4 mb-6 border-b border-stone-400/40">
        <button
          onClick={() => { setTabMode('comprar'); setError(null); setSuccessMsg(null); setSelected(null) }}
          className={`px-4 py-2 text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px] ${
            tabMode === 'comprar'
              ? 'border-parchment-sienna text-parchment-sienna font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          🛒 Adquirir Equipo
        </button>
        <button
          onClick={() => { setTabMode('vender'); setError(null); setSuccessMsg(null); setSelected(null) }}
          className={`px-4 py-2 text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px] ${
            tabMode === 'vender'
              ? 'border-parchment-sienna text-parchment-sienna font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          💰 Vender Botín
        </button>
        {isGm && (
          <button
            onClick={() => { setTabMode('creaciones'); setError(null); setSuccessMsg(null); setSelected(null) }}
            className={`px-4 py-2 text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px] ${
              tabMode === 'creaciones'
                ? 'border-parchment-sienna text-parchment-sienna font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            ✦ Creaciones
          </button>
        )}
      </div>

      {/* ── BUY TAB MODE ──────────────────────────────────────────────────── */}
      {tabMode === 'comprar' && (
        <div className="space-y-6">
          
          {/* Specialty shops selector */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {SHOPS.map(shop => {
              const isSelected = activeShopId === shop.id
              return (
                <button
                  key={shop.id}
                  onClick={() => { setActiveShopId(shop.id); setSearch(''); setSelected(null); setError(null) }}
                  className={`flex flex-col items-center justify-center p-3 text-center border rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-900 border-amber-800 text-amber-100 font-semibold shadow-inner'
                      : 'bg-amber-50/20 border-stone-300 text-stone-600 hover:bg-amber-100/30 hover:text-stone-900'
                  }`}
                >
                  <span className="text-xl mb-1.5">{shop.icon}</span>
                  <span className="text-xs font-serif font-semibold">{shop.label}</span>
                </button>
              )
            })}
          </div>

          {/* Shop ambiance flavor text */}
          <div className="bg-amber-100/40 border border-stone-300 p-4 rounded text-xs font-serif italic text-stone-700">
            {activeShop.flavor}
          </div>

          {/* Catalog listing + search */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setSelected(null) }}
                placeholder={`Buscar en ${activeShop.label}...`}
                className="flex-1 px-3 py-2 text-xs font-serif bg-amber-50/40 border border-stone-300 text-stone-900 placeholder:text-stone-500 rounded focus:outline-none focus:border-parchment-sienna/60 focus:bg-white"
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Items grid */}
              <div className="flex-1 min-w-0">
                {categoryQueries.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 bg-amber-100/30 border border-stone-300/40 animate-pulse rounded" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-sm font-serif italic text-stone-500 py-10 text-center border border-dashed border-stone-300 rounded">
                    Ningún objeto disponible en esta categoría.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
                    {items.map(item => {
                      const iconUrl = getItemIconUrl(item.name)
                      const isSelected = selected?.index === item.index
                      return (
                        <button
                          key={item.index}
                          onClick={() => handleSelect(item)}
                          className={`text-left flex items-center gap-3 px-3 py-2 text-xs font-serif border rounded transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-900 border-amber-800 text-amber-100 font-semibold shadow-sm'
                              : 'bg-amber-50/20 border-stone-300/60 text-stone-700 hover:bg-amber-100/40 hover:border-stone-500'
                          }`}
                        >
                          <div className={`w-8 h-8 shrink-0 overflow-hidden rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-amber-950 border-amber-800 text-amber-100' : 'bg-amber-100/60 border-stone-300 text-stone-900'
                          }`}>
                            {iconUrl ? (
                              <img src={iconUrl} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                            ) : (
                              <span className="text-sm opacity-45">📦</span>
                            )}
                          </div>
                          <span className="truncate flex-1 font-semibold">{item.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Buying details sidebar */}
              {selected && (
                <div className="w-full lg:w-80 shrink-0">
                  <div className="relative bg-amber-50 border border-parchment-sienna/40 p-5 rounded-lg space-y-4 shadow-lg border-2">
                    <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 text-lg leading-none">✕</button>

                    {loadingDetail ? (
                      <div className="space-y-3">
                        <div className="h-4 w-3/4 bg-amber-100/50 animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-amber-100/50 animate-pulse rounded" />
                        <div className="h-10 w-full bg-amber-100/50 animate-pulse rounded" />
                      </div>
                    ) : itemDetail ? (
                      <>
                        <div className="flex items-start gap-3">
                          {(() => {
                            const u = getItemIconUrl(itemDetail.name)
                            return u ? (
                              <img src={u} alt="" className="w-12 h-12 object-cover rounded border border-stone-300 bg-amber-100/60 shrink-0" />
                            ) : null
                          })()}
                          <div className="min-w-0">
                            <h3 className="font-display text-sm font-bold text-stone-900 leading-tight pr-5">{itemDetail.name}</h3>
                            <p className="text-[10px] font-serif italic text-stone-500 mt-0.5 capitalize">{itemDetail.equipment_category.name}</p>
                          </div>
                        </div>

                        <div className="flex gap-4 text-xs font-mono text-parchment-chocolate bg-amber-900/10 px-3 py-1.5 border border-amber-800/20 rounded">
                          {itemDetail.cost?.quantity > 0 ? (
                            <span className="text-parchment-sienna font-bold">{formatCost(itemDetail.cost.quantity, itemDetail.cost.unit)}</span>
                          ) : (
                            <span className="text-stone-500 italic">Sin valor</span>
                          )}
                          {itemDetail.weight > 0 && <span>{itemDetail.weight} lb</span>}
                          {itemDetail.armor_class && (
                            <span className="text-stone-700 font-semibold">CA {itemDetail.armor_class.base}{itemDetail.armor_class.dex_bonus ? '+Des' : ''}</span>
                          )}
                        </div>

                        {itemDetail.desc && itemDetail.desc.length > 0 && (
                          <p className="text-[11px] font-serif text-stone-600 leading-relaxed max-h-24 overflow-y-auto pr-1">
                            {itemDetail.desc[0]}
                          </p>
                        )}

                        {buyableChars.length > 0 && itemDetail.cost?.quantity > 0 && (
                          <div className="pt-3 border-t border-stone-300/40 space-y-3">
                            <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block">Comprar para:</span>
                            <div className="space-y-1.5">
                              {buyableChars.map(c => {
                                const cur = (c.sheet_json as Character['sheet_json']).currency ?? { gold: 0, silver: 0, copper: 0 }
                                const charCp = toCp(cur.gold, 'gp') + toCp(cur.silver, 'sp') + toCp(cur.copper, 'cp')
                                const costCp = toCp(itemDetail.cost.quantity, itemDetail.cost.unit as CostUnit)
                                const canAfford = charCp >= costCp
                                const isSelected = buyCharId === c.id
                                return (
                                  <label key={c.id} className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-all text-xs font-serif ${
                                    isSelected ? 'border-amber-800 bg-amber-900 text-amber-100' : 'border-stone-300 bg-amber-50/20 hover:bg-amber-100/30 text-stone-700'
                                  } ${!canAfford ? 'opacity-40' : ''}`}>
                                    <input
                                      type="radio" name="buy-char" value={c.id}
                                      checked={isSelected}
                                      onChange={() => { setBuyCharId(c.id); setError(null) }}
                                      className="accent-amber-700"
                                      disabled={!canAfford}
                                    />
                                    <span className={`flex-1 truncate ${isSelected ? 'text-amber-100' : 'text-stone-900'}`}>{c.name}</span>
                                    <span className={`font-mono text-[10px] ${isSelected ? 'text-amber-300' : canAfford ? 'text-parchment-sienna' : 'text-red-700'}`}>
                                      {cur.gold} MO {cur.silver > 0 ? `${cur.silver} MP` : ''}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                            {error && <p className="text-xs font-serif text-red-750 bg-red-50 border border-red-200 px-2 py-1.5 rounded">{error}</p>}
                            <button
                              onClick={handleBuy}
                              disabled={loading || !buyCharId}
                              className="w-full py-2 font-serif text-xs border border-[#6B2C06] bg-gradient-to-b from-[#9B4A10] to-[#7B3408] text-[#f5d9a8] rounded-sm transition-colors uppercase tracking-wider font-semibold hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {loading ? 'Comprando…' : `Adquirir — ${formatCost(itemDetail.cost.quantity, itemDetail.cost.unit)}`}
                            </button>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* ── SELL TAB MODE ─────────────────────────────────────────────────── */}
      {tabMode === 'vender' && (
        <div className="space-y-6">
          <div className="bg-amber-100/40 border border-stone-300 p-4 rounded text-xs font-serif italic text-stone-700">
            Los mercaderes locales compran tu equipo usado al **50% de su valor comercial estándar**.
          </div>

          <div>
            <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block mb-2">Inventario del Personaje</span>
            <div className="flex flex-wrap gap-2">
              {characters.map(c => {
                const isSelected = sellCharId === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSellCharId(c.id); setSellConfirm(null) }}
                    className={`px-3 py-1.5 text-xs font-serif border rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-900 border-amber-800 text-amber-100 font-bold shadow-inner'
                        : 'bg-amber-50/20 border-stone-300 text-stone-600 hover:bg-amber-100/30 hover:text-stone-900'
                    }`}
                  >
                    {c.name}
                    <span className={`ml-2 font-mono text-[10px] ${isSelected ? 'text-amber-300' : 'text-parchment-sienna'}`}>{(c.sheet_json as Character['sheet_json']).currency?.gold ?? 0} MO</span>
                  </button>
                )
              })}
            </div>
          </div>

          {sellCharId && (
            selectedCharInventory.length === 0 ? (
              <p className="text-sm font-serif italic text-stone-500 py-12 text-center border border-dashed border-stone-300 rounded">
                El inventario está vacío. No hay objetos para revender.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedCharInventory.map(item => {
                  return (
                    <div key={item.id} className="bg-amber-50/20 border border-stone-300/60 p-4 rounded-lg flex flex-col justify-between space-y-3 hover:bg-amber-100/30 transition-all">
                      <div>
                        <h4 className="font-display text-sm font-bold text-stone-900 truncate">{item.name}</h4>
                        {item.notes && <p className="text-[10px] font-serif italic text-stone-500 line-clamp-1 mt-0.5">{item.notes}</p>}
                        <span className="text-xs font-mono text-stone-600 mt-1 block">Cantidad: ×{item.quantity}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-stone-300/40">
                        {sellConfirm?.id === item.id ? (
                          <div className="flex gap-2 items-center w-full justify-between">
                            <span className="text-[10px] font-mono text-amber-700">+{sellConfirm.resaleQty} {UNIT_LABEL[sellConfirm.resaleUnit]}</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => setSellConfirm(null)} className="text-xs text-stone-500 hover:text-stone-850 font-serif cursor-pointer">No</button>
                              <button
                                onClick={handleSellConfirm}
                                disabled={loading}
                                className="text-xs px-2.5 py-1 bg-red-900 hover:bg-red-800 text-red-100 font-serif rounded border border-red-800 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                Sí, vender
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="text-[10px] font-serif text-stone-650">Valor Reventa Estimado</span>
                            <button
                              onClick={() => {
                                let qty = 1
                                let unit: CostUnit = 'gp'
                                const name = item.name.toLowerCase()
                                if (name.includes('ration') || name.includes('torch') || name.includes('rope')) {
                                  qty = 5
                                  unit = 'sp'
                                } else if (name.includes('sword') || name.includes('armor') || name.includes('shield')) {
                                  qty = 5
                                  unit = 'gp'
                                } else {
                                  qty = 5
                                  unit = 'sp'
                                }
                                const res = getResaleValue(qty, unit)
                                setSellConfirm({
                                  id: item.id,
                                  name: item.name,
                                  qty: item.quantity,
                                  charId: sellCharId,
                                  resaleQty: res.quantity,
                                  resaleUnit: res.unit
                                })
                              }}
                              className="text-xs px-3 py-1 bg-stone-900 hover:bg-stone-850 text-amber-100 rounded border border-stone-800 font-serif transition-colors cursor-pointer"
                            >
                              Vender
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          )}

          {!sellCharId && (
            <p className="text-sm font-serif italic text-stone-500 py-12 text-center border border-dashed border-stone-300 rounded">
              Selecciona un personaje para examinar su inventario y comerciar.
            </p>
          )}
        </div>
      )}

      {/* ── CREACIONES TAB (GM only) ─────────────────────────────────────────── */}
      {tabMode === 'creaciones' && (
        <CustomItemsTab
          campaignId={campaignId}
          userId={session.user.id}
          isDm={isGm}
        />
      )}
    </div>
    </div>
  )
}
