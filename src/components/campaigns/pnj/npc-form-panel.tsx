import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { dndApi, dndKeys } from '../../../lib/dnd-api'
import { Frame, Block, Field, inputClass } from './pnj-primitives'
import { type NpcForm, type Stats, STAT_KEYS, STAT_LABELS, ROLES, abilityMod, formatMod, rollAllStats } from './pnj-types'
import { useI18n } from '../../../i18n'
import { RACE_NAMES } from '../../../lib/dnd-terms'

interface NpcFormPanelProps {
  form: NpcForm
  patchForm: <K extends keyof NpcForm>(k: K, v: NpcForm[K]) => void
  patchStat: (k: keyof Stats, v: number) => void
  editingId: string | null
  resetForm: () => void
  submit: () => void
  saving: boolean
  races?: { results: { index: string; name: string }[] }
  classes?: { results: { index: string; name: string }[] }
}

export function NpcFormPanel({ form, patchForm, patchStat, editingId, resetForm, submit, saving, races, classes }: NpcFormPanelProps) {
  const { t, loc } = useI18n()
  const raceName = (name: string) => {
    const known = RACE_NAMES[name.toLowerCase()]
    return known ? loc(known) : name
  }
  const { data: allSpellsData } = useQuery({
    queryKey: dndKeys.allSpells,
    queryFn: dndApi.allSpells,
    staleTime: Infinity,
  })

  const { data: allMonstersData } = useQuery({
    queryKey: dndKeys.monsters,
    queryFn: dndApi.monsters,
    staleTime: Infinity,
  })

  const [spellSearch, setSpellSearch] = useState('')
  const [raceTab, setRaceTab] = useState<'classic' | 'monster'>('classic')
  const [raceDropdownOpen, setRaceDropdownOpen] = useState(false)
  const raceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!raceDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (raceRef.current && !raceRef.current.contains(e.target as Node)) {
        setRaceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [raceDropdownOpen])

  const apiRaces = races?.results.map(r => r.name) || []
  const classicList = apiRaces.length > 0 ? apiRaces : ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling']
  const monsterList = allMonstersData?.results.map(m => m.name) || []

  const activeList = raceTab === 'classic' ? classicList : monsterList

  const query = form.race.trim().toLowerCase()
  const filteredRaces = query
    ? activeList.filter(r => {
        const displayName = raceTab === 'classic' ? raceName(r) : r
        return r.toLowerCase().includes(query) || displayName.toLowerCase().includes(query)
      })
    : activeList

  const baseInputClass = inputClass.replace('w-full', '').trim()

  return (
    <Frame>
      <div className="p-5 space-y-5">

        {/* Identidad */}
        <Block label={t('npc.identity')}>
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
            <Field label={t('npc.name')} required>
              <input
                value={form.name}
                onChange={e => patchForm('name', e.target.value)}
                placeholder={t('npc.namePlaceholder')}
                className={inputClass}
              />
            </Field>
            <Field label={t('npc.race')}>
              <div ref={raceRef} className="relative">
                <div className="relative">
                  <input
                    value={form.race}
                    onChange={e => {
                      patchForm('race', e.target.value)
                      setRaceDropdownOpen(true)
                    }}
                    onFocus={() => setRaceDropdownOpen(true)}
                    placeholder={t('npc.racePlaceholder')}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setRaceDropdownOpen(o => !o)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-850 cursor-pointer text-[10px]"
                  >
                    ▼
                  </button>
                </div>
                {raceDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 z-30 bg-amber-50 border border-stone-400 shadow-lg font-serif">
                    <div className="flex border-b border-stone-300 text-[10px] uppercase tracking-wider select-none bg-stone-100">
                      <button
                        type="button"
                        onClick={() => setRaceTab('classic')}
                        className={`flex-1 py-2 text-center font-bold transition-colors cursor-pointer border-r border-stone-300 ${
                          raceTab === 'classic' ? 'bg-amber-100/80 text-amber-900 font-extrabold' : 'text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {t('npc.raceClassic')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRaceTab('monster')}
                        className={`flex-1 py-2 text-center font-bold transition-colors cursor-pointer ${
                          raceTab === 'monster' ? 'bg-amber-100/80 text-amber-900 font-extrabold' : 'text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {t('npc.raceMonster')}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-stone-200/60 custom-scrollbar text-xs">
                      {filteredRaces.length === 0 ? (
                        <div className="px-3 py-2 text-stone-500 italic text-center">{t('npc.noResults')}</div>
                      ) : (
                        filteredRaces.map(r => {
                          const displayName = raceTab === 'classic' ? raceName(r) : r
                          return (
                            <button
                              key={r}
                              type="button"
                              onMouseDown={e => {
                                e.preventDefault()
                                patchForm('race', displayName)
                                setRaceDropdownOpen(false)
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-amber-100/60 text-stone-800 transition-colors cursor-pointer"
                            >
                              {displayName}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Field>
            <Field label={t('npc.level')}>
              <input
                type="number" min={1} max={20}
                value={form.level}
                onChange={e => patchForm('level', Math.max(1, parseInt(e.target.value) || 1))}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3 mt-3">
            <Field label={t('npc.class')}>
              <select value={form.class} onChange={e => patchForm('class', e.target.value)} className={inputClass}>
                <option value="">{t('npc.noClass')}</option>
                {classes?.results.map(c => (
                  <option key={c.index} value={c.index}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('npc.role')}>
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => patchForm('role', r.value)}
                    className={`flex-1 px-3 py-2 text-sm font-serif border transition-colors ${
                      form.role === r.value ? r.color : 'bg-amber-50 border-stone-300/50 text-stone-500 hover:border-stone-500'
                    }`}
                  >
                    {t(r.labelKey)}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Block>

        {/* Stats */}
        <Block
          label={t('npc.abilities')}
          right={
            <button
              type="button"
              onClick={() => patchForm('stats', rollAllStats())}
              className="text-xs px-3 py-1 bg-stone-900 text-amber-100 hover:bg-stone-800 transition-colors font-serif"
            >
              🎲 {t('npc.rollStats')}
            </button>
          }
        >
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STAT_KEYS.map(k => (
              <div key={k} className="flex flex-col items-center bg-amber-100/60 border border-stone-400/40 py-2 px-1">
                <p className="text-[9px] font-display tracking-wider text-stone-700 uppercase" aria-hidden>{k}</p>
                <input
                  type="number" min={1} max={30}
                  aria-label={loc(STAT_LABELS[k])}
                  value={form.stats[k]}
                  onChange={e => patchStat(k, Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-12 text-center bg-transparent text-lg font-bold text-stone-900 focus:outline-none focus:bg-amber-200/60"
                />
                <p className="text-[10px] font-mono text-stone-700">{formatMod(abilityMod(form.stats[k]))}</p>
                <p className="text-[8px] italic text-stone-500 mt-0.5 leading-none">{loc(STAT_LABELS[k])}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* Combate */}
        <Block label={t('npc.combat')}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label={t('npc.maxHp')}>
              <input value={form.max_hp} onChange={e => patchForm('max_hp', e.target.value)}
                placeholder="—" inputMode="numeric" className={inputClass} />
            </Field>
            <Field label={t('npc.armorClass')}>
              <input value={form.armor_class} onChange={e => patchForm('armor_class', e.target.value)}
                placeholder="—" inputMode="numeric" className={inputClass} />
            </Field>
            <Field label={t('npc.attackBonus')}>
              <input value={form.attack_bonus} onChange={e => patchForm('attack_bonus', e.target.value)}
                placeholder="—" inputMode="numeric" className={inputClass} />
            </Field>
            <Field label={t('npc.damage')}>
              <input value={form.damage} onChange={e => patchForm('damage', e.target.value)}
                placeholder={t('npc.damagePlaceholder')} className={inputClass} />
            </Field>
          </div>
        </Block>

        {/* Armas */}
        <Block
          label={t('npc.weapons')}
          right={
            <button
              type="button"
              onClick={() => patchForm('weapons', [...form.weapons, { id: crypto.randomUUID(), name: '', damage: '' }])}
              className="text-xs px-2.5 py-1 bg-stone-900 text-amber-100 hover:bg-stone-800 transition-colors font-serif cursor-pointer"
            >
              + {t('npc.addWeapon')}
            </button>
          }
        >
          {form.weapons.length === 0 ? (
            <p className="text-xs text-stone-500 font-serif italic">{t('npc.noWeapons')}</p>
          ) : (
            <div className="space-y-2">
              {form.weapons.map((w, idx) => (
                <div key={w.id} className="flex gap-2 items-center">
                  <input
                    value={w.name}
                    onChange={e => {
                      const next = [...form.weapons]
                      next[idx] = { ...w, name: e.target.value }
                      patchForm('weapons', next)
                    }}
                    placeholder={t('npc.weaponNamePlaceholder')}
                    className={`${baseInputClass} flex-1 min-w-0`}
                  />
                  <input
                    value={w.damage}
                    onChange={e => {
                      const next = [...form.weapons]
                      next[idx] = { ...w, damage: e.target.value }
                      patchForm('weapons', next)
                    }}
                    placeholder={t('npc.weaponDamagePlaceholder')}
                    className={`${baseInputClass} w-32 font-mono text-center`}
                  />
                  <button
                    type="button"
                    onClick={() => patchForm('weapons', form.weapons.filter(x => x.id !== w.id))}
                    className="px-2 py-1 text-red-700 hover:text-red-900 font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Block>

        {/* Hechizos */}
        <Block label={t('npc.spellbook')}>
          <div className="space-y-3">
            <div className="relative">
              <input
                value={spellSearch}
                onChange={e => setSpellSearch(e.target.value)}
                placeholder={t('npc.spellSearchPlaceholder')}
                className={inputClass}
              />
              {spellSearch.trim().length > 1 && (
                <div className="absolute left-0 right-0 mt-1 z-30 bg-amber-50 border border-stone-400 max-h-40 overflow-y-auto shadow-lg divide-y divide-stone-200">
                  {allSpellsData?.results
                    .filter(s => s.name.toLowerCase().includes(spellSearch.toLowerCase()))
                    .slice(0, 8)
                    .map(spell => (
                      <button
                        key={spell.index}
                        type="button"
                        onClick={() => {
                          if (!form.spells.includes(spell.index)) {
                            patchForm('spells', [...form.spells, spell.index])
                          }
                          setSpellSearch('')
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-stone-850 hover:bg-amber-100 transition-colors font-serif cursor-pointer"
                      >
                        {spell.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {form.spells.length === 0 ? (
              <p className="text-xs text-stone-500 font-serif italic">{t('npc.noSpells')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {form.spells.map(sIndex => {
                  const spellName = allSpellsData?.results.find(x => x.index === sIndex)?.name ?? sIndex.replace(/-/g, ' ')
                  return (
                    <span
                      key={sIndex}
                      className="inline-flex items-center gap-1 px-2 py-0.5 border border-amber-800 bg-amber-900/10 text-amber-900 text-xs rounded capitalize font-serif"
                    >
                      {spellName}
                      <button
                        type="button"
                        onClick={() => patchForm('spells', form.spells.filter(x => x !== sIndex))}
                        className="text-[10px] text-amber-700 hover:text-red-750 font-bold ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </Block>

        {/* Notas */}
        <Block label={t('npc.notesAndInventory')}>
          <div className="space-y-3">
            <Field label={t('npc.equipment')}>
              <textarea value={form.equipment_notes} onChange={e => patchForm('equipment_notes', e.target.value)}
                rows={2} placeholder={t('npc.equipmentPlaceholder')}
                className={`${inputClass} resize-none`} />
            </Field>
            <Field label={t('npc.backstory')}>
              <textarea value={form.backstory} onChange={e => patchForm('backstory', e.target.value)}
                rows={2} placeholder={t('npc.backstoryPlaceholder')}
                className={`${inputClass} resize-none`} />
            </Field>
            <Field label={t('npc.dmNotes')}>
              <textarea value={form.notes} onChange={e => patchForm('notes', e.target.value)}
                rows={2} placeholder={t('npc.dmNotesPlaceholder')}
                className={`${inputClass} resize-none`} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_hidden}
                onChange={e => patchForm('is_hidden', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-serif text-stone-700">{t('npc.hidden')}</span>
            </label>
          </div>
        </Block>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-400/30">
          {editingId && (
            <button type="button" onClick={resetForm}
              className="px-4 py-2 text-sm font-serif text-stone-600 hover:text-stone-900 transition-colors cursor-pointer">
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!form.name.trim() || saving}
            className="px-5 py-2 text-sm font-serif bg-stone-900 text-amber-100 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {saving ? t('npc.saving') : editingId ? t('npc.update') : t('npc.create')}
          </button>
        </div>

      </div>
    </Frame>
  )
}
