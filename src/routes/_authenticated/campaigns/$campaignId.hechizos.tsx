import { createFileRoute, Link } from '@tanstack/react-router'
import { ComingSoon } from './-coming-soon'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/hechizos')({
  component: HechizosTab,
})

function HechizosTab() {
  return (
    <ComingSoon
      icon="✨"
      title="Hechizos"
      lines={[
        'Próximamente: compendio embebido con filtros por clase y nivel, dentro del hub.',
      ]}
      footer={
        <Link
          to="/spellbook"
          className="inline-block mt-4 px-4 py-2 rounded bg-stone-900 text-amber-100 text-sm font-serif hover:bg-stone-800 transition-colors"
        >
          Abrir compendio global →
        </Link>
      }
    />
  )
}
