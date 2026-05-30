import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import { parchmentStyle } from './sheet-primitives'
import type { SheetJson } from './types'
import {
  FIGHTING_STYLES_BY_CLASS, FAVORED_ENEMIES, KNOWN_SPELL_CASTERS,
  FIGHTING_STYLE_MIN_LEVEL, CLASSES_WITH_FAVORED_ENEMY,
  SUBCLASS_SELECTION_LEVELS, getExpertiseCount
} from '../../lib/class-choices'

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

function maxCastableLevel(spellcasting?: Record<string, number | undefined>): number {
  if (!spellcasting) return 0
  for (let i = 9; i >= 1; i--) {
    if ((spellcasting[`spell_slots_level_${i}`] ?? 0) > 0) return i
  }
  return 0
}

export function ClassChoicesPanel({
  characterClass, sheet, level, isOwner, patchSheet,
}: {
  characterClass: string
  sheet: SheetJson
  level: number
  isOwner: boolean
  patchSheet: (p: Partial<SheetJson>) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [fightingStyle, setFightingStyle] = useState('')
  const [favoredEnemy, setFavoredEnemy] = useState('')
  const [newSpells, setNewSpells] = useState<string[]>([])
  const [spellSearch, setSpellSearch] = useState('')
  const [subclass, setSubclass] = useState('')
  const [selectedExpertises, setSelectedExpertises] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [changingSubclass, setChangingSubclass] = useState(false)
  const [newSubclass, setNewSubclass] = useState('')

  const classKey = characterClass.toLowerCase()

  const needsFightingStyle =
    classKey in FIGHTING_STYLE_MIN_LEVEL &&
    level >= FIGHTING_STYLE_MIN_LEVEL[classKey] &&
    !sheet.fighting_style

  const needsFavoredEnemy =
    CLASSES_WITH_FAVORED_ENEMY.includes(classKey) &&
    level >= 1 &&
    (!sheet.favored_enemy || sheet.favored_enemy.length === 0)

  const subclassReqLevel = SUBCLASS_SELECTION_LEVELS[classKey] ?? 1
  const needsSubclass = level >= subclassReqLevel && !sheet.subclass

  const expectedExpertise = getExpertiseCount(classKey, level)
  const currentExpertise = sheet.expertise ?? []
  const expertiseToLearn = Math.max(0, expectedExpertise - currentExpertise.length)
  const needsExpertise = expertiseToLearn > 0

  const isKnownCaster = KNOWN_SPELL_CASTERS.includes(classKey)

  const { data: classLevels } = useQuery({
    queryKey: dndKeys.classLevels(classKey),
    queryFn: () => dndApi.classLevels(classKey),
    staleTime: Infinity,
    enabled: isKnownCaster && level >= 2,
  })

  const canChangeSubclass = !!sheet.subclass && level >= subclassReqLevel

  const { data: classSubclasses } = useQuery({
    queryKey: dndKeys.classSubclasses(classKey),
    queryFn: () => dndApi.classSubclasses(classKey),
    enabled: (needsSubclass || changingSubclass) && open,
    staleTime: Infinity,
  })

  const currentLevelData = classLevels?.find(l => l.level === level)
  const totalSpellsExpected = currentLevelData?.spellcasting?.spells_known ?? 0
  const spellsToLearn = Math.max(0, totalSpellsExpected - (sheet.spells?.length ?? 0))
  const maxSpellLevel = maxCastableLevel(currentLevelData?.spellcasting as Record<string, number> | undefined)
  const needsSpells = isKnownCaster && level >= 2 && spellsToLearn > 0

  const { data: classSpellRefs } = useQuery({
    queryKey: dndKeys.classSpells(classKey),
    queryFn: () => dndApi.classSpells(classKey),
    staleTime: Infinity,
    enabled: needsSpells && open,
  })

  const allSpellRefs = classSpellRefs?.results ?? []
  const spellDetailResults = useQueries({
    queries: allSpellRefs.map(s => ({
      queryKey: dndKeys.spell(s.index),
      queryFn: () => dndApi.spell(s.index),
      staleTime: Infinity,
      enabled: needsSpells && open,
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

  const hasAny = needsFightingStyle || needsFavoredEnemy || needsSpells || needsSubclass || needsExpertise

  if (!isOwner || (!hasAny && !canChangeSubclass)) return null

  const fightingStyles = FIGHTING_STYLES_BY_CLASS[classKey] ?? FIGHTING_STYLES_BY_CLASS['fighter']

  const bgSkills = sheet.background_skills?.map((s: string) => s.toLowerCase().replace(/\s+/g, '-')) ?? []
  const currentSkills = sheet.skill_proficiencies ?? []
  const eligibleExpertises = [
    ...currentSkills,
    ...bgSkills,
  ]
  if (classKey === 'rogue') {
    eligibleExpertises.push('thieves-tools')
  }
  const uniqueEligibles = Array.from(new Set(eligibleExpertises))
    .filter(x => !currentExpertise.includes(x))

  const toggleSpell = (index: string) => {
    if (newSpells.includes(index)) {
      setNewSpells(newSpells.filter(s => s !== index))
    } else if (newSpells.length < spellsToLearn) {
      setNewSpells([...newSpells, index])
    }
  }

  const toggleExpertise = (index: string) => {
    if (selectedExpertises.includes(index)) {
      setSelectedExpertises(selectedExpertises.filter(x => x !== index))
    } else if (selectedExpertises.length < expertiseToLearn) {
      setSelectedExpertises([...selectedExpertises, index])
    }
  }

  const fsValid = !needsFightingStyle || fightingStyle !== ''
  const feValid = !needsFavoredEnemy || favoredEnemy !== ''
  const spValid = !needsSpells || newSpells.length === spellsToLearn
  const scValid = !needsSubclass || subclass !== ''
  const exValid = !needsExpertise || selectedExpertises.length === expertiseToLearn
  const canSave = fsValid && feValid && spValid && scValid && exValid

  const handleSave = async () => {
    setSaving(true)
    const patch: Partial<SheetJson> = {}
    if (fightingStyle) patch.fighting_style = fightingStyle
    if (favoredEnemy) patch.favored_enemy = [...(sheet.favored_enemy ?? []), favoredEnemy]
    if (newSpells.length > 0) patch.spells = [...(sheet.spells ?? []), ...newSpells]
    if (subclass) patch.subclass = subclass
    if (selectedExpertises.length > 0) patch.expertise = [...currentExpertise, ...selectedExpertises]
    
    await patchSheet(patch)
    setSaving(false)
    setOpen(false)
    setFightingStyle('')
    setFavoredEnemy('')
    setNewSpells([])
    setSubclass('')
    setSelectedExpertises([])
  }

  const handleSaveSubclassChange = async () => {
    if (!newSubclass) return
    setSaving(true)
    await patchSheet({ subclass: newSubclass })
    setSaving(false)
    setChangingSubclass(false)
    setNewSubclass('')
    setOpen(false)
  }

  const pendingCount = [needsFightingStyle, needsFavoredEnemy, needsSpells, needsSubclass, needsExpertise].filter(Boolean).length

  return (
    <div className="mx-3 mt-3 mb-1 space-y-1.5">
      {/* Cambiar especialidad — always visible when subclass is set */}
      {canChangeSubclass && !open && (
        <div className="flex items-center justify-between px-4 py-2 border font-serif"
          style={{ background: 'rgba(180,100,20,0.05)', border: '1px solid rgba(180,100,20,0.2)' }}>
          <span className="text-xs text-stone-600">
            Especialidad: <strong className="text-stone-800 capitalize">{sheet.subclass?.replace(/-/g, ' ')}</strong>
          </span>
          <button onClick={() => { setChangingSubclass(true); setOpen(true) }}
            className="text-xs text-amber-700 hover:text-amber-600 underline cursor-pointer">
            Cambiar
          </button>
        </div>
      )}

      {/* Collapsed banner for pending choices */}
      {!open && hasAny && (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left border px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer"
          style={{
            background: 'rgba(180,100,20,0.08)',
            border: '1px solid rgba(180,100,20,0.35)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="7" cy="7" r="6"/><line x1="7" y1="5" x2="7" y2="7.5"/><circle cx="7" cy="10" r="0.6" fill="#b45309" stroke="none"/>
          </svg>
          <span className="text-xs font-serif text-amber-800">
            {pendingCount === 1 ? 'Hay 1 elección de clase pendiente' : `Hay ${pendingCount} elecciones de clase pendientes`}
            <span className="ml-1.5 underline">Completar</span>
          </span>
        </button>
      )}

      {/* Expanded form */}
      {open && (
        <div
          className="border p-5 space-y-5"
          style={{ ...parchmentStyle, border: '1px solid rgba(180,100,20,0.4)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
        >
          <div className="flex items-center justify-between border-b border-stone-400 pb-3">
            <p className="text-sm font-semibold font-serif text-stone-800 font-serif">
              {changingSubclass ? 'Cambiar especialidad' : 'Completar elecciones de clase'}
            </p>
            <button onClick={() => { setOpen(false); setChangingSubclass(false); setNewSubclass('') }}
              className="text-stone-400 hover:text-stone-600 text-xs font-serif cursor-pointer">cerrar</button>
          </div>

          {(needsSubclass || changingSubclass) && classSubclasses && (
            <div className="space-y-2">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
                {changingSubclass ? `Cambiar especialidad (actual: ${sheet.subclass?.replace(/-/g, ' ')})` : 'Especialidad / Subclase'}
              </p>
              <select
                value={changingSubclass ? newSubclass : subclass}
                onChange={e => changingSubclass ? setNewSubclass(e.target.value) : setSubclass(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(120,70,20,0.35)' }}
                className="w-full px-3 py-2 text-stone-900 font-serif text-sm focus:outline-none">
                <option value="">Elegir especialidad...</option>
                {classSubclasses.results.map((sc: any) => (
                  <option key={sc.index} value={sc.index}>{sc.name}</option>
                ))}
              </select>
              {changingSubclass && (
                <div className="flex gap-2">
                  <button onClick={() => { setChangingSubclass(false); setNewSubclass(''); setOpen(false) }}
                    className="flex-1 px-3 py-2 text-xs border border-stone-400 text-stone-500 hover:bg-stone-200/50 font-serif transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button onClick={handleSaveSubclassChange} disabled={!newSubclass || saving}
                    className="flex-1 px-3 py-2 text-xs bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors font-semibold cursor-pointer">
                    {saving ? 'Guardando...' : 'Confirmar cambio'}
                  </button>
                </div>
              )}
            </div>
          )}

          {!changingSubclass && needsFightingStyle && (
            <div className="space-y-2">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">Estilo de combate</p>
              <div className="grid gap-1.5">
                {fightingStyles.map(fs => (
                  <button key={fs.id} onClick={() => setFightingStyle(fs.id)}
                    className={`text-left border px-3 py-2 transition-colors cursor-pointer ${fightingStyle === fs.id
                      ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600'
                      : 'border-stone-300 hover:border-amber-600 hover:bg-amber-50/30'
                    }`}>
                    <p className="text-sm font-semibold text-stone-800 font-serif">{fs.name}</p>
                    <p className="text-xs text-stone-500 font-serif italic mt-0.5">{fs.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!changingSubclass && needsFavoredEnemy && (
            <div className="space-y-2">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">Enemigo predilecto</p>
              <div className="grid grid-cols-2 gap-1.5">
                {FAVORED_ENEMIES.map(enemy => (
                  <button key={enemy} onClick={() => setFavoredEnemy(enemy)}
                    className={`text-left border px-3 py-2 text-xs font-serif transition-colors cursor-pointer ${favoredEnemy === enemy
                      ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600 text-stone-800 font-semibold'
                      : 'border-stone-300 hover:border-amber-600 hover:bg-amber-50/30 text-stone-600'
                    }`}>
                    {enemy}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!changingSubclass && needsExpertise && uniqueEligibles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
                Especialización (Expertise) — Elegí {expertiseToLearn}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {uniqueEligibles.map(idx => {
                  const selected = selectedExpertises.includes(idx)
                  const name = SKILL_NAMES_ES[idx] ?? idx.replace('-', ' ')
                  const maxed = !selected && selectedExpertises.length >= expertiseToLearn
                  return (
                    <button key={idx} disabled={maxed} onClick={() => toggleExpertise(idx)}
                      className={`text-left border px-3 py-1.5 text-xs font-serif transition-colors cursor-pointer ${selected
                        ? 'border-amber-750 bg-amber-100/55 text-amber-900 font-semibold'
                        : maxed ? 'border-stone-200 opacity-40 cursor-not-allowed' : 'border-stone-300 hover:border-amber-600 hover:bg-amber-50/30 text-stone-600'
                      }`}>
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!changingSubclass && needsSpells && (
            <div className="space-y-2">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-serif font-semibold">
                Conjuros conocidos ({newSpells.length}/{spellsToLearn} elegidos)
              </p>
              <p className="text-xs text-stone-500 font-serif italic">
                Elegí {spellsToLearn} conjuro{spellsToLearn > 1 ? 's' : ''} de nivel {maxSpellLevel > 1 ? `1–${maxSpellLevel}` : '1'} de la lista del {characterClass}.
              </p>
              {allSpellRefs.length > 0 && spellsLoadedPct < 100 && (
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(200,170,110,0.3)' }}>
                  <div className="h-full rounded-full bg-amber-700 transition-all" style={{ width: `${spellsLoadedPct}%` }} />
                </div>
              )}
              <input
                type="text" placeholder="Buscar conjuro..."
                value={spellSearch} onChange={e => setSpellSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-stone-400 bg-amber-50/80 focus:outline-none focus:border-amber-700 font-serif"
              />
              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {filteredSpells.length === 0 && spellsLoadedPct < 100 && (
                  <p className="text-xs text-stone-400 font-serif italic text-center py-2">Cargando conjuros...</p>
                )}
                {filteredSpells.map(spell => {
                  const selected = newSpells.includes(spell!.index)
                  const canSelect = selected || newSpells.length < spellsToLearn
                  return (
                    <button key={spell!.index} onClick={() => canSelect && toggleSpell(spell!.index)}
                      disabled={!canSelect}
                      className={`w-full text-left border px-3 py-1.5 transition-colors cursor-pointer ${selected
                        ? 'border-amber-700 bg-amber-100/50 ring-1 ring-amber-600'
                        : canSelect ? 'border-stone-300 hover:border-amber-600 hover:bg-amber-50/30' : 'border-stone-200 opacity-40 cursor-not-allowed'
                      }`}>
                      <span className="text-xs font-semibold text-stone-800 font-serif">{spell!.name}</span>
                      <span className="text-[10px] text-stone-400 font-serif ml-2">Nv.{spell!.level} · {spell!.school?.name}</span>
                      {selected && <span className="float-right text-[10px] text-amber-700 font-semibold">elegido</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {!changingSubclass && (
            <div className="flex gap-2 border-t border-stone-300 pt-3">
              <button onClick={() => setOpen(false)}
                className="flex-1 px-3 py-2 text-xs border border-stone-400 text-stone-500 hover:bg-stone-200/50 font-serif transition-colors cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!canSave || saving}
                className="flex-1 px-3 py-2 text-xs bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors font-semibold cursor-pointer">
                {saving ? 'Guardando...' : 'Guardar elecciones'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
