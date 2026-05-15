import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId')({
  component: CampaignLayout,
})

type TabDef = {
  to:
  | '/campaigns/$campaignId'
  | '/campaigns/$campaignId/pnj'
  | '/campaigns/$campaignId/hechizos'
  | '/campaigns/$campaignId/objetos'
  | '/campaigns/$campaignId/habilidades'
  | '/campaigns/$campaignId/taberna'
  | '/campaigns/$campaignId/lucha'
  | '/campaigns/$campaignId/mapas'
  label: string
  icon: string
  exact?: boolean
}

const TABS: TabDef[] = [
  { to: '/campaigns/$campaignId', label: 'Overview', icon: '📇' },
  { to: '/campaigns/$campaignId/pnj', label: 'Generador de PNJ', icon: '👤' },
  { to: '/campaigns/$campaignId/hechizos', label: 'Hechizos', icon: '✨' },
  { to: '/campaigns/$campaignId/objetos', label: 'Objetos', icon: '📦' },
  { to: '/campaigns/$campaignId/habilidades', label: 'Habilidades', icon: '😊' },
  { to: '/campaigns/$campaignId/taberna', label: 'Taberna', icon: '🍺' },
  { to: '/campaigns/$campaignId/lucha', label: 'Lucha', icon: '⚔️' },
  { to: '/campaigns/$campaignId/mapas', label: 'Mapas', icon: '🗺️' },
]

function CampaignLayout() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const matchRoute = useMatchRoute()
  const [copied, setCopied] = useState(false)

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

  return (
    <div className="min-h-screen text-stone-900" style={parchmentStyle}>

      {/* Header */}
      <header className="border-b-2 border-stone-900 bg-stone-950 px-4 sm:px-8 py-3 flex items-center gap-4">
        <Link to="/" className="text-amber-400 hover:text-amber-200 transition-colors text-sm font-serif shrink-0">
          ← Dashboard
        </Link>
        <div className="w-px h-5 bg-stone-700 shrink-0" />
        <h1 className="text-lg sm:text-xl font-display tracking-wide text-amber-100 flex-1 truncate">{campaign.name}</h1>
        {isGm && (
          <div className="flex gap-2 items-center">
            <button
              onClick={copyInvite}
              className="hidden sm:block px-3 py-1.5 text-xs rounded bg-stone-800/80 hover:bg-stone-700 text-stone-300 transition-colors min-w-[110px] text-center font-serif"
            >
              {copied ? '¡Copiado!' : 'Copiar invite'}
            </button>
            <Link
              to="/campaigns/$campaignId/lucha"
              params={{ campaignId }}
              className="px-3 py-1.5 text-xs sm:text-sm rounded bg-gradient-to-b from-amber-900 to-amber-950 hover:from-amber-800 hover:to-amber-900 text-amber-100 transition-colors font-serif flex items-center gap-1.5 border border-amber-700/40 shadow-sm"
            >
              <span>📖</span> Pantalla DM
            </Link>
          </div>
        )}
      </header>

      {/* Tab bar */}
      <nav className="border-b-2 border-stone-900 bg-stone-900 px-2 sm:px-6 py-1.5 overflow-x-auto">
        <ul className="flex items-center gap-1 min-w-max">
          {TABS.map(tab => {
            const isActive = matchRoute({
              to: tab.to,
              params: { campaignId },
              fuzzy: false,
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
      <Outlet />
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
