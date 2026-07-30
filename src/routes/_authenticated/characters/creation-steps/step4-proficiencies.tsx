import { StepTitle, cardStyle } from './primitives'
import type { Draft } from '../character-creation-steps'
import { getExpertiseCount } from '../../../../lib/class-choices'
import { useLoc } from '../../../../i18n'
import { SKILL_NAMES } from '../../../../lib/dnd-terms'

interface Step4Props {
  draft: Draft
  patch: (u: Partial<Draft>) => void
  classDetail: any
  selectedBg: any
}

export function Step4Proficiencies({ draft, patch, classDetail, selectedBg }: Step4Props) {
  const loc = useLoc()
  // Normalize background skills to lowercase
  const bgSkills = selectedBg?.skills?.map((s: string) => s.toLowerCase().replace(/\s+/g, '-')) ?? []
  
  // Eligible options for expertise: proficient skills + thieves' tools (if rogue)
  const isRogue = draft.classIndex.toLowerCase() === 'rogue'
  const eligibleExpertises = [
    ...draft.skillProficiencies,
    ...bgSkills,
  ]
  if (isRogue) {
    eligibleExpertises.push('thieves-tools')
  }
  const uniqueEligibles = Array.from(new Set(eligibleExpertises))

  const expertiseCount = getExpertiseCount(draft.classIndex, draft.level)

  const toggleExpertise = (idx: string) => {
    const current = draft.expertise ?? []
    if (current.includes(idx)) {
      patch({ expertise: current.filter(x => x !== idx) })
    } else if (current.length < expertiseCount) {
      patch({ expertise: [...current, idx] })
    }
  }

  return (
    <div className="space-y-6">
      <StepTitle>Competencias & Pericias</StepTitle>
      
      {classDetail.proficiencies.length > 0 && (
        <div style={cardStyle} className="p-4 space-y-2">
          <p className="text-xs text-stone-500 font-display tracking-widest uppercase font-serif">Competencias automáticas de clase</p>
          <div className="flex flex-wrap gap-1.5">
            {classDetail.proficiencies.map((p: any) => (
              <span key={p.index} className="px-2 py-0.5 text-xs font-serif text-stone-400 border border-stone-700/60">{p.name}</span>
            ))}
          </div>
        </div>
      )}

      {selectedBg && (selectedBg.skills.length > 0 || selectedBg.tool) && (
        <div style={cardStyle} className="p-4 space-y-2">
          <p className="text-xs text-stone-500 font-display tracking-widest uppercase font-serif">Competencias de trasfondo ({selectedBg.name})</p>
          <div className="flex flex-wrap gap-1.5">
            {selectedBg.skills.map((s: string) => (
              <span key={s} className="px-2 py-0.5 text-xs font-serif text-amber-400/70 border border-amber-900/30">{s}</span>
            ))}
            {selectedBg.tool && (
              <span className="px-2 py-0.5 text-xs font-serif text-amber-550/70 border border-amber-900/40 bg-amber-950/10">
                🛠️ {selectedBg.tool}
              </span>
            )}
          </div>
        </div>
      )}

      {classDetail.proficiency_choices.map((choice: any, ci: number) => (
        <div key={ci} className="space-y-3">
          <p className="text-sm text-stone-300 font-serif">
            Elegí {choice.choose} pericias adicionales de tu clase:{' '}
            <span className={`font-mono ${draft.skillProficiencies.length >= choice.choose ? 'text-amber-400' : 'text-stone-500'}`}>
              {draft.skillProficiencies.length}/{choice.choose}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {choice.from.options.map((opt: any) => {
              const idx = opt.item.index
              const name = opt.item.name.replace('Skill: ', '')
              const isBgSkill = bgSkills.includes(idx)
              const selected = draft.skillProficiencies.includes(idx) || isBgSkill
              const maxed = !selected && draft.skillProficiencies.length >= choice.choose
              return (
                <button key={idx} disabled={isBgSkill || maxed}
                  onClick={() => {
                    const nextSkills = selected
                      ? draft.skillProficiencies.filter(s => s !== idx)
                      : [...draft.skillProficiencies, idx]
                    
                    // Clean up expertise if skill is deselected
                    const nextExpertise = (draft.expertise ?? []).filter(e => nextSkills.includes(e) || e === 'thieves-tools')
                    
                    patch({
                      skillProficiencies: nextSkills,
                      expertise: nextExpertise
                    })
                  }}
                  className={`px-3 py-2 text-sm text-left transition-colors border font-serif ${
                    isBgSkill ? 'border-amber-900/30 text-amber-500/50 bg-amber-950/5 cursor-default'
                    : selected ? 'border-amber-700/80 text-amber-200 bg-amber-900/10'
                    : maxed ? 'border-stone-800 text-stone-700 cursor-not-allowed'
                    : 'border-stone-700/60 text-stone-400 hover:border-amber-800/60 hover:text-stone-200'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span>{SKILL_NAMES[idx] ? loc(SKILL_NAMES[idx]) : name}</span>
                    {isBgSkill && (
                      <span className="text-[8px] uppercase tracking-widest text-amber-500/60 font-mono font-bold bg-amber-950/30 px-1 border border-amber-900/20">
                        Trasfondo
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Expertise Selection */}
      {expertiseCount > 0 && uniqueEligibles.length > 0 && (
        <div className="space-y-3 border-t border-stone-850 pt-5 mt-5">
          <p className="text-sm text-amber-200/90 font-serif font-semibold">
            Especialización (Expertise)
          </p>
          <p className="text-xs text-stone-500 font-serif italic">
            Elegí {expertiseCount} competencias para duplicar tu bono de competencia en ellas:{' '}
            <span className={`font-mono ${(draft.expertise ?? []).length >= expertiseCount ? 'text-amber-400' : 'text-stone-500'}`}>
              {(draft.expertise ?? []).length}/{expertiseCount}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {uniqueEligibles.map(idx => {
              const selected = (draft.expertise ?? []).includes(idx)
              const maxed = !selected && (draft.expertise ?? []).length >= expertiseCount
              const name = SKILL_NAMES[idx] ? loc(SKILL_NAMES[idx]) : idx.replace('-', ' ')
              return (
                <button key={idx} disabled={maxed}
                  onClick={() => toggleExpertise(idx)}
                  className={`px-3 py-2 text-sm text-left transition-colors border font-serif ${
                    selected ? 'border-amber-600/95 text-amber-300 bg-amber-950/20'
                    : maxed ? 'border-stone-850 text-stone-700 cursor-not-allowed opacity-50'
                    : 'border-stone-700/40 text-stone-450 hover:border-amber-800/40 hover:text-stone-200'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>{name}</span>
                    {selected && <span className="text-[10px] text-amber-400 uppercase tracking-widest font-mono">x2</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
