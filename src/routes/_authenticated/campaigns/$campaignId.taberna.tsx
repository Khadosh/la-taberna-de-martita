import { createFileRoute } from '@tanstack/react-router'
import { ComingSoon } from './-coming-soon'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/taberna')({
  component: () => (
    <ComingSoon
      icon="🍺"
      title="Taberna"
      lines={[
        'Tiendas con economía: armería, pociones, objetos mágicos con precios y pesos.',
        'Roadmap: catálogos predefinidos, "vender al party" que mueva oro y items al PJ.',
      ]}
    />
  ),
})
