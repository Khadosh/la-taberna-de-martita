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
        .select('*, profiles!characters_user_id_profiles_id_fk(username)')
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
                const playerName = (c as unknown as { profiles: { username: string | null } | null }).profiles?.username
                const isOwn = c.user_id === session.user.id
                const canSeeFullSheet = isGm || isOwn
                const conMod = Math.floor(((stats.con ?? 10) - 10) / 2)
                const hitDie = (c.sheet_json as { hit_die?: number })?.hit_die ?? 8
                const sheetMaxHp = (c.sheet_json as { max_hp?: number })?.max_hp
                const estimatedMax = (hitDie + conMod) + (c.level - 1) * (Math.floor(hitDie / 2) + 1 + conMod)
                const maxHp = sheetMaxHp ?? Math.max(estimatedMax, c.current_hp ?? 0)
                const hpPct = c.current_hp != null ? Math.max(0, Math.min((c.current_hp / maxHp) * 100, 100)) : null
                const ac = c.armor_class ?? (10 + Math.floor(((stats.dex ?? 10) - 10) / 2))

                const cardInner = (
                  <>
                    {playerName && (
                      <p className="text-[10px] text-stone-500 font-serif tracking-wider uppercase mb-1">
                        {isOwn ? '— tu personaje —' : `Jugador: ${playerName}`}
                      </p>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-stone-100">{c.name}</p>
                        <p className="text-xs text-stone-400 capitalize mt-0.5">{c.race} · {c.class} · Nv. {c.level}</p>
                      </div>
                      <span className="text-2xl">{icon}</span>
                    </div>
                    {/* HP bar — always visible */}
                    {hpPct != null && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-xs text-stone-500">PV</span>
                        <div className="flex-1 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'}`} style={{ width: `${hpPct}%` }} />
                        </div>
                        {canSeeFullSheet
                          ? <span className="text-xs font-mono text-stone-400">{c.current_hp}/{maxHp}</span>
                          : <span className="text-xs text-stone-500">{hpPct > 50 ? 'bien' : hpPct > 25 ? 'herido' : 'crítico'}</span>
                        }
                        <span className="text-xs font-mono text-stone-500 bg-stone-800 px-1.5 py-0.5 rounded">CA {ac}</span>
                      </div>
                    )}
                    {/* Full stats — only for GM or own character */}
                    {canSeeFullSheet && (
                      <>
                        <div className="grid grid-cols-6 gap-1 mt-2">
                          {STAT_KEYS.map(k => (
                            <div key={k} className="text-center">
                              <p className="text-xs text-stone-500">{ABILITY_LABELS[k]}</p>
                              <p className="text-sm font-mono font-bold">{stats[k] ?? '—'}</p>
                              <p className="text-xs text-amber-400">{stats[k] ? abilityModifier(stats[k]) : ''}</p>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const currency = (c.sheet_json as { currency?: { gold: number } })?.currency
                          if (!currency?.gold) return null
                          return <p className="text-xs font-mono text-amber-400 mt-1.5">{currency.gold} PO</p>
                        })()}
                      </>
                    )}
                  </>
                )

                return (
                  <li key={c.id}>
                    {canSeeFullSheet ? (
                      <Link
                        to="/characters/$characterId"
                        params={{ characterId: c.id }}
                        className="block bg-stone-900 border border-stone-800 rounded-xl p-4 hover:bg-stone-800/50 transition-colors"
                      >
                        {cardInner}
                      </Link>
                    ) : (
                      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                        {cardInner}
                      </div>
                    )}
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
