/**
 * Tab "Pericias": todos los skills agrupados por stat con modificador calculado.
 * Inspirado en el panel izquierdo de BG3.
 */
import { useState } from 'react'
import { ABILITY_LABELS } from '../../lib/dnd-api'
import { SheetLabel, SheetRow } from './sheet-primitives'
import type { InfoModalData } from './types'

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

// D&D 5e SRD — armas incluidas en cada categoría amplia
const PROF_WEAPONS: Record<string, string[]> = {
  'simple-weapons': [
    'Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin',
    'Light Hammer', 'Mace', 'Quarterstaff', 'Sickle', 'Spear',
    'Dart', 'Light Crossbow', 'Shortbow', 'Sling',
  ],
  'martial-weapons': [
    'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword',
    'Halberd', 'Lance', 'Longsword', 'Maul', 'Morningstar',
    'Pike', 'Rapier', 'Scimitar', 'Shortsword', 'Trident',
    'War Pick', 'Warhammer', 'Whip',
    'Blowgun', 'Hand Crossbow', 'Heavy Crossbow', 'Longbow', 'Net',
  ],
}

function abilityMod(score: number) { return Math.floor((score - 10) / 2) }
function fmtMod(m: number) { return m >= 0 ? `+${m}` : String(m) }

export function TabPericias({
  stats, skillProficiencies, weaponProficiencies, profBonus, savingThrows,
}: TabPericiasProps) {
  const [openProf, setOpenProf] = useState<string | null>(null)
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
              {weaponProficiencies.map(p => {
                const weapons = PROF_WEAPONS[p]
                const isOpen = openProf === p
                return (
                  <div key={p} className="relative">
                    <button
                      onClick={() => setOpenProf(isOpen ? null : p)}
                      className="px-2 py-0.5 text-xs font-serif capitalize transition-colors"
                      style={{
                        border: '1px solid rgba(109,85,48,0.55)',
                        color: '#4a2e0c',
                        background: isOpen ? 'rgba(200,160,80,0.28)' : 'rgba(200,170,110,0.15)',
                      }}
                    >
                      {p.replace(/-/g, ' ')}
                      <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.6 }}>{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div
                        className="absolute left-0 z-20 mt-1"
                        style={{
                          background: '#f0e4c0',
                          border: '1px solid rgba(109,85,48,0.4)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          padding: '8px 10px',
                          minWidth: 200,
                          maxWidth: 280,
                        }}
                      >
                        {weapons ? (
                          <>
                            <p className="text-[9px] uppercase tracking-widest font-serif mb-1.5" style={{ color: '#7a5828' }}>
                              {p === 'simple-weapons' ? 'Armas simples (14)' : `Armas marciales (${weapons.length})`}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {weapons.map(w => (
                                <span key={w} className="text-[10px] font-serif" style={{ color: '#3a2010' }}>{w}</span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs font-serif italic" style={{ color: '#5a3a14' }}>
                            {p.replace(/-/g, ' ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </SheetRow>
      )}
    </div>
  )
}
