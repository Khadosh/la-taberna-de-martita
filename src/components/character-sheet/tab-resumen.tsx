/**
 * Tab "Resumen": stats, rasgos raciales, condiciones y descanso.
 * El grueso del estado y los handlers vienen del padre (CharacterSheet).
 */
import type { RaceDetail } from '../../lib/dnd-api'
import { ABILITY_LABELS, abilityModifier, modifierColor } from '../../lib/dnd-api'
import { CONDITIONS } from '../../lib/dnd-constants'
import type { SheetJson } from './types'
import { SheetLabel, SheetRow, QuickPill } from './sheet-primitives'
import { TraitBadge } from './sheet-badges'
import type { InfoModalData } from './types'

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

interface TabResumenProps {
  stats: Record<string, number>
  sheet: SheetJson
  character: {
    race: string
    class: string
    level: number
    current_hp: number | null
    campaign_id: string | null
    conditions?: string[] | null
  }
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
  // Derived
  dexMod: number
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
  classDetail?: { saving_throws?: { index: string; name: string }[] }
  raceDetailSpeed?: number
}

export function TabResumen(props: TabResumenProps) {
  const {
    stats, character, raceDetail, isOwner, isGm,
    currentHp, maxHp, hpPct, hpColor,
    editingHp, hpInput, setHpInput, setEditingHp,
    ac, xp, xpPct, level, xpForCurrent, xpForNext, canLevelUp,
    editingAc, acInput, setAcInput, setEditingAc,
    editingXp, xpInput, setXpInput, setEditingXp,
    dexMod, profBonus, passivePerception,
    conditions, deathSaves, isStable, isDead, currency,
    showConditionPicker, setShowConditionPicker,
    adjustHp, saveHp, saveAc, saveXp,
    toggleCondition, toggleDeathSave,
    setShowLevelUpModal, setLevelUpHpInput, setModal,
    classDetail, raceDetailSpeed,
  } = props

  return (
    <div>
      {/* Quick stats strip */}
      <div className="border-t border-stone-500/40 px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ background: 'rgba(180,145,80,0.1)' }}>
        <QuickPill label="Velocidad" value={`${raceDetailSpeed ?? 30} ft`} />
        <QuickPill label="Iniciativa" value={dexMod >= 0 ? `+${dexMod}` : String(dexMod)} />
        <QuickPill label="Perc. pasiva" value={String(passivePerception)} title="Percepción Pasiva: 10 + mod. Sabiduría" />
        <QuickPill label="Bono prof." value={`+${profBonus}`} title="Bonus de competencia" />
        {currency.gold > 0 && <QuickPill label="MO" value={String(currency.gold)} variant="gold" />}
        {classDetail?.saving_throws && classDetail.saving_throws.length > 0 && (
          <QuickPill
            label="Sal. prof."
            value={classDetail.saving_throws.map(st => ABILITY_LABELS[st.index]).join(', ')}
            variant="save"
            title={`Tiradas de salvación con competencia: ${classDetail.saving_throws.map(st => st.name).join(', ')}`}
          />
        )}
      </div>

      {/* Stats grid */}
      <SheetRow className="border-t border-stone-600">
        <div className="flex-1 p-4">
          <SheetLabel>Características</SheetLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
            {STAT_KEYS.map(k => (
              <div key={k} className="border border-stone-500 text-center py-2 px-1" style={{ background: 'rgba(200,170,110,0.15)' }}>
                <p className="text-xs text-stone-500 font-serif tracking-widest uppercase">{ABILITY_LABELS[k]}</p>
                <p className="text-2xl sm:text-3xl font-bold text-stone-900 my-0.5" style={{ fontFamily: 'Georgia, serif' }}>{stats[k] ?? '—'}</p>
                <div className="border-t border-stone-400 pt-0.5">
                  <p className={`text-sm font-bold font-mono ${stats[k] ? modifierColor(stats[k]) : 'text-stone-400'}`}>
                    {stats[k] ? abilityModifier(stats[k]) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetRow>

      {/* HP + AC + XP */}
      <SheetRow className="border-t border-stone-600">
        {/* HP */}
        <div className="flex-1 border-b sm:border-b-0 sm:border-r border-stone-600 p-4">
          <SheetLabel>Puntos de Vida</SheetLabel>
          <div className="mt-3 space-y-2">
            <div className="h-3 border border-stone-500 overflow-hidden bg-stone-200/40">
              <div className={`h-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {isOwner && <button onClick={() => adjustHp(-5)} className="w-7 h-6 text-xs border border-red-700/60 text-red-700 hover:bg-red-100/30 leading-none font-mono" title="−5 daño">-5</button>}
                {isOwner && <button onClick={() => adjustHp(-1)} className="w-6 h-6 text-sm border border-stone-500 text-stone-600 hover:bg-stone-200/50 leading-none font-mono">−</button>}
                {editingHp ? (
                  <input autoFocus value={hpInput} onChange={e => setHpInput(e.target.value)}
                    onBlur={saveHp} onKeyDown={e => e.key === 'Enter' && saveHp()}
                    className="w-14 text-center text-lg font-bold font-mono border-b border-stone-600 bg-transparent focus:outline-none" />
                ) : (
                  <button onClick={() => { setEditingHp(true); setHpInput(String(currentHp)) }}
                    className="text-lg font-bold font-mono text-stone-800 px-1 hover:text-amber-800 transition-colors min-w-[2rem]">
                    {currentHp === 0 ? <span className="text-red-700">0</span> : currentHp}
                  </button>
                )}
                {isOwner && <button onClick={() => adjustHp(1)} className="w-6 h-6 text-sm border border-stone-500 text-stone-600 hover:bg-stone-200/50 leading-none font-mono">+</button>}
                {isOwner && <button onClick={() => adjustHp(5)} className="w-7 h-6 text-xs border border-green-700/60 text-green-700 hover:bg-green-100/30 leading-none font-mono" title="+5 curar">+5</button>}
              </div>
              <span className="text-xs text-stone-500 font-serif">/ {maxHp} PV</span>
            </div>
          </div>
        </div>

        {/* AC */}
        <div className="sm:w-32 border-b sm:border-b-0 sm:border-r border-stone-600 p-4 text-center">
          <SheetLabel>CA</SheetLabel>
          <div className="mt-3">
            {editingAc && isOwner ? (
              <input autoFocus value={acInput} onChange={e => setAcInput(e.target.value)}
                onBlur={saveAc} onKeyDown={e => e.key === 'Enter' && saveAc()}
                className="w-16 text-center text-3xl font-bold font-mono border-b-2 border-stone-700 bg-transparent focus:outline-none" style={{ fontFamily: 'Georgia, serif' }} />
            ) : (
              <button onClick={() => { if (isOwner) { setEditingAc(true); setAcInput(String(ac)) } }}
                className="text-3xl font-bold text-stone-900 hover:text-amber-800 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                {ac}
              </button>
            )}
            <p className="text-xs text-stone-400 font-serif italic mt-1">Clase de Armadura</p>
          </div>
        </div>

        {/* XP */}
        <div className="flex-1 p-4">
          <SheetLabel>Experiencia</SheetLabel>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-stone-400 font-serif">Nv. {level} — {xpForCurrent.toLocaleString()} XP</span>
              {xpForNext && <span className="text-[10px] text-stone-400 font-serif">Nv. {level + 1} — {xpForNext.toLocaleString()} XP</span>}
            </div>
            <div className="h-3 border border-stone-500 overflow-hidden bg-stone-200/40">
              <div className="h-full bg-amber-700 transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-stone-700">{xp.toLocaleString()} XP</span>
                {editingXp && isGm ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-stone-500 font-serif">+</span>
                    <input autoFocus value={xpInput} onChange={e => setXpInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveXp()} placeholder="0"
                      className="w-16 text-sm font-mono border-b border-stone-600 bg-transparent focus:outline-none text-center" />
                    <button onClick={saveXp} className="text-[10px] px-1.5 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors leading-none">OK</button>
                    <button onClick={() => { setEditingXp(false); setXpInput('') }} className="text-stone-500 hover:text-stone-300 text-xs">✕</button>
                  </div>
                ) : isGm ? (
                  <button onClick={() => { setEditingXp(true); setXpInput('') }}
                    className="text-[10px] px-1.5 py-0.5 border border-stone-500 hover:border-amber-700 text-stone-500 hover:text-amber-700 font-serif transition-colors leading-none">
                    + otorgar XP
                  </button>
                ) : null}
              </div>
              {xpForNext && <span className="text-xs text-stone-400 font-serif">→ {xpForNext.toLocaleString()}</span>}
            </div>
            {canLevelUp && (isGm || isOwner) && (
              <button onClick={() => { setShowLevelUpModal(true); setLevelUpHpInput('') }}
                className="w-full text-xs py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors animate-pulse">
                ⬆ Subir al nivel {level + 1}
              </button>
            )}
          </div>
        </div>
      </SheetRow>

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
                {isStable && <p className="text-sm text-green-700 font-serif">✓ Estable</p>}
                {isDead && <p className="text-sm text-red-700 font-serif">✕ Muerto</p>}
                {!isStable && !isDead && <p className="text-xs text-stone-500 font-serif italic">Inconsciente</p>}
              </div>
            </div>
          </div>
        </SheetRow>
      )}

      {/* Racial traits */}
      {raceDetail && (
        <SheetRow className="border-t border-stone-600">
          <div className="flex-1 p-4 space-y-3">
            <SheetLabel>Rasgos raciales · <span className="capitalize">{character.race}</span></SheetLabel>
            {raceDetail.ability_bonuses.filter(b => b.bonus !== 0).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {raceDetail.ability_bonuses.filter(b => b.bonus !== 0).map(b => (
                  <span key={b.ability_score.index} className="px-2 py-0.5 text-xs border border-amber-600/60 text-amber-900 font-serif font-semibold" style={{ background: 'rgba(200,140,40,0.13)' }}>
                    {ABILITY_LABELS[b.ability_score.index]} +{b.bonus}
                  </span>
                ))}
                <span className="px-2 py-0.5 text-xs border border-stone-400 text-stone-500 font-serif">{raceDetail.speed} ft</span>
              </div>
            )}
            {raceDetail.traits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {raceDetail.traits.map(t => (
                  <TraitBadge key={t.index} index={t.index} name={t.name}
                    isResistance={t.index.includes('resistance') || t.index.includes('immunity') || t.index.includes('resilience')}
                    onInfo={data => setModal({ kind: 'trait', data })} />
                ))}
              </div>
            )}
          </div>
        </SheetRow>
      )}

      {/* Conditions + Rest */}
      <SheetRow className="border-t border-stone-600">
        <div className="flex-1 p-4 space-y-4">
          {(conditions.length > 0 || isOwner) && (
            <div>
              <SheetLabel>Condiciones activas</SheetLabel>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {conditions.map(c => (
                  <span key={c} className="flex items-center gap-1 px-2 py-0.5 text-xs border border-red-700 bg-red-100/60 text-red-800 font-serif">
                    {c}
                    {isOwner && <button onClick={() => toggleCondition(c)} className="text-red-600 hover:text-red-900 ml-0.5">✕</button>}
                  </span>
                ))}
                {isOwner && (
                  <div className="relative">
                    <button onClick={() => setShowConditionPicker(v => !v)}
                      className="px-2 py-0.5 text-xs border border-stone-400 text-stone-500 hover:border-amber-700 hover:text-amber-800 font-serif transition-colors">
                      + condición
                    </button>
                    {showConditionPicker && (
                      <div className="absolute left-0 top-7 z-20 w-48 border border-stone-500 bg-amber-50 shadow-lg max-h-52 overflow-y-auto">
                        {CONDITIONS.filter(c => !conditions.includes(c)).map(c => (
                          <button key={c} onClick={() => { toggleCondition(c); setShowConditionPicker(() => false) }}
                            className="block w-full text-left px-3 py-1.5 text-xs font-serif text-stone-700 hover:bg-amber-200 transition-colors">
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetRow>
    </div>
  )
}
