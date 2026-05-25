import { useState } from 'react'
import { ABILITY_LABELS } from '../../lib/dnd-api'
import { SheetLabel, SheetRow } from './sheet-primitives'
import type { InfoModalData } from './types'
import { BACKGROUNDS } from '../../lib/dnd-backgrounds'

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
  expertise: string[]
  weaponProficiencies: string[]
  profBonus: number
  backgroundKey?: string
  setModal: (m: InfoModalData) => void
}

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
  stats, skillProficiencies, expertise, weaponProficiencies, profBonus, backgroundKey
}: TabPericiasProps) {
  const [openProf, setOpenProf] = useState<string | null>(null)
  
  const bgDetail = backgroundKey ? BACKGROUNDS[backgroundKey] : null
  const bgSkills = bgDetail?.skills?.map(s => s.toLowerCase().replace(/\s+/g, '-')) ?? []

  const profSet = new Set([
    ...skillProficiencies.map(p => p.replace(/^skill-/, '')),
    ...bgSkills
  ])
  const expertiseSet = new Set(expertise.map(e => e.replace(/^skill-/, '')))

  // Group skills by ability
  const byAbility = ABILITY_ORDER.map(ability => {
    const skills = Object.entries(SKILL_TO_ABILITY)
      .filter(([, ab]) => ab === ability)
      .map(([skillIndex]) => {
        const abilityScore = stats[ability] ?? 10
        const mod = abilityMod(abilityScore)
        const hasProficiency = profSet.has(skillIndex)
        const hasExpertise = expertiseSet.has(skillIndex)
        const total = mod + (hasProficiency ? profBonus : 0) + (hasExpertise ? profBonus : 0)
        return { skillIndex, mod: total, hasProficiency, hasExpertise }
      })
    return { ability, score: stats[ability] ?? 10, skills }
  })

  // Weapons and Tools lists
  const isRogue = weaponProficiencies.includes('thieves-tools')
  const dexScore = stats.dex ?? 10
  const dexMod = abilityMod(dexScore)
  const thievesToolsExpertise = expertiseSet.has('thieves-tools')
  const thievesToolsTotal = dexMod + profBonus + (thievesToolsExpertise ? profBonus : 0)

  const bgTool = bgDetail?.tool

  const weaponProfsFiltered = weaponProficiencies.filter(p => p !== 'thieves-tools')

  return (
    <div>
      {/* Skills by ability */}
      <SheetRow>
        <div className="flex-1 p-4">
          <SheetLabel>Pericias</SheetLabel>
          <div className="mt-3 space-y-4">
            {byAbility.map(({ ability, score, skills }) => (
              <div key={ability}>
                <p className="text-[10px] font-serif uppercase tracking-widest pb-0.5 mb-2 font-semibold" style={{ color: '#6b4c24', borderBottom: '1px solid rgba(109,85,48,0.35)' }}>
                  {ABILITY_LABELS[ability]} ({fmtMod(abilityMod(score))})
                </p>
                <div className="space-y-0.5">
                  {skills.map(({ skillIndex, mod, hasProficiency, hasExpertise }) => (
                    <div key={skillIndex} className="flex items-center gap-2 px-2 py-1"
                      style={hasExpertise ? { background: 'rgba(180,100,15,0.11)', borderLeft: '2px solid rgba(180,100,15,0.75)' } : hasProficiency ? { background: 'rgba(180,100,15,0.04)', borderLeft: '2px solid rgba(180,100,15,0.35)' } : {}}>
                      {hasExpertise ? (
                        <div className="flex gap-0.5 shrink-0">
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="#b45309">
                            <path d="M4 0L8 4L4 8L0 4Z"/>
                          </svg>
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="#b45309">
                            <path d="M4 0L8 4L4 8L0 4Z"/>
                          </svg>
                        </div>
                      ) : hasProficiency ? (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="#b45309" className="shrink-0">
                          <path d="M4 0L8 4L4 8L0 4Z"/>
                        </svg>
                      ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0" style={{ color: '#9ca3af' }}>
                          <circle cx="4" cy="4" r="2.5"/>
                        </svg>
                      )}
                      <span className="text-xs font-serif flex-1" style={{ color: hasExpertise ? '#3f1a04' : hasProficiency ? '#4a2e0c' : '#57534e' }}>
                        {SKILL_NAMES_ES[skillIndex] ?? skillIndex}
                        {hasExpertise && <span className="text-[9px] font-sans font-semibold text-amber-700 ml-1.5 uppercase tracking-wide">Especialista</span>}
                      </span>
                      <span className="text-xs font-mono font-bold" style={{ color: hasExpertise ? '#b45309' : hasProficiency ? '#92400e' : '#78716c' }}>
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

      {/* Tool Proficiencies */}
      {(isRogue || bgTool) && (
        <SheetRow className="border-t border-stone-500/30">
          <div className="flex-1 p-4">
            <SheetLabel>Competencia con Herramientas</SheetLabel>
            <div className="mt-3 space-y-2">
              {isRogue && (
                <div className="flex items-center gap-2 px-2 py-1"
                  style={thievesToolsExpertise ? { background: 'rgba(180,100,15,0.11)', borderLeft: '2px solid rgba(180,100,15,0.75)' } : { background: 'rgba(180,100,15,0.04)', borderLeft: '2px solid rgba(180,100,15,0.35)' }}>
                  {thievesToolsExpertise ? (
                    <div className="flex gap-0.5 shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="#b45309">
                        <path d="M4 0L8 4L4 8L0 4Z"/>
                      </svg>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="#b45309">
                        <path d="M4 0L8 4L4 8L0 4Z"/>
                      </svg>
                    </div>
                  ) : (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="#b45309" className="shrink-0">
                      <path d="M4 0L8 4L4 8L0 4Z"/>
                    </svg>
                  )}
                  <span className="text-xs font-serif flex-1 text-stone-800">
                    Herramientas de ladrón (DES)
                    {thievesToolsExpertise && <span className="text-[9px] font-sans font-semibold text-amber-700 ml-1.5 uppercase tracking-wide">Especialista</span>}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    {fmtMod(thievesToolsTotal)}
                  </span>
                </div>
              )}
              {bgTool && (!isRogue || !bgTool.toLowerCase().includes('ladrón')) && (
                <div className="flex items-center gap-2 px-2 py-1 bg-stone-100/20 border-l-2 border-stone-400">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="#57534e" className="shrink-0">
                    <path d="M4 0L8 4L4 8L0 4Z"/>
                  </svg>
                  <span className="text-xs font-serif flex-1 text-stone-600">
                    {bgTool} <span className="text-[10px] text-stone-500 font-sans italic">(Trasfondo)</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-500">
                    {fmtMod(profBonus)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </SheetRow>
      )}

      {/* Weapon proficiencies */}
      {weaponProfsFiltered.length > 0 && (
        <SheetRow className="border-t border-stone-500/30">
          <div className="flex-1 p-4">
            <SheetLabel>Competencias con armas</SheetLabel>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {weaponProfsFiltered.map(p => {
                const weapons = PROF_WEAPONS[p]
                const isOpen = openProf === p
                return (
                  <div key={p} className="relative">
                    <button
                      onClick={() => setOpenProf(isOpen ? null : p)}
                      className="px-2 py-0.5 text-xs font-serif capitalize transition-colors cursor-pointer"
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
                            <p className="text-[9px] uppercase tracking-widest font-serif mb-1.5 font-semibold" style={{ color: '#7a5828' }}>
                              {p === 'simple-weapons' ? 'Armas simples (14)' : `Armas marciales (${weapons.length})`}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-serif">
                              {weapons.map(w => (
                                <span key={w} className="text-[10px]" style={{ color: '#3a2010' }}>{w}</span>
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
