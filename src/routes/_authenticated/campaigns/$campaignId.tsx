import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { DiceModule } from '../../../lib/dice'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId')({
  component: CampaignLayout,
})

type TabDef = {
  to:
  | '/campaigns/$campaignId'
  | '/campaigns/$campaignId/pnj'
  | '/campaigns/$campaignId/hechizos'
  | '/campaigns/$campaignId/comercio'
  | '/campaigns/$campaignId/habilidades'
  | '/campaigns/$campaignId/taberna'
  | '/campaigns/$campaignId/tablero'
  label: string
  icon: string
  exact?: boolean
}

// Tabs que ve el GM (acceso completo a herramientas de dirección)
const GM_TABS: TabDef[] = [
  { to: '/campaigns/$campaignId', label: 'Overview', icon: '📇', exact: true },
  { to: '/campaigns/$campaignId/pnj', label: 'PNJs', icon: '👤' },
  { to: '/campaigns/$campaignId/tablero', label: 'Tablero', icon: '⚔️' },
  { to: '/campaigns/$campaignId/taberna', label: 'Taberna', icon: '🍺' },
  { to: '/campaigns/$campaignId/hechizos', label: 'Hechizos', icon: '✨' },
  { to: '/campaigns/$campaignId/comercio', label: 'Comercio', icon: '🏪' },
  { to: '/campaigns/$campaignId/habilidades', label: 'Habilidades', icon: '😊' },
]

// Tabs que ve el jugador (herramientas de referencia en mesa)
const PLAYER_TABS: TabDef[] = [
  { to: '/campaigns/$campaignId', label: 'Mi Party', icon: '📇', exact: true },
  { to: '/campaigns/$campaignId/tablero', label: 'Tablero', icon: '⚔️' },
  { to: '/campaigns/$campaignId/taberna', label: 'Taberna', icon: '🍺' },
  { to: '/campaigns/$campaignId/hechizos', label: 'Hechizos', icon: '✨' },
  { to: '/campaigns/$campaignId/comercio', label: 'Comercio', icon: '🏪' },
  { to: '/campaigns/$campaignId/habilidades', label: 'Habilidades', icon: '😊' },
]

function CampaignLayout() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const matchRoute = useMatchRoute()
  const [copied, setCopied] = useState(false)
  const [showDice, setShowDice] = useState(false)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
      if (error) throw error
      return data
    },
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
  const tabs = isGm ? GM_TABS : PLAYER_TABS
  const isTablero = !!matchRoute({
    to: '/campaigns/$campaignId/tablero',
    fuzzy: true,
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden text-stone-900" style={isGm ? dmStyle : parchmentStyle}>

      {/* Header */}
      <header className="border-b-2 border-stone-900 bg-stone-950 px-4 sm:px-8 py-3 flex items-center gap-4 shrink-0">
        <Link to="/" className="text-amber-400 hover:text-amber-200 transition-colors text-sm font-serif shrink-0">
          ← Dashboard
        </Link>
        <div className="w-px h-5 bg-stone-700 shrink-0" />

        {/* Campaign name + role badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-display tracking-wide text-amber-100 truncate">{campaign.name}</h1>
          {isGm ? (
            <span className="shrink-0 px-2 py-0.5 text-[10px] font-serif tracking-widest uppercase bg-amber-900/50 border border-amber-700/50 text-amber-300 rounded">
              DM
            </span>
          ) : (
            <span className="shrink-0 px-2 py-0.5 text-[10px] font-serif tracking-widest uppercase bg-stone-800 border border-stone-700 text-stone-400 rounded">
              Jugador
            </span>
          )}
        </div>

        {/* Header actions */}
        <div className="flex gap-2 items-center">
          {/* Dice: available to everyone */}
          <button
            onClick={() => setShowDice(true)}
            className="px-3 py-1.5 text-xs sm:text-sm rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 transition-colors font-serif flex items-center gap-1.5 border border-amber-700/40"
          >
            <span>🎲</span> Dados
          </button>

          {/* GM-only: copy invite */}
          {isGm && (
            <button
              onClick={copyInvite}
              className="hidden sm:block px-3 py-1.5 text-xs rounded bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors min-w-[110px] text-center font-serif"
            >
              {copied ? '¡Copiado!' : 'Copiar invite'}
            </button>
          )}
        </div>
      </header>

      {/* Tab bar — role-aware */}
      <nav className="border-b-2 border-stone-900 bg-stone-900 px-2 sm:px-6 py-1.5 overflow-x-auto shrink-0">
        <ul className="flex items-center gap-1 min-w-max">
          {tabs.map(tab => {
            const isActive = matchRoute({
              to: tab.to,
              params: { campaignId },
              fuzzy: !tab.exact,
            })
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  params={{ campaignId }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs sm:text-sm font-serif transition-colors whitespace-nowrap ${isActive
                      ? 'bg-amber-900/40 text-amber-200 border border-amber-700/40'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 border border-transparent'
                    }`}
                >
                  <span className="text-sm leading-none">{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Outlet — child renders */}
      <div className={`flex-1 ${isTablero ? 'overflow-hidden' : 'overflow-y-auto'} relative flex flex-col`}>
        <Outlet />
      </div>

      {/* Dice Module — available to all */}
      <DiceModule isOpen={showDice} onClose={() => setShowDice(false)} />
    </div>
  )
}

const parchmentStyle: React.CSSProperties = {
  background: `
    linear-gradient(rgba(120, 90, 40, 0.08) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(90deg, rgba(120, 90, 40, 0.08) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(160deg, #f5ead6 0%, #ede0c4 50%, #e8d9b8 100%)
  `,
}

const dmStyle: React.CSSProperties = {
  backgroundImage: `url('/assets/images/Fondo DM.png')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center top',
  backgroundAttachment: 'fixed',
}
