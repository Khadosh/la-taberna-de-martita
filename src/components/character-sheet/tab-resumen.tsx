/**
 * Tab "Resumen": stats, rasgos raciales, condiciones y descanso.
 * El grueso del estado y los handlers vienen del padre (CharacterSheet).
 */
import type { RaceDetail, FeatureDetail } from '../../lib/dnd-api'
import { ABILITY_LABELS, abilityModifier, modifierColor } from '../../lib/dnd-api'
import { CONDITIONS } from '../../lib/dnd-constants'
import type { SheetJson, InfoModalData } from './types'
import { SheetLabel, SheetRow } from './sheet-primitives'
import { TraitBadge, FeatureCard } from './sheet-badges'

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
function fmtMod(m: number) { return m >= 0 ? `+${m}` : String(m) }

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
  // Combate
  strMod: number
  hitDie: number
  hitDiceAvailable: number
  classFeaturesByLevel: ClassFeatureLevel[]
  subclassDetail?: { name: string; subclass_flavor?: string }
  subclassFeatureList?: { results: { index: string; name: string }[] }
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
    dexMod, profBonus, raceDetailSpeed,
    setShowLevelUpModal, setLevelUpHpInput, setModal,
    strMod, hitDie, hitDiceAvailable,
    classFeaturesByLevel, subclassDetail, subclassFeatureList,
  } = props

  return (
    <div>
      {/* Stats grid — primero */}
      <SheetRow>
        <div className="flex-1 p-4">
          <SheetLabel>Características</SheetLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3">
            {STAT_KEYS.map(k => (
              <div key={k} className="text-center py-1.5 px-1" style={{ background: 'rgba(200,170,110,0.18)', border: '1px solid rgba(109,85,48,0.35)' }}>
                <p className="text-[10px] text-stone-500 font-serif tracking-widest uppercase">{ABILITY_LABELS[k]}</p>
                <p className="text-xl sm:text-2xl font-bold text-stone-900 my-0.5" style={{ fontFamily: 'Georgia, serif' }}>{stats[k] ?? '—'}</p>
                <div className="pt-0.5" style={{ borderTop: '1px solid rgba(109,85,48,0.25)' }}>
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
      <SheetRow className="border-t border-stone-500/30">
        {/* HP */}
        <div className="flex-1 p-4" style={{ borderRight: '1px solid rgba(109,85,48,0.3)' }}>
          <SheetLabel>Puntos de Vida</SheetLabel>
          <div className="mt-3 space-y-2">
            <div className="h-3 border border-stone-500/60 overflow-hidden bg-stone-200/40">
              <div className={`h-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
            </div>
            {/* 3 grupos: [decrementar] [HP / maxHP PV] [incrementar] */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {isOwner && <button onClick={() => adjustHp(-5)} className="w-7 h-6 text-xs border border-red-700/60 text-red-700 hover:bg-red-100/30 leading-none font-mono" title="−5 daño">-5</button>}
                {isOwner && <button onClick={() => adjustHp(-1)} className="w-6 h-6 text-sm border border-stone-500 text-stone-600 hover:bg-stone-200/50 leading-none font-mono">−</button>}
              </div>

              <div className="flex items-baseline gap-1">
                {editingHp ? (
                  <input autoFocus value={hpInput} onChange={e => setHpInput(e.target.value)}
                    onBlur={saveHp} onKeyDown={e => e.key === 'Enter' && saveHp()}
                    className="w-12 text-center text-lg font-bold font-mono border-b border-stone-600 bg-transparent focus:outline-none" />
                ) : (
                  <button onClick={() => { setEditingHp(true); setHpInput(String(currentHp)) }}
                    className="text-xl font-bold font-mono text-stone-800 hover:text-amber-800 transition-colors">
                    {currentHp === 0 ? <span className="text-red-700">0</span> : currentHp}
                  </button>
                )}
                <span className="text-stone-400 text-sm font-serif">/</span>
                {editingMaxHp && isOwner ? (
                  <input autoFocus value={maxHpInput} onChange={e => setMaxHpInput(e.target.value)}
                    onBlur={saveMaxHp} onKeyDown={e => e.key === 'Enter' && saveMaxHp()}
                    className="w-10 text-center text-sm font-mono border-b border-amber-600 bg-transparent focus:outline-none" />
                ) : (
                  <button
                    onClick={() => { if (isOwner) { setEditingMaxHp(true); setMaxHpInput(String(maxHp)) } }}
                    className={`text-sm font-mono text-stone-500 leading-none ${isOwner ? 'hover:text-amber-700 transition-colors' : ''}`}
                    title={isOwner ? 'Click para editar PV máximos' : undefined}
                  >
                    {maxHp}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                {isOwner && <button onClick={() => adjustHp(1)} className="w-6 h-6 text-sm border border-stone-500 text-stone-600 hover:bg-stone-200/50 leading-none font-mono">+</button>}
                {isOwner && <button onClick={() => adjustHp(5)} className="w-7 h-6 text-xs border border-green-700/60 text-green-700 hover:bg-green-100/30 leading-none font-mono" title="+5 curar">+5</button>}
              </div>
            </div>
          </div>
        </div>

        {/* AC */}
        <div className="sm:w-28 p-4 text-center" style={{ borderRight: '1px solid rgba(109,85,48,0.3)' }}>
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
            <p className="text-[10px] text-stone-400 font-serif mt-1">Armadura</p>
          </div>
        </div>

        {/* XP — barra alineada con HP (labels debajo) */}
        <div className="flex-1 p-4">
          <SheetLabel>Experiencia</SheetLabel>
          <div className="mt-3 space-y-1.5">
            {/* Barra primero, alineada con la de HP */}
            <div className="h-3 border border-stone-500/60 overflow-hidden bg-stone-200/40">
              <div className="h-full bg-amber-700 transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            {/* Valor actual + acción GM */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-stone-700">{xp.toLocaleString()} XP</span>
                {(isGm && !editingXp) && (
                  <button onClick={() => { setEditingXp(true); setXpInput('') }}
                    className="text-[10px] px-1.5 py-0.5 border border-stone-500 hover:border-amber-700 text-stone-500 hover:text-amber-700 font-serif transition-colors leading-none">
                    + XP
                  </button>
                )}
              </div>
              {xpForNext && <span className="text-[10px] text-stone-400 font-serif">Nv. {level + 1} — {xpForNext.toLocaleString()}</span>}
            </div>
            {
              (isGm && editingXp) && (
                <div className="flex items-center gap-1 w-full">
                  <span className="text-xs text-stone-500 font-serif">+</span>
                  <input autoFocus value={xpInput} onChange={e => setXpInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveXp()} placeholder="0"
                    className="w-full text-sm font-mono border-b border-stone-600 bg-transparent focus:outline-none text-center" />
                  <button onClick={saveXp} className="text-[10px] px-1.5 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors leading-none">OK</button>
                  <button onClick={() => { setEditingXp(false); setXpInput('') }} className="text-stone-500 text-xs">✕</button>
                </div>
              )
            }
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


      {/* Habilidades de clase */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4">
          <SheetLabel>
            Habilidades de clase
            {subclassDetail && <span className="font-serif normal-case tracking-normal ml-1 text-amber-700">· {subclassDetail.name}</span>}
          </SheetLabel>
          <div className="mt-3 space-y-4">
            {classFeaturesByLevel.length === 0 && (
              <p className="text-stone-400 text-xs font-serif italic">Cargando habilidades...</p>
            )}
            {classFeaturesByLevel.map(({ level: lvl, features }) => (
              <div key={lvl}>
                <p className="text-[10px] text-stone-400 font-serif tracking-widest uppercase border-b border-stone-300/60 pb-0.5 mb-2">
                  Nivel {lvl}{lvl === level && <span className="ml-2 text-amber-600">★ Nivel actual</span>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {features.map(f => (
                    <FeatureCard key={f.index} index={f.index} name={f.name}
                      isNew={lvl === level} compact maxLevel={level}
                      onInfo={(data: FeatureDetail) => setModal({ kind: 'feature', data })} />
                  ))}
                </div>
              </div>
            ))}
            {subclassFeatureList && subclassFeatureList.results.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-stone-400 font-serif tracking-widest uppercase border-b border-amber-600/30 pb-0.5 mb-2">
                  {subclassDetail?.subclass_flavor ?? 'Subclase'} · {subclassDetail?.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {subclassFeatureList.results.map(f => (
                    <FeatureCard key={f.index} index={f.index} name={f.name}
                      isNew={false} compact maxLevel={level}
                      onInfo={(data: FeatureDetail) => setModal({ kind: 'feature', data })} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetRow>

      {/* Rasgos raciales — sin modificadores de estadística */}
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

      {/* Atributos de combate */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4">
          <SheetLabel>Atributos de combate</SheetLabel>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: 'GACO', value: fmtMod(profBonus + Math.max(strMod, dexMod)), caption: 'Bono de ataque' },
              { label: 'Iniciativa', value: fmtMod(dexMod), caption: 'Orden de turnos' },
              { label: 'Velocidad', value: `${raceDetailSpeed ?? 30} ft`, caption: 'Por turno' },
            ].map(stat => (
              <div key={stat.label} className="border border-stone-400 text-center py-3 px-2" style={{ background: 'rgba(200,170,110,0.15)' }}>
                <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500">{stat.label}</p>
                <p className="text-2xl font-bold font-mono text-stone-900 my-0.5" style={{ fontFamily: 'Georgia, serif' }}>{stat.value}</p>
                <p className="text-[10px] italic text-stone-400 font-serif">{stat.caption}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3">
            {[
              { label: 'Dado de golpe', value: `d${hitDie}` },
              { label: 'DG disponibles', value: `${hitDiceAvailable}/${level}` },
              { label: 'Bono Prof.', value: `+${profBonus}` },
            ].map(s => (
              <div key={s.label} className="border border-stone-400 px-3 py-2 text-center" style={{ background: 'rgba(200,170,110,0.12)' }}>
                <p className="text-[10px] font-serif uppercase tracking-widest text-stone-500">{s.label}</p>
                <p className="text-lg font-bold font-mono text-stone-800">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </SheetRow>

      {/* Conditions + Rest */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4 space-y-4">
          {(conditions.length > 0 || isOwner) && (
            <div>
              <SheetLabel>Condiciones activas</SheetLabel>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {conditions.map(c => (
                  <span
                    key={c}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border-2 border-red-700/65 rounded-full text-red-900 font-serif font-semibold"
                    style={{
                      background: 'rgba(200,50,30,0.1)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 5px rgba(140,20,10,0.18)',
                    }}
                  >
                    <span className="text-red-500 text-[10px] leading-none">⚑</span>
                    {c}
                    {isOwner && (
                      <button onClick={() => toggleCondition(c)} className="text-red-500 hover:text-red-900 ml-0.5 font-bold text-xs leading-none">✕</button>
                    )}
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
