import { useState } from 'react'
import type { RaceDetail, FeatureDetail } from '../../lib/dnd-api'
import { CONDITIONS } from '../../lib/dnd-constants'
import type { SheetJson, InfoModalData } from './types'
import { SheetLabel, SheetRow, QuickPill } from './sheet-primitives'
import { TraitBadge, FeatureCard } from './sheet-badges'
import { WaxSeal } from './condition-seals'
import type { AttackBonusResult } from '../../lib/weapon-utils'
import { StatGrid, fmtMod } from './stat-grid'
import { HpAcXpRow } from './hp-ac-xp-row'

interface ClassFeatureLevel {
  level: number
  features: { index: string; name: string }[]
}

interface TabResumenProps {
  stats: Record<string, number>
  sheet: SheetJson
  character: { race: string }
  raceDetail?: RaceDetail
  isOwner: boolean
  isGm: boolean
  // HP
  currentHp: number
  maxHp: number
  hpPct: number
  hpColor: string
  editingHp: boolean
  hpInput: string
  setHpInput: (v: string) => void
  setEditingHp: (v: boolean) => void
  // AC / XP
  ac: number
  xp: number
  xpPct: number
  level: number
  xpForCurrent: number
  xpForNext?: number
  canLevelUp: boolean
  editingAc: boolean
  acInput: string
  setAcInput: (v: string) => void
  setEditingAc: (v: boolean) => void
  editingXp: boolean
  xpInput: string
  setXpInput: (v: string) => void
  setEditingXp: (v: boolean) => void
  // Max HP editable
  editingMaxHp: boolean
  maxHpInput: string
  setMaxHpInput: (v: string) => void
  setEditingMaxHp: (v: boolean) => void
  saveMaxHp: () => void
  // Derived
  dexMod: number
  strMod: number
  profBonus: number
  passivePerception: number
  conditions: string[]
  deathSaves: { successes: number; failures: number }
  isStable: boolean
  isDead: boolean
  currency: { gold: number; silver: number; copper: number }
  showConditionPicker: boolean
  setShowConditionPicker: (v: (prev: boolean) => boolean) => void
  // Handlers
  adjustHp: (delta: number) => void
  saveHp: () => void
  saveAc: () => void
  saveXp: () => void
  toggleCondition: (c: string) => void
  toggleDeathSave: (kind: 'successes' | 'failures', i: number) => void
  patchSheet: (p: Partial<SheetJson>) => void
  patchCharacter: (p: Record<string, unknown>) => void
  setShowLevelUpModal: (v: boolean) => void
  setLevelUpHpInput: (v: string) => void
  setModal: (m: InfoModalData) => void
  classDetail?: {
    saving_throws?: { index: string; name: string }[]
    proficiencies?: { index: string; name: string }[]
  }
  raceDetailSpeed?: number
  // Clase
  hitDie?: number
  hitDiceAvailable?: number
  classFeaturesByLevel: ClassFeatureLevel[]
  subclassDetail?: { name: string; subclass_flavor?: string }
  subclassFeatureList?: { results: { index: string; name: string }[] }
  // Ataque y proficiencia
  gacoResult?: AttackBonusResult | null
  armorProficient?: boolean
  shieldProfOk?: boolean
}

export function TabResumen(props: TabResumenProps) {
  const {
    stats, character, raceDetail, isOwner, isGm,
    currentHp, maxHp, hpPct, hpColor,
    editingHp, hpInput, setHpInput, setEditingHp,
    editingMaxHp, maxHpInput, setMaxHpInput, setEditingMaxHp, saveMaxHp,
    ac, xp, xpPct, level, xpForNext, canLevelUp,
    editingAc, acInput, setAcInput, setEditingAc,
    editingXp, xpInput, setXpInput, setEditingXp,
    conditions, deathSaves, isStable, isDead,
    showConditionPicker, setShowConditionPicker,
    adjustHp, saveHp, saveAc, saveXp,
    toggleCondition, toggleDeathSave,
    dexMod, strMod, profBonus, passivePerception, raceDetailSpeed,
    setShowLevelUpModal, setLevelUpHpInput, setModal,
    classDetail, classFeaturesByLevel, subclassDetail, subclassFeatureList,
    gacoResult, armorProficient = true, shieldProfOk = true,
  } = props

  const hasSubclass = !!(subclassFeatureList && subclassFeatureList.results.length > 0)
  const [activeFeatLevel, setActiveFeatLevel] = useState<number | 'subclass'>(level)

  return (
    <div>
      {/* Stats grid */}
      <SheetRow>
        <div className="flex-1 p-4">
          <SheetLabel>Características</SheetLabel>
          <StatGrid stats={stats} profBonus={profBonus} savingThrows={classDetail?.saving_throws} />
        </div>
      </SheetRow>

      {/* Quick stats */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1.5" style={{ background: 'rgba(160,125,60,0.08)' }}>
          <QuickPill label="Ini." value={fmtMod(dexMod)} title="Iniciativa" />
          <QuickPill label="Vel." value={`${raceDetailSpeed ?? 30} ft`} title="Velocidad por turno" />
          <QuickPill
            label="GACO"
            value={gacoResult ? fmtMod(gacoResult.bonus) : fmtMod(profBonus + Math.max(strMod, dexMod))}
            variant={gacoResult && !gacoResult.proficient ? 'warn' : undefined}
            title={
              gacoResult
                ? `${gacoResult.weaponName} — usa ${gacoResult.abilityUsed === 'str' ? 'FUE' : 'DES'}${gacoResult.proficient ? ' + competencia' : ' (sin competencia con este tipo de arma)'}${!gacoResult.known ? ' · arma no reconocida, asumiendo melee FUE' : ''}`
                : 'Bono de ataque estimado (sin arma equipada)'
            }
          />
          <QuickPill label="Perc. pas." value={String(passivePerception)} title="Percepción Pasiva" />
          <QuickPill label="Prof." value={`+${profBonus}`} title="Bono de competencia" />
        </div>
      </SheetRow>

      {/* HP + AC + XP */}
      <HpAcXpRow
        isOwner={isOwner} isGm={isGm}
        currentHp={currentHp} maxHp={maxHp} hpPct={hpPct} hpColor={hpColor}
        editingHp={editingHp} hpInput={hpInput} setHpInput={setHpInput} setEditingHp={setEditingHp}
        editingMaxHp={editingMaxHp} maxHpInput={maxHpInput} setMaxHpInput={setMaxHpInput}
        setEditingMaxHp={setEditingMaxHp} saveMaxHp={saveMaxHp}
        adjustHp={adjustHp} saveHp={saveHp}
        ac={ac} armorProficient={armorProficient} shieldProfOk={shieldProfOk}
        editingAc={editingAc} acInput={acInput} setAcInput={setAcInput}
        setEditingAc={setEditingAc} saveAc={saveAc}
        xp={xp} xpPct={xpPct} level={level} xpForNext={xpForNext} canLevelUp={canLevelUp}
        editingXp={editingXp} xpInput={xpInput} setXpInput={setXpInput} setEditingXp={setEditingXp}
        saveXp={saveXp} setShowLevelUpModal={setShowLevelUpModal} setLevelUpHpInput={setLevelUpHpInput}
      />

      {/* Death saves */}
      {currentHp === 0 && (
        <SheetRow className="border-t border-stone-600 bg-red-950/20">
          <div className="flex-1 p-4">
            <SheetLabel>Tiradas de Muerte</SheetLabel>
            <div className="mt-3 flex items-start gap-8">
              {(['successes', 'failures'] as const).map(kind => (
                <div key={kind}>
                  <p className="text-xs text-stone-500 font-serif mb-2">{kind === 'successes' ? 'Éxitos' : 'Fallos'}</p>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <button key={i} onClick={() => isOwner && toggleDeathSave(kind, i)}
                        className={`w-7 h-7 border-2 rounded-full transition-colors ${i < deathSaves[kind]
                          ? kind === 'successes' ? 'bg-green-600 border-green-500' : 'bg-red-700 border-red-600'
                          : `bg-transparent border-stone-500 hover:border-${kind === 'successes' ? 'green' : 'red'}-700`}`} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="self-end pb-0.5">
                {isStable && (
                  <p className="text-sm font-serif flex items-center gap-1" style={{ color: '#15803d' }}>
                    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1,5 4,8 9,2" />
                    </svg>
                    Estable
                  </p>
                )}
                {isDead && (
                  <p className="text-sm font-serif flex items-center gap-1" style={{ color: '#b91c1c' }}>
                    <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
                      <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" /><line x1="8.5" y1="1.5" x2="1.5" y2="8.5" />
                    </svg>
                    Muerto
                  </p>
                )}
                {!isStable && !isDead && <p className="text-xs text-stone-500 font-serif italic">Inconsciente</p>}
              </div>
            </div>
          </div>
        </SheetRow>
      )}

      {/* Habilidades de clase con tabs por nivel */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4">
          <SheetLabel>
            Habilidades de clase
            {subclassDetail && <span className="font-serif normal-case tracking-normal ml-1 text-amber-700">· {subclassDetail.name}</span>}
          </SheetLabel>

          {classFeaturesByLevel.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 pb-2" style={{ borderBottom: '1px solid rgba(109,85,48,0.25)' }}>
              {classFeaturesByLevel.map(({ level: lvl }) => (
                <button
                  key={lvl}
                  onClick={() => setActiveFeatLevel(lvl)}
                  className="px-2 py-0.5 text-[10px] font-serif border transition-colors"
                  style={activeFeatLevel === lvl
                    ? { background: '#78350f', color: '#fef3c7', border: '1px solid #92400e' }
                    : { background: 'transparent', color: '#4e4c4cff', border: '1px solid rgba(56, 48, 36, 0.4)' }
                  }
                >
                  Nv. {lvl}{lvl === level ? ' ★' : ''}
                </button>
              ))}
              {hasSubclass && (
                <button
                  onClick={() => setActiveFeatLevel('subclass')}
                  className="px-2 py-0.5 text-[10px] font-serif border transition-colors"
                  style={activeFeatLevel === 'subclass'
                    ? { background: '#78350f', color: '#fef3c7', border: '1px solid #92400e' }
                    : { background: 'transparent', color: '#b45309', border: '1px solid rgba(180,83,9,0.5)' }
                  }
                >
                  {subclassDetail?.name ?? 'Subclase'}
                </button>
              )}
            </div>
          )}

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {classFeaturesByLevel.length === 0 && (
              <p className="text-stone-400 text-xs font-serif italic col-span-2">Cargando habilidades...</p>
            )}
            {activeFeatLevel === 'subclass'
              ? subclassFeatureList?.results.map(f => (
                <FeatureCard key={f.index} index={f.index} name={f.name}
                  isNew={false} compact maxLevel={level}
                  onInfo={(data: FeatureDetail) => setModal({ kind: 'feature', data })} />
              ))
              : classFeaturesByLevel.find(l => l.level === activeFeatLevel)?.features.map(f => (
                <FeatureCard key={f.index} index={f.index} name={f.name}
                  isNew={activeFeatLevel === level} compact maxLevel={level}
                  onInfo={(data: FeatureDetail) => setModal({ kind: 'feature', data })} />
              ))
            }
          </div>
        </div>
      </SheetRow>

      {/* Rasgos raciales */}
      {raceDetail && raceDetail.traits.length > 0 && (
        <SheetRow className="border-t border-stone-500/30">
          <div className="flex-1 p-4 space-y-3">
            <SheetLabel>Rasgos raciales · <span className="capitalize">{character.race}</span></SheetLabel>
            <div className="flex flex-wrap gap-1.5">
              {raceDetail.traits.map(t => (
                <TraitBadge key={t.index} index={t.index} name={t.name}
                  isResistance={t.index.includes('resistance') || t.index.includes('immunity') || t.index.includes('resilience')}
                  onInfo={data => setModal({ kind: 'trait', data })} />
              ))}
            </div>
          </div>
        </SheetRow>
      )}

      {/* Conditions — wax seals */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4">
          {(conditions.length > 0 || isOwner) && (
            <>
              <SheetLabel>Condiciones activas</SheetLabel>
              <div className="flex flex-wrap gap-3 mt-4 items-center">
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setShowConditionPicker(v => !v)}
                      className="text-xs font-serif transition-colors"
                      style={{
                        padding: '4px 10px',
                        border: '1px solid rgba(90,52,14,0.75)',
                        color: '#4a2808',
                        background: 'rgba(180,130,60,0.18)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      }}
                    >
                      + condición
                    </button>
                    {showConditionPicker && (
                      <div
                        className="absolute left-0 bottom-9 z-20 w-48 shadow-lg max-h-52 overflow-y-auto"
                        style={{ border: '1px solid rgba(120,80,30,0.5)', background: '#f0e4c0' }}
                      >
                        {CONDITIONS.filter(c => !conditions.includes(c)).map(c => (
                          <button
                            key={c}
                            onClick={() => { toggleCondition(c); setShowConditionPicker(() => false) }}
                            className="block w-full text-left px-3 py-1.5 text-xs font-serif text-stone-700 hover:bg-amber-200 transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-1 gap-0 items-center relative px-2">
                  <div style={{
                    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                    left: 0, right: 36, height: 32, borderRadius: 999,
                    background: 'rgba(42,24,8,0.38)', border: '2px solid rgba(72,44,14,0.8)',
                    boxShadow: `
                      inset 0 2px 4px rgba(0,0,0,0.45),
                      inset 0 -1px 2px rgba(160,100,30,0.15),
                      0 1px 0 rgba(190,130,45,0.35),
                      0 2px 5px rgba(0,0,0,0.25)
                    `,
                  }} />
                  {conditions.map(c => (
                    <WaxSeal key={c} condition={c} canRemove={isOwner} onRemove={() => toggleCondition(c)} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetRow>
    </div>
  )
}
