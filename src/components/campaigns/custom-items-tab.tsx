import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CustomItem } from '../../lib/custom-items'
import { CustomItemForm, EMPTY_FORM, formToProperties, itemToForm, type ItemFormState } from './custom-item-form'
import { CustomItemCard } from './custom-item-card'

type Character = { id: string; name: string }

type Props = {
  campaignId: string
  userId: string
  isDm: boolean
}

export function CustomItemsTab({ campaignId, userId, isDm }: Props) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<CustomItem | null>(null)
  const [assignCharId, setAssignCharId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['custom-items', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_items')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CustomItem[]
    },
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('id, name')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data as Character[]
    },
  })

  const openCreate = () => {
    setForm(EMPTY_FORM())
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (item: CustomItem) => {
    setForm(itemToForm(item))
    setEditingId(item.id)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM())
  }

  const submit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        campaign_id: campaignId,
        created_by: userId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        image_url: form.image_url || null,
        rarity: form.rarity,
        item_type: form.item_type,
        weight_lbs: parseFloat(form.weight_lbs) || 0,
        properties: formToProperties(form),
      }
      if (editingId) {
        const { error } = await supabase.from('custom_items').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('custom_items').insert(payload)
        if (error) throw error
      }
      await queryClient.invalidateQueries({ queryKey: ['custom-items', campaignId] })
      cancelForm()
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id: string) => {
    await supabase.from('custom_items').delete().eq('id', id)
    setConfirmDeleteId(null)
    if (editingId === id) cancelForm()
    queryClient.invalidateQueries({ queryKey: ['custom-items', campaignId] })
  }

  const assignToCharacter = async () => {
    if (!assignTarget || !assignCharId) return
    setAssigning(true)
    setAssignError(null)
    try {
      const { error } = await supabase.from('character_inventory').insert({
        character_id: assignCharId,
        name: assignTarget.name,
        quantity: 1,
        weight_lbs: assignTarget.weight_lbs,
        notes: assignTarget.description ?? '',
        custom_item_id: assignTarget.id,
      })
      if (error) throw error
      setAssignTarget(null)
      setAssignCharId('')
    } catch (e) {
      setAssignError('No se pudo asignar el objeto.')
      console.error(e)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <p className="text-stone-600 text-sm font-serif italic">
          Crea objetos mágicos únicos y asígnalos a los personajes de la campaña.
        </p>
        {isDm && !showForm && (
          <button
            onClick={openCreate}
            className="text-sm bg-amber-900/30 hover:bg-amber-900/50 text-amber-900 border border-amber-800/40 rounded px-4 py-1.5 transition-colors font-medium"
          >
            + Crear objeto
          </button>
        )}
        {isDm && showForm && (
          <button onClick={cancelForm} className="text-sm text-stone-500 hover:text-stone-700 transition-colors">
            Cancelar
          </button>
        )}
      </div>

      {/* form */}
      {isDm && showForm && (
        <div className="border border-parchment-sienna/30 rounded-md p-5 bg-amber-50/20">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-5">
            {editingId ? 'Editar objeto' : 'Nuevo objeto'}
          </h3>
          <CustomItemForm
            form={form}
            setForm={setForm}
            saving={saving}
            editingId={editingId}
            onSubmit={submit}
            onCancel={cancelForm}
          />
        </div>
      )}

      {/* modal asignar */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-stone-100 border border-stone-300 rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-stone-800 font-semibold mb-1 font-serif">Dar a personaje</h3>
            <p className="text-stone-500 text-sm mb-4">
              Asignar <span className="text-stone-700 font-medium">"{assignTarget.name}"</span> al inventario de:
            </p>
            <select
              value={assignCharId}
              onChange={e => setAssignCharId(e.target.value)}
              className="w-full bg-white border border-stone-300 text-stone-800 text-sm rounded px-2.5 py-2 focus:outline-none focus:border-amber-700 mb-3"
            >
              <option value="">Seleccionar personaje...</option>
              {characters.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {assignError && <p className="text-red-600 text-xs mb-2">{assignError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAssignTarget(null); setAssignCharId(''); setAssignError(null) }}
                className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={assignToCharacter}
                disabled={assigning || !assignCharId}
                className="text-sm bg-amber-800 hover:bg-amber-700 text-amber-100 rounded px-4 py-1.5 transition-colors disabled:opacity-40 font-semibold"
              >
                {assigning ? 'Asignando...' : 'Dar objeto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* lista */}
      {isLoading && <p className="text-stone-500 italic text-sm font-serif">Cargando...</p>}

      {!isLoading && items.length === 0 && (
        <p className="text-stone-500 italic text-sm font-serif">
          {isDm
            ? 'Todavía no creaste ningún objeto. Usá el botón "Crear objeto" para empezar.'
            : 'El DM todavía no creó objetos para esta campaña.'}
        </p>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map(item => (
            <CustomItemCard
              key={item.id}
              item={item}
              onEdit={isDm ? openEdit : () => {}}
              onDelete={isDm ? deleteItem : () => {}}
              onAssign={isDm ? (i) => { setAssignTarget(i); setAssignCharId('') } : () => {}}
              confirmDeleteId={confirmDeleteId}
              setConfirmDeleteId={setConfirmDeleteId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
