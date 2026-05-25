import { abilityModifier, modifierColor, ABILITY_LABELS, ABILITY_FULL } from '../../../../lib/dnd-api'
import { StepTitle, inputStyle, cardStyle } from './primitives'
import type { Draft } from '../character-creation-steps'
import { EMPTY_STATS, STAT_KEYS, rollAll } from '../character-creation-steps'

interface Step2Props {
  draft: Draft
  patch: (u: Partial<Draft>) => void
  statMode: 'rolled' | 'manual'
  setStatMode: (m: 'rolled' | 'manual') => void
}

export function Step2Stats({ draft, patch, statMode, setStatMode }: Step2Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <StepTitle>Atributos</StepTitle>
        <div className="flex shrink-0 border border-stone-700 overflow-hidden">
          <button
            onClick={() => { setStatMode('rolled'); patch({ rolledValues: rollAll(), stats: EMPTY_STATS }) }}
            className={`px-3 py-1.5 text-xs font-serif transition-colors border-r border-stone-700 ${statMode === 'rolled' ? 'text-amber-300 bg-amber-900/30' : 'text-stone-500 hover:text-stone-300'}`}
          >
            🎲 Sistema
          </button>
          <button
            onClick={() => { setStatMode('manual'); patch({ stats: EMPTY_STATS }) }}
            className={`px-3 py-1.5 text-xs font-serif transition-colors ${statMode === 'manual' ? 'text-amber-300 bg-amber-900/30' : 'text-stone-500 hover:text-stone-300'}`}
          >
            ✍ Manual
          </button>
        </div>
      </div>

      {statMode === 'rolled' ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500 font-serif italic">
              Asigná cada valor a un atributo. Cada valor puede usarse una sola vez.
            </p>
            <button
              onClick={() => patch({ rolledValues: rollAll(), stats: EMPTY_STATS })}
              className="text-xs px-3 py-1.5 border border-stone-700 hover:border-amber-700 text-stone-400 hover:text-amber-400 transition-colors font-serif shrink-0 ml-4"
            >
              ↺ Volver a tirar
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {draft.rolledValues.map((v, i) => {
              const used = Object.values(draft.stats).includes(v) &&
                Object.values(draft.stats).filter(s => s === v).length >
                draft.rolledValues.slice(0, i).filter(r => r === v).length
              return (
                <span key={i}
                  className={`px-3 py-1.5 text-sm font-mono font-bold border ${used ? 'border-stone-800 text-stone-700' : 'border-amber-700/60 text-amber-300'}`}
                  style={used ? {} : { background: 'rgba(120,60,10,0.2)' }}
                >
                  {v}
                </span>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {STAT_KEYS.map(key => (
              <div key={key} style={cardStyle} className="flex items-center gap-3 p-3">
                <div className="w-12 shrink-0">
                  <p className="font-display text-amber-400/80 text-xs tracking-wider">{ABILITY_LABELS[key]}</p>
                  <p className="text-[10px] text-stone-600 font-serif">{ABILITY_FULL[key]}</p>
                </div>
                <select
                  value={draft.stats[key] || ''}
                  onChange={e => patch({ stats: { ...draft.stats, [key]: +e.target.value } })}
                  style={inputStyle} className="flex-1 px-2 py-1.5 text-stone-100 font-mono text-sm focus:outline-none"
                >
                  <option value="">—</option>
                  {draft.rolledValues.map((v, i) => <option key={i} value={v}>{v}</option>)}
                </select>
                {draft.stats[key] > 0 && (
                  <div className="text-right w-12 shrink-0">
                    <p className="text-sm font-mono text-stone-200">{draft.stats[key]}</p>
                    <p className={`text-xs font-mono ${modifierColor(draft.stats[key])}`}>{abilityModifier(draft.stats[key])}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-stone-500 font-serif italic">
            Ingresá los valores de tus atributos (3–20). Podés tirar los dados físicamente y escribir el resultado.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {STAT_KEYS.map(key => {
              const total = draft.stats[key] || 0
              return (
                <div key={key} style={cardStyle} className="flex items-center gap-3 p-3">
                  <div className="w-12 shrink-0">
                    <p className="font-display text-amber-400/80 text-xs tracking-wider">{ABILITY_LABELS[key]}</p>
                    <p className="text-[10px] text-stone-600 font-serif">{ABILITY_FULL[key]}</p>
                  </div>
                  <input type="number" min={3} max={20} placeholder="—"
                    value={draft.stats[key] || ''}
                    onChange={e => {
                      const v = Math.min(20, Math.max(0, parseInt(e.target.value) || 0))
                      patch({ stats: { ...draft.stats, [key]: v } })
                    }}
                    style={inputStyle}
                    className="flex-1 px-3 py-1.5 text-stone-100 font-mono text-lg font-bold text-center focus:outline-none w-0"
                  />
                  {draft.stats[key] >= 3 && (
                    <div className="text-right w-12 shrink-0">
                      <p className="text-sm font-mono text-stone-200">{total}</p>
                      <p className={`text-xs font-mono ${modifierColor(total)}`}>{abilityModifier(total)}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <p className="text-xs text-stone-600 font-serif italic">Los bonificadores +2/+1 del trasfondo se asignan en el siguiente paso.</p>
    </div>
  )
}
