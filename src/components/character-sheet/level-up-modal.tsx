import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { parchmentStyle } from './sheet-primitives'
import { FIGHTING_STYLES_BY_CLASS, FAVORED_ENEMIES, SUBCLASS_SELECTION_LEVELS, getExpertiseCount } from '../../lib/class-choices'
import type { SheetJson } from './types'
import { useT } from '../../i18n'

const STAT_LABELS_FULL: Record<string, string> = {
  str: 'Fuerza', dex: 'Destreza', con: 'Constitución',
  int: 'Inteligencia', wis: 'Sabiduría', cha: 'Carisma',
}

const SKILL_NAMES_ES: Record<string, string> = {
  acrobatics: 'Acrobacias', 'animal-handling': 'Trato con animales',
  arcana: 'Conocimiento arcano', athletics: 'Atletismo',
  deception: 'Engaño', history: 'Historia', insight: 'Perspicacia',
  intimidation: 'Intimidación', investigation: 'Investigación',
  medicine: 'Medicina', nature: 'Naturaleza', perception: 'Percepción',
  performance: 'Actuación', persuasion: 'Persuasión', religion: 'Religión',
  'sleight-of-hand': 'Juego de manos', stealth: 'Sigilo', survival: 'Supervivencia',
  'thieves-tools': 'Herramientas de ladrón',
}

function maxCastableLevel(spellcasting?: { [key: string]: number | undefined }): number {
  if (!spellcasting) return 0
  for (let i = 9; i >= 1; i--) {
    if ((spellcasting[`spell_slots_level_${i}`] ?? 0) > 0) return i
  }
  return 0
}

export function LevelUpModal({
  character, level, hitDie, conMod, stats,
  hpInput, setHpInput,
  subclass, setSubclass,
  asi, setAsi,
  fightingStyle, setFightingStyle,
  favoredEnemy, setFavoredEnemy,
  newSpells, setNewSpells,
  expertise, setExpertise,
  currentSubclass,
  currentFightingStyle,
  currentFavoredEnemies,
  currentExpertise = [],
  onConfirm, onCancel,
}: {
  character: { name: string; class: string; sheet_json: unknown }
  level: number
  hitDie: number
  conMod: number
  stats: Record<string, number>
  hpInput: string
  setHpInput: (v: string) => void
  subclass: string
  setSubclass: (v: string) => void
  asi: Record<string, number>
  setAsi: (v: Record<string, number>) => void
  fightingStyle: string
  setFightingStyle: (v: string) => void
  favoredEnemy: string
  setFavoredEnemy: (v: string) => void
  newSpells: string[]
  setNewSpells: (v: string[]) => void
  expertise: string[]
  setExpertise: (v: string[]) => void
  currentSubclass?: string
  currentFightingStyle?: string
  currentFavoredEnemies?: string[]
  currentExpertise?: string[]
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useT()
  const nextLevel = level + 1
  const classIndex = character.class.toLowerCase()
  const [spellSearch, setSpellSearch] = useState('')

  const { data: classLevels } = useQuery({
    queryKey: dndKeys.classLevels(classIndex),
    queryFn: () => dndApi.classLevels(classIndex),
    staleTime: Infinity,
  })
  const { data: subclasses } = useQuery({
    queryKey: dndKeys.classSubclasses(classIndex),
    queryFn: () => dndApi.classSubclasses(classIndex),
    staleTime: Infinity,
  })

  const targetLevel = classLevels?.find(l => l.level === nextLevel)
  const currentLevelData = classLevels?.find(l => l.level === level)
  const features = targetLevel?.features ?? []

  const hasAsi = (targetLevel?.ability_score_bonuses ?? 0) > 0 && !currentSubclass?.includes('asi-done-' + nextLevel)
  
  // Subclass logic by configuration
  const subclassReqLevel = SUBCLASS_SELECTION_LEVELS[classIndex] ?? 1
  const needsSubclass = nextLevel === subclassReqLevel && !currentSubclass

  const hasFightingStyleFeature = !currentFightingStyle && features.some(f =>
    f.name.toLowerCase().includes('fighting style') || f.index.includes('fighting-style')
  )
  const hasFavoredEnemyFeature = features.some(f =>
    f.index.includes('favored-enemy') || f.name.toLowerCase().includes('favored enemy')
  )

  // Expertise logic
  const nextLevelExpertiseCount = getExpertiseCount(classIndex, nextLevel)
  const currentLevelExpertiseCount = getExpertiseCount(classIndex, level)
  const expertiseToLearn = Math.max(0, nextLevelExpertiseCount - currentLevelExpertiseCount)
  const needsExpertise = expertiseToLearn > 0

  // Spell learning
  const spellsKnownNow = currentLevelData?.spellcasting?.spells_known ?? 0
  const spellsKnownNext = targetLevel?.spellcasting?.spells_known ?? 0
  const spellsToLearn = Math.max(0, spellsKnownNext - spellsKnownNow)
  const needsSpells = spellsToLearn > 0
  const maxSpellLevel = maxCastableLevel(targetLevel?.spellcasting as Record<string, number> | undefined)

  const { data: classSpellRefs } = useQuery({
    queryKey: dndKeys.classSpells(classIndex),
    queryFn: () => dndApi.classSpells(classIndex),
    staleTime: Infinity,
    enabled: needsSpells,
  })

  const allSpellRefs = classSpellRefs?.results ?? []
  const spellDetailResults = useQueries({
    queries: allSpellRefs.map(s => ({
      queryKey: dndKeys.spell(s.index),
      queryFn: () => dndApi.spell(s.index),
      staleTime: Infinity,
      enabled: needsSpells,
    })),
  })

  const spellsLoaded = spellDetailResults.filter(r => r.data).length
  const spellsLoadedPct = allSpellRefs.length > 0 ? Math.round(spellsLoaded / allSpellRefs.length * 100) : 0

  const filteredSpells = spellDetailResults
    .map(r => r.data)
    .filter(Boolean)
    .filter(s => s!.level <= maxSpellLevel)
    .filter(s => !spellSearch || s!.name.toLowerCase().includes(spellSearch.toLowerCase()))
    .sort((a, b) => a!.level - b!.level || a!.name.localeCompare(b!.name))

  const featureResults = useQueries({
    queries: features.map(f => ({
      queryKey: dndKeys.feature(f.index),
      queryFn: () => dndApi.feature(f.index),
      staleTime: Infinity,
    })),
  })

  const totalAsiPoints = Object.values(asi).reduce((a, b) => a + b, 0)
  const maxAsiPoints = 2
  const avgHp = Math.floor(hitDie / 2) + 1 + conMod

  const fightingStyles = FIGHTING_STYLES_BY_CLASS[classIndex] ?? FIGHTING_STYLES_BY_CLASS['fighter']

  // Eligible expertise list
  const sheet = (character.sheet_json as SheetJson) ?? {}
  const bgSkills = sheet.background_skills?.map((s: string) => s.toLowerCase().replace(/\s+/g, '-')) ?? []
  const currentSkills = sheet.skill_proficiencies ?? []
  const eligibleExpertises = [
    ...currentSkills,
    ...bgSkills,
  ]
  if (classIndex === 'rogue') {
    eligibleExpertises.push('thieves-tools')
  }
  const uniqueEligibles = Array.from(new Set(eligibleExpertises))
    .filter(x => !currentExpertise.includes(x))

  const hpValid = hpInput && parseInt(hpInput) >= 1
  const subclassValid = !needsSubclass || subclass
  const asiValid = !hasAsi || totalAsiPoints === maxAsiPoints
  const fightingStyleValid = !hasFightingStyleFeature || fightingStyle !== ''
  const favoredEnemyValid = !hasFavoredEnemyFeature || favoredEnemy !== ''
  const spellsValid = !needsSpells || newSpells.length === spellsToLearn
  const expertiseValid = !needsExpertise || expertise.length === expertiseToLearn
  const canConfirm = hpValid && subclassValid && asiValid && fightingStyleValid && favoredEnemyValid && spellsValid && expertiseValid

  const toggleSpell = (index: string) => {
    if (newSpells.includes(index)) {
      setNewSpells(newSpells.filter(s => s !== index))
    } else if (newSpells.length < spellsToLearn) {
      setNewSpells([...newSpells, index])
    }
  }

  const toggleExpertise = (index: string) => {
    if (expertise.includes(index)) {
      setExpertise(expertise.filter(e => e !== index))
    } else if (expertise.length < expertiseToLearn) {
      setExpertise([...expertise, index])
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className="border-4 border-double border-stone-700 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
        style={{ ...parchmentStyle, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b-2 border-stone-600 pb-3">
          <h3 className="font-bold text-stone-800 font-serif text-xl flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="8.5" x2="5" y2="1.5"/><polyline points="2,4.5 5,1.5 8,4.5"/>
            </svg>
            {t('levelUp.title', { level: nextLevel })}
          </h3>
          <p className="text-sm text-stone-500 font-serif italic mt-1">{character.name} · {character.class} · d{hitDie}</p>
        </div>

        {features.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">{t('levelUp.newFeatures')}</p>
            {featureResults.map((q, i) => (
              <div key={features[i].index} className="border border-stone-400 p-3" style={{ background: 'rgba(200,170,110,0.15)' }}>
                <p className="text-sm font-semibold text-stone-800 font-serif">{features[i].name}</p>
                {q.data?.desc?.[0] && <p className="text-xs text-stone-600 font-serif italic mt-1 line-clamp-3">{q.data.desc[0]}</p>}
              </div>
            ))}
          </div>
        )}

        {needsSubclass && subclasses && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">{t('levelUp.pickSubclass')}</p>
            <p className="text-xs text-stone-500 font-serif italic">Al llegar a nivel {nextLevel}, elegís tu camino de especialización.</p>
            <div className="grid gap-2">
              {subclasses.results.map(sc => (
                <SubclassOption key={sc.index} index={sc.index} selected={subclass === sc.index} onSelect={() => setSubclass(sc.index)} />
              ))}
            </div>
          </div>
        )}

        {hasFightingStyleFeature && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">{t('levelUp.fightingStyle')}</p>
            <p className="text-xs text-stone-500 font-serif italic">{t('levelUp.fightingStyleHint')}</p>
            <div className="grid gap-2">
              {fightingStyles.map(fs => (
                <button
                  key={fs.id}
                  onClick={() => setFightingStyle(fs.id)}
                  className={`text-left border p-3 transition-colors cursor-pointer ${fightingStyle === fs.id
                    ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600'
                    : 'border-stone-400 hover:border-amber-600 hover:bg-amber-50/30'
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-800 font-serif">{fs.name}</p>
                  <p className="text-xs text-stone-500 font-serif italic mt-0.5">{fs.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasFavoredEnemyFeature && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
              Enemigo predilecto {currentFavoredEnemies && currentFavoredEnemies.length > 0 && `(actual: ${currentFavoredEnemies.join(', ')})`}
            </p>
            <p className="text-xs text-stone-500 font-serif italic">
              Elegí un tipo de criatura. Obtenés ventaja en Sabiduría (Percepción/Supervivencia) para rastrearlos y recordar información de ellos.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {FAVORED_ENEMIES.map(enemy => (
                <button
                  key={enemy}
                  onClick={() => setFavoredEnemy(enemy)}
                  className={`text-left border px-3 py-2 text-xs font-serif transition-colors cursor-pointer ${favoredEnemy === enemy
                    ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600 text-stone-800 font-semibold'
                    : 'border-stone-400 hover:border-amber-600 hover:bg-amber-50/30 text-stone-600'
                  }`}
                >
                  {enemy}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsExpertise && uniqueEligibles.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
              Especialización (Expertise) — Elegí {expertiseToLearn}
            </p>
            <p className="text-xs text-stone-500 font-serif italic">
              Duplica tu bono de competencia en las habilidades seleccionadas.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {uniqueEligibles.map(idx => {
                const selected = expertise.includes(idx)
                const name = SKILL_NAMES_ES[idx] ?? idx.replace('-', ' ')
                const maxed = !selected && expertise.length >= expertiseToLearn
                return (
                  <button key={idx} disabled={maxed} onClick={() => toggleExpertise(idx)}
                    className={`text-left border px-3 py-2 text-xs font-serif transition-colors cursor-pointer ${selected
                      ? 'border-amber-750 bg-amber-105/55 text-amber-900 font-semibold ring-1 ring-amber-650'
                      : maxed ? 'border-stone-200 opacity-40 cursor-not-allowed' : 'border-stone-400 hover:border-amber-600 hover:bg-amber-50/30 text-stone-600'
                    }`}>
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {needsSpells && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
              Conjuros conocidos ({newSpells.length}/{spellsToLearn} elegidos)
            </p>
            <p className="text-xs text-stone-500 font-serif italic">
              Elegí {spellsToLearn} conjuro{spellsToLearn > 1 ? 's' : ''} de nivel {maxSpellLevel > 1 ? `1–${maxSpellLevel}` : '1'} de la lista del {character.class}.
            </p>
            {allSpellRefs.length > 0 && spellsLoadedPct < 100 && (
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(200,170,110,0.3)' }}>
                <div className="h-full rounded-full bg-amber-700 transition-all" style={{ width: `${spellsLoadedPct}%` }} />
              </div>
            )}
            <input
              type="text"
              placeholder={t('compendium.searchSpell')}
              value={spellSearch}
              onChange={e => setSpellSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-stone-400 bg-amber-50/80 focus:outline-none focus:border-amber-700 font-serif"
            />
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {filteredSpells.length === 0 && spellsLoadedPct < 100 && (
                <p className="text-xs text-stone-400 font-serif italic text-center py-2">{t('levelUp.loadingSpells')}</p>
              )}
              {filteredSpells.length === 0 && spellsLoadedPct === 100 && (
                <p className="text-xs text-stone-400 font-serif italic text-center py-2">{t('levelUp.noSpells')}</p>
              )}
              {filteredSpells.map(spell => {
                const selected = newSpells.includes(spell!.index)
                const canSelect = selected || newSpells.length < spellsToLearn
                return (
                  <button
                    key={spell!.index}
                    onClick={() => canSelect && toggleSpell(spell!.index)}
                    disabled={!canSelect}
                    className={`w-full text-left border px-3 py-2 transition-colors cursor-pointer ${selected
                      ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600'
                      : canSelect
                        ? 'border-stone-300 hover:border-amber-600 hover:bg-amber-50/30'
                        : 'border-stone-200 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs font-semibold text-stone-800 font-serif">{spell!.name}</span>
                    <span className="text-[10px] text-stone-400 font-serif ml-2">Nv.{spell!.level} · {spell!.school?.name ?? ''}</span>
                    {selected && (
                      <span className="float-right text-[10px] text-amber-700 font-semibold">{t('levelUp.chosen')}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {hasAsi && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
              Mejora de características ({totalAsiPoints}/{maxAsiPoints} puntos)
            </p>
            <p className="text-xs text-stone-500 font-serif italic">Repartí {maxAsiPoints} puntos entre tus características (máx 20).</p>
            <div className="grid grid-cols-3 gap-2">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(k => {
                const current = stats[k] ?? 10
                const bonus = asi[k] ?? 0
                const canAdd = totalAsiPoints < maxAsiPoints && current + bonus < 20
                return (
                  <div key={k} className="border border-stone-400 p-2 text-center" style={{ background: bonus > 0 ? 'rgba(200,140,40,0.15)' : 'rgba(200,170,110,0.08)' }}>
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest">{STAT_LABELS_FULL[k]}</p>
                    <p className="text-lg font-bold font-mono text-stone-800">
                      {current}{bonus > 0 && <span className="text-amber-700 text-sm ml-0.5">+{bonus}</span>}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <button disabled={bonus <= 0} onClick={() => setAsi({ ...asi, [k]: bonus - 1 })}
                        className="w-5 h-5 text-xs border border-stone-400 text-stone-500 disabled:opacity-30 hover:bg-stone-200/50 leading-none font-mono cursor-pointer">−</button>
                      <button disabled={!canAdd} onClick={() => setAsi({ ...asi, [k]: bonus + 1 })}
                        className="w-5 h-5 text-xs border border-stone-400 text-stone-500 disabled:opacity-30 hover:bg-stone-200/50 leading-none font-mono cursor-pointer">+</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">{t('levelUp.hitPoints')}</p>
          <p className="text-xs text-stone-500 font-serif italic">
            {t('levelUp.hpHint', {
              die: hitDie,
              conMod: conMod >= 0 ? `+${conMod}` : String(conMod),
              min: Math.max(1, 1 + conMod),
              max: hitDie + conMod,
              avg: avgHp,
            })}
          </p>
          <div className="flex items-center gap-2">
            <input
              autoFocus={!needsSubclass}
              type="number" min={1}
              value={hpInput}
              onChange={e => setHpInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canConfirm && onConfirm()}
              placeholder={String(avgHp)}
              className="flex-1 px-3 py-2 text-lg font-mono text-center border border-stone-500 bg-amber-50/80 focus:outline-none focus:border-amber-700"
            />
            <button onClick={() => setHpInput(String(avgHp))}
              className="px-3 py-2 text-xs border border-stone-400 text-stone-600 hover:bg-stone-200/50 font-serif transition-colors cursor-pointer">
              {t('levelUp.useAverage', { avg: avgHp })}
            </button>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-stone-400">
          <button onClick={onCancel}
            className="flex-1 px-3 py-2 text-sm border border-stone-400 text-stone-500 hover:bg-stone-200/50 font-serif transition-colors cursor-pointer">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} disabled={!canConfirm}
            className="flex-1 px-3 py-2 text-sm bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors font-semibold cursor-pointer">
            <svg width="13" height="13" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
              <line x1="5" y1="8.5" x2="5" y2="1.5"/><polyline points="2,4.5 5,1.5 8,4.5"/>
            </svg>
            {t('levelUp.confirm', { level: nextLevel })}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubclassOption({ index, selected, onSelect }: { index: string; selected: boolean; onSelect: () => void }) {
  const { data: detail } = useQuery({
    queryKey: dndKeys.subclass(index),
    queryFn: () => dndApi.subclass(index),
    staleTime: Infinity,
  })

  return (
    <button
      onClick={onSelect}
      className={`text-left border p-3 transition-colors cursor-pointer ${selected
        ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600'
        : 'border-stone-400 hover:border-amber-600 hover:bg-amber-50/30'
      }`}
    >
      <p className="text-sm font-semibold text-stone-800 font-serif capitalize">{detail?.name ?? index.replace(/-/g, ' ')}</p>
      {detail?.subclass_flavor && <p className="text-[10px] text-stone-500 font-serif uppercase tracking-wider mt-0.5">{detail.subclass_flavor}</p>}
      {detail?.desc && <p className="text-xs text-stone-600 font-serif italic mt-1 line-clamp-2">{detail.desc}</p>}
    </button>
  )
}
