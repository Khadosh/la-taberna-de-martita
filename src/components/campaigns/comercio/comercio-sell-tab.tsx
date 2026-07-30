import { type CostUnit, UNIT_LABEL_BY_LOCALE, getResaleValue } from '../../../lib/currency'
import { currencyOf, type InventoryRow, type useComercio } from './use-comercio'
import { useT, useI18n } from '../../../i18n'

type Props = { c: ReturnType<typeof useComercio> }

/**
 * Estimación heurística: el inventario guarda nombres libres, no índices del
 * SRD, así que no hay costo real que consultar. Se aproxima por categoría.
 */
function estimateBaseCost(itemName: string): { qty: number; unit: CostUnit } {
  const name = itemName.toLowerCase()
  const isGear = name.includes('sword') || name.includes('armor') || name.includes('shield')
  return { qty: 5, unit: isGear ? 'gp' : 'sp' }
}

export function ComercioSellTab({ c }: Props) {
  const t = useT()
  const { locale } = useI18n()
  return (
    <div className="space-y-6">
      <div className="bg-amber-100/40 border border-stone-300 p-4 rounded text-xs font-serif italic text-stone-700">
        {t('trade.resaleNotice', { percent: '50%' })}
      </div>

      <div>
        <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block mb-2">{t('trade.characterInventory')}</span>
        <div className="flex flex-wrap gap-2">
          {c.characters.map(char => {
            const isSelected = c.sellCharId === char.id
            return (
              <button
                key={char.id}
                onClick={() => { c.setSellCharId(char.id); c.setSellConfirm(null) }}
                className={`px-3 py-1.5 text-xs font-serif border rounded transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-900 border-amber-800 text-amber-100 font-bold shadow-inner'
                    : 'bg-amber-50/20 border-stone-300 text-stone-600 hover:bg-amber-100/30 hover:text-stone-900'
                }`}
              >
                {char.name}
                <span className={`ml-2 font-mono text-[10px] ${isSelected ? 'text-amber-300' : 'text-parchment-sienna'}`}>
                  {currencyOf(char).gold} {UNIT_LABEL_BY_LOCALE[locale].gp}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {!c.sellCharId ? (
        <p className="text-sm font-serif italic text-stone-500 py-12 text-center border border-dashed border-stone-300 rounded">
          {t('trade.selectCharacter')}
        </p>
      ) : c.charInventory.length === 0 ? (
        <p className="text-sm font-serif italic text-stone-500 py-12 text-center border border-dashed border-stone-300 rounded">
          {t('trade.emptyInventory')}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {c.charInventory.map(item => (
            <SellItemCard key={item.id} c={c} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function SellItemCard({ c, item }: Props & { item: InventoryRow }) {
  const t = useT()
  const { locale } = useI18n()
  const isConfirming = c.sellConfirm?.id === item.id

  const startSale = () => {
    const { qty, unit } = estimateBaseCost(item.name)
    const res = getResaleValue(qty, unit)
    c.setSellConfirm({
      id: item.id,
      name: item.name,
      qty: item.quantity,
      charId: c.sellCharId,
      resaleQty: res.quantity,
      resaleUnit: res.unit,
    })
  }

  return (
    <div className="bg-amber-50/20 border border-stone-300/60 p-4 rounded-lg flex flex-col justify-between space-y-3 hover:bg-amber-100/30 transition-all">
      <div>
        <h4 className="font-display text-sm font-bold text-stone-900 truncate">{item.name}</h4>
        {item.notes && <p className="text-[10px] font-serif italic text-stone-500 line-clamp-1 mt-0.5">{item.notes}</p>}
        <span className="text-xs font-mono text-stone-600 mt-1 block">{t('trade.quantity', { count: item.quantity })}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-300/40">
        {isConfirming && c.sellConfirm ? (
          <div className="flex gap-2 items-center w-full justify-between">
            <span className="text-[10px] font-mono text-amber-700">
              +{c.sellConfirm.resaleQty} {UNIT_LABEL_BY_LOCALE[locale][c.sellConfirm.resaleUnit]}
            </span>
            <div className="flex gap-1.5">
              <button onClick={() => c.setSellConfirm(null)} className="text-xs text-stone-500 hover:text-stone-850 font-serif cursor-pointer">{t('common.no')}</button>
              <button
                onClick={c.handleSellConfirm}
                disabled={c.loading}
                className="text-xs px-2.5 py-1 bg-red-900 hover:bg-red-800 text-red-100 font-serif rounded border border-red-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t('trade.confirmSell')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="text-[10px] font-serif text-stone-650">{t('trade.estimatedResale')}</span>
            <button
              onClick={startSale}
              className="text-xs px-3 py-1 bg-stone-900 hover:bg-stone-850 text-amber-100 rounded border border-stone-800 font-serif transition-colors cursor-pointer"
            >
              {t('trade.sell')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
