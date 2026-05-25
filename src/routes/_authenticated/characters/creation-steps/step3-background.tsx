import { BACKGROUNDS, ABILITY_LABELS_ES } from '../../../../lib/dnd-backgrounds'
import { StepTitle, cardStyle } from './primitives'
import type { Draft } from '../character-creation-steps'

type SelectedBg = (typeof BACKGROUNDS)[string] | null

interface Step3Props {
  draft: Draft
  patch: (u: Partial<Draft>) => void
  selectedBg: SelectedBg
}

export function Step3Background({ draft, patch, selectedBg }: Step3Props) {
  return (
    <div className="space-y-6">
      <StepTitle>Trasfondo</StepTitle>
      <p className="text-sm text-stone-500 font-serif italic leading-relaxed">
        El trasfondo representa tu vida y ocupación antes de convertirte en aventurero. Cada trasfondo te otorga habilidades entrenadas, competencia con herramientas y bonificaciones de atributo (+2 a uno y +1 a otro).
      </p>

      {/* Grid of Backgrounds */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {Object.entries(BACKGROUNDS).map(([key, bg]) => {
          const isSelected = draft.backgroundKey === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => patch({ backgroundKey: key, bgBonus2: '', bgBonus1: '' })}
              className={`text-left p-3.5 border transition-all ${
                isSelected
                  ? 'border-amber-600/90 text-amber-100 bg-amber-950/20 shadow-sm'
                  : 'border-stone-800 text-stone-400 hover:border-amber-800/40 hover:text-stone-200'
              }`}
              style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
            >
              <div className="flex justify-between items-baseline gap-1">
                <p className="text-sm font-display tracking-wide font-semibold">{bg.name}</p>
                <p className="text-[9px] font-mono text-amber-500/70 uppercase tracking-widest shrink-0">
                  {bg.abilities.map(a => ABILITY_LABELS_ES[a]).join(' · ')}
                </p>
              </div>
              <p className="text-[11px] text-stone-500 font-serif mt-1.5 leading-snug line-clamp-2">{bg.desc}</p>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {bg.skills.map(s => (
                  <span key={s} className="text-[8px] px-1.5 py-0.5 bg-stone-900 border border-stone-850 text-stone-500 rounded-sm font-serif">
                    {s}
                  </span>
                ))}
                {bg.tool && (
                  <span className="text-[8px] px-1.5 py-0.5 bg-amber-900/10 border border-amber-900/30 text-amber-500/70 rounded-sm font-serif">
                    🛠️ {bg.tool}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Background options */}
      {selectedBg && (
        <div style={cardStyle} className="p-4 space-y-4 bg-stone-900/40 border border-stone-800/80 rounded-sm">
          <div>
            <p className="text-xs text-amber-500/70 font-display tracking-widest uppercase mb-1">Beneficios de {selectedBg.name}</p>
            <p className="text-[11px] text-stone-400 font-serif">
              Competencias automáticas: <span className="font-semibold text-stone-300">{selectedBg.skills.join(', ')}</span> y <span className="font-semibold text-stone-300">{selectedBg.tool}</span>.
            </p>
          </div>

          <div className="border-t border-stone-850/60 pt-4 space-y-4">
            <p className="text-xs text-stone-400 font-serif italic">
              Elige dos atributos diferentes de tu trasfondo para aplicar los bonificadores de creación (+2 y +1):
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* +2 Bonus selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Aplicar +2 a...</label>
                <div className="flex gap-2">
                  {selectedBg.abilities.map(a => {
                    const isSelected = draft.bgBonus2 === a
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => patch({ bgBonus2: a, bgBonus1: draft.bgBonus1 === a ? '' : draft.bgBonus1 })}
                        className={`flex-1 py-2 text-center text-xs font-mono font-bold border transition-all ${
                          isSelected
                            ? 'border-amber-600/90 text-amber-250 bg-amber-950/20'
                            : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                        }`}
                        style={isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                      >
                        {ABILITY_LABELS_ES[a]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* +1 Bonus selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-stone-500 font-display tracking-widest uppercase block">Aplicar +1 a...</label>
                <div className="flex gap-2">
                  {selectedBg.abilities.map(a => {
                    const isSelected = draft.bgBonus1 === a
                    const isUsedFor2 = draft.bgBonus2 === a
                    return (
                      <button
                        key={a}
                        type="button"
                        disabled={isUsedFor2}
                        onClick={() => patch({ bgBonus1: a })}
                        className={`flex-1 py-2 text-center text-xs font-mono font-bold border transition-all ${
                          isUsedFor2
                            ? 'opacity-20 border-stone-900 text-stone-800 cursor-not-allowed'
                            : isSelected
                            ? 'border-amber-600/90 text-amber-250 bg-amber-950/20'
                            : 'border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                        }`}
                        style={!isUsedFor2 && isSelected ? { background: 'rgba(120,60,10,0.15)', border: '1px solid rgba(180,100,20,0.7)' } : cardStyle}
                      >
                        {ABILITY_LABELS_ES[a]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {draft.bgBonus2 && draft.bgBonus1 && (
            <div className="flex gap-2 flex-wrap pt-3 border-t border-stone-850/60 items-center">
              <span className="text-xs text-amber-300/90 border border-amber-900/60 px-2 py-0.5 font-serif bg-amber-900/10">
                +2 {ABILITY_LABELS_ES[draft.bgBonus2]}
              </span>
              <span className="text-xs text-amber-400/60 border border-amber-900/30 px-2 py-0.5 font-serif bg-stone-900/20">
                +1 {ABILITY_LABELS_ES[draft.bgBonus1]}
              </span>
              {(() => {
                const unused = selectedBg.abilities.find(a => a !== draft.bgBonus2 && a !== draft.bgBonus1)
                return unused ? (
                  <span className="text-[10px] text-stone-600 font-serif italic ml-auto">
                    ({ABILITY_LABELS_ES[unused]} no recibe bono)
                  </span>
                ) : null
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
