import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys } from '../../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/taberna')({
  component: Taberna,
})

// ── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'weapon',           label: 'Armas',       icon: '⚔️' },
  { id: 'armor',            label: 'Armaduras',   icon: '🛡️' },
  { id: 'adventuring-gear', label: 'Equipo',      icon: '🎒' },
  { id: 'tools',            label: 'Herramientas',icon: '🔧' },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Types ─────────────────────────────────────────────────────────────────────

type Character = {
  id: string
  name: string
  user_id: string
  sheet_json: { currency?: Currency }
}

// ── Component ─────────────────────────────────────────────────────────────────

type TabernaTab = 'comprar' | 'vender'

function Taberna() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()

  const [mainTab, setMainTab] = useState<TabernaTab>('comprar')
  const [activeCategory, setActiveCategory] = useState<CategoryId>('weapon')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ index: string; name: string } | null>(null)
  const [buyCharId, setBuyCharId] = useState<string>('')

  // Sell tab
  const [sellCharId, setSellCharId] = useState<string>('')
  const [sellConfirm, setSellConfirm] = useState<{ id: string; name: string; qty: number; charId: string } | null>(null)

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

  const { data: categoryData, isLoading: loadingList } = useQuery({
    queryKey: dndKeys.equipmentCategory(activeCategory),
    queryFn: () => dndApi.equipmentCategory(activeCategory),
  })

  const { data: itemDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['dnd', 'equipment', selected?.index],
    queryFn: () => dndApi.equipmentDetail(selected!.index),
    enabled: !!selected,
  })

  const isGm = campaign?.dm_id === session.user.id
  const ownChar = characters.find(c => c.user_id === session.user.id)
  const buyableChars = isGm ? characters : (ownChar ? [ownChar] : [])

  const items = (categoryData?.equipment ?? []).filter(i =>
    !search.trim() || i.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (item: { index: string; name: string }) => {
    setSelected(item)
    setBuyCharId(buyableChars[0]?.id ?? '')
    setError(null)
    setSuccessMsg(null)
  }

  // ── Buy ───────────────────────────────────────────────────────────────────

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

    setSuccessMsg(`${itemDetail.name} comprado para ${char.name} (−${formatCost(cost.quantity, unit)}).`)
    setLoading(false)
    setSelected(null)
  }

  // ── Sell ──────────────────────────────────────────────────────────────────

  const handleSellConfirm = async () => {
    if (!sellConfirm) return
    const char = characters.find(c => c.id === sellConfirm.charId)
    if (!char) return

    setLoading(true)
    const sellGp = 1

    if (sellConfirm.qty > 1) {
      await supabase.from('character_inventory').update({ quantity: sellConfirm.qty - 1 }).eq('id', sellConfirm.id)
    } else {
      await supabase.from('character_inventory').delete().eq('id', sellConfirm.id)
    }

    const currency = char.sheet_json.currency ?? { gold: 0, silver: 0, copper: 0 }
    await supabase
      .from('characters')
      .update({ sheet_json: { ...(char.sheet_json as object), currency: { ...currency, gold: currency.gold + sellGp } } as never })
      .eq('id', sellConfirm.charId)

    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['inventory', sellConfirm.charId] })
    queryClient.invalidateQueries({ queryKey: ['campaign-inventory', campaignId] })

    setSuccessMsg(`${char.name} vendió ${sellConfirm.name} por ${sellGp} MO.`)
    setSellConfirm(null)
    setLoading(false)
  }

  const selectedCharInventory = allInventory.filter(i => i.character_id === sellCharId)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">

      {/* Ambient Header Image */}
      <div className="relative h-64 sm:h-80 w-full mb-8 overflow-hidden rounded-sm border border-stone-400/30 shadow-lg">
        <img 
          src="/assets/images/tavern_bg.png" 
          alt="Ambiente de la Taberna" 
          className="w-full h-full object-cover opacity-90 sepia-[0.2]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-100 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-4 left-6">
          <h2 className="text-3xl font-display tracking-widest text-stone-900 drop-shadow-sm uppercase">La Taberna de Martita</h2>
          <p className="text-sm font-serif italic text-stone-800 bg-stone-100/40 backdrop-blur-sm px-2 inline-block rounded-sm">
            Hogar de aventureros, rumores y comercio de contrabando.
          </p>
        </div>
      </div>

      <div className="mb-8 border-b border-stone-400/20 pb-4">
        <p className="text-sm font-serif italic text-stone-600 max-w-2xl">
          {isGm
            ? 'Gestioná la economía del party: comprá equipo o aceptá lo que quieran vender. El ambiente es cálido y el fuego crepita en el hogar.'
            : 'Comprá equipo para tu personaje o vendé lo que no necesités. El tabernero te observa con curiosidad mientras limpias tu espada.'}
        </p>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-2.5 border border-green-800/40 bg-green-100/60 text-green-900 text-sm font-serif flex items-center justify-between gap-3">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-lg leading-none text-green-900/60 hover:text-green-900">&times;</button>
        </div>
      )}

      {/* Main tabs */}
      <div className="flex gap-0 mb-6 border-b-2 border-stone-800">
        {(['comprar', 'vender'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setMainTab(tab); setError(null); setSuccessMsg(null); setSelected(null) }}
            className={`px-6 py-2 text-sm font-display tracking-wide uppercase transition-colors border-b-2 -mb-[2px] ${
              mainTab === tab
                ? 'border-amber-700 text-stone-900 bg-amber-50/40'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-amber-50/20'
            }`}
          >
            {tab === 'comprar' ? '🛒 Comprar' : '💰 Vender'}
          </button>
        ))}
      </div>

      {/* ── BUY TAB ────────────────────────────────────────────────────────── */}
      {mainTab === 'comprar' && (
        <div>
          {/* Category + search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setSearch(''); setSelected(null) }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif border transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-amber-900/20 border-stone-600 text-stone-900'
                      : 'border-stone-400/40 text-stone-600 hover:bg-amber-50/60 hover:text-stone-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
              placeholder="Buscar…"
              className="flex-1 px-3 py-1.5 text-xs font-serif bg-amber-50/60 border border-stone-400/40 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-600"
            />
          </div>

          <div className="flex gap-6">
            {/* Item list */}
            <div className="flex-1 min-w-0">
              {loadingList ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-9 bg-stone-300/30 animate-pulse" />)}
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm font-serif italic text-stone-500 py-8 text-center">Sin resultados.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[60vh] overflow-y-auto pr-1">
                  {items.map(item => (
                    <button
                      key={item.index}
                      onClick={() => handleSelect(item)}
                      className={`text-left px-3 py-2 text-sm font-serif border transition-colors ${
                        selected?.index === item.index
                          ? 'bg-amber-900/20 border-amber-700 text-stone-900'
                          : 'border-stone-400/30 hover:bg-amber-50/60 hover:border-stone-500/50 text-stone-800'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail + buy panel */}
            {selected && (
              <div className="w-72 shrink-0">
                <div className="relative bg-amber-50/80 border border-stone-400/40 p-4 space-y-3">
                  <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                  <button onClick={() => setSelected(null)} className="absolute top-2 right-2 text-stone-400 hover:text-stone-700 text-lg leading-none">×</button>

                  {loadingDetail ? (
                    <div className="space-y-2">
                      {[3, 4, 2].map(w => <div key={w} className={`h-3 w-${w}/4 bg-stone-300/40 animate-pulse`} />)}
                    </div>
                  ) : itemDetail ? (
                    <>
                      <div>
                        <h3 className="font-display text-base text-stone-900 leading-tight pr-5">{itemDetail.name}</h3>
                        <p className="text-[11px] font-serif italic text-stone-500 mt-0.5 capitalize">{itemDetail.equipment_category.name}</p>
                      </div>

                      <div className="flex gap-4 text-xs font-mono text-stone-700">
                        {itemDetail.cost?.quantity > 0
                          ? <span className="text-amber-700 font-bold">{formatCost(itemDetail.cost.quantity, itemDetail.cost.unit)}</span>
                          : <span className="text-stone-400 italic">Sin precio</span>
                        }
                        {itemDetail.weight > 0 && <span>{itemDetail.weight} lb</span>}
                        {itemDetail.armor_class && (
                          <span>CA {itemDetail.armor_class.base}{itemDetail.armor_class.dex_bonus ? '+Des' : ''}</span>
                        )}
                      </div>

                      {itemDetail.desc && itemDetail.desc.length > 0 && (
                        <p className="text-[11px] font-serif text-stone-600 leading-relaxed line-clamp-4">{itemDetail.desc[0]}</p>
                      )}

                      {buyableChars.length > 0 && itemDetail.cost?.quantity > 0 && (
                        <div className="pt-2 border-t border-stone-400/30 space-y-2">
                          <p className="text-[10px] font-display tracking-wider uppercase text-stone-600">Para quién</p>
                          <div className="space-y-1">
                            {buyableChars.map(c => {
                              const cur = (c.sheet_json as Character['sheet_json']).currency ?? { gold: 0, silver: 0, copper: 0 }
                              const charCp = toCp(cur.gold, 'gp') + toCp(cur.silver, 'sp') + toCp(cur.copper, 'cp')
                              const costCp = toCp(itemDetail.cost.quantity, itemDetail.cost.unit as CostUnit)
                              const canAfford = charCp >= costCp
                              return (
                                <label key={c.id} className={`flex items-center gap-2 px-2 py-1.5 border cursor-pointer transition-colors text-xs font-serif ${
                                  buyCharId === c.id ? 'border-amber-700 bg-amber-100/60' : 'border-stone-400/30 hover:bg-amber-50/60'
                                } ${!canAfford ? 'opacity-50' : ''}`}>
                                  <input
                                    type="radio" name="buy-char" value={c.id}
                                    checked={buyCharId === c.id}
                                    onChange={() => { setBuyCharId(c.id); setError(null) }}
                                    className="accent-amber-700"
                                  />
                                  <span className="flex-1 text-stone-900">{c.name}</span>
                                  <span className={`font-mono ${canAfford ? 'text-amber-700' : 'text-red-700'}`}>
                                    {cur.gold} MO {cur.silver > 0 ? `${cur.silver} MP` : ''}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                          {error && <p className="text-xs font-serif text-red-800 bg-red-100/60 border border-red-800/30 px-2 py-1.5">{error}</p>}
                          <button
                            onClick={handleBuy}
                            disabled={loading || !buyCharId}
                            className="w-full px-4 py-2 text-xs font-serif bg-amber-900 hover:bg-amber-800 text-amber-100 border border-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Comprando…' : `Comprar — ${formatCost(itemDetail.cost.quantity, itemDetail.cost.unit)}`}
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
      )}

      {/* ── SELL TAB ───────────────────────────────────────────────────────── */}
      {mainTab === 'vender' && (
        <div className="space-y-4">
          <p className="text-xs font-serif italic text-stone-500">El comerciante paga 1 MO por cada ítem (precio estándar de reventa).</p>

          <div>
            <p className="text-xs font-display tracking-wider uppercase text-stone-600 mb-2">Inventario de</p>
            <div className="flex flex-wrap gap-2">
              {characters.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSellCharId(c.id); setSellConfirm(null) }}
                  className={`px-3 py-1.5 text-xs font-serif border transition-colors ${
                    sellCharId === c.id
                      ? 'bg-amber-900/20 border-amber-700 text-stone-900'
                      : 'border-stone-400/40 text-stone-600 hover:bg-amber-50/60'
                  }`}
                >
                  {c.name}
                  <span className="ml-1.5 font-mono text-amber-700">{(c.sheet_json as Character['sheet_json']).currency?.gold ?? 0} MO</span>
                </button>
              ))}
            </div>
          </div>

          {sellCharId && (
            selectedCharInventory.length === 0 ? (
              <p className="text-sm font-serif italic text-stone-500 py-8 text-center border border-dashed border-stone-400/40">
                El inventario está vacío.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedCharInventory.map(item => (
                  <div key={item.id} className="relative bg-amber-50/60 border border-stone-400/30 p-3">
                    <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                    <p className="font-display text-sm text-stone-900 truncate">{item.name}</p>
                    {item.notes && <p className="text-[11px] font-serif italic text-stone-500 line-clamp-1 mt-0.5">{item.notes}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-mono text-stone-500">×{item.quantity}</span>
                      {sellConfirm?.id === item.id ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs italic text-stone-700">+1 MO. ¿Confirmar?</span>
                          <button onClick={() => setSellConfirm(null)} className="text-xs text-stone-500 hover:text-stone-800 font-serif">No</button>
                          <button
                            onClick={handleSellConfirm}
                            disabled={loading}
                            className="text-xs px-2 py-1 bg-stone-900 text-amber-100 hover:bg-stone-800 font-serif transition-colors disabled:opacity-50"
                          >
                            Sí
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSellConfirm({ id: item.id, name: item.name, qty: item.quantity, charId: sellCharId })}
                          className="text-xs px-3 py-1 bg-stone-900 hover:bg-stone-800 text-amber-100 border border-stone-700 font-serif transition-colors"
                        >
                          Vender
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {!sellCharId && (
            <p className="text-sm font-serif italic text-stone-500 py-8 text-center border border-dashed border-stone-400/40">
              Seleccioná un personaje para ver su inventario.
            </p>
          )}
        </div>
      )}
    </main>
  )
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const positions: Record<typeof pos, string> = {
    tl: 'top-[-3px] left-[-3px] border-t-2 border-l-2',
    tr: 'top-[-3px] right-[-3px] border-t-2 border-r-2',
    bl: 'bottom-[-3px] left-[-3px] border-b-2 border-l-2',
    br: 'bottom-[-3px] right-[-3px] border-b-2 border-r-2',
  }
  return <span className={`absolute w-3 h-3 border-stone-900 ${positions[pos]} pointer-events-none`} />
}
