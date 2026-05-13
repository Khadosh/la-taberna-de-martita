import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys, abilityModifier, modifierColor, ABILITY_LABELS, ABILITY_FULL } from '../../../lib/dnd-api'
import type { SpellDetail } from '../../../lib/dnd-api'

export const Route = createFileRoute('/_authenticated/characters/$characterId')({
  component: CharacterSheet,
})

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

function CharacterSheet() {
  const { characterId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [spellModal, setSpellModal] = useState<SpellDetail | null>(null)
  const [assigningCampaign, setAssigningCampaign] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: character, isLoading } = useQuery({
    queryKey: ['character', characterId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('id', characterId).single()
      if (error) throw error
      return data
    },
  })

  const { data: userCampaigns = [] } = useQuery({
    queryKey: ['campaigns', 'all', session.user.id],
    queryFn: async () => {
      const [gm, player] = await Promise.all([
        supabase.from('campaigns').select('id, name').eq('dm_id', session.user.id),
        supabase.from('campaign_players').select('campaigns(id, name)').eq('user_id', session.user.id),
      ])
      const gmList = gm.data ?? []
      const playerList = (player.data ?? []).flatMap(r => r.campaigns ? [r.campaigns as { id: string; name: string }] : [])
      const seen = new Set<string>()
      return [...gmList, ...playerList].filter(c => seen.has(c.id) ? false : (seen.add(c.id), true))
    },
    enabled: !!character && character.user_id === session.user.id,
  })

  const deleteCharacter = async () => {
    await supabase.from('characters').delete().eq('id', characterId)
    await queryClient.invalidateQueries({ queryKey: ['characters'] })
    navigate({ to: '/' })
  }

  const assignToCampaign = async () => {
    await supabase.from('characters').update({ campaign_id: selectedCampaignId || null }).eq('id', characterId)
    await queryClient.invalidateQueries({ queryKey: ['character', characterId] })
    setAssigningCampaign(false)
  }

  const { data: raceDetail } = useQuery({
    queryKey: dndKeys.race(character?.race ?? ''),
    queryFn: () => dndApi.race(character!.race),
    enabled: !!character?.race,
  })

  const { data: classDetail } = useQuery({
    queryKey: dndKeys.klass(character?.class ?? ''),
    queryFn: () => dndApi.klass(character!.class),
    enabled: !!character?.class,
  })

  if (isLoading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <p className="text-stone-500">Cargando...</p>
    </div>
  )

  if (!character) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <p className="text-stone-400">Personaje no encontrado.</p>
    </div>
  )

  const stats = character.stats as Record<string, number>
  const sheet = character.sheet_json as {
    skill_proficiencies?: string[]
    weapon_proficiencies?: string[]
    spells?: string[]
    saving_throws?: string[]
    hit_die?: number
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 px-8 py-4 flex items-center gap-4">
        <Link to="/" className="text-stone-400 hover:text-stone-200 transition-colors text-sm">← Dashboard</Link>
        <h1 className="text-xl font-bold text-amber-200 flex-1">{character.name}</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-stone-400 capitalize">{character.race} · {character.class} · Nv. {character.level}</div>
          {character.user_id === session.user.id && (
            assigningCampaign ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  className="px-3 py-1 text-sm rounded-lg bg-stone-800 border border-stone-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Sin campaña</option>
                  {userCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={assignToCampaign} className="px-3 py-1 text-sm bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors">Guardar</button>
                <button onClick={() => setAssigningCampaign(false)} className="text-stone-500 hover:text-stone-300 text-sm">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setAssigningCampaign(true); setSelectedCampaignId(character.campaign_id ?? '') }}
                className="text-xs px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 transition-colors"
              >
                {character.campaign_id ? '✎ Campaña' : '+ Asignar campaña'}
              </button>
            )
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-8">

        {/* Ability scores */}
        <section>
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Atributos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {STAT_KEYS.map(k => (
              <div key={k} className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
                <p className="text-xs text-stone-500 mb-1">{ABILITY_LABELS[k]}</p>
                <p className="text-2xl font-bold">{stats[k] ?? '—'}</p>
                <p className={`text-sm font-mono ${stats[k] ? modifierColor(stats[k]) : 'text-stone-400'}`}>{stats[k] ? abilityModifier(stats[k]) : ''}</p>
                <p className="text-xs text-stone-600 mt-1">{ABILITY_FULL[k]}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Combat info */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Combate</h2>
            <div className="bg-stone-900 border border-stone-800 rounded-xl divide-y divide-stone-800">
              <InfoRow label="Dado de golpe" value={`d${sheet.hit_die ?? classDetail?.hit_die ?? '?'}`} />
              <InfoRow label="PV máximos" value={`${(sheet.hit_die ?? classDetail?.hit_die ?? 8) + Math.floor((stats.con - 10) / 2)}`} />
              <InfoRow label="Tiradas de salvación" value={sheet.saving_throws?.join(', ') ?? '—'} capitalize />
            </div>
          </section>

          {/* Proficiencies */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Competencias de armas/armadura</h2>
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-wrap gap-2">
              {(sheet.weapon_proficiencies ?? []).length > 0
                ? sheet.weapon_proficiencies!.map(p => (
                  <span key={p} className="px-2 py-1 text-xs rounded bg-stone-800 border border-stone-700 text-stone-300 capitalize">
                    {p.replace(/-/g, ' ')}
                  </span>
                ))
                : <p className="text-stone-500 text-sm">—</p>}
            </div>
          </section>
        </div>

        {/* Skill proficiencies */}
        {(sheet.skill_proficiencies ?? []).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Pericias de habilidad</h2>
            <div className="flex flex-wrap gap-2">
              {sheet.skill_proficiencies!.map(p => (
                <span key={p} className="px-3 py-1.5 text-sm rounded-lg bg-amber-900/40 border border-amber-800/50 text-amber-200 capitalize">
                  {p.replace('skill-', '').replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Spells */}
        {(sheet.spells ?? []).length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Hechizos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sheet.spells!.map(spellIndex => (
                <SpellBadge key={spellIndex} index={spellIndex} onInfo={setSpellModal} />
              ))}
            </div>
          </section>
        )}

        {/* Backstory */}
        {character.backstory && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Historia</h2>
            <p className="text-stone-300 text-sm leading-relaxed bg-stone-900 border border-stone-800 rounded-xl p-4">
              {character.backstory}
            </p>
          </section>
        )}

        {/* Racial traits */}
        {raceDetail && raceDetail.traits.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Rasgos raciales</h2>
            <div className="flex flex-wrap gap-2">
              {raceDetail.traits.map(t => (
                <span key={t.index} className="px-2 py-1 text-xs rounded bg-stone-800 border border-stone-700 text-stone-300">{t.name}</span>
              ))}
            </div>
          </section>
        )}
        {/* Delete */}
        {character.user_id === session.user.id && !character.campaign_id && (
          <section className="pt-4 border-t border-stone-800">
            {confirmDelete ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-stone-400 flex-1">¿Seguro? Esta acción no se puede deshacer.</p>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm rounded-lg border border-stone-700 text-stone-400 hover:bg-stone-800 transition-colors">
                  Cancelar
                </button>
                <button onClick={deleteCharacter} className="px-3 py-1.5 text-sm rounded-lg bg-red-900 hover:bg-red-800 text-red-200 transition-colors">
                  Eliminar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-stone-600 hover:text-red-400 transition-colors"
              >
                Eliminar personaje
              </button>
            )}
          </section>
        )}
      </main>

      {/* Spell modal */}
      {spellModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSpellModal(null)}>
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-amber-200">{spellModal.name}</h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Nv. {spellModal.level} · {spellModal.school.name} · {spellModal.casting_time}
                </p>
              </div>
              <button onClick={() => setSpellModal(null)} className="text-stone-500 hover:text-stone-300 text-lg">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-400">
              <span>Alcance: {spellModal.range}</span>
              <span>Duración: {spellModal.duration}</span>
              <span>Componentes: {spellModal.components.join(', ')}</span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed max-h-48 overflow-y-auto">{spellModal.desc[0]}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SpellBadge({ index, onInfo }: { index: string; onInfo: (s: SpellDetail) => void }) {
  const { data: spell } = useQuery({
    queryKey: dndKeys.spell(index),
    queryFn: () => dndApi.spell(index),
  })

  return (
    <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-lg px-3 py-2">
      <span className="text-sm text-stone-300 flex-1 capitalize">{index.replace(/-/g, ' ')}</span>
      {spell && (
        <button
          onClick={() => onInfo(spell)}
          className="text-stone-500 hover:text-amber-400 transition-colors text-xs ml-1"
          title="Ver descripción"
        >
          ℹ
        </button>
      )}
    </div>
  )
}

function InfoRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-stone-400">{label}</span>
      <span className={`text-stone-200 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  )
}
