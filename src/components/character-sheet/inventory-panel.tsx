import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { getItemIconUrl, getItemFallbackEmoji } from '../../lib/item-icons'
import type { SheetJson } from './types'

type InventoryItem = {
  id: string
  name: string
  quantity: number
  weight_lbs: number | null
  notes: string | null
  image_url?: string
}

interface InventoryPanelProps {
  characterId: string
  inventory: InventoryItem[]
  sheet: SheetJson
  isOwner: boolean
  toggleEquip: (id: string) => Promise<void>
  patchCurrency: (patch: Partial<{ gold: number; silver: number; copper: number }>) => void
  currency: { gold: number; silver: number; copper: number }
  strScore: number
}

// ── COMPONENTE ITEM ICON ─────────────────────────────────────────────────────

function ItemIcon({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} className="w-full h-full object-cover" alt={name} />
  }

  const url = getItemIconUrl(name)
  if (url) {
    return (
      <img
        src={url}
        className="w-8 h-8 object-contain opacity-75"
        alt={name}
        onError={e => {
          const t = e.currentTarget
          t.style.display = 'none'
          const span = document.createElement('span')
          span.className = 'text-lg opacity-40'
          span.textContent = getItemFallbackEmoji(name)
          t.parentElement?.appendChild(span)
        }}
      />
    )
  }

  return <span className="text-lg opacity-40">{getItemFallbackEmoji(name)}</span>
}

export function InventoryPanel({
  characterId, inventory, sheet, isOwner,
  toggleEquip, patchCurrency, currency, strScore,
}: InventoryPanelProps) {
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [addingItem, setAddingItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemWeight, setNewItemWeight] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')
  const [editingCoin, setEditingCoin] = useState<'gold' | 'silver' | 'copper' | null>(null)
  const [coinInput, setCoinInput] = useState('')

  const equippedItemIds = useMemo(() => new Set(sheet.equipped_items ?? []), [sheet.equipped_items])

  const { displayEquipped, displayInventory } = useMemo(() => {
    const eq: InventoryItem[] = []
    const inv: InventoryItem[] = []
    for (const item of inventory) {
      if (equippedItemIds.has(item.id)) {
        eq.push({ ...item, quantity: 1 })
        if (item.quantity > 1) {
          inv.push({ ...item, quantity: item.quantity - 1 })
        }
      } else {
        inv.push(item)
      }
    }
    return { displayEquipped: eq, displayInventory: inv }
  }, [inventory, equippedItemIds])

  const totalWeight = inventory.reduce((s, i) => s + (Number(i.weight_lbs) || 0) * i.quantity, 0)
  const carryCapacity = strScore * 15
  const weightPct = Math.min((totalWeight / carryCapacity) * 100, 100)

  const addInventoryItem = async () => {
    if (!newItemName.trim()) return
    await supabase.from('character_inventory').insert({
      character_id: characterId,
      name: newItemName.trim(),
      weight_lbs: parseFloat(newItemWeight) || 0,
      quantity: parseInt(newItemQty) || 1,
    })
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
    setNewItemName(''); setNewItemWeight(''); setNewItemQty('1')
    setAddingItem(false)
  }

  const removeInventoryItem = async (id: string) => {
    await supabase.from('character_inventory').delete().eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
    setSelectedItem(null)
  }

  const updateQty = async (id: string, delta: number, current: number) => {
    const next = current + delta
    if (next <= 0) return removeInventoryItem(id)
    await supabase.from('character_inventory').update({ quantity: next }).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['inventory', characterId] })
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] text-stone-300 overflow-hidden font-serif">
      <div className="p-3 bg-[#121212] border-b border-[#333] flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#2a2a2a] border border-[#444] rounded-full px-3 py-1 flex-1 max-w-[200px]">
          <span className="text-stone-500 text-xs">🔍</span>
          <input placeholder="Filtrar morral..." className="bg-transparent border-none outline-none text-[10px] w-full text-stone-400 font-serif" />
        </div>
        <button onClick={() => setAddingItem(true)} className="text-stone-500 hover:text-amber-500 text-lg transition-colors">＋</button>
      </div>

      <div className="px-4 py-2 bg-[#0d0d0d] border-b border-[#222] flex justify-around items-center">
        {[
          { key: 'gold' as const, color: 'text-amber-500' },
          { key: 'silver' as const, color: 'text-stone-300' },
          { key: 'copper' as const, color: 'text-orange-700' },
        ].map(({ key, color }) => (
          <div key={key} className="flex items-center gap-1.5 group cursor-pointer" onClick={() => { if (isOwner) { setEditingCoin(key); setCoinInput('') } }}>
            <span className={`text-[10px] ${color}`}>●</span>
            {editingCoin === key ? (
              <input autoFocus className="bg-transparent w-8 outline-none border-b border-stone-600 text-xs font-mono" value={coinInput} onBlur={() => setEditingCoin(null)}
                onKeyDown={e => { if (e.key === 'Enter') { patchCurrency({ [key]: currency[key] + (parseInt(coinInput) || 0) }); setEditingCoin(null) } }}
                onChange={e => setCoinInput(e.target.value)} />
            ) : <span className="text-xs font-mono font-bold group-hover:text-white transition-colors">{currency[key]}</span>}
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#141414] border-b border-[#222]">
        <p className="text-[9px] uppercase tracking-[0.2em] text-amber-600/60 font-bold mb-3 font-serif">Equipo Activo</p>
        <div className="flex flex-wrap gap-2.5">
          {displayEquipped.map(item => (
            <div key={`eq-${item.id}`}
              onClick={() => setSelectedItem(item)}
              className="w-12 h-12 bg-[#222] border border-amber-600/40 shadow-[inset_0_0_15px_rgba(217,119,6,0.15)] flex items-center justify-center relative cursor-pointer hover:bg-[#2a2a2a] group overflow-hidden rounded-sm">
              <ItemIcon name={item.name} imageUrl={item.image_url} />
              <div className="absolute inset-0 border border-amber-400/10 pointer-events-none group-hover:border-amber-400/30 transition-colors" />
            </div>
          ))}
          {displayEquipped.length === 0 && (
            <div className="w-12 h-12 border border-[#222] bg-[#0d0d0d] flex items-center justify-center text-[#222] text-xl">⚔</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#121212] custom-scrollbar">
        <div className="grid grid-cols-5 gap-2">
          {displayInventory.map(item => (
            <div key={`inv-${item.id}`}
              onClick={() => setSelectedItem(item)}
              className={`w-12 h-12 bg-[#1e1e1e] border border-[#333] flex items-center justify-center relative cursor-pointer hover:bg-[#2a2a2a] hover:border-[#555] transition-all group overflow-hidden rounded-sm ${selectedItem?.id === item.id ? 'ring-1 ring-amber-500 border-amber-500/50' : ''}`}>
              <ItemIcon name={item.name} imageUrl={item.image_url} />
              {item.quantity > 1 && (
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{item.quantity}</span>
              )}
            </div>
          ))}
          {Array.from({ length: Math.max(0, 30 - displayInventory.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-12 h-12 bg-[#0d0d0d] border border-[#1a1a1a] opacity-30 rounded-sm" />
          ))}
        </div>
      </div>

      {selectedItem && (
        <div className="p-4 bg-[#1a1a1a] border-t border-[#3a3a3a] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-500 tracking-wide uppercase">{selectedItem.name}</p>
              <p className="text-[10px] text-stone-500 italic mt-1 leading-relaxed">{selectedItem.notes || 'Objeto común sin propiedades mágicas detectadas.'}</p>
            </div>
            <button onClick={() => setSelectedItem(null)} className="text-stone-600 hover:text-stone-300 ml-2">✕</button>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2a2a]">
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <button onClick={() => toggleEquip(selectedItem.id)} className="text-[10px] uppercase font-bold px-3 py-1.5 bg-amber-900/30 border border-amber-900/50 text-amber-400 hover:bg-amber-900/50 transition-colors rounded-sm">
                    {equippedItemIds.has(selectedItem.id) ? 'Quitar' : 'Equipar'}
                  </button>
                  <button onClick={() => removeInventoryItem(selectedItem.id)} className="text-[10px] uppercase font-bold px-3 py-1.5 bg-red-900/10 border border-red-900/30 text-red-500 hover:bg-red-900/30 rounded-sm">X</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 bg-[#121212] rounded-full px-2 py-1 border border-[#333]">
              <button onClick={() => updateQty(selectedItem.id, -1, selectedItem.quantity)} className="w-5 h-5 text-stone-500 hover:text-white transition-colors">－</button>
              <span className="text-[10px] font-mono font-bold text-stone-300 min-w-[12px] text-center">{selectedItem.quantity}</span>
              <button onClick={() => updateQty(selectedItem.id, 1, selectedItem.quantity)} className="w-5 h-5 text-stone-500 hover:text-white transition-colors">＋</button>
            </div>
          </div>
        </div>
      )}

      {addingItem && (
        <div className="absolute inset-0 bg-black/90 z-40 p-8 flex flex-col justify-center animate-in fade-in zoom-in-95">
          <div className="bg-[#1a1a1a] border border-[#444] p-6 space-y-4 shadow-2xl rounded-sm">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest text-center border-b border-[#333] pb-3 mb-4">Adquirir Nuevo Objeto</p>
            <input placeholder="Nombre..." className="w-full bg-[#0d0d0d] border border-[#333] p-2.5 text-xs outline-none focus:border-amber-600 text-stone-300" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-[8px] text-stone-500 mb-1 ml-1 uppercase">Peso (lb)</p>
                <input type="number" className="w-full bg-[#0d0d0d] border border-[#333] p-2 text-xs outline-none" value={newItemWeight} onChange={e => setNewItemWeight(e.target.value)} />
              </div>
              <div className="flex-1">
                <p className="text-[8px] text-stone-500 mb-1 ml-1 uppercase">Cantidad</p>
                <input type="number" className="w-full bg-[#0d0d0d] border border-[#333] p-2 text-xs outline-none" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={addInventoryItem} className="flex-1 bg-amber-700 text-white py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors rounded-sm shadow-lg">Añadir</button>
              <button onClick={() => setAddingItem(false)} className="px-4 border border-[#444] text-[10px] uppercase font-bold text-stone-500 hover:text-stone-300">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 bg-[#0a0a0a] border-t border-[#222]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-stone-600 text-xs">⚖</span>
          <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider">{totalWeight.toFixed(1)} <span className="text-stone-700">/</span> {carryCapacity} <span className="text-stone-700 ml-1 italic opacity-60">lb</span></span>
        </div>
        <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden flex shadow-inner border border-[#222]">
          <div className="h-full bg-gradient-to-r from-amber-900 to-amber-600 transition-all duration-1000 shadow-[0_0_12px_rgba(217,119,6,0.6)]" style={{ width: `${weightPct}%` }} />
        </div>
      </div>
    </div>
  )
}
