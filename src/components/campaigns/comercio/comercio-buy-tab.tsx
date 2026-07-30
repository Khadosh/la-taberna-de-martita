import { getItemIconUrl } from '../../../lib/item-icons'
import { GameIcon } from '../../icons/game-icon'
import { useT, useLoc, useI18n } from '../../../i18n'
import { SHOPS } from '../../../lib/shops-data'
import { type CostUnit, toCp, formatCost } from '../../../lib/currency'
import { currencyOf, totalCp, type useComercio } from './use-comercio'

type Props = { c: ReturnType<typeof useComercio> }

export function ComercioBuyTab({ c }: Props) {
  const t = useT()
  const loc = useLoc()
  return (
    <div className="space-y-6">
      {/* tiendas temáticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {SHOPS.map(shop => {
          const isSelected = c.activeShopId === shop.id
          return (
            <button
              key={shop.id}
              onClick={() => c.switchShop(shop.id)}
              className={`flex flex-col items-center justify-center p-3 text-center border rounded transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-900 border-amber-800 text-amber-100 font-semibold shadow-inner'
                  : 'bg-amber-50/20 border-stone-300 text-stone-600 hover:bg-amber-100/30 hover:text-stone-900'
              }`}
            >
              <span className="text-xl mb-1.5">{shop.icon}</span>
              <span className="text-xs font-serif font-semibold">{loc(shop.label)}</span>
            </button>
          )
        })}
      </div>

      <div className="bg-amber-100/40 border border-stone-300 p-4 rounded text-xs font-serif italic text-stone-700">
        {loc(c.activeShop.flavor)}
      </div>

      <div className="space-y-4">
        <input
          value={c.search}
          onChange={e => { c.setSearch(e.target.value); c.setSelected(null) }}
          placeholder={t('trade.searchIn', { shop: loc(c.activeShop.label) })}
          className="w-full px-3 py-2 text-xs font-serif bg-amber-50/40 border border-stone-300 text-stone-900 placeholder:text-stone-500 rounded focus:outline-none focus:border-parchment-sienna/60 focus:bg-white"
        />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            {c.isLoadingItems ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-amber-100/30 border border-stone-300/40 animate-pulse rounded" />
                ))}
              </div>
            ) : c.items.length === 0 ? (
              <p className="text-sm font-serif italic text-stone-500 py-10 text-center border border-dashed border-stone-300 rounded">
                {t('trade.noItems')}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {c.items.map(item => {
                  const iconUrl = getItemIconUrl(item.name)
                  const isSelected = c.selected?.index === item.index
                  return (
                    <button
                      key={item.index}
                      onClick={() => c.selectItem(item)}
                      className={`text-left flex items-center gap-3 px-3 py-2 text-xs font-serif border rounded transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-900 border-amber-800 text-amber-100 font-semibold shadow-sm'
                          : 'bg-amber-50/20 border-stone-300/60 text-stone-700 hover:bg-amber-100/40 hover:border-stone-500'
                      }`}
                    >
                      <div className={`w-8 h-8 shrink-0 overflow-hidden rounded flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-amber-950 border-amber-800 text-amber-100' : 'bg-amber-100/60 border-stone-300 text-stone-900'
                      }`}>
                        {iconUrl ? (
                          <GameIcon url={iconUrl} title={item.name} className="w-5 h-5 opacity-80" />
                        ) : (
                          <span className="text-sm opacity-45">📦</span>
                        )}
                      </div>
                      <span className="truncate flex-1 font-semibold">{item.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {c.selected && <BuyDetailSidebar c={c} />}
        </div>
      </div>
    </div>
  )
}

function BuyDetailSidebar({ c }: Props) {
  const t = useT()
  const { locale } = useI18n()
  const { itemDetail } = c

  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="relative bg-amber-50 border border-parchment-sienna/40 p-5 rounded-lg space-y-4 shadow-lg border-2">
        <button onClick={() => c.setSelected(null)} className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 text-lg leading-none">✕</button>

        {c.loadingDetail ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 bg-amber-100/50 animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-amber-100/50 animate-pulse rounded" />
            <div className="h-10 w-full bg-amber-100/50 animate-pulse rounded" />
          </div>
        ) : itemDetail ? (
          <>
            <div className="flex items-start gap-3">
              {getItemIconUrl(itemDetail.name) && (
                <span className="w-12 h-12 rounded border border-stone-300 bg-amber-100/60 shrink-0 flex items-center justify-center text-stone-800">
                  <GameIcon url={getItemIconUrl(itemDetail.name)!} title={itemDetail.name} className="w-8 h-8" />
                </span>
              )}
              <div className="min-w-0">
                <h3 className="font-display text-sm font-bold text-stone-900 leading-tight pr-5">{itemDetail.name}</h3>
                <p className="text-[10px] font-serif italic text-stone-500 mt-0.5 capitalize">{itemDetail.equipment_category.name}</p>
              </div>
            </div>

            <div className="flex gap-4 text-xs font-mono text-parchment-chocolate bg-amber-900/10 px-3 py-1.5 border border-amber-800/20 rounded">
              {itemDetail.cost?.quantity > 0 ? (
                <span className="text-parchment-sienna font-bold">{formatCost(itemDetail.cost.quantity, itemDetail.cost.unit, locale)}</span>
              ) : (
                <span className="text-stone-500 italic">{t('trade.noValue')}</span>
              )}
              {itemDetail.weight > 0 && <span>{itemDetail.weight} lb</span>}
              {itemDetail.armor_class && (
                <span className="text-stone-700 font-semibold">CA {itemDetail.armor_class.base}{itemDetail.armor_class.dex_bonus ? '+Des' : ''}</span>
              )}
            </div>

            {itemDetail.desc && itemDetail.desc.length > 0 && (
              <p className="text-[11px] font-serif text-stone-600 leading-relaxed max-h-24 overflow-y-auto pr-1">
                {itemDetail.desc[0]}
              </p>
            )}

            {c.buyableChars.length > 0 && itemDetail.cost?.quantity > 0 && (
              <div className="pt-3 border-t border-stone-300/40 space-y-3">
                <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block">{t('trade.buyFor')}</span>
                <div className="space-y-1.5">
                  {c.buyableChars.map(char => {
                    const cur = currencyOf(char)
                    const costCp = toCp(itemDetail.cost.quantity, itemDetail.cost.unit as CostUnit)
                    const canAfford = totalCp(cur) >= costCp
                    const isSelected = c.buyCharId === char.id
                    return (
                      <label key={char.id} className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-all text-xs font-serif ${
                        isSelected ? 'border-amber-800 bg-amber-900 text-amber-100' : 'border-stone-300 bg-amber-50/20 hover:bg-amber-100/30 text-stone-700'
                      } ${!canAfford ? 'opacity-40' : ''}`}>
                        <input
                          type="radio" name="buy-char" value={char.id}
                          checked={isSelected}
                          onChange={() => { c.setBuyCharId(char.id); c.setError(null) }}
                          className="accent-amber-700"
                          disabled={!canAfford}
                        />
                        <span className={`flex-1 truncate ${isSelected ? 'text-amber-100' : 'text-stone-900'}`}>{char.name}</span>
                        <span className={`font-mono text-[10px] ${isSelected ? 'text-amber-300' : canAfford ? 'text-parchment-sienna' : 'text-red-700'}`}>
                          {cur.gold} MO {cur.silver > 0 ? `${cur.silver} MP` : ''}
                        </span>
                      </label>
                    )
                  })}
                </div>
                {c.error && <p className="text-xs font-serif text-red-750 bg-red-50 border border-red-200 px-2 py-1.5 rounded">{c.error}</p>}
                <button
                  onClick={c.handleBuy}
                  disabled={c.loading || !c.buyCharId}
                  className="w-full py-2 font-serif text-xs border border-[#6B2C06] bg-gradient-to-b from-[#9B4A10] to-[#7B3408] text-[#f5d9a8] rounded-sm transition-colors uppercase tracking-wider font-semibold hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {c.loading ? t('trade.buying') : t('trade.acquire', { cost: formatCost(itemDetail.cost.quantity, itemDetail.cost.unit, locale) })}
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
