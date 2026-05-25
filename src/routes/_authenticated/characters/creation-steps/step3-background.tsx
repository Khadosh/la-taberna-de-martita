import { BACKGROUNDS, ABILITY_LABELS_ES } from '../../../../lib/dnd-backgrounds'
import type { StatKey } from '../../../../lib/dnd-backgrounds'
import { StepTitle, inputStyle, cardStyle } from './primitives'
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
      <p className="text-sm text-stone-500 font-serif italic">
        El trasfondo define quién eras antes de aventurarte. Cada trasfondo otorga +2 y +1 a dos de sus tres características predefinidas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {Object.entries(BACKGROUNDS).map(([key, bg]) => {
          const isSelected = draft.backgroundKey === key
          return (
            <button key={key}
              onClick={() => patch({ backgroundKey: key, bgBonus2: '', bgBonus1: '' })}
              className={`text-left p-3 border transition-colors ${isSelected ? 'border-amber-700/80 text-amber-100' : 'border-stone-700/50 text-stone-400 hover:border-amber-800/50 hover:text-stone-200'}`}
              style={isSelected ? { background: 'rgba(120,60,10,0.3)', border: '1px solid rgba(180,100,20,0.5)' } : cardStyle}
            >
              <p className="text-sm font-serif font-semibold leading-tight">{bg.name}</p>
              <p className="text-[11px] text-stone-500 mt-0.5 font-display tracking-wider font-serif">
                {bg.abilities.map(a => ABILITY_LABELS_ES[a]).join(' · ')}
              </p>
              <p className="text-[11px] text-stone-600 font-serif italic mt-1 leading-snug line-clamp-2">{bg.desc}</p>
            </button>
          )
        })}
      </div>

      {selectedBg && (
        <div style={cardStyle} className="p-4 space-y-4">
          <div>
            <p className="text-xs text-stone-400 font-display tracking-widest uppercase mb-1">{selectedBg.name}</p>
            <p className="text-[11px] text-stone-600 font-serif">Pericias: {selectedBg.skills.join(', ')} · Herramienta: {selectedBg.tool}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 font-display tracking-widest uppercase">+2 a...</label>
              <select value={draft.bgBonus2}
                onChange={e => {
                  const val = e.target.value as StatKey | ''
                  patch({ bgBonus2: val, bgBonus1: draft.bgBonus1 === val ? '' : draft.bgBonus1 })
                }}
                style={inputStyle} className="w-full px-3 py-2 text-stone-100 font-serif text-sm focus:outline-none"
              >
                <option value="">Elegir...</option>
                {selectedBg.abilities.map(a => (
                  <option key={a} value={a}>{ABILITY_LABELS_ES[a]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-stone-500 font-display tracking-widest uppercase">+1 a...</label>
              <select value={draft.bgBonus1}
                onChange={e => patch({ bgBonus1: e.target.value as StatKey | '' })}
                style={inputStyle} className="w-full px-3 py-2 text-stone-100 font-serif text-sm focus:outline-none"
              >
                <option value="">Elegir...</option>
                {selectedBg.abilities.filter(a => a !== draft.bgBonus2).map(a => (
                  <option key={a} value={a}>{ABILITY_LABELS_ES[a]}</option>
                ))}
              </select>
            </div>
          </div>
          {draft.bgBonus2 && draft.bgBonus1 && (
            <div className="flex gap-2 flex-wrap pt-2 border-t border-stone-800">
              <span className="text-xs text-amber-400/90 border border-amber-900/50 px-2 py-0.5 font-serif">
                +2 {ABILITY_LABELS_ES[draft.bgBonus2]}
              </span>
              <span className="text-xs text-amber-400/60 border border-amber-900/30 px-2 py-0.5 font-serif">
                +1 {ABILITY_LABELS_ES[draft.bgBonus1]}
              </span>
              <span className="text-xs text-stone-700 font-serif italic ml-auto">
                El tercer atributo ({ABILITY_LABELS_ES[selectedBg.abilities.find(a => a !== draft.bgBonus2 && a !== draft.bgBonus1)!]}) no recibe bono
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
