/**
 * InventoryPanel: equipamiento activo + tabla de inventario completa.
 * Siempre visible (no tabbeable), debajo de los tabs.
 */
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { SheetLabel, SheetRow } from './sheet-primitives'
import type { SheetJson } from './types'

type InventoryItem = {
  id: string
  name: string
  quantity: number
  weight_lbs: number | null
  notes: string | null
}

interface InventoryPanelProps {
  characterId: string
  inventory: InventoryItem[]
  sheet: SheetJson
  isOwner: boolean
  ac: number
  dexMod: number
  // mutations
  toggleEquip: (id: string) => Promise<void>
  patchCurrency: (patch: Partial<{ gold: number; silver: number; copper: number }>) => void
  currency: { gold: number; silver: number; copper: number }
  strScore: number
}

export function InventoryPanel({
  characterId, inventory, sheet, isOwner, ac, dexMod,
  toggleEquip, patchCurrency, currency, strScore,
}: InventoryPanelProps) {
  const queryClient = useQueryClient()
  const [newItemName, setNewItemName] = useState('')
  const [newItemWeight, setNewItemWeight] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')
  const [newItemNotes, setNewItemNotes] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [equipSearch, setEquipSearch] = useState('')
  const [showEquipDropdown, setShowEquipDropdown] = useState(false)
  const [editingCoin, setEditingCoin] = useState<'gold' | 'silver' | 'copper' | null>(null)
  const [coinInput, setCoinInput] = useState('')

  const { data: equipmentList = [] } = useQuery({
    queryKey: dndKeys.equipment,
    queryFn: async () => (await dndApi.equipment()).results,
    staleTime: Infinity,
  })

  const filteredEquipment = useMemo(() =>
    equipSearch.length >= 2
      ? equipmentList.filter(e => e.name.toLowerCase().includes(equipSearch.toLowerCase())).slice(0, 8)
      : [],
    [equipmentList, equipSearch]
  )

  const equippedItemIds = new Set(sheet.equipped_items ?? [])
  const equippedItems = inventory.filter(i => equippedItemIds.has(i.id))
  const totalWeight = inventory.reduce((s, i) => s + (Number(i.weight_lbs) || 0) * i.quantity, 0)
  const carryCapacity = strScore * 15
  const weightPct = Math.min((totalWeight / carryCapacity) * 100, 100)
  const weightColor = weightPct > 90 ? 'bg-red-700' : weightPct > 66 ? 'bg-amber-600' : 'bg-stone-600'

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
    if (detail.armor_class) {
      const acDesc = detail.armor_category === 'Shield'
        ? `Escudo +${detail.armor_class.base}`
        : `CA ${detail.armor_class.base}${detail.armor_class.dex_bonus ? ' + DES' : ''}${detail.armor_class.max_bonus ? ` (máx ${detail.armor_class.max_bonus})` : ''}`
      setNewItemNotes(acDesc)
    }
    setEquipSearch(''); setShowEquipDropdown(false)
  }

  return (
    <SheetRow className="border-t border-stone-600">
      <div className="flex-1 p-4">
        {/* Header: title + weight bar */}
        <div className="flex items-center gap-3 mb-3">
          <SheetLabel>Inventario</SheetLabel>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 border border-stone-400/40 overflow-hidden" style={{ background: 'rgba(200,170,110,0.15)' }}>
              <div className={`h-full transition-all ${weightColor}`} style={{ width: `${weightPct}%` }} />
            </div>
            <span className="text-xs font-serif text-stone-500 whitespace-nowrap">{totalWeight.toFixed(1)} / {carryCapacity} lb</span>
          </div>
        </div>

        {/* Currency */}
        <div className="flex items-center gap-4 mb-4 pb-3 border-b border-stone-300/40">
          {([
            { key: 'gold' as const, label: 'MO', color: 'text-amber-700' },
            { key: 'silver' as const, label: 'MP', color: 'text-stone-500' },
            { key: 'copper' as const, label: 'MC', color: 'text-orange-700' },
          ]).map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-1">
              <span className={`text-[10px] font-serif tracking-wider uppercase ${color}`}>{label}</span>
              {isOwner && (
                <button onClick={() => patchCurrency({ [key]: Math.max(0, currency[key] - 1) })}
                  className="w-4 h-4 text-[10px] border border-stone-400 text-stone-500 hover:bg-stone-200/50 leading-none font-mono">−</button>
              )}
              {isOwner && editingCoin === key ? (
                <input type="number" value={coinInput} onChange={e => setCoinInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      patchCurrency({ [key]: Math.max(0, currency[key] + (parseInt(coinInput) || 0)) })
                      setEditingCoin(null); setCoinInput('')
                    }
                    if (e.key === 'Escape') { setEditingCoin(null); setCoinInput('') }
                  }}
                  onBlur={() => { setEditingCoin(null); setCoinInput('') }}
                  autoFocus placeholder="±0"
                  className="w-10 text-center text-xs font-mono border border-stone-400 bg-white/70 focus:outline-none py-0.5" />
              ) : (
                <span
                  className={`text-sm font-mono font-bold text-stone-700 min-w-[1.5rem] text-center ${isOwner ? 'cursor-pointer hover:text-amber-800' : ''}`}
                  title={isOwner ? 'Clic para sumar o restar' : undefined}
                  onClick={() => { if (isOwner) { setCoinInput(''); setEditingCoin(key) } }}
                >
                  {currency[key]}
                </span>
              )}
              {isOwner && (
                <button onClick={() => patchCurrency({ [key]: currency[key] + 1 })}
                  className="w-4 h-4 text-[10px] border border-stone-400 text-stone-500 hover:bg-stone-200/50 leading-none font-mono">+</button>
              )}
            </div>
          ))}
        </div>

        {/* Equipped */}
        <div className="mb-4 border-2 border-amber-700/40 p-3" style={{ background: 'rgba(200,140,40,0.08)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-amber-800 uppercase tracking-widest font-serif font-semibold">⚔ Equipado</p>
            {sheet.equipped_armor && (
              <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/50 px-2 py-0.5 border border-amber-600/40">
                CA {ac} {sheet.equipped_armor.dex_bonus ? `(${sheet.equipped_armor.base} + DES ${dexMod >= 0 ? '+' : ''}${dexMod})` : `(${sheet.equipped_armor.category})`}
              </span>
            )}
          </div>
          {equippedItems.length > 0 ? (
            <div className="space-y-1.5">
              {equippedItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 px-2 py-1.5 bg-amber-100/30 border border-amber-600/30">
                  <span className="text-amber-700 text-sm">⚔</span>
                  <span className="text-sm font-serif text-stone-800 font-medium flex-1">{item.name}</span>
                  {item.notes && <span className="text-xs text-stone-500 italic">{item.notes}</span>}
                  {(item.weight_lbs ?? 0) > 0 && <span className="text-xs text-stone-400 font-mono">{Number(item.weight_lbs)} lb</span>}
                  {isOwner && (
                    <button onClick={() => toggleEquip(item.id)}
                      className="text-xs px-1.5 py-0.5 border border-stone-400 text-stone-500 hover:border-red-600 hover:text-red-700 font-serif transition-colors">
                      Desequipar
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 font-serif italic">Nada equipado. Usá el botón "Equipar" en la tabla.</p>
          )}
        </div>

        {/* Inventory table */}
        {inventory.length > 0 && (
          <table className="w-full text-sm font-serif mb-3">
            <thead>
              <tr className="border-b border-stone-400 text-xs text-stone-400 uppercase tracking-wider">
                <th className="text-left py-1 font-normal">Objeto</th>
                <th className="text-center py-1 font-normal w-12">Cant.</th>
                <th className="text-center py-1 font-normal w-16">Peso</th>
                <th className="text-center py-1 font-normal w-16">Total</th>
                {isOwner && <th className="w-12" />}
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} className={`border-b border-stone-200/80 hover:bg-amber-100/40 group ${equippedItemIds.has(item.id) ? 'bg-amber-50/60' : ''}`}>
                  <td className="py-1.5 text-stone-700">
                    {item.name}
                    {item.notes && <span className="ml-1 text-xs text-stone-400 italic">· {item.notes}</span>}
                    {equippedItemIds.has(item.id) && <span className="ml-1.5 text-[10px] text-amber-700 border border-amber-600/50 px-1 font-serif">equipado</span>}
                  </td>
                  <td className="text-center text-stone-600">
                    {isOwner ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={async () => {
                          if (item.quantity <= 1) return removeInventoryItem(item.id)
                          await supabase.from('character_inventory').update({ quantity: item.quantity - 1 }).eq('id', item.id)
                          queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
                        }} className="w-5 h-5 text-xs border border-stone-400 text-stone-500 hover:bg-stone-200/50 leading-none font-mono">−</button>
                        <span className="min-w-[1.5rem] text-center">{item.quantity}</span>
                        <button onClick={async () => {
                          await supabase.from('character_inventory').update({ quantity: item.quantity + 1 }).eq('id', item.id)
                          queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
                        }} className="w-5 h-5 text-xs border border-stone-400 text-stone-500 hover:bg-stone-200/50 leading-none font-mono">+</button>
                      </div>
                    ) : item.quantity}
                  </td>
                  <td className="text-center text-stone-500">{Number(item.weight_lbs)} lb</td>
                  <td className="text-center text-stone-600 font-medium">{(Number(item.weight_lbs) * item.quantity).toFixed(1)} lb</td>
                  {isOwner && (
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => toggleEquip(item.id)}
                          className={`text-[10px] px-1.5 py-0.5 border font-serif transition-colors whitespace-nowrap ${equippedItemIds.has(item.id) ? 'border-amber-600/60 text-amber-800 bg-amber-100/40 hover:bg-amber-200/50' : 'border-stone-400 text-stone-500 hover:border-amber-700 hover:text-amber-700'}`}>
                          {equippedItemIds.has(item.id) ? '✓ Equip.' : 'Equipar'}
                        </button>
                        <button onClick={() => removeInventoryItem(item.id)} className="text-stone-300 hover:text-red-700 text-xs">✕</button>
                      </div>
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
                <input placeholder="Buscar en catálogo de equipo..."
                  value={equipSearch}
                  onChange={e => { setEquipSearch(e.target.value); setShowEquipDropdown(true) }}
                  onFocus={() => setShowEquipDropdown(true)}
                  className="w-full px-2 py-1 text-sm border border-stone-400 bg-amber-50/80 font-serif focus:outline-none focus:border-amber-700" />
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
  )
}
