import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { abilityModifier, modifierColor, ABILITY_LABELS } from '../lib/dnd-api'
import { CLASS_ICONS, CLASS_COLORS } from '../lib/class-meta'
import { LandingPage } from '../components/landing-page'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const { session } = Route.useRouteContext() as { session: Session | null }

  if (!session) {
    return <LandingPage />
  }

  return <Dashboard session={session} />
}

function Dashboard({ session }: { session: Session }) {
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
    <div className="min-h-screen bg-stone-tavern text-stone-100">
      {/* Dynamic Title for Authenticated User */}
      <title>La Taberna — Tu Tablero de D&D</title>

      {/* Header */}
      <header className="border-b border-stone-800/80 px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-2" style={headerStyle}>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <img src="/favicon.svg" alt="" className="w-7 h-7" />
          <div className="hidden sm:block">
            <h1 className="font-display text-amber-200/90 text-base leading-tight tracking-wide">La Taberna</h1>
            <p className="font-display text-amber-500/80 text-[0.6rem] tracking-[0.3em] uppercase leading-none">de Martita</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/characters/new"
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-serif border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-stone-100 transition-colors whitespace-nowrap">
            + Personaje
          </Link>
          <Link to="/campaigns/new"
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-serif border border-amber-800/60 hover:border-amber-600 text-amber-400/80 hover:text-amber-300 transition-colors whitespace-nowrap">
            + Campaña
          </Link>
          <div className="hidden sm:block w-px h-5 bg-stone-800" />
          <Link to="/bestiary"
            className="hidden sm:block text-xs text-stone-600 hover:text-stone-400 transition-colors font-serif whitespace-nowrap">
            Bestiario
          </Link>
          <Link to="/spellbook"
            className="hidden sm:block text-xs text-stone-600 hover:text-stone-400 transition-colors font-serif whitespace-nowrap">
            Conjuros
          </Link>
          <button onClick={() => supabase.auth.signOut()}
            className="hidden sm:block text-xs text-stone-600 hover:text-stone-400 transition-colors font-serif italic whitespace-nowrap">
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-12">

        {/* Characters */}
        <section className="space-y-5">
          <SectionHeader label="Tus personajes" />
          {loadingChars ? (
            <p className="text-stone-600 text-sm font-serif italic">Consultando los pergaminos...</p>
          ) : characters.length === 0 ? (
            <EmptyState>
              Todavía no tenés personajes.{' '}
              <Link to="/characters/new" className="text-amber-500/80 hover:text-amber-400 underline underline-offset-2">Crear uno</Link>
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map(c => <CharacterCard key={c.id} character={c} />)}
            </ul>
          )}
        </section>

        {/* GM campaigns */}
        <section className="space-y-5">
          <SectionHeader label="Campañas · Game Master" />
          {loadingGm ? (
            <p className="text-stone-600 text-sm font-serif italic">Cargando...</p>
          ) : gmCampaigns.length === 0 ? (
            <EmptyState>No dirigís ninguna campaña.{' '}
              <Link to="/campaigns/new" className="text-amber-500/80 hover:text-amber-400 underline underline-offset-2">Crear una</Link>
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {gmCampaigns.map(c => <CampaignCard key={c.id} campaign={c} role="gm" />)}
            </ul>
          )}
        </section>

        {/* Player campaigns */}
        <section className="space-y-5">
          <SectionHeader label="Campañas · Jugador" />
          {loadingPlayer ? (
            <p className="text-stone-600 text-sm font-serif italic">Cargando...</p>
          ) : playerCampaigns.length === 0 ? (
            <EmptyState>No estás en ninguna campaña como jugador.</EmptyState>
          ) : (
            <ul className="space-y-2">
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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-stone-800" />
      <p className="text-xs font-display tracking-widest text-stone-500 uppercase whitespace-nowrap">{label}</p>
      <div className="h-px flex-1 bg-stone-800" />
    </div>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-stone-600 text-sm font-serif italic px-1">{children}</p>
  )
}

function CharacterCard({ character }: { character: Tables<'characters'> }) {
  const stats = character.stats as Record<string, number>
  const borderColor = CLASS_COLORS[character.class] ?? 'border-stone-700'
  const icon = CLASS_ICONS[character.class] ?? '🎲'
  const conMod = Math.floor(((stats.con ?? 10) - 10) / 2)
  const hitDie = (character.sheet_json as { hit_die?: number })?.hit_die ?? 8
  const maxHp = hitDie + conMod
  const hpPct = character.current_hp != null
    ? Math.max(0, Math.min(100, (character.current_hp / Math.max(1, maxHp)) * 100))
    : 100

  return (
    <li className={`border-l-2 ${borderColor} overflow-hidden`} style={cardStyle}>
      <Link to="/characters/$characterId" params={{ characterId: character.id }} className="block p-4 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-stone-100 text-sm leading-tight">{character.name}</p>
            <p className="text-xs text-stone-500 mt-0.5 capitalize font-serif">
              {character.race} · {character.class} · Nv. {character.level}
            </p>
          </div>
          {icon.startsWith('/') ? (
            <img
              src={icon}
              className="w-10 h-10 rounded-full border border-tavern-gold/40 bg-stone-950 object-cover object-center shrink-0 mt-0.5"
              alt=""
            />
          ) : (
            <span className="text-xl leading-none mt-0.5">{icon}</span>
          )}
        </div>
        <div className="grid grid-cols-6 gap-1">
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(k => (
            <div key={k} className="text-center">
              <p className="text-[10px] text-stone-600 uppercase tracking-wider">{ABILITY_LABELS[k]}</p>
              <p className="text-sm font-mono font-bold text-stone-200">{stats[k] ?? '—'}</p>
              <p className={`text-[10px] ${stats[k] ? modifierColor(stats[k]) : 'text-stone-600'}`}>{stats[k] ? abilityModifier(stats[k]) : ''}</p>
            </div>
          ))}
        </div>
        {/* HP mini bar */}
        {character.current_hp != null && (
          <div className="mt-3 h-0.5 bg-stone-800 overflow-hidden">
            <div
              className={`h-full transition-all ${hpPct > 50 ? 'bg-green-800' : hpPct > 25 ? 'bg-amber-700' : 'bg-red-800'}`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        )}
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
    <li style={cardStyle} className="overflow-hidden">
      <Link to="/campaigns/$campaignId" params={{ campaignId: campaign.id }}
        className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
        <div>
          <p className="text-sm font-medium text-stone-200">{campaign.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {role === 'gm' && <span className="text-[10px] text-amber-500 font-display tracking-wider uppercase">Game Master</span>}
            {joinedAt && <span className="text-[10px] text-stone-600 font-serif">Unido el {new Date(joinedAt).toLocaleDateString()}</span>}
          </div>
        </div>
        {role === 'gm' && (
          <button
            onClick={copyInviteLink}
            className="text-xs px-3 py-1.5 border border-stone-800 hover:border-stone-600 text-stone-500 hover:text-stone-300 transition-colors font-serif min-w-[96px] text-center">
            {copied ? '¡Copiado!' : 'Copiar invite'}
          </button>
        )}
      </Link>
    </li>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #100c08 0%, #0c0a08 100%)',
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.06)',
}
