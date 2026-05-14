import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from './-coming-soon'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/pnj')({
  component: () => (
    <ComingSoon
      icon="👤"
      title="Generador de PNJ"
      lines={[
        'Generá personajes no jugadores con stats aleatorios y rol (antagonista, aliado, neutral).',
        'Roadmap: nombre por raza, stats 4d6 drop lowest, HP/CA derivados, guardar al hub de la campaña.',
      ]}
    />
  ),
})
