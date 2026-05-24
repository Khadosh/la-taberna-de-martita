import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys } from '../../../lib/dnd-api'
import type { Tables, TablesInsert } from '../../../lib/database.types'
import { SectionHeader } from '../../../components/campaigns/pnj/pnj-primitives'
import { NpcCard } from '../../../components/campaigns/pnj/npc-card'
import { NpcFormPanel } from '../../../components/campaigns/pnj/npc-form-panel'
import { type NpcForm, type Stats, DEFAULT_STATS, EMPTY_FORM, toIntOrNull } from '../../../components/campaigns/pnj/pnj-types'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/pnj')({
  component: PnjGenerator,
})

type Npc = Tables<'npcs'>

function PnjGenerator() {
  const { campaignId } = Route.useParams()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<NpcForm>(EMPTY_FORM())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: races } = useQuery({ queryKey: dndKeys.races, queryFn: dndApi.races })
  const { data: classes } = useQuery({ queryKey: dndKeys.classes, queryFn: dndApi.classes })

  const { data: npcs = [], isLoading } = useQuery({
    queryKey: ['campaign-npcs', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs').select('*').eq('campaign_id', campaignId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const patchForm = <K extends keyof NpcForm>(k: K, v: NpcForm[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const patchStat = (k: keyof Stats, v: number) =>
    setForm(f => ({ ...f, stats: { ...f.stats, [k]: v } }))

  const resetForm = () => {
    setForm(EMPTY_FORM())
    setEditingId(null)
  }

  const loadForEdit = (npc: Npc) => {
    const stats = (npc.stats as Stats | null) ?? DEFAULT_STATS
    setForm({
      name: npc.name,
      race: npc.race ?? '',
      class: npc.class ?? '',
      level: npc.level,
      role: npc.role as NpcForm['role'],
      stats: { ...DEFAULT_STATS, ...stats },
      max_hp: npc.max_hp?.toString() ?? '',
      current_hp: npc.current_hp?.toString() ?? '',
      armor_class: npc.armor_class?.toString() ?? '',
      attack_bonus: npc.attack_bonus?.toString() ?? '',
      damage: npc.damage ?? '',
      backstory: npc.backstory ?? '',
      notes: npc.notes ?? '',
      is_hidden: npc.is_hidden,
    })
    setEditingId(npc.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const max_hp = toIntOrNull(form.max_hp)
      const current_hp = toIntOrNull(form.current_hp) ?? max_hp
      const payload = {
        campaign_id: campaignId,
        name: form.name.trim(),
        race: form.race || null,
        class: form.class || null,
        level: form.level,
        role: form.role,
        stats: form.stats as unknown as TablesInsert<'npcs'>['stats'],
        max_hp,
        current_hp,
        armor_class: toIntOrNull(form.armor_class),
        attack_bonus: toIntOrNull(form.attack_bonus),
        damage: form.damage.trim() || null,
        backstory: form.backstory.trim() || null,
        notes: form.notes.trim() || null,
        is_hidden: form.is_hidden,
      }
      if (editingId) {
        await supabase.from('npcs').update(payload).eq('id', editingId)
      } else {
        await supabase.from('npcs').insert(payload)
      }
      await queryClient.invalidateQueries({ queryKey: ['campaign-npcs', campaignId] })
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const removeNpc = async (id: string) => {
    await supabase.from('npcs').delete().eq('id', id)
    setConfirmDeleteId(null)
    if (editingId === id) resetForm()
    queryClient.invalidateQueries({ queryKey: ['campaign-npcs', campaignId] })
  }

  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-10 my-4 relative space-y-10">
        <span className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-2 border-l-2 border-stone-900" />
        <span className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-2 border-r-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-2 border-l-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-2 border-r-2 border-stone-900" />

        <section>
          <SectionHeader
            icon="👤"
            label={editingId ? 'Editar PNJ' : 'Generar PNJ'}
            extra={editingId && (
              <button onClick={resetForm} className="text-xs italic text-stone-600 hover:text-stone-900 underline font-serif">
                cancelar edición
              </button>
            )}
          />
          <NpcFormPanel
            form={form} patchForm={patchForm} patchStat={patchStat}
            editingId={editingId} resetForm={resetForm}
            submit={submit} saving={saving}
            races={races} classes={classes}
          />
        </section>

        <section>
          <SectionHeader icon="📜" label={`PNJs · ${npcs.length}`} />
          {isLoading ? (
            <p className="text-stone-600 italic font-serif">Cargando...</p>
          ) : npcs.length === 0 ? (
            <p className="text-stone-600 italic font-serif">Todavía no creaste ningún PNJ.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {npcs.map(npc => (
                <NpcCard
                  key={npc.id}
                  npc={npc}
                  onEdit={() => loadForEdit(npc)}
                  onDelete={() => setConfirmDeleteId(npc.id)}
                  confirmingDelete={confirmDeleteId === npc.id}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onConfirmDelete={() => removeNpc(npc.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
