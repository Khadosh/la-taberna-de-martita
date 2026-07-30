import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys } from '../../../lib/dnd-api'
import type { Tables, TablesInsert } from '../../../lib/database.types'
import { SectionHeader } from '../../../components/campaigns/pnj/pnj-primitives'
import { NpcCard } from '../../../components/campaigns/pnj/npc-card'
import { NpcFormPanel } from '../../../components/campaigns/pnj/npc-form-panel'
import { type NpcForm, type Stats, DEFAULT_STATS, EMPTY_FORM, toIntOrNull, calculateSuggestedHp } from '../../../components/campaigns/pnj/pnj-types'
import { useT } from '../../../i18n'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/pnj')({
  component: PnjGenerator,
})

type Npc = Tables<'npcs'>

function PnjGenerator() {
  const t = useT()
  const { campaignId } = Route.useParams()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<NpcForm>(EMPTY_FORM())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  
  // Track last auto-calculated HP to respect manual overrides
  const [lastAutoHp, setLastAutoHp] = useState<number | null>(null)

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
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'class' || k === 'level') {
        const currentMaxHp = f.max_hp.trim()
        const isAutoHp = !currentMaxHp || (lastAutoHp !== null && currentMaxHp === String(lastAutoHp))
        if (isAutoHp) {
          const suggested = calculateSuggestedHp(next.level, next.class, next.stats.con)
          next.max_hp = String(suggested)
          next.current_hp = String(suggested)
          setLastAutoHp(suggested)
        }
      }
      return next
    })

  const patchStat = (k: keyof Stats, v: number) =>
    setForm(f => {
      const next = { ...f, stats: { ...f.stats, [k]: v } }
      if (k === 'con') {
        const currentMaxHp = f.max_hp.trim()
        const isAutoHp = !currentMaxHp || (lastAutoHp !== null && currentMaxHp === String(lastAutoHp))
        if (isAutoHp) {
          const suggested = calculateSuggestedHp(next.level, next.class, next.stats.con)
          next.max_hp = String(suggested)
          next.current_hp = String(suggested)
          setLastAutoHp(suggested)
        }
      }
      return next
    })

  const resetForm = () => {
    setForm(EMPTY_FORM())
    setEditingId(null)
    setLastAutoHp(null)
  }

  const loadForEdit = (npc: Npc) => {
    const stats = (npc.stats as Stats | null) ?? DEFAULT_STATS
    const sheet = (npc.sheet_json as { spells?: string[]; weapons?: { id: string; name: string; damage: string }[]; equipment_notes?: string } | null) ?? {}
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
      spells: sheet.spells ?? [],
      weapons: sheet.weapons ?? [],
      equipment_notes: sheet.equipment_notes ?? '',
    })
    setEditingId(npc.id)
    const suggested = calculateSuggestedHp(npc.level, npc.class ?? '', stats.con)
    setLastAutoHp(suggested)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const max_hp = toIntOrNull(form.max_hp)
      const current_hp = toIntOrNull(form.current_hp) ?? max_hp
      
      // Fallback damage expression from weapons if not set in form
      const fallbackDamage = form.weapons.length > 0 ? form.weapons[0].damage : ''
      const resolvedDamage = form.damage.trim() || fallbackDamage || null

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
        damage: resolvedDamage,
        backstory: form.backstory.trim() || null,
        notes: form.notes.trim() || null,
        is_hidden: form.is_hidden,
        sheet_json: {
          spells: form.spells,
          weapons: form.weapons,
          equipment_notes: form.equipment_notes,
        } as any,
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
            label={editingId ? t('npc.editTitle') : t('npc.generate')}
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
            <p className="text-stone-600 italic font-serif">{t('common.loading')}</p>
          ) : npcs.length === 0 ? (
            <p className="text-stone-600 italic font-serif">{t('npc.empty')}</p>
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
