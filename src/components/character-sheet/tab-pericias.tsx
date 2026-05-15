/**
 * Tab "Pericias": todos los skills agrupados por stat con modificador calculado.
 * Inspirado en el panel izquierdo de BG3.
 */
import { ABILITY_LABELS } from '../../lib/dnd-api'
import { SheetLabel, SheetRow } from './sheet-primitives'
import type { InfoModalData } from './types'
import type { SkillDetail } from '../../lib/dnd-api'

// D&D 5e: skill → governing ability
const SKILL_TO_ABILITY: Record<string, string> = {
  acrobatics: 'dex', 'animal-handling': 'wis', arcana: 'int',
  athletics: 'str', deception: 'cha', history: 'int',
  insight: 'wis', intimidation: 'cha', investigation: 'int',
  medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int',
  'sleight-of-hand': 'dex', stealth: 'dex', survival: 'wis',
}

const SKILL_NAMES_ES: Record<string, string> = {
  acrobatics: 'Acrobacias', 'animal-handling': 'Trato con animales',
  arcana: 'Conocimiento arcano', athletics: 'Atletismo',
  deception: 'Engaño', history: 'Historia', insight: 'Perspicacia',
  intimidation: 'Intimidación', investigation: 'Investigación',
  medicine: 'Medicina', nature: 'Naturaleza', perception: 'Percepción',
  performance: 'Actuación', persuasion: 'Persuasión', religion: 'Religión',
  'sleight-of-hand': 'Juego de manos', stealth: 'Sigilo', survival: 'Supervivencia',
}

const ABILITY_ORDER = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

interface TabPericiasProps {
  stats: Record<string, number>
  skillProficiencies: string[]
  weaponProficiencies: string[]
  profBonus: number
  savingThrows: string[]
  setModal: (m: InfoModalData) => void
}

function abilityMod(score: number) { return Math.floor((score - 10) / 2) }
function fmtMod(m: number) { return m >= 0 ? `+${m}` : String(m) }

export function TabPericias({
  stats, skillProficiencies, weaponProficiencies, profBonus, savingThrows,
}: TabPericiasProps) {
  // Normalize proficiency keys (may come as "skill-acrobatics" or "acrobatics")
  const profSet = new Set(skillProficiencies.map(p => p.replace(/^skill-/, '')))
  const saveSet = new Set(savingThrows)

  // Group skills by ability
  const byAbility = ABILITY_ORDER.map(ability => {
    const skills = Object.entries(SKILL_TO_ABILITY)
      .filter(([, ab]) => ab === ability)
      .map(([skillIndex]) => {
        const abilityScore = stats[ability] ?? 10
        const mod = abilityMod(abilityScore)
        const hasProficiency = profSet.has(skillIndex)
        const total = mod + (hasProficiency ? profBonus : 0)
        return { skillIndex, mod: total, hasProficiency }
      })
    return { ability, score: stats[ability] ?? 10, skills }
  })

  return (
    <div>
      {/* Saving throws */}
      <SheetRow className="border-t border-stone-600">
        <div className="flex-1 p-4">
          <SheetLabel>Tiradas de Salvación</SheetLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
            {ABILITY_ORDER.map(ab => {
              const score = stats[ab] ?? 10
              const mod = abilityMod(score)
              const hasSave = saveSet.has(ab)
              const total = mod + (hasSave ? profBonus : 0)
              return (
                <div key={ab} className={`text-center border py-2 px-1 ${hasSave ? 'border-amber-600/60 bg-amber-50/40' : 'border-stone-400/40'}`}>
                  <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500">{ABILITY_LABELS[ab]}</p>
                  <p className={`text-lg font-bold font-mono mt-0.5 ${hasSave ? 'text-amber-800' : 'text-stone-600'}`}>{fmtMod(total)}</p>
                  {hasSave && <p className="text-[9px] text-amber-600 font-serif">✦ prof.</p>}
                </div>
              )
            })}
          </div>
        </div>
      </SheetRow>

      {/* Skills by ability */}
      <SheetRow className="border-t border-stone-600">
        <div className="flex-1 p-4">
          <SheetLabel>Pericias</SheetLabel>
          <div className="mt-3 space-y-4">
            {byAbility.map(({ ability, score, skills }) => (
              <div key={ability}>
                <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500 border-b border-stone-300/60 pb-0.5 mb-2">
                  {ABILITY_LABELS[ability]} ({fmtMod(abilityMod(score))})
                </p>
                <div className="space-y-1">
                  {skills.map(({ skillIndex, mod, hasProficiency }) => (
                    <div key={skillIndex} className={`flex items-center gap-2 px-2 py-1 ${hasProficiency ? 'bg-amber-50/50 border-l-2 border-amber-600' : ''}`}>
                      <span className={`text-[10px] font-serif ${hasProficiency ? 'text-amber-600' : 'text-stone-400'}`}>
                        {hasProficiency ? '★' : '○'}
                      </span>
                      <span className="text-xs font-serif text-stone-700 flex-1">
                        {SKILL_NAMES_ES[skillIndex] ?? skillIndex}
                      </span>
                      <span className={`text-xs font-mono font-bold ${hasProficiency ? 'text-amber-800' : 'text-stone-600'}`}>
                        {fmtMod(mod)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetRow>

      {/* Weapon proficiencies */}
      {weaponProficiencies.length > 0 && (
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4">
            <SheetLabel>Competencias con armas</SheetLabel>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {weaponProficiencies.map(p => (
                <span key={p} className="px-2 py-0.5 text-xs border border-stone-400 text-stone-600 font-serif capitalize" style={{ background: 'rgba(200,170,110,0.15)' }}>
                  {p.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </SheetRow>
      )}
    </div>
  )
}
