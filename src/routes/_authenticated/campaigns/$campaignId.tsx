import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { ABILITY_LABELS, abilityModifier } from '../../../lib/dnd-api'
import { CLASS_ICONS } from '../../../lib/class-meta'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId')({
  component: CampaignDetail,
})

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

function CampaignDetail() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const [copied, setCopied] = useState(false)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
      if (error) throw error
      return data
    },
  })

  const { data: players = [] } = useQuery({
    queryKey: ['campaign-players', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_players')
        .select('user_id, joined_at, profiles(username, avatar_url)')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data
    },
    enabled: !!campaign,
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId)
      if (error) throw error
      return data
    },
    enabled: !!campaign,
  })

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${campaignId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <p className="text-stone-500">Cargando...</p>
    </div>
  )

  if (!campaign) return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <p className="text-stone-400">Campaña no encontrada.</p>
    </div>
  )

  const isGm = campaign.dm_id === session.user.id

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 px-8 py-4 flex items-center gap-4">
        <Link to="/" className="text-stone-400 hover:text-stone-200 transition-colors text-sm">← Dashboard</Link>
        <h1 className="text-xl font-bold text-amber-200 flex-1">{campaign.name}</h1>
        {isGm && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-amber-600 font-medium">Game Master</span>
            <button
              onClick={copyInvite}
              className="px-3 py-1.5 text-sm rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors min-w-[110px] text-center"
            >
              {copied ? '¡Copiado!' : 'Copiar invite'}
            </button>
            <Link
              to="/campaigns/$campaignId/session"
              params={{ campaignId }}
              className="px-3 py-1.5 text-sm rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-100 transition-colors"
            >
              ⚔ Pantalla DM
            </Link>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10 space-y-10">

        {/* Players */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">
            Jugadores · {players.length}
          </h2>
          {players.length === 0 ? (
            <p className="text-stone-500 text-sm">Nadie se unió todavía. Compartí el link de invite.</p>
          ) : (
            <ul className="space-y-2">
              {players.map(p => (
                <li key={p.user_id} className="flex items-center gap-3 px-4 py-3 bg-stone-900 border border-stone-800 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-sm font-bold text-stone-300">
                    {(p.profiles as { username: string | null } | null)?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm text-stone-200">
                      {(p.profiles as { username: string | null } | null)?.username ?? 'Sin nombre'}
                      {p.user_id === campaign.dm_id && <span className="ml-2 text-xs text-amber-600">GM</span>}
                    </p>
                    <p className="text-xs text-stone-500">Unido el {new Date(p.joined_at!).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Characters in campaign */}
        {characters.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider">Personajes</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map(c => {
                const stats = c.stats as Record<string, number>
                const icon = CLASS_ICONS[c.class] ?? '🎲'
                return (
                  <li key={c.id}>
                    <Link
                      to="/characters/$characterId"
                      params={{ characterId: c.id }}
                      className="block bg-stone-900 border border-stone-800 rounded-xl p-4 hover:bg-stone-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-stone-100">{c.name}</p>
                          <p className="text-xs text-stone-400 capitalize mt-0.5">{c.race} · {c.class} · Nv. {c.level}</p>
                        </div>
                        <span className="text-2xl">{icon}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {STAT_KEYS.map(k => (
                          <div key={k} className="text-center">
                            <p className="text-xs text-stone-500">{ABILITY_LABELS[k]}</p>
                            <p className="text-sm font-mono font-bold">{stats[k] ?? '—'}</p>
                            <p className="text-xs text-amber-400">{stats[k] ? abilityModifier(stats[k]) : ''}</p>
                          </div>
                        ))}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

      </main>
    </div>
  )
}
