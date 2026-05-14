import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from './-coming-soon'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/mapas')({
  component: () => (
    <ComingSoon
      icon="🗺️"
      title="Mapas"
      lines={[
        'Subir imágenes como mapa de sesión y mostrarlas al party.',
        'Roadmap v2: tokens drag-and-drop, fog of war, layers de DM.',
      ]}
    />
  ),
})
