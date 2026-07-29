import { formatCost } from '../../../lib/currency'
import type { useTaberna } from './use-taberna'
import { useT } from '../../../i18n'

type Props = { t: ReturnType<typeof useTaberna> }

const CARD_BASE = 'text-left p-4 border rounded transition-all flex items-start gap-4 cursor-pointer'
const CARD_ON = 'bg-amber-900 border-amber-800 text-amber-100 shadow-md'
const CARD_OFF = 'bg-amber-50/30 border-stone-300/60 text-stone-700 hover:bg-amber-100/40 hover:border-stone-500'

const GLYPH_BASE = 'text-3xl p-2 border rounded shrink-0 transition-colors'
const GLYPH_ON = 'bg-amber-950 border-amber-700 text-amber-100'
const GLYPH_OFF = 'bg-amber-100/60 border-stone-300 text-stone-900'

export function TabernaMenuList({ t: tv }: Props) {
  const t = useT()
  if (tv.activeCategory === 'stables') {
    if (tv.loadingStables) {
      return <p className="text-stone-600 italic font-serif">{t('tavern.loadingStables')}</p>
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tv.stablesItems.map(item => {
          const on = tv.selectedStablesItem?.index === item.index
          return (
            <button
              key={item.index}
              onClick={() => tv.selectStablesItem(item)}
              className={`${CARD_BASE} ${on ? CARD_ON : CARD_OFF}`}
            >
              <span className={`${GLYPH_BASE} ${on ? GLYPH_ON : GLYPH_OFF}`}>🐴</span>
              <div className="flex-1 min-w-0 space-y-1">
                <span className={`font-semibold text-sm truncate font-display block ${on ? 'text-amber-100' : 'text-stone-900'}`}>
                  {item.name}
                </span>
                <p className={`text-xs font-serif leading-relaxed line-clamp-2 ${on ? 'text-amber-200/90' : 'text-stone-600'}`}>
                  {t('tavern.mountsBlurb')}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {tv.currentServices.map(serv => {
        const on = tv.selectedService?.id === serv.id
        return (
          <button
            key={serv.id}
            onClick={() => tv.selectService(serv)}
            className={`${CARD_BASE} ${on ? CARD_ON : CARD_OFF}`}
          >
            <span className={`${GLYPH_BASE} ${on ? GLYPH_ON : GLYPH_OFF}`}>{serv.icon}</span>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-semibold text-sm truncate font-display ${on ? 'text-amber-100' : 'text-stone-900'}`}>
                  {serv.name}
                </span>
                <span className={`font-mono text-xs font-bold shrink-0 ${on ? 'text-amber-300' : 'text-parchment-sienna'}`}>
                  {formatCost(serv.cost, serv.unit)}
                </span>
              </div>
              <p className={`text-xs font-serif leading-relaxed line-clamp-2 ${on ? 'text-amber-200/90' : 'text-stone-600'}`}>
                {serv.description}
              </p>
              <p className={`text-[10px] font-serif italic ${on ? 'text-amber-300' : 'text-parchment-sienna'}`}>
                {serv.benefit}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
