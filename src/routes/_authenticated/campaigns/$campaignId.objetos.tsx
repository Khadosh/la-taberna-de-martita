import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys } from '../../../lib/dnd-api'
import type { ApiRef } from '../../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/objetos')({
  component: Objetos,
})

// ── Categories shown in the filter bar ───────────────────────────────────────

const CATEGORIES = [
  { id: 'weapon',          label: 'Armas',       icon: '⚔️' },
  { id: 'armor',           label: 'Armaduras',   icon: '🛡️' },
  { id: 'adventuring-gear',label: 'Equipo',      icon: '🎒' },
  { id: 'tools',           label: 'Herramientas',icon: '🔧' },
] as const

type CategoryId = typeof CATEGORIES[number]['id']

// ── Types ─────────────────────────────────────────────────────────────────────

type Character = {
  id: string
  name: string
  user_id: string
}

// ── Component ─────────────────────────────────────────────────────────────────

function Objetos() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()

  const [activeCategory, setActiveCategory] = useState<CategoryId>('weapon')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ApiRef | null>(null)
  const [giveCharId, setGiveCharId] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [giving, setGiving] = useState(false)

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('dm_id').eq('id', campaignId).single()
      if (error) throw error
      return data
    },
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, user_id')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data as Character[]
    },
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
  const ownCharacter = characters.find(c => c.user_id === session.user.id)
  const targetCharacters = isGm ? characters : (ownCharacter ? [ownCharacter] : [])

  const items = (categoryData?.equipment ?? []).filter(i =>
    !search.trim() || i.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (item: ApiRef) => {
    setSelected(item)
    setGiveCharId(targetCharacters[0]?.id ?? '')
    setSuccessMsg(null)
  }

  const handleGive = async () => {
    if (!selected || !giveCharId || !itemDetail) return
    setGiving(true)
    const char = characters.find(c => c.id === giveCharId)

    const { error } = await supabase.from('character_inventory').insert({
      character_id: giveCharId,
      name: itemDetail.name,
      quantity: 1,
      weight_lbs: itemDetail.weight ?? 0,
      notes: itemDetail.desc?.join(' ') || null,
    })

    setGiving(false)
    if (error) return

    queryClient.invalidateQueries({ queryKey: ['inventory', giveCharId] })
    setSuccessMsg(`${itemDetail.name} agregado al inventario de ${char?.name}.`)
    setSelected(null)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8">

      <div className="mb-5">
        <h2 className="text-2xl font-display tracking-wide text-stone-900 mb-1">📦 Objetos</h2>
        <p className="text-sm font-serif italic text-stone-600">
          Catálogo D&D 5e — {isGm ? 'entregá equipo al party sin transacción de oro.' : 'pedile al DM que te dé un ítem.'}
        </p>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-2.5 border border-green-800/40 bg-green-100/60 text-green-900 text-sm font-serif flex items-center justify-between gap-3">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-green-900/60 hover:text-green-900 text-lg leading-none">&times;</button>
        </div>
      )}

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
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-9 bg-stone-300/30 animate-pulse" />
              ))}
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

        {/* Detail panel */}
        {selected && (
          <div className="w-72 shrink-0">
            <div className="relative bg-amber-50/80 border border-stone-400/40 p-4 space-y-3">
              <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

              {loadingDetail ? (
                <div className="space-y-2">
                  <div className="h-5 w-3/4 bg-stone-300/40 animate-pulse" />
                  <div className="h-3 w-full bg-stone-300/30 animate-pulse" />
                  <div className="h-3 w-2/3 bg-stone-300/30 animate-pulse" />
                </div>
              ) : itemDetail ? (
                <>
                  <div>
                    <h3 className="font-display text-base text-stone-900 leading-tight">{itemDetail.name}</h3>
                    <p className="text-[11px] font-serif italic text-stone-500 mt-0.5 capitalize">
                      {itemDetail.equipment_category.name}
                    </p>
                  </div>

                  <div className="flex gap-4 text-xs font-mono text-stone-700">
                    {itemDetail.cost?.quantity > 0 && (
                      <span className="text-amber-700">{itemDetail.cost.quantity} {itemDetail.cost.unit}</span>
                    )}
                    {itemDetail.weight > 0 && <span>{itemDetail.weight} lb</span>}
                    {itemDetail.armor_class && (
                      <span>CA {itemDetail.armor_class.base}{itemDetail.armor_class.dex_bonus ? '+Des' : ''}</span>
                    )}
                  </div>

                  {itemDetail.desc && itemDetail.desc.length > 0 && (
                    <p className="text-[11px] font-serif text-stone-600 leading-relaxed line-clamp-4">
                      {itemDetail.desc[0]}
                    </p>
                  )}

                  {targetCharacters.length > 0 && (
                    <div className="pt-2 border-t border-stone-400/30 space-y-2">
                      <p className="text-[10px] font-display tracking-wider uppercase text-stone-600">
                        {isGm ? 'Dar a' : 'Agregar a'}
                      </p>
                      <select
                        value={giveCharId}
                        onChange={e => setGiveCharId(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-serif bg-amber-50 border border-stone-400/40 text-stone-900 focus:outline-none focus:border-stone-700"
                      >
                        {targetCharacters.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleGive}
                        disabled={giving || !giveCharId}
                        className="w-full px-4 py-2 text-xs font-serif bg-stone-900 hover:bg-stone-800 text-amber-100 border border-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {giving ? 'Agregando…' : '+ Dar ítem'}
                      </button>
                    </div>
                  )}
                </>
              ) : null}

              <button
                onClick={() => setSelected(null)}
                className="absolute top-2 right-2 text-stone-400 hover:text-stone-700 text-lg leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
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
