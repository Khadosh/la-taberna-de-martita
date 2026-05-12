import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export const Route = createFileRoute('/_authenticated/join/$campaignId')({
  component: JoinCampaign,
})

function JoinCampaign() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: membership } = useQuery({
    queryKey: ['membership', campaignId, session.user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('campaign_players')
        .select('campaign_id')
        .eq('campaign_id', campaignId)
        .eq('user_id', session.user.id)
        .maybeSingle()
      return data
    },
  })

  const isGm = campaign?.dm_id === session.user.id
  const isAlreadyMember = isGm || !!membership

  const handleJoin = async () => {
    setJoining(true)
    setError(null)
    const { error } = await supabase
      .from('campaign_players')
      .insert({ campaign_id: campaignId, user_id: session.user.id })
    if (error) {
      setError(error.message)
      setJoining(false)
      return
    }
    await queryClient.invalidateQueries({ queryKey: ['campaigns', 'player'] })
    navigate({ to: '/' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500">Cargando...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-stone-300">Campaña no encontrada.</p>
          <button onClick={() => navigate({ to: '/' })} className="text-sm text-amber-400 hover:text-amber-300">
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8 text-center">
        <h1 className="text-2xl font-bold text-amber-200">{campaign.name}</h1>

        {isAlreadyMember ? (
          <div className="space-y-4">
            <p className="text-stone-400">
              {isGm ? 'Sos el GM de esta campaña.' : 'Ya sos parte de esta campaña.'}
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
            >
              Ir al dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-stone-400">Fuiste invitado a unirte a esta campaña.</p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {joining ? '...' : 'Unirse a la campaña'}
            </button>
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-full text-sm text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
