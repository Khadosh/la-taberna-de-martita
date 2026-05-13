import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Tables } from '../../lib/database.types'
import { abilityModifier, ABILITY_LABELS } from '../../lib/dnd-api'
import { CLASS_ICONS, CLASS_COLORS } from '../../lib/class-meta'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

function Dashboard() {
  const { session } = Route.useRouteContext() as { session: Session }
  const userId = session.user.id

  const { data: gmCampaigns = [], isLoading: loadingGm } = useQuery({
    queryKey: ['campaigns', 'gm', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').eq('dm_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: playerCampaigns = [], isLoading: loadingPlayer } = useQuery({
    queryKey: ['campaigns', 'player', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaign_players').select('joined_at, campaigns(*)').eq('user_id', userId).order('joined_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const { data: characters = [], isLoading: loadingChars } = useQuery({
    queryKey: ['characters', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-200">The Tavern</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Link to="/characters/new" className="px-4 py-1.5 bg-stone-700 hover:bg-stone-600 text-white text-sm rounded-lg transition-colors">
              + Personaje
            </Link>
            <Link to="/campaigns/new" className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors">
              + Campaña
            </Link>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-stone-400 hover:text-stone-200 transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-12">

        {/* Characters */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-200">Tus personajes</h2>
          {loadingChars ? (
            <p className="text-stone-500 text-sm">Cargando...</p>
          ) : characters.length === 0 ? (
            <p className="text-stone-500 text-sm">
              No tenés personajes.{' '}
              <Link to="/characters/new" className="text-amber-400 hover:text-amber-300">Crear uno</Link>
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map(c => <CharacterCard key={c.id} character={c} />)}
            </ul>
          )}
        </section>

        {/* GM campaigns */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-200">Tus campañas (GM)</h2>
          {loadingGm ? (
            <p className="text-stone-500 text-sm">Cargando...</p>
          ) : gmCampaigns.length === 0 ? (
            <p className="text-stone-500 text-sm">No tenés campañas activas como GM.</p>
          ) : (
            <ul className="space-y-3">
              {gmCampaigns.map(c => <CampaignCard key={c.id} campaign={c} role="gm" />)}
            </ul>
          )}
        </section>

        {/* Player campaigns */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-200">Campañas como jugador</h2>
          {loadingPlayer ? (
            <p className="text-stone-500 text-sm">Cargando...</p>
          ) : playerCampaigns.length === 0 ? (
            <p className="text-stone-500 text-sm">No estás en ninguna campaña como jugador.</p>
          ) : (
            <ul className="space-y-3">
              {playerCampaigns.map(({ campaigns: c, joined_at }) =>
                c ? <CampaignCard key={c.id} campaign={c} role="player" joinedAt={joined_at ?? undefined} /> : null
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

function CharacterCard({ character }: { character: Tables<'characters'> }) {
  const stats = character.stats as Record<string, number>
  const borderColor = CLASS_COLORS[character.class] ?? 'border-stone-700'
  const icon = CLASS_ICONS[character.class] ?? '🎲'

  return (
    <li className={`bg-stone-900 border-l-4 ${borderColor} border border-stone-800 rounded-xl overflow-hidden`}>
      <Link to="/characters/$characterId" params={{ characterId: character.id }} className="block p-4 hover:bg-stone-800/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-stone-100">{character.name}</p>
            <p className="text-xs text-stone-400 mt-0.5 capitalize">
              {character.race} · {character.class} · Nv. {character.level}
            </p>
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(k => (
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
}

function CampaignCard({ campaign, role, joinedAt }: { campaign: Tables<'campaigns'>; role: 'gm' | 'player'; joinedAt?: string }) {
  const [copied, setCopied] = useState(false)

  const copyInviteLink = (e: React.MouseEvent) => {
    e.preventDefault()
    navigator.clipboard.writeText(`${window.location.origin}/join/${campaign.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <li className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
      <Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }} className="flex items-center justify-between px-5 py-4 hover:bg-stone-800/50 transition-colors">
        <div>
          <p className="font-medium text-stone-100">{campaign.name}</p>
          {joinedAt && <p className="text-xs text-stone-500 mt-0.5">Unido el {new Date(joinedAt).toLocaleDateString()}</p>}
          {role === 'gm' && <p className="text-xs text-amber-600 mt-0.5">Game Master</p>}
        </div>
        {role === 'gm' && (
          <button
            onClick={copyInviteLink}
            className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors min-w-[100px] text-center"
          >
            {copied ? '¡Copiado!' : 'Copiar invite'}
          </button>
        )}
      </Link>
    </li>
  )
}
