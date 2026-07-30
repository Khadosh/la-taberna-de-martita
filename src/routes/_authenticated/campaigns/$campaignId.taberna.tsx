import { createFileRoute } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { TabernaMenuList } from '../../../components/campaigns/taberna/taberna-menu-list'
import { TabernaCheckoutPanel } from '../../../components/campaigns/taberna/taberna-checkout-panel'
import { useT, type TranslationKey } from '../../../i18n'
import { useTaberna, type TabernaCategory } from '../../../components/campaigns/taberna/use-taberna'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/taberna')({
  component: Taberna,
})

/** Emoji + clave del catálogo: las categorías se declaran fuera del componente. */
const CATEGORY_LABELS: Record<TabernaCategory, { emoji: string; key: TranslationKey }> = {
  drinks: { emoji: '🍺', key: 'tavern.tab.drinks' },
  foods: { emoji: '🍲', key: 'tavern.tab.food' },
  lodging: { emoji: '🛏️', key: 'tavern.tab.lodging' },
  stables: { emoji: '🐴', key: 'tavern.tab.stables' },
}

const TAB_BASE = 'px-4 py-2.5 text-xs sm:text-sm font-display tracking-wide uppercase transition-all border-b-2 -mb-[1px]'
const TAB_ACTIVE = 'border-parchment-sienna text-parchment-sienna font-semibold'
const TAB_IDLE = 'border-transparent text-stone-500 hover:text-stone-800'

function Taberna() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const t = useT()
  const tv = useTaberna(campaignId, session)

  const hasSelection = tv.selectedService || (tv.activeCategory === 'stables' && tv.selectedStablesItem)

  return (
    <div className="w-full min-h-full flex-1 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-10 my-4 relative">
        <span className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-2 border-l-2 border-stone-900" />
        <span className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-2 border-r-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-2 border-l-2 border-stone-900" />
        <span className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-2 border-r-2 border-stone-900" />

        <div className="relative h-56 sm:h-64 w-full mb-8 overflow-hidden rounded-lg border border-stone-850 shadow-2xl bg-stone-950">
          {/* La ilustración va de fondo con un degradado encima: sin él, el texto
              claro queda ilegible sobre el fuego del hogar. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(100deg, rgba(12,10,9,0.92) 20%, rgba(12,10,9,0.66) 46%, rgba(12,10,9,0.25) 100%), url('/assets/images/taberna_bg.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 58%',
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,90,40,0.03)_1px,_transparent_1px)_0_0_/_20px_20px]" />

          <div className="absolute bottom-6 left-6 z-10 space-y-1">
            <span className="text-[10px] tracking-widest text-amber-500 font-serif uppercase font-bold">{t('tavern.eyebrow')}</span>
            <h2 className="text-3xl font-display tracking-widest text-stone-100 uppercase">La Taberna de Martita</h2>
            <p className="text-xs font-serif italic text-stone-400">
              {t('tavern.subtitle')}
            </p>
          </div>
          <span className="absolute right-8 bottom-6 text-7xl opacity-10 pointer-events-none">🍺</span>
        </div>

        {tv.successMsg && (
          <div className="mb-6 px-4 py-3 border border-amber-800 bg-amber-900/10 text-amber-900 text-sm font-serif rounded flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <span>🎉</span>
              <span>{tv.successMsg}</span>
            </div>
            <button onClick={() => tv.setSuccessMsg(null)} className="text-lg leading-none text-amber-800 hover:text-amber-600 transition-colors">&times;</button>
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-stone-400/40">
          {(Object.keys(CATEGORY_LABELS) as TabernaCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => tv.switchCategory(cat)}
              className={`${TAB_BASE} ${tv.activeCategory === cat ? TAB_ACTIVE : TAB_IDLE}`}
            >
              {CATEGORY_LABELS[cat].emoji} {t(CATEGORY_LABELS[cat].key)}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <TabernaMenuList t={tv} />
          </div>
          {hasSelection && <TabernaCheckoutPanel t={tv} />}
        </div>
      </div>
    </div>
  )
}
