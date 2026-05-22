import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi } from '../../../lib/dnd-api'
import { getItemIconUrl } from '../../../lib/item-icons'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/comercio')({
  component: Comercio,
})

// ── Specialty Shops ──────────────────────────────────────────────────────────

interface ShopDef {
  id: 'armeria' | 'provisiones' | 'alquimia' | 'establo' | 'artesanos'
  label: string
  icon: string
  flavor: string
  categories: readonly string[]
  filter?: (name: string) => boolean
}

const SHOPS: readonly ShopDef[] = [
  {
    id: 'armeria',
    label: 'Armería',
    icon: '⚔️',
    flavor: 'El martilleo de la forja resuena mientras observas hileras de espadas templadas, escudos de acero y cotas de malla relucientes.',
    categories: ['weapon', 'armor'],
  },
  {
    id: 'provisiones',
    label: 'Provisiones',
    icon: '🎒',
    flavor: 'Cuerdas de cáñamo, antorchas, raciones secas y todo el equipo esencial que un explorador necesita para adentrarse en las ruinas.',
    categories: ['adventuring-gear'],
    filter: (name: string) => !isMagicOrAlchemy(name),
  },
  {
    id: 'alquimia',
    label: 'Alquimia y Magia',
    icon: '🧪',
    flavor: 'Frascos con líquidos luminiscentes, ungüentos extraños y pergaminos cargados con leves rastros de energía arcana.',
    categories: ['adventuring-gear'],
    filter: (name: string) => isMagicOrAlchemy(name),
  },
  {
    id: 'establo',
    label: 'Establo y Transportes',
    icon: '🐴',
    flavor: 'El olor a heno fresco y el relinchar de corceles. Aquí puedes adquirir caballos, mulas, monturas y carruajes de viaje.',
    categories: ['mounts-and-other-animals', 'tack-harness-and-drawn-vehicles'],
  },
  {
    id: 'artesanos',
    label: 'Gremio de Artesanos',
    icon: '🛠️',
    flavor: 'Herramientas de precisión para toda clase de oficios, desde ganzúas de ladrón hasta instrumentos musicales de fina madera.',
    categories: ['tools'],
  },
]


type ShopId = typeof SHOPS[number]['id']

function isMagicOrAlchemy(name: string): boolean {
  const n = name.toLowerCase()
  return (
    n.includes('potion') ||
    n.includes('scroll') ||
    n.includes('oil') ||
    n.includes('vial') ||
    n.includes('acid') ||
    n.includes('poison') ||
    n.includes('antitoxin') ||
    n.includes('ink') ||
    n.includes('alchemist') ||
    n.includes('herbalism') ||
    n.includes('holy water') ||
    n.includes('perfume')
  )
}

// ── Currency Helpers ──────────────────────────────────────────────────────────

type CostUnit = 'gp' | 'sp' | 'cp'
type CurrencyKey = 'gold' | 'silver' | 'copper'
type Currency = { gold: number; silver: number; copper: number }

const UNIT_MAP: Record<CostUnit, CurrencyKey> = { gp: 'gold', sp: 'silver', cp: 'copper' }
const UNIT_LABEL: Record<CostUnit, string> = { gp: 'MO', sp: 'MP', cp: 'MC' }

function toCp(qty: number, unit: CostUnit) {
  if (unit === 'gp') return qty * 100
  if (unit === 'sp') return qty * 10
  return qty
}

function formatCost(qty: number, unit: string) {
  return `${qty} ${UNIT_LABEL[unit as CostUnit] ?? unit.toUpperCase()}`
}

function getResaleValue(costQty: number, costUnit: CostUnit): { quantity: number; unit: CostUnit } {
  const totalCp = toCp(costQty, costUnit)
  const resaleCp = Math.max(1, Math.floor(totalCp / 2))
  
  if (resaleCp >= 100 && resaleCp % 100 === 0) {
    return { quantity: resaleCp / 100, unit: 'gp' }
  }
  if (resaleCp >= 10 && resaleCp % 10 === 0) {
    return { quantity: resaleCp / 10, unit: 'sp' }
  }
  return { quantity: resaleCp, unit: 'cp' }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Character = {
  id: string
  name: string
  user_id: string
  sheet_json: { currency?: Currency }
}

type TabMode = 'comprar' | 'vender'

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

    const { error: invErr } = await supabase.from('character_inventory').insert({
      character_id: buyCharId,
      name: itemDetail.name,
      quantity: 1,
      weight_lbs: itemDetail.weight ?? 0,
      notes: itemDetail.desc?.[0] ?? null,
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
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      
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
        <div className="mb-6 px-4 py-3 border border-green-800 bg-green-950/60 text-green-300 text-sm font-serif rounded flex items-center justify-between gap-3 shadow-lg">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-lg leading-none text-green-600 hover:text-green-300 transition-colors">&times;</button>
        </div>
      )}

      {/* Main Trade Mode Selectors */}
      <div className="flex gap-4 mb-6 border-b border-stone-850">
        <button
          onClick={() => { setTabMode('comprar'); setError(null); setSuccessMsg(null); setSelected(null) }}
          className={`px-4 py-2 text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px] ${
            tabMode === 'comprar'
              ? 'border-amber-600 text-amber-400 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          🛒 Adquirir Equipo
        </button>
        <button
          onClick={() => { setTabMode('vender'); setError(null); setSuccessMsg(null); setSelected(null) }}
          className={`px-4 py-2 text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px] ${
            tabMode === 'vender'
              ? 'border-amber-600 text-amber-400 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-300'
          }`}
        >
          💰 Vender Botín
        </button>
      </div>

      {/* ── BUY TAB MODE ──────────────────────────────────────────────────── */}
      {tabMode === 'comprar' && (
        <div className="space-y-6">
          
          {/* Specialty shops selector */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {SHOPS.map(shop => (
              <button
                key={shop.id}
                onClick={() => { setActiveShopId(shop.id); setSearch(''); setSelected(null); setError(null) }}
                className={`flex flex-col items-center justify-center p-3 text-center border rounded transition-all ${
                  activeShopId === shop.id
                    ? 'bg-amber-950 border-amber-500 text-amber-250 font-semibold shadow-inner'
                    : 'bg-stone-950 border-stone-850 text-stone-450 hover:bg-stone-900 hover:text-stone-200'
                }`}
              >
                <span className="text-xl mb-1.5">{shop.icon}</span>
                <span className="text-xs font-serif font-semibold">{shop.label}</span>
              </button>
            ))}
          </div>

          {/* Shop ambiance flavor text */}
          <div className="bg-stone-950 border border-stone-850 p-4 rounded text-xs font-serif italic text-stone-300">
            {activeShop.flavor}
          </div>

          {/* Catalog listing + search */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setSelected(null) }}
                placeholder={`Buscar en ${activeShop.label}...`}
                className="flex-1 px-3 py-2 text-xs font-serif bg-stone-950 border border-stone-800 text-stone-200 placeholder:text-stone-600 rounded focus:outline-none focus:border-stone-600"
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Items grid */}
              <div className="flex-1 min-w-0">
                {categoryQueries.isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 bg-stone-950 border border-stone-850 animate-pulse rounded" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-sm font-serif italic text-stone-600 py-10 text-center border border-dashed border-stone-850 rounded">
                    Ningún objeto disponible en esta categoría.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
                    {items.map(item => {
                      const iconUrl = getItemIconUrl(item.name)
                      return (
                        <button
                          key={item.index}
                          onClick={() => handleSelect(item)}
                          className={`text-left flex items-center gap-3 px-3 py-2 text-xs font-serif border rounded transition-all ${
                            selected?.index === item.index
                              ? 'bg-amber-950 border-amber-500 text-amber-250 font-semibold'
                              : 'bg-stone-950 border-stone-850 text-stone-300 hover:bg-stone-900 hover:border-stone-700'
                          }`}
                        >
                          <div className="w-8 h-8 shrink-0 overflow-hidden rounded bg-stone-950 flex items-center justify-center border border-stone-800">
                            {iconUrl ? (
                              <img src={iconUrl} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                            ) : (
                              <span className="text-sm opacity-40">📦</span>
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
                  <div className="relative bg-stone-950 border border-stone-800 p-5 rounded-lg space-y-4 shadow-xl">
                    <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-stone-500 hover:text-stone-300 text-lg leading-none">✕</button>

                    {loadingDetail ? (
                      <div className="space-y-3">
                        <div className="h-4 w-3/4 bg-stone-800 animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-stone-800 animate-pulse rounded" />
                        <div className="h-10 w-full bg-stone-800 animate-pulse rounded" />
                      </div>
                    ) : itemDetail ? (
                      <>
                        <div className="flex items-start gap-3">
                          {(() => {
                            const u = getItemIconUrl(itemDetail.name)
                            return u ? (
                              <img src={u} alt="" className="w-12 h-12 object-cover rounded border border-stone-750 bg-stone-950 shrink-0" />
                            ) : null
                          })()}
                          <div className="min-w-0">
                            <h3 className="font-display text-sm font-bold text-stone-200 leading-tight pr-5">{itemDetail.name}</h3>
                            <p className="text-[10px] font-serif italic text-stone-500 mt-0.5 capitalize">{itemDetail.equipment_category.name}</p>
                          </div>
                        </div>

                        <div className="flex gap-4 text-xs font-mono text-stone-400 bg-stone-950 px-3 py-1.5 border border-stone-850 rounded">
                          {itemDetail.cost?.quantity > 0 ? (
                            <span className="text-amber-500 font-bold">{formatCost(itemDetail.cost.quantity, itemDetail.cost.unit)}</span>
                          ) : (
                            <span className="text-stone-600 italic">Sin valor</span>
                          )}
                          {itemDetail.weight > 0 && <span>{itemDetail.weight} lb</span>}
                          {itemDetail.armor_class && (
                            <span className="text-stone-300">CA {itemDetail.armor_class.base}{itemDetail.armor_class.dex_bonus ? '+Des' : ''}</span>
                          )}
                        </div>

                        {itemDetail.desc && itemDetail.desc.length > 0 && (
                          <p className="text-[11px] font-serif text-stone-400 leading-relaxed max-h-24 overflow-y-auto pr-1">
                            {itemDetail.desc[0]}
                          </p>
                        )}

                        {buyableChars.length > 0 && itemDetail.cost?.quantity > 0 && (
                          <div className="pt-3 border-t border-stone-800 space-y-3">
                            <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block">Comprar para:</span>
                            <div className="space-y-1.5">
                              {buyableChars.map(c => {
                                const cur = (c.sheet_json as Character['sheet_json']).currency ?? { gold: 0, silver: 0, copper: 0 }
                                const charCp = toCp(cur.gold, 'gp') + toCp(cur.silver, 'sp') + toCp(cur.copper, 'cp')
                                const costCp = toCp(itemDetail.cost.quantity, itemDetail.cost.unit as CostUnit)
                                const canAfford = charCp >= costCp
                                return (
                                  <label key={c.id} className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-all text-xs font-serif ${
                                    buyCharId === c.id ? 'border-amber-600 bg-amber-950/15' : 'border-stone-800 bg-stone-900/60 hover:bg-stone-800/40'
                                  } ${!canAfford ? 'opacity-40' : ''}`}>
                                    <input
                                      type="radio" name="buy-char" value={c.id}
                                      checked={buyCharId === c.id}
                                      onChange={() => { setBuyCharId(c.id); setError(null) }}
                                      className="accent-amber-500"
                                      disabled={!canAfford}
                                    />
                                    <span className="flex-1 text-stone-200 truncate">{c.name}</span>
                                    <span className={`font-mono text-[10px] ${canAfford ? 'text-amber-500' : 'text-red-500'}`}>
                                      {cur.gold} MO {cur.silver > 0 ? `${cur.silver} MP` : ''}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                            {error && <p className="text-xs font-serif text-red-400 bg-red-950/40 border border-red-900/30 px-2 py-1.5 rounded">{error}</p>}
                            <button
                              onClick={handleBuy}
                              disabled={loading || !buyCharId}
                              className="w-full py-2 text-xs font-serif bg-amber-900 hover:bg-amber-850 text-amber-100 rounded border border-amber-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold uppercase tracking-wider"
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
          <div className="bg-stone-950 border border-stone-850 p-4 rounded text-xs font-serif italic text-stone-300">
            Los mercaderes locales compran tu equipo usado al **50% de su valor comercial estándar**.
          </div>

          <div>
            <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block mb-2">Inventario del Personaje</span>
            <div className="flex flex-wrap gap-2">
              {characters.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSellCharId(c.id); setSellConfirm(null) }}
                  className={`px-3 py-1.5 text-xs font-serif border rounded transition-all ${
                    sellCharId === c.id
                      ? 'bg-amber-950 border-amber-500 text-amber-250 font-bold shadow-inner'
                      : 'bg-stone-950 border-stone-850 text-stone-450 hover:bg-stone-900 hover:text-stone-200'
                  }`}
                >
                  {c.name}
                  <span className="ml-2 font-mono text-[10px] text-amber-500">{(c.sheet_json as Character['sheet_json']).currency?.gold ?? 0} MO</span>
                </button>
              ))}
            </div>
          </div>

          {sellCharId && (
            selectedCharInventory.length === 0 ? (
              <p className="text-sm font-serif italic text-stone-600 py-12 text-center border border-dashed border-stone-850 rounded">
                El inventario está vacío. No hay objetos para revender.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedCharInventory.map(item => {
                  return (
                    <div key={item.id} className="bg-stone-950 border border-stone-850 p-4 rounded-lg flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-display text-sm font-bold text-stone-200 truncate">{item.name}</h4>
                        {item.notes && <p className="text-[10px] font-serif italic text-stone-500 line-clamp-1 mt-0.5">{item.notes}</p>}
                        <span className="text-xs font-mono text-stone-500 mt-1 block">Cantidad: ×{item.quantity}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                        {sellConfirm?.id === item.id ? (
                          <div className="flex gap-2 items-center w-full justify-between">
                            <span className="text-[10px] font-mono text-amber-500">+{sellConfirm.resaleQty} {UNIT_LABEL[sellConfirm.resaleUnit]}</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => setSellConfirm(null)} className="text-xs text-stone-500 hover:text-stone-300 font-serif">No</button>
                              <button
                                onClick={handleSellConfirm}
                                disabled={loading}
                                className="text-xs px-2.5 py-1 bg-stone-950 hover:bg-stone-850 text-red-400 font-serif rounded border border-red-950 transition-colors disabled:opacity-50"
                              >
                                Sí, vender
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="text-[10px] font-serif text-stone-500">Valor Reventa Estimado</span>
                            <button
                              onClick={() => {
                                // Default cost parsing (if it has gp/sp/cp or typical price)
                                // Standard resale for items: e.g. Shield (10gp) resells for 5gp. Rations (5sp) resells for 2sp 5cp (or similar)
                                // Let's guess standard pricing categories. We default to 5 sp (0.5 gp) for unknown items
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
                              className="text-xs px-3 py-1 bg-stone-950 hover:bg-stone-850 text-amber-300 rounded border border-stone-800 font-serif transition-colors"
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
            <p className="text-sm font-serif italic text-stone-600 py-12 text-center border border-dashed border-stone-850 rounded">
              Selecciona un personaje para examinar su inventario y comerciar.
            </p>
          )}
        </div>
      )}

    </main>
  )
}
