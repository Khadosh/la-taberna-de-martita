/**
 * Tab "Resumen": stats, rasgos raciales, condiciones y descanso.
 * El grueso del estado y los handlers vienen del padre (CharacterSheet).
 */
import { useState } from 'react'
import type { RaceDetail, FeatureDetail } from '../../lib/dnd-api'
import { ABILITY_LABELS } from '../../lib/dnd-api'
import { CONDITIONS } from '../../lib/dnd-constants'
import type { SheetJson, InfoModalData } from './types'
import { SheetLabel, SheetRow, QuickPill } from './sheet-primitives'
import { TraitBadge, FeatureCard } from './sheet-badges'
import { WaxSeal } from './condition-seals'

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
function fmtMod(m: number) { return m >= 0 ? `+${m}` : String(m) }

// ── Helpers de color para stat boxes ─────────────────────────────────────────

// Latón base: varía sutilmente según el valor de la habilidad
function statBodyRgb(val: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (val - 6) / 14))
  return [
    Math.round(78 + t * 26),  // 78 → 104  (rojo cálido)
    Math.round(61 + t * 20),  // 61 → 81   (verde latón)
    Math.round(16 + t * 16),  // 16 → 32   (azul mínimo)
  ]
}

// Color de texto del modificador: rojo → crema → verde
function modTextColor(mod: number): string {
  if (mod >= 4) return '#22c55e'
  if (mod >= 2) return '#4ade80'
  if (mod >= 1) return '#86efac'
  if (mod === 0) return '#e8d898'
  if (mod >= -1) return '#fb923c'
  return '#f87171'
}

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
  classDetail?: { saving_throws?: { index: string; name: string }[] }
  raceDetailSpeed?: number
  // Clase
  hitDie?: number
  hitDiceAvailable?: number
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
    dexMod, strMod, profBonus, passivePerception, raceDetailSpeed,
    setShowLevelUpModal, setLevelUpHpInput, setModal,
    classDetail, classFeaturesByLevel, subclassDetail, subclassFeatureList,
  } = props

  const hasSubclass = !!(subclassFeatureList && subclassFeatureList.results.length > 0)
  const [activeFeatLevel, setActiveFeatLevel] = useState<number | 'subclass'>(level)

  return (
    <div>
      {/* Stats grid */}
      <SheetRow>
        <div className="flex-1 p-4">
          <SheetLabel>Características</SheetLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
            {STAT_KEYS.map(k => {
              const val = stats[k] ?? 10
              const mod = Math.floor((val - 10) / 2)
              const [r, g, b] = statBodyRgb(val)
              const textColor = modTextColor(mod)
              // Colores derivados del latón base
              const hi  = `rgb(${r+26},${g+19},${b+7})`   // brillo top-left
              const mid = `rgb(${r+10},${g+7},${b+2})`     // medio
              const base= `rgb(${r},${g},${b})`
              const drk = `rgb(${r-12},${g-9},${b-3})`     // sombra bottom-right
              const bdr = `rgb(${r-24},${g-17},${b-6})`    // borde exterior
              const insetDrk = `rgb(${r-18},${g-13},${b-4})`  // placa inset (más oscura)
              const rivetHi   = `rgb(${r+55},${g+42},${b+16})` // specular de la tachuela
              return (
                <div
                  key={k}
                  className="relative select-none flex flex-col items-center"
                  style={{
                    borderRadius: 7,
                    background: `linear-gradient(155deg, ${hi} 0%, ${mid} 30%, ${base} 65%, ${drk} 100%)`,
                    border: `2px solid ${bdr}`,
                    boxShadow: `
                      inset 0 1px 0 rgba(230,200,110,0.5),
                      inset 1px 0 0 rgba(210,175,80,0.25),
                      inset 0 -2px 0 rgba(0,0,0,0.5),
                      inset -1px 0 0 rgba(0,0,0,0.3),
                      0 4px 8px rgba(0,0,0,0.55),
                      0 2px 3px rgba(0,0,0,0.3)
                    `,
                    padding: '7px 5px 7px',
                  }}
                >
                  {/* Tachuelas en las cuatro esquinas */}
                  {([{top:3,left:3},{top:3,right:3},{bottom:3,left:3},{bottom:3,right:3}] as React.CSSProperties[]).map((pos, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      width: 5, height: 5,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 36% 30%, ${rivetHi} 0%, ${mid} 50%, ${bdr} 100%)`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,220,100,0.25)',
                      ...pos,
                    }} />
                  ))}

                  {/* Label */}
                  <p style={{
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    fontFamily: 'Georgia, serif',
                    color: `rgb(${r+62},${g+48},${b+20})`,
                    textTransform: 'uppercase',
                    textShadow: '0 1px 2px rgba(0,0,0,0.75)',
                    marginBottom: 1,
                  }}>
                    {ABILITY_LABELS[k]}
                  </p>

                  {/* Valor */}
                  <p style={{
                    fontSize: 28,
                    fontWeight: 700,
                    fontFamily: 'Georgia, serif',
                    color: '#f0e8c8',
                    lineHeight: 1.1,
                    textShadow: '0 2px 5px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,0.5)',
                    margin: '1px 0 6px',
                  }}>
                    {val}
                  </p>

                  {/* Placa de modificador — inset grabado */}
                  <div style={{
                    width: '84%',
                    textAlign: 'center',
                    borderRadius: 4,
                    background: `linear-gradient(180deg, ${insetDrk} 0%, ${base} 100%)`,
                    border: `1px solid ${bdr}`,
                    boxShadow: `
                      inset 0 2px 4px rgba(0,0,0,0.55),
                      inset 0 1px 0 rgba(0,0,0,0.3),
                      0 1px 0 rgba(230,200,90,0.2)
                    `,
                    padding: '2px 0 3px',
                  }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: textColor,
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      letterSpacing: '0.04em',
                    }}>
                      {fmtMod(mod)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </SheetRow>

      {/* Quick stats — Ini, Vel, GACO, Perc. Pas., Prof., Sal. */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1.5" style={{ background: 'rgba(160,125,60,0.08)' }}>
          <QuickPill label="Ini." value={fmtMod(dexMod)} title="Iniciativa" />
          <QuickPill label="Vel." value={`${raceDetailSpeed ?? 30} ft`} title="Velocidad por turno" />
          <QuickPill label="GACO" value={fmtMod(profBonus + Math.max(strMod, dexMod))} title="Bono de ataque con competencia" />
          <QuickPill label="Perc. pas." value={String(passivePerception)} title="Percepción Pasiva" />
          <QuickPill label="Prof." value={`+${profBonus}`} title="Bono de competencia" />
          {classDetail?.saving_throws && classDetail.saving_throws.length > 0 && (
            <QuickPill
              label="Sal."
              value={classDetail.saving_throws.map((st: { index: string }) => ABILITY_LABELS[st.index]).join(', ')}
              variant="save"
              title={`Salvaciones con competencia: ${classDetail.saving_throws.map((st: { name: string }) => st.name).join(', ')}`}
            />
          )}
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

        {/* CA */}
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
            <p className="text-[10px] text-stone-600 font-serif mt-1">Armadura</p>
          </div>
        </div>

        {/* XP */}
        <div className="flex-1 p-4">
          <SheetLabel>Experiencia</SheetLabel>
          <div className="mt-3 space-y-1.5">
            <div className="h-3 border border-stone-500/60 overflow-hidden bg-stone-200/40">
              <div className="h-full bg-amber-700 transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-stone-600">{xp.toLocaleString()} XP</span>
                {(isGm && !editingXp) && (
                  <button onClick={() => { setEditingXp(true); setXpInput('') }}
                    className="text-[10px] px-1.5 py-0.5 border border-stone-500 hover:border-amber-700 text-stone-500 hover:text-amber-700 font-serif transition-colors leading-none">
                    + XP
                  </button>
                )}
              </div>
              {xpForNext && <span className="text-[10px] text-stone-700 font-serif">Nv. {level + 1} → {xpForNext.toLocaleString()}</span>}
            </div>
            {(isGm && editingXp) && (
              <div className="flex items-center gap-1 w-full">
                <span className="text-xs text-stone-500 font-serif">+</span>
                <input autoFocus value={xpInput} onChange={e => setXpInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveXp()} placeholder="0"
                  className="w-full text-sm font-mono border-b border-stone-600 bg-transparent focus:outline-none text-center" />
                <button onClick={saveXp} className="text-[10px] px-1.5 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors leading-none">OK</button>
                <button onClick={() => { setEditingXp(false); setXpInput('') }} className="text-stone-500 text-xs">✕</button>
              </div>
            )}
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

      {/* Habilidades de clase con tabs por nivel */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4">
          <SheetLabel>
            Habilidades de clase
            {subclassDetail && <span className="font-serif normal-case tracking-normal ml-1 text-amber-700">· {subclassDetail.name}</span>}
          </SheetLabel>

          {/* Tabs por nivel */}
          {classFeaturesByLevel.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3 pb-2" style={{ borderBottom: '1px solid rgba(109,85,48,0.25)' }}>
              {classFeaturesByLevel.map(({ level: lvl }) => (
                <button
                  key={lvl}
                  onClick={() => setActiveFeatLevel(lvl)}
                  className="px-2 py-0.5 text-[10px] font-serif border transition-colors"
                  style={activeFeatLevel === lvl
                    ? { background: '#78350f', color: '#fef3c7', border: '1px solid #92400e' }
                    : { background: 'transparent', color: '#78716c', border: '1px solid rgba(109,85,48,0.4)' }
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

          {/* Features del nivel/subclase activo */}
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

      {/* Conditions — wax seals */}
      <SheetRow className="border-t border-stone-500/30">
        <div className="flex-1 p-4">
          {(conditions.length > 0 || isOwner) && (
            <>
              <SheetLabel>Condiciones activas</SheetLabel>
              <div className="flex flex-wrap gap-3 mt-4 items-center">
                {conditions.map(c => (
                  <WaxSeal
                    key={c}
                    condition={c}
                    canRemove={isOwner}
                    onRemove={() => toggleCondition(c)}
                  />
                ))}
                {isOwner && (
                  <div className="relative">
                    <button
                      onClick={() => setShowConditionPicker(v => !v)}
                      className="text-xs font-serif transition-colors"
                      style={{
                        padding: '4px 10px',
                        border: '1px solid rgba(120,80,30,0.5)',
                        color: '#8a6840',
                        background: 'rgba(80,50,15,0.1)',
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
              </div>
            </>
          )}
        </div>
      </SheetRow>
    </div>
  )
}
