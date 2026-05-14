import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from './-coming-soon'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/habilidades')({
  component: () => (
    <ComingSoon
      icon="😊"
      title="Habilidades"
      lines={[
        'Referencia rápida para el DM: 18 skills, saving throws, condiciones y descansos.',
        'Roadmap: tarjetas explicativas, cuándo aplicar cada condición, atajos de descanso corto/largo.',
      ]}
    />
  ),
})
