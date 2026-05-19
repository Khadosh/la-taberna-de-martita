import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/mapas')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/campaigns/$campaignId/tablero', params })
  },
  component: () => null,
})
