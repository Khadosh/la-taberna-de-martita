import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { CLASS_ICONS } from '../../../lib/class-meta'
import type { Tables, TablesInsert } from '../../../lib/database.types'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/pnj')({
  component: PnjGenerator,
})

type Npc = Tables<'npcs'>
type Stats = { str: number; dex: number; con: number; int: number; wis: number; cha: number }

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const STAT_LABELS: Record<typeof STAT_KEYS[number], string> = {
  str: 'Fuerza', dex: 'Destreza', con: 'Constitución',
  int: 'Inteligencia', wis: 'Sabiduría', cha: 'Carisma',
}
const ROLES = [
  { value: 'antagonist', label: 'Antagonista', color: 'bg-red-900/30 border-red-800/40 text-red-900' },
  { value: 'ally', label: 'Aliado', color: 'bg-green-900/20 border-green-800/40 text-green-900' },
  { value: 'neutral', label: 'Neutral', color: 'bg-stone-200 border-stone-400 text-stone-700' },
] as const
const CLASS_OPTIONS = Object.keys(CLASS_ICONS)

const DEFAULT_STATS: Stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
const EMPTY_FORM = (): NpcForm => ({
  name: '', race: '', class: '', level: 1, role: 'antagonist',
  stats: { ...DEFAULT_STATS },
  max_hp: '', current_hp: '', armor_class: '',
  attack_bonus: '', damage: '',
  backstory: '', notes: '', is_hidden: false,
})

type NpcForm = {
  name: string
  race: string
  class: string
  level: number
  role: 'antagonist' | 'ally' | 'neutral'
  stats: Stats
  max_hp: string
  current_hp: string
  armor_class: string
  attack_bonus: string
  damage: string
  backstory: string
  notes: string
  is_hidden: boolean
}

const abilityMod = (score: number) => Math.floor((score - 10) / 2)
const formatMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`)
const toIntOrNull = (s: string): number | null => {
  const t = s.trim()
  if (!t) return null
  const n = parseInt(t, 10)
  return isNaN(n) ? null : n
}
const rollOneStat = () => {
  const rolls = [0, 0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6))
  rolls.sort((a, b) => a - b)
  return rolls[1] + rolls[2] + rolls[3] // drop lowest
}
const rollAllStats = (): Stats => ({
  str: rollOneStat(), dex: rollOneStat(), con: rollOneStat(),
  int: rollOneStat(), wis: rollOneStat(), cha: rollOneStat(),
})

function PnjGenerator() {
  const { campaignId } = Route.useParams()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<NpcForm>(EMPTY_FORM())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data: npcs = [], isLoading } = useQuery({
    queryKey: ['campaign-npcs', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
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
        race: form.race.trim() || null,
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
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-10">

      {/* Form */}
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

        <Frame>
          <div className="p-5 space-y-5">

            {/* Identidad */}
            <Block label="Identidad">
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
                <Field label="Nombre *" required>
                  <input
                    value={form.name}
                    onChange={e => patchForm('name', e.target.value)}
                    placeholder="Lord Vekrath"
                    className={inputClass}
                  />
                </Field>
                <Field label="Raza">
                  <input
                    value={form.race}
                    onChange={e => patchForm('race', e.target.value)}
                    placeholder="Humano, Goblin..."
                    className={inputClass}
                  />
                </Field>
                <Field label="Nivel">
                  <input
                    type="number" min={1} max={20}
                    value={form.level}
                    onChange={e => patchForm('level', Math.max(1, parseInt(e.target.value) || 1))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3 mt-3">
                <Field label="Clase">
                  <select
                    value={form.class}
                    onChange={e => patchForm('class', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">— ninguna —</option>
                    {CLASS_OPTIONS.map(c => (
                      <option key={c} value={c}>{CLASS_ICONS[c]} {c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Rol">
                  <div className="flex gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => patchForm('role', r.value)}
                        className={`flex-1 px-3 py-2 text-sm font-serif border transition-colors ${
                          form.role === r.value ? r.color : 'bg-amber-50 border-stone-300/50 text-stone-500 hover:border-stone-500'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </Block>

            {/* Stats */}
            <Block
              label="Características"
              right={
                <button
                  type="button"
                  onClick={() => patchForm('stats', rollAllStats())}
                  className="text-xs px-3 py-1 bg-stone-900 text-amber-100 hover:bg-stone-800 transition-colors font-serif"
                >
                  🎲 Tirar (4d6dl)
                </button>
              }
            >
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {STAT_KEYS.map(k => (
                  <div key={k} className="flex flex-col items-center bg-amber-100/60 border border-stone-400/40 py-2 px-1">
                    <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase">{k}</p>
                    <input
                      type="number" min={1} max={30}
                      value={form.stats[k]}
                      onChange={e => patchStat(k, Math.max(1, parseInt(e.target.value) || 10))}
                      className="w-12 text-center bg-transparent text-lg font-bold text-stone-900 focus:outline-none focus:bg-amber-200/60"
                    />
                    <p className="text-[10px] font-mono text-stone-700">{formatMod(abilityMod(form.stats[k]))}</p>
                    <p className="text-[8px] italic text-stone-500 mt-0.5 leading-none">{STAT_LABELS[k]}</p>
                  </div>
                ))}
              </div>
            </Block>

            {/* Combate */}
            <Block label="Combate">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Field label="HP máx.">
                  <input value={form.max_hp} onChange={e => patchForm('max_hp', e.target.value)}
                    placeholder="—" inputMode="numeric" className={inputClass} />
                </Field>
                <Field label="CA">
                  <input value={form.armor_class} onChange={e => patchForm('armor_class', e.target.value)}
                    placeholder="—" inputMode="numeric" className={inputClass} />
                </Field>
                <Field label="Bono ataque">
                  <input value={form.attack_bonus} onChange={e => patchForm('attack_bonus', e.target.value)}
                    placeholder="—" inputMode="numeric" className={inputClass} />
                </Field>
                <Field label="Daño">
                  <input value={form.damage} onChange={e => patchForm('damage', e.target.value)}
                    placeholder="1d8+2" className={inputClass} />
                </Field>
              </div>
            </Block>

            {/* Notas */}
            <Block label="Notas">
              <div className="space-y-3">
                <Field label="Trasfondo (visible al party si no está oculto)">
                  <textarea value={form.backstory} onChange={e => patchForm('backstory', e.target.value)}
                    rows={2} placeholder="Capitán de la guardia del duque..."
                    className={`${inputClass} resize-none`} />
                </Field>
                <Field label="Notas privadas del DM">
                  <textarea value={form.notes} onChange={e => patchForm('notes', e.target.value)}
                    rows={2} placeholder="Recordar que tiene una hermana en la ciudad..."
                    className={`${inputClass} resize-none`} />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_hidden}
                    onChange={e => patchForm('is_hidden', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-serif text-stone-700">Oculto al party (villano sorpresa)</span>
                </label>
              </div>
            </Block>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-400/30">
              {editingId && (
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 text-sm font-serif text-stone-600 hover:text-stone-900 transition-colors">
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={!form.name.trim() || saving}
                className="px-5 py-2 text-sm font-serif bg-stone-900 text-amber-100 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Guardando…' : editingId ? 'Actualizar PNJ' : 'Crear PNJ'}
              </button>
            </div>

          </div>
        </Frame>
      </section>

      {/* Lista */}
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

    </main>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function NpcCard({
  npc, onEdit, onDelete, confirmingDelete, onCancelDelete, onConfirmDelete,
}: {
  npc: Npc
  onEdit: () => void
  onDelete: () => void
  confirmingDelete: boolean
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  const stats = npc.stats as Stats | null
  const role = ROLES.find(r => r.value === npc.role)
  const icon = npc.class ? CLASS_ICONS[npc.class] : '👤'

  return (
    <Frame>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {role && (
              <span className={`inline-block text-[10px] font-serif tracking-wide px-2 py-0.5 border ${role.color} mb-1`}>
                {role.label}
              </span>
            )}
            {npc.is_hidden && (
              <span className="ml-1 inline-block text-[10px] font-serif tracking-wide px-2 py-0.5 border border-stone-700 text-stone-700 bg-stone-200 mb-1">
                oculto
              </span>
            )}
            <h3 className="text-lg font-display font-bold text-stone-900 leading-tight truncate">{npc.name}</h3>
            {(npc.race || npc.class || npc.level) && (
              <p className="text-xs italic text-stone-600 capitalize">
                {[npc.race, npc.class, `Nv. ${npc.level}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className="text-2xl shrink-0">{icon}</span>
        </div>

        {(npc.max_hp != null || npc.armor_class != null) && (
          <div className="flex items-center gap-3 text-sm font-mono text-stone-800">
            {npc.max_hp != null && <span>❤ {npc.current_hp ?? npc.max_hp}/{npc.max_hp}</span>}
            {npc.armor_class != null && <span>🛡 {npc.armor_class}</span>}
            {npc.attack_bonus != null && <span>⚔ {formatMod(npc.attack_bonus)}</span>}
            {npc.damage && <span className="text-stone-600">{npc.damage}</span>}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-6 gap-1">
            {STAT_KEYS.map(k => (
              <div key={k} className="text-center bg-amber-100/40 border border-stone-400/30 py-0.5">
                <p className="text-[8px] font-display tracking-wider text-stone-700 uppercase">{k}</p>
                <p className="text-[11px] font-mono text-stone-900">{formatMod(abilityMod(stats[k]))}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-400/30">
          {confirmingDelete ? (
            <>
              <span className="text-xs italic text-stone-700 mr-auto">¿Eliminar?</span>
              <button onClick={onCancelDelete} className="text-xs text-stone-600 hover:text-stone-900 font-serif">Cancelar</button>
              <button onClick={onConfirmDelete} className="text-xs px-2.5 py-1 bg-red-900 text-red-100 hover:bg-red-800 font-serif transition-colors">
                Eliminar
              </button>
            </>
          ) : (
            <>
              <button onClick={onDelete} className="text-xs text-stone-500 hover:text-red-800 font-serif">eliminar</button>
              <button onClick={onEdit} className="text-xs px-3 py-1 bg-stone-900 text-amber-100 hover:bg-stone-800 font-serif transition-colors">
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </Frame>
  )
}

// ── UI primitives ────────────────────────────────────────────────────────────

const inputClass =
  'w-full px-2 py-1.5 bg-amber-50 border border-stone-400/40 text-stone-900 text-sm font-serif focus:outline-none focus:border-stone-700 focus:bg-white'

function SectionHeader({ icon, label, extra }: { icon: string; label: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-400/40">
      <span className="text-lg">{icon}</span>
      <h2 className="text-sm font-display tracking-[0.25em] uppercase text-stone-700 flex-1">{label}</h2>
      {extra}
    </div>
  )
}

function Block({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-display tracking-[0.25em] uppercase text-stone-600">{label}</p>
        {right}
      </div>
      {children}
    </div>
  )
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={`block text-[10px] font-serif tracking-wide uppercase mb-1 ${required ? 'text-stone-900' : 'text-stone-600'}`}>
        {label}
      </span>
      {children}
    </label>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ background: 'rgba(255, 248, 230, 0.6)' }}>
      <span className="absolute -top-[3px] -left-[3px] w-3 h-3 border-t-2 border-l-2 border-stone-900" />
      <span className="absolute -top-[3px] -right-[3px] w-3 h-3 border-t-2 border-r-2 border-stone-900" />
      <span className="absolute -bottom-[3px] -left-[3px] w-3 h-3 border-b-2 border-l-2 border-stone-900" />
      <span className="absolute -bottom-[3px] -right-[3px] w-3 h-3 border-b-2 border-r-2 border-stone-900" />
      <div className="border border-stone-400/30">{children}</div>
    </div>
  )
}
