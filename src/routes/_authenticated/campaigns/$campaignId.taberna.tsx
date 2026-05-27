import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { type Currency, type CostUnit, UNIT_MAP, toCp, formatCost } from '../../../lib/currency'
import { type ServiceItem, DRINKS, FOODS, LODGINGS } from '../../../lib/tavern-services-data'
import { dndApi } from '../../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/taberna')({
  component: Taberna,
})

// ── Types ─────────────────────────────────────────────────────────────────────

type Character = {
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

function maxHpFor(c: Character) {
  const sheet = c.sheet_json
  if (sheet.max_hp != null) return sheet.max_hp
  // Fallback calculation
  const stats = c.stats as Record<string, number> | null
  const conMod = Math.floor((((stats?.con) ?? 10) - 10) / 2)
  const hitDie = sheet.hit_die ?? 8
  const level = c.level ?? 1
  return hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
}

function Taberna() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()

  const [activeCategory, setActiveCategory] = useState<'drinks' | 'foods' | 'lodging' | 'stables'>('drinks')
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedStablesItem, setSelectedStablesItem] = useState<{ index: string; name: string } | null>(null)
  const [consumeCharId, setConsumeCharId] = useState<string>('')
  
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch campaign info (check if GM)
  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('campaigns').select('dm_id').eq('id', campaignId).single()
      return data
    },
  })

  // Fetch campaign characters
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

  // Stables categories queries
  const stablesCategoryQuery = useQuery({
    queryKey: ['stables-categories'],
    queryFn: async () => {
      const results = await Promise.all([
        dndApi.equipmentCategory('mounts-and-other-animals'),
        dndApi.equipmentCategory('tack-harness-and-drawn-vehicles')
      ])
      const merged = results.flatMap(r => r.equipment)
      const unique = Array.from(new Map(merged.map(item => [item.index, item])).values())
      return unique
    },
    enabled: activeCategory === 'stables',
  })

  // Selected stables item details
  const { data: stablesItemDetail, isLoading: loadingStablesDetail } = useQuery({
    queryKey: ['dnd', 'equipment', selectedStablesItem?.index],
    queryFn: () => dndApi.equipmentDetail(selectedStablesItem!.index),
    enabled: activeCategory === 'stables' && !!selectedStablesItem,
  })

  const isGm = campaign?.dm_id === session.user.id
  const ownChar = characters.find(c => c.user_id === session.user.id)
  const buyableChars = isGm ? characters : (ownChar ? [ownChar] : [])

  const currentServices = useMemo(() => {
    if (activeCategory === 'stables') return []
    return {
      drinks: DRINKS,
      foods: FOODS,
      lodging: LODGINGS,
    }[activeCategory] || []
  }, [activeCategory])

  const handleSelectService = (serv: ServiceItem) => {
    setSelectedService(serv)
    setSelectedStablesItem(null)
    setConsumeCharId(buyableChars[0]?.id ?? '')
    setError(null)
    setSuccessMsg(null)
  }

  // ── ORDER & CONSUME ACTION ────────────────────────────────────────────────

  const handleOrder = async () => {
    if (!selectedService || !consumeCharId) return
    const char = characters.find(c => c.id === consumeCharId)
    if (!char) return

    const currency = char.sheet_json.currency ?? { gold: 0, silver: 0, copper: 0 }
    const charTotalCp = toCp(currency.gold, 'gp') + toCp(currency.silver, 'sp') + toCp(currency.copper, 'cp')
    const costCp = toCp(selectedService.cost, selectedService.unit)

    if (charTotalCp < costCp) {
      setError(`${char.name} no tiene suficientes fondos (necesita ${formatCost(selectedService.cost, selectedService.unit)}).`)
      return
    }

    setLoading(true)
    setError(null)

    // 1. Calculate new currency balance
    const currencyKey = UNIT_MAP[selectedService.unit]
    const updatedCurrency = { ...currency, [currencyKey]: (currency[currencyKey] ?? 0) - selectedService.cost }

    // 2. Apply mechanical benefits
    const maxHp = maxHpFor(char)
    const currentHp = char.current_hp ?? maxHp
    const effect = selectedService.applyEffect(char)

    let finalHp = currentHp
    if (effect.hpGain) {
      finalHp = Math.min(maxHp, currentHp + effect.hpGain)
    }

    // Prepare character sheet updates
    const nextSheetJson = {
      ...char.sheet_json,
      currency: updatedCurrency,
    }

    // Apply resting mechanics if requested
    if (effect.triggerLongRest) {
      finalHp = maxHp
      nextSheetJson.spell_slots_used = {}
      nextSheetJson.death_saves = undefined
      nextSheetJson.hit_dice_used = 0
    }

    // Write updates to DB
    const { error: dbErr } = await supabase
      .from('characters')
      .update({
        current_hp: finalHp,
        sheet_json: nextSheetJson as any
      })
      .eq('id', consumeCharId)

    if (dbErr) {
      setError('Error al actualizar la ficha del personaje.')
      setLoading(false)
      return
    }

    // Write log message to session notes
    await supabase.from('session_notes').insert({
      campaign_id: campaignId,
      author_id: session.user.id,
      title: '🍺 Consumo en Taberna',
      body: effect.logMsg,
      is_private: false,
    })

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['character', consumeCharId] })

    setSuccessMsg(effect.logMsg)
    setSelectedService(null)
    setLoading(false)
  }

  // ── MIGRATED STABLES BUY ACTION ───────────────────────────────────────────

  const handleStablesBuy = async () => {
    if (!stablesItemDetail || !consumeCharId) return
    const char = characters.find(c => c.id === consumeCharId)
    if (!char) return

    const cost = stablesItemDetail.cost
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

    // 1. Deduct currency
    const newCurrency = { ...currency, [currencyKey]: (currency[currencyKey] ?? 0) - cost.quantity }
    const { error: sheetErr } = await supabase
      .from('characters')
      .update({ sheet_json: { ...(char.sheet_json as object), currency: newCurrency } as never })
      .eq('id', consumeCharId)

    if (sheetErr) {
      setError('Error al descontar el dinero.')
      setLoading(false)
      return
    }

    // 2. Add to inventory
    const { error: invErr } = await supabase.from('character_inventory').insert({
      character_id: consumeCharId,
      name: stablesItemDetail.name,
      quantity: 1,
      weight_lbs: stablesItemDetail.weight ?? 0,
      notes: stablesItemDetail.desc?.[0] ?? 'Comprado en los Establos de la Taberna.',
    })

    if (invErr) {
      setError('Error al agregar al inventario.')
      setLoading(false)
      return
    }

    // 3. Write log message to session notes
    const logMsg = `🐴 ${char.name} compró ${stablesItemDetail.name} por ${formatCost(cost.quantity, unit)} en los establos.`
    await supabase.from('session_notes').insert({
      campaign_id: campaignId,
      author_id: session.user.id,
      title: '🐴 Compra en Establo',
      body: logMsg,
      is_private: false,
    })

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
    queryClient.invalidateQueries({ queryKey: ['inventory', consumeCharId] })
    queryClient.invalidateQueries({ queryKey: ['campaign-inventory', campaignId] })

    setSuccessMsg(logMsg)
    setSelectedStablesItem(null)
    setLoading(false)
  }

  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-10 my-4 relative">
        <span className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-2 border-l-2 border-stone-900" />
        <span className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-2 border-r-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-2 border-l-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-2 border-r-2 border-stone-900" />
      
      {/* Decorative tavern ambiance banner */}
      <div className="relative h-56 sm:h-64 w-full mb-8 overflow-hidden rounded-lg border border-stone-850 shadow-2xl bg-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-900/30 via-stone-950 to-stone-950" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,90,40,0.03)_1px,_transparent_1px)_0_0_/_20px_20px]" />
        
        {/* Hearth glowing fireplace simulation */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-orange-950/40 via-transparent to-transparent opacity-60 pointer-events-none" />

        <div className="absolute bottom-6 left-6 z-10 space-y-1">
          <span className="text-[10px] tracking-widest text-amber-500 font-serif uppercase font-bold">Servicios del Establecimiento</span>
          <h2 className="text-3xl font-display tracking-widest text-stone-100 uppercase">La Taberna de Martita</h2>
          <p className="text-xs font-serif italic text-stone-400">
            Un fuego crepitante, cerveza bien fría y catres limpios para reposar el cansancio del viaje.
          </p>
        </div>
        <span className="absolute right-8 bottom-6 text-7xl opacity-10 pointer-events-none">🍺</span>
      </div>

      {successMsg && (
        <div className="mb-6 px-4 py-3 border border-amber-800 bg-amber-900/10 text-amber-900 text-sm font-serif rounded flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-lg leading-none text-amber-800 hover:text-amber-600 transition-colors">&times;</button>
        </div>
      )}

      {/* Category Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-stone-400/40">
        {(['drinks', 'foods', 'lodging', 'stables'] as const).map(cat => {
          const labels = { drinks: '🍺 Bebidas', foods: '🍲 Comidas', lodging: '🛏️ Alojamiento', stables: '🐴 Establo' }
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat)
                setSelectedService(null)
                setSelectedStablesItem(null)
                setError(null)
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px] ${
                activeCategory === cat
                  ? 'border-parchment-sienna text-parchment-sienna font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {labels[cat]}
            </button>
          )
        })}
      </div>

      {/* Services Grid & Interactive Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Services Menu List */}
        <div className="flex-1 min-w-0">
          {activeCategory === 'stables' ? (
            stablesCategoryQuery.isLoading ? (
              <p className="text-stone-600 italic font-serif">Cargando establos...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(stablesCategoryQuery.data ?? []).map(item => {
                  const isSelected = selectedStablesItem?.index === item.index
                  return (
                    <button
                      key={item.index}
                      onClick={() => {
                        setSelectedStablesItem(item)
                        setSelectedService(null)
                        setConsumeCharId(buyableChars[0]?.id ?? '')
                        setError(null)
                        setSuccessMsg(null)
                      }}
                      className={`text-left p-4 border rounded transition-all flex items-start gap-4 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-900 border-amber-800 text-amber-100 shadow-md'
                          : 'bg-amber-50/30 border-stone-300/60 text-stone-700 hover:bg-amber-100/40 hover:border-stone-500'
                      }`}
                    >
                      <span className={`text-3xl p-2 border rounded shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-amber-950 border-amber-700 text-amber-100'
                          : 'bg-amber-100/60 border-stone-300 text-stone-900'
                      }`}>🐴</span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className={`font-semibold text-sm truncate font-display block ${
                          isSelected ? 'text-amber-100' : 'text-stone-900'
                        }`}>{item.name}</span>
                        <p className={`text-xs font-serif leading-relaxed line-clamp-2 ${
                          isSelected ? 'text-amber-200/90' : 'text-stone-600'
                        }`}>Caballos, monturas, mulas y vehículos de viaje.</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentServices.map(serv => (
                <button
                  key={serv.id}
                  onClick={() => handleSelectService(serv)}
                  className={`text-left p-4 border rounded transition-all flex items-start gap-4 cursor-pointer ${
                    selectedService?.id === serv.id
                      ? 'bg-amber-900 border-amber-800 text-amber-100 shadow-md'
                      : 'bg-amber-50/30 border-stone-300/60 text-stone-700 hover:bg-amber-100/40 hover:border-stone-500'
                  }`}
                >
                  <span className={`text-3xl p-2 border rounded shrink-0 transition-colors ${
                    selectedService?.id === serv.id
                      ? 'bg-amber-950 border-amber-700 text-amber-100'
                      : 'bg-amber-100/60 border-stone-300 text-stone-900'
                  }`}>{serv.icon}</span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold text-sm truncate font-display ${
                        selectedService?.id === serv.id ? 'text-amber-100' : 'text-stone-900'
                      }`}>{serv.name}</span>
                      <span className={`font-mono text-xs font-bold shrink-0 ${
                        selectedService?.id === serv.id ? 'text-amber-300' : 'text-parchment-sienna'
                      }`}>{formatCost(serv.cost, serv.unit)}</span>
                    </div>
                    <p className={`text-xs font-serif leading-relaxed line-clamp-2 ${
                      selectedService?.id === serv.id ? 'text-amber-200/90' : 'text-stone-600'
                    }`}>{serv.description}</p>
                    <p className={`text-[10px] font-serif italic ${
                      selectedService?.id === serv.id ? 'text-amber-300' : 'text-parchment-sienna'
                    }`}>{serv.benefit}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Checkout Box */}
        {(selectedService || (activeCategory === 'stables' && selectedStablesItem)) && (
          <div className="w-full lg:w-80 shrink-0">
            {activeCategory === 'stables' && loadingStablesDetail ? (
              <div className="bg-amber-50 border border-parchment-sienna/40 p-5 rounded-lg shadow-lg border-2">
                <p className="text-xs italic text-stone-500 font-serif">Cargando detalles...</p>
              </div>
            ) : (
              <div className="relative bg-amber-50 border border-parchment-sienna/40 p-5 rounded-lg space-y-4 shadow-lg border-2">
                <button
                  onClick={() => {
                    setSelectedService(null)
                    setSelectedStablesItem(null)
                    setError(null)
                  }}
                  className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 text-lg leading-none cursor-pointer"
                >✕</button>

                {activeCategory === 'stables' && stablesItemDetail ? (
                  <>
                    <div className="flex items-start gap-3">
                      <span className="text-4xl bg-amber-100/60 border border-stone-300 p-2.5 rounded shrink-0">🐴</span>
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-bold text-stone-900 leading-tight pr-5">{stablesItemDetail.name}</h3>
                        <span className="font-mono text-xs text-parchment-sienna font-bold block mt-1">
                          {stablesItemDetail.cost
                            ? formatCost(stablesItemDetail.cost.quantity, stablesItemDetail.cost.unit)
                            : 'Gratis'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-serif text-stone-600 leading-relaxed border-t border-b border-stone-300/40 py-3">
                      {stablesItemDetail.desc && stablesItemDetail.desc.length > 0
                        ? stablesItemDetail.desc.join('\n')
                        : 'Monturas, mulas, carruajes y pertrechos de establo de la taberna para viajes de larga distancia.'}
                    </p>

                    <div className="bg-amber-900 border border-amber-800 p-3 rounded text-amber-100">
                      <span className="text-[10px] font-display font-semibold uppercase text-amber-300 block mb-1">Detalles Técnicos</span>
                      <p className="text-xs font-serif italic text-amber-200/95">
                        Peso: {stablesItemDetail.weight ?? 0} lbs | Categoría: {stablesItemDetail.equipment_category?.name ?? 'Establo'}
                      </p>
                    </div>
                  </>
                ) : selectedService ? (
                  <>
                    <div className="flex items-start gap-3">
                      <span className="text-4xl bg-amber-100/60 border border-stone-300 p-2.5 rounded shrink-0">{selectedService.icon}</span>
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-bold text-stone-900 leading-tight pr-5">{selectedService.name}</h3>
                        <span className="font-mono text-xs text-parchment-sienna font-bold block mt-1">{formatCost(selectedService.cost, selectedService.unit)}</span>
                      </div>
                    </div>

                    <p className="text-xs font-serif text-stone-600 leading-relaxed border-t border-b border-stone-300/40 py-3">
                      {selectedService.description}
                    </p>

                    <div className="bg-amber-900 border border-amber-800 p-3 rounded text-amber-100">
                      <span className="text-[10px] font-display font-semibold uppercase text-amber-300 block mb-1">Efecto Especial</span>
                      <p className="text-xs font-serif italic text-amber-200/95">{selectedService.benefit}</p>
                    </div>
                  </>
                ) : null}

                {buyableChars.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block">
                      {activeCategory === 'stables' ? 'Comprador:' : 'Consumidor:'}
                    </span>
                    <div className="space-y-1.5">
                      {buyableChars.map(c => {
                        const cur = c.sheet_json.currency ?? { gold: 0, silver: 0, copper: 0 }
                        const charCp = toCp(cur.gold, 'gp') + toCp(cur.silver, 'sp') + toCp(cur.copper, 'cp')
                        
                        // Parse cost for stables or service
                        const costQty = activeCategory === 'stables' && stablesItemDetail?.cost ? stablesItemDetail.cost.quantity : (selectedService ? selectedService.cost : 0)
                        const costUnit = activeCategory === 'stables' && stablesItemDetail?.cost ? stablesItemDetail.cost.unit as CostUnit : (selectedService ? selectedService.unit : 'gp')
                        const costCp = toCp(costQty, costUnit)
                        
                        const canAfford = charCp >= costCp
                        const maxHp = maxHpFor(c)
                        const isSelected = consumeCharId === c.id
                        
                        return (
                          <label key={c.id} className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-all text-xs font-serif ${
                            isSelected ? 'border-amber-800 bg-amber-900 text-amber-100 shadow-sm' : 'border-stone-300 bg-amber-50/20 hover:bg-amber-100/30 text-stone-700'
                          } ${!canAfford ? 'opacity-40' : ''}`}>
                            <input
                              type="radio" name="consume-char" value={c.id}
                              checked={isSelected}
                              onChange={() => { setConsumeCharId(c.id); setError(null) }}
                              className="accent-amber-700"
                              disabled={!canAfford}
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`block truncate font-semibold ${isSelected ? 'text-amber-100' : 'text-stone-900'}`}>{c.name}</span>
                              <span className={`block font-mono text-[10px] ${isSelected ? 'text-amber-200/80' : 'text-stone-500'}`}>HP: {c.current_hp ?? maxHp}/{maxHp}</span>
                            </div>
                            <span className={`font-mono text-[10px] shrink-0 ${isSelected ? 'text-amber-300' : canAfford ? 'text-parchment-sienna' : 'text-red-700'}`}>
                              {cur.gold} MO {cur.silver > 0 ? `${cur.silver} MP` : ''}
                            </span>
                          </label>
                        )
                      })}
                    </div>

                    {error && <p className="text-xs font-serif text-red-700 bg-red-50 border border-red-200 px-2 py-1.5 rounded">{error}</p>}
                    
                    <button
                      onClick={activeCategory === 'stables' ? handleStablesBuy : handleOrder}
                      disabled={loading || !consumeCharId}
                      className="w-full py-2.5 font-serif text-xs border border-[#6B2C06] bg-gradient-to-b from-[#9B4A10] to-[#7B3408] text-[#f5d9a8] rounded-sm transition-colors uppercase tracking-wider font-semibold hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? 'Procesando transacción…' : activeCategory === 'stables' ? 'Comprar Montura' : 'Ordenar & Consumir'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-serif text-stone-500 italic">No posees personajes en esta campaña.</p>
                )}
              </div>
            )}
          </div>
        )}

      </div>
      </div>
    </div>
  )
}
