import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { PlayerTablero } from '../../../components/tablero/player-tablero'
import { useDmTablero } from '../../../components/tablero/use-dm-tablero'
import { DmTableroLayout } from '../../../components/tablero/dm-tablero-layout'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/tablero')({
  component: TableroRoute,
})

function TableroRoute() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
      if (error) throw error
      return data
    },
  })

  if (!campaign) return null
  const isGm = campaign.dm_id === session.user.id

  return isGm ? (
    <DmTablero campaignId={campaignId} session={session} />
  ) : (
    <PlayerTablero campaignId={campaignId} session={session} />
  )
}

function DmTablero({ campaignId }: { campaignId: string; session: Session }) {
  const dmState = useDmTablero(campaignId)
  return <DmTableroLayout campaignId={campaignId} dmState={dmState} />
}
