import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from './-coming-soon'
import { parchmentStyle } from './$campaignId'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/habilidades')({
  component: HabilidadesTab,
})

function HabilidadesTab() {
  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto text-stone-900 bg-stone-950" style={parchmentStyle}>
      <ComingSoon
        icon="🧠"
        title="Habilidades"
        lines={[
          'Referencia rápida para el DM: 18 skills, saving throws, condiciones y descansos.',
          'Roadmap: tarjetas explicativas, cuándo aplicar cada condición, atajos de descanso corto/largo.',
        ]}
      />
    </div>
  )
}
