import { toCp, formatCost } from '../../../lib/currency'
import { currencyOf, maxHpFor, totalCp, type useTaberna } from './use-taberna'

type Props = { t: ReturnType<typeof useTaberna> }

export function TabernaCheckoutPanel({ t }: Props) {
  const isStables = t.activeCategory === 'stables'

  if (isStables && t.loadingStablesDetail) {
    return (
      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-amber-50 border border-parchment-sienna/40 p-5 rounded-lg shadow-lg border-2">
          <p className="text-xs italic text-stone-500 font-serif">Cargando detalles...</p>
        </div>
      </div>
    )
  }

  const { qty: costQty, unit: costUnit } = t.activeCost()

  return (
    <div className="w-full lg:w-80 shrink-0">
      <div className="relative bg-amber-50 border border-parchment-sienna/40 p-5 rounded-lg space-y-4 shadow-lg border-2">
        <button
          onClick={t.clearSelection}
          className="absolute top-3 right-3 text-stone-500 hover:text-stone-800 text-lg leading-none cursor-pointer"
        >✕</button>

        {isStables && t.stablesItemDetail ? (
          <>
            <PanelHeader
              icon="🐴"
              title={t.stablesItemDetail.name}
              price={t.stablesItemDetail.cost
                ? formatCost(t.stablesItemDetail.cost.quantity, t.stablesItemDetail.cost.unit)
                : 'Gratis'}
            />
            <p className="text-xs font-serif text-stone-600 leading-relaxed border-t border-b border-stone-300/40 py-3">
              {t.stablesItemDetail.desc && t.stablesItemDetail.desc.length > 0
                ? t.stablesItemDetail.desc.join('\n')
                : 'Monturas, mulas, carruajes y pertrechos de establo de la taberna para viajes de larga distancia.'}
            </p>
            <PanelCallout label="Detalles Técnicos">
              Peso: {t.stablesItemDetail.weight ?? 0} lbs | Categoría: {t.stablesItemDetail.equipment_category?.name ?? 'Establo'}
            </PanelCallout>
          </>
        ) : t.selectedService ? (
          <>
            <PanelHeader
              icon={t.selectedService.icon}
              title={t.selectedService.name}
              price={formatCost(t.selectedService.cost, t.selectedService.unit)}
            />
            <p className="text-xs font-serif text-stone-600 leading-relaxed border-t border-b border-stone-300/40 py-3">
              {t.selectedService.description}
            </p>
            <PanelCallout label="Efecto Especial">{t.selectedService.benefit}</PanelCallout>
          </>
        ) : null}

        {t.buyableChars.length === 0 ? (
          <p className="text-xs font-serif text-stone-500 italic">No posees personajes en esta campaña.</p>
        ) : (
          <div className="space-y-3 pt-1">
            <span className="text-[10px] font-display font-semibold tracking-wider uppercase text-stone-500 block">
              {isStables ? 'Comprador:' : 'Consumidor:'}
            </span>

            <div className="space-y-1.5">
              {t.buyableChars.map(char => {
                const cur = currencyOf(char)
                const canAfford = totalCp(cur) >= toCp(costQty, costUnit)
                const maxHp = maxHpFor(char)
                const on = t.consumeCharId === char.id
                return (
                  <label key={char.id} className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-all text-xs font-serif ${
                    on ? 'border-amber-800 bg-amber-900 text-amber-100 shadow-sm' : 'border-stone-300 bg-amber-50/20 hover:bg-amber-100/30 text-stone-700'
                  } ${!canAfford ? 'opacity-40' : ''}`}>
                    <input
                      type="radio" name="consume-char" value={char.id}
                      checked={on}
                      onChange={() => { t.setConsumeCharId(char.id); t.setError(null) }}
                      className="accent-amber-700"
                      disabled={!canAfford}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`block truncate font-semibold ${on ? 'text-amber-100' : 'text-stone-900'}`}>{char.name}</span>
                      <span className={`block font-mono text-[10px] ${on ? 'text-amber-200/80' : 'text-stone-500'}`}>
                        HP: {char.current_hp ?? maxHp}/{maxHp}
                      </span>
                    </div>
                    <span className={`font-mono text-[10px] shrink-0 ${on ? 'text-amber-300' : canAfford ? 'text-parchment-sienna' : 'text-red-700'}`}>
                      {cur.gold} MO {cur.silver > 0 ? `${cur.silver} MP` : ''}
                    </span>
                  </label>
                )
              })}
            </div>

            {t.error && <p className="text-xs font-serif text-red-700 bg-red-50 border border-red-200 px-2 py-1.5 rounded">{t.error}</p>}

            <button
              onClick={isStables ? t.handleStablesBuy : t.handleOrder}
              disabled={t.loading || !t.consumeCharId}
              className="w-full py-2.5 font-serif text-xs border border-[#6B2C06] bg-gradient-to-b from-[#9B4A10] to-[#7B3408] text-[#f5d9a8] rounded-sm transition-colors uppercase tracking-wider font-semibold hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {t.loading ? 'Procesando transacción…' : isStables ? 'Comprar Montura' : 'Ordenar & Consumir'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PanelHeader({ icon, title, price }: { icon: string; title: string; price: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-4xl bg-amber-100/60 border border-stone-300 p-2.5 rounded shrink-0">{icon}</span>
      <div className="min-w-0">
        <h3 className="font-display text-sm font-bold text-stone-900 leading-tight pr-5">{title}</h3>
        <span className="font-mono text-xs text-parchment-sienna font-bold block mt-1">{price}</span>
      </div>
    </div>
  )
}

function PanelCallout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-amber-900 border border-amber-800 p-3 rounded text-amber-100">
      <span className="text-[10px] font-display font-semibold uppercase text-amber-300 block mb-1">{label}</span>
      <p className="text-xs font-serif italic text-amber-200/95">{children}</p>
    </div>
  )
}
