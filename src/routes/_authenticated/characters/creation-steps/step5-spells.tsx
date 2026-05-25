import { StepTitle, SpellInfoButton } from './primitives'
import type { SpellDetail } from '../../../../lib/dnd-api'
import type { Draft } from '../character-creation-steps'

interface Step5Props {
  draft: Draft
  patch: (u: Partial<Draft>) => void
  classSpells: any
  classDetail: any
  setSpellModal: (s: SpellDetail | null) => void
}

export function Step5Spells({ draft, patch, classSpells, classDetail, setSpellModal }: Step5Props) {
  return (
    <div className="space-y-6">
      <StepTitle>Conjuros iniciales</StepTitle>
      <p className="text-sm text-stone-500 font-serif italic">
        Seleccioná los hechizos de tu {classDetail?.name}.{' '}
        <span className="text-amber-500/80 not-italic">{draft.spells.length} seleccionados</span>
      </p>
      <div className="grid grid-cols-2 gap-1.5 max-h-[400px] overflow-y-auto pr-1">
        {classSpells.results.map((s: any) => {
          const selected = draft.spells.includes(s.index)
          return (
            <div key={s.index}
              className={`flex items-center border transition-colors ${selected ? 'border-amber-700/80' : 'border-stone-700/50 hover:border-amber-800/50'}`}
              style={selected ? { background: 'rgba(120,60,10,0.25)' } : {}}
            >
              <button
                onClick={() => patch({ spells: selected ? draft.spells.filter(i => i !== s.index) : [...draft.spells, s.index] })}
                className="flex-1 px-3 py-2 text-sm text-left font-serif"
              >
                <span className={selected ? 'text-amber-200' : 'text-stone-400'}>{s.name}</span>
              </button>
              <SpellInfoButton index={s.index} onInfo={setSpellModal} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
