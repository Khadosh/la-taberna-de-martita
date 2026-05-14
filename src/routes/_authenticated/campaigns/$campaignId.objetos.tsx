import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from './-coming-soon'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/objetos')({
  component: () => (
    <ComingSoon
      icon="📦"
      title="Objetos"
      lines={[
        'Catálogo de equipo D&D 5e con filtros (armas, armaduras, equipo) y "dar a un PJ".',
        'Roadmap: integrar /equipment del API, items propios de campaña, transferencia al inventario del PJ.',
      ]}
    />
  ),
})
