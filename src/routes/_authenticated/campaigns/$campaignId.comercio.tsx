import { createFileRoute } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { CustomItemsTab } from '../../../components/campaigns/custom-items-tab'
import { ComercioBuyTab } from '../../../components/campaigns/comercio/comercio-buy-tab'
import { ComercioSellTab } from '../../../components/campaigns/comercio/comercio-sell-tab'
import { useComercio, type TabMode } from '../../../components/campaigns/comercio/use-comercio'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/comercio')({
  component: Comercio,
})

const TAB_BASE = 'px-4 py-2 text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px]'
const TAB_ACTIVE = 'border-parchment-sienna text-parchment-sienna font-bold'
const TAB_IDLE = 'border-transparent text-stone-500 hover:text-stone-800'

function Comercio() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const c = useComercio(campaignId, session)

  const tab = (mode: TabMode, label: string) => (
    <button
      onClick={() => c.switchTab(mode)}
      className={`${TAB_BASE} ${c.tabMode === mode ? TAB_ACTIVE : TAB_IDLE}`}
    >
      {label}
    </button>
  )

  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-10 my-4 relative">
        <span className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-2 border-l-2 border-stone-900" />
        <span className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-2 border-r-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-2 border-l-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-2 border-r-2 border-stone-900" />

        <div className="relative h-44 sm:h-52 w-full mb-8 overflow-hidden rounded-lg border border-stone-800 shadow-2xl bg-stone-950">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-950/30 via-stone-950 to-stone-950" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,90,40,0.04)_1px,_transparent_1px)_0_0_/_16px_16px]" />
          <div className="absolute bottom-6 left-6 z-10 space-y-1">
            <span className="text-[10px] tracking-widest text-amber-500 font-serif uppercase font-bold">Mercado de la Campaña</span>
            <h2 className="text-3xl font-display tracking-widest text-stone-100 uppercase">Comercio General</h2>
            <p className="text-xs font-serif italic text-stone-400">
              Adquiere pertrechos de aventura o vende botín a los gremios locales.
            </p>
          </div>
          <span className="absolute right-8 bottom-4 text-7xl opacity-10 pointer-events-none">⚖️</span>
        </div>

        {c.successMsg && (
          <div className="mb-6 px-4 py-3 border border-green-800 bg-green-900/10 text-green-800 text-sm font-serif rounded flex items-center justify-between gap-3 shadow-md">
            <span>{c.successMsg}</span>
            <button onClick={() => c.setSuccessMsg(null)} className="text-lg leading-none text-green-850 hover:text-green-600 transition-colors">&times;</button>
          </div>
        )}

        <div className="flex gap-4 mb-6 border-b border-stone-400/40">
          {tab('comprar', '🛒 Adquirir Equipo')}
          {tab('vender', '💰 Vender Botín')}
          {c.isGm && tab('creaciones', '✦ Creaciones')}
        </div>

        {c.tabMode === 'comprar' && <ComercioBuyTab c={c} />}
        {c.tabMode === 'vender' && <ComercioSellTab c={c} />}
        {c.tabMode === 'creaciones' && (
          <CustomItemsTab campaignId={campaignId} userId={session.user.id} isDm={c.isGm} />
        )}
      </div>
    </div>
  )
}
