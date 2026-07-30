import { SheetLabel, SheetRow } from './sheet-primitives'
import { useT } from '../../i18n'

interface HpAcXpRowProps {
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
  editingMaxHp: boolean
  maxHpInput: string
  setMaxHpInput: (v: string) => void
  setEditingMaxHp: (v: boolean) => void
  saveMaxHp: () => void
  adjustHp: (delta: number) => void
  saveHp: () => void
  // CA
  ac: number
  armorProficient: boolean
  shieldProfOk: boolean
  editingAc: boolean
  acInput: string
  setAcInput: (v: string) => void
  setEditingAc: (v: boolean) => void
  saveAc: () => void
  // XP
  xp: number
  xpPct: number
  level: number
  xpForNext?: number
  canLevelUp: boolean
  editingXp: boolean
  xpInput: string
  setXpInput: (v: string) => void
  setEditingXp: (v: boolean) => void
  saveXp: () => void
  setShowLevelUpModal: (v: boolean) => void
  setLevelUpHpInput: (v: string) => void
}

export function HpAcXpRow({
  isOwner, isGm,
  currentHp, maxHp, hpPct, hpColor,
  editingHp, hpInput, setHpInput, setEditingHp,
  editingMaxHp, maxHpInput, setMaxHpInput, setEditingMaxHp, saveMaxHp,
  adjustHp, saveHp,
  ac, armorProficient, shieldProfOk,
  editingAc, acInput, setAcInput, setEditingAc, saveAc,
  xp, xpPct, level, xpForNext, canLevelUp,
  editingXp, xpInput, setXpInput, setEditingXp, saveXp,
  setShowLevelUpModal, setLevelUpHpInput,
}: HpAcXpRowProps) {
  const t = useT()
  return (
    <SheetRow className="border-t border-stone-500/30">
      {/* HP */}
      <div className="flex-1 p-4" style={{ borderRight: '1px solid rgba(109,85,48,0.3)' }}>
        <SheetLabel>{t('sheet.hitPoints')}</SheetLabel>
        <div className="mt-3 space-y-2">
          <div className="h-3 border border-stone-500/60 overflow-hidden bg-stone-200/40">
            <div className={`h-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {isOwner && <button onClick={() => adjustHp(-5)} className="w-7 h-6 text-xs border border-red-700/60 text-red-700 hover:bg-red-100/30 leading-none font-mono" title={t('sheet.damage5')}>-5</button>}
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
                  title={isOwner ? t('sheet.editMaxHp') : undefined}
                >
                  {maxHp}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isOwner && <button onClick={() => adjustHp(1)} className="w-6 h-6 text-sm border border-stone-500 text-stone-600 hover:bg-stone-200/50 leading-none font-mono">+</button>}
              {isOwner && <button onClick={() => adjustHp(5)} className="w-7 h-6 text-xs border border-green-700/60 text-green-700 hover:bg-green-100/30 leading-none font-mono" title={t('sheet.heal5')}>+5</button>}
            </div>
          </div>
        </div>
      </div>

      {/* CA */}
      <div className="sm:w-28 p-4 text-center" style={{ borderRight: '1px solid rgba(109,85,48,0.3)' }}>
        <SheetLabel>
          {(!armorProficient || !shieldProfOk)
            ? <span className="inline-flex items-center gap-1" title={t('sheet.noProficiency', { what: t(armorProficient ? 'sheet.noProficiencyShield' : 'sheet.noProficiencyArmor') })}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 1L11 10.5H1Z" />
                <line x1="6" y1="5" x2="6" y2="7.5" />
                <circle cx="6" cy="9" r="0.65" fill="currentColor" stroke="none" />
              </svg>
              {t('sheet.armorClass')}
            </span>
            : t('sheet.armorClass')
          }
        </SheetLabel>
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
          <p className="text-[10px] text-stone-600 font-serif mt-1">{t('sheet.armor')}</p>
        </div>
      </div>

      {/* XP */}
      <div className="flex-1 p-4">
        <SheetLabel>{t('sheet.experience')}</SheetLabel>
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
                  {t('sheet.addXp')}
                </button>
              )}
            </div>
            {xpForNext && <span className="text-[10px] text-stone-700 font-serif">{t('sheet.nextLevel', { level: level + 1, xp: xpForNext.toLocaleString() })}</span>}
          </div>
          {(isGm && editingXp) && (
            <div className="flex items-center gap-1 w-full">
              <span className="text-xs text-stone-500 font-serif">+</span>
              <input autoFocus value={xpInput} onChange={e => setXpInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveXp()} placeholder="0"
                className="w-full text-sm font-mono border-b border-stone-600 bg-transparent focus:outline-none text-center" />
              <button onClick={saveXp} className="text-[10px] px-1.5 py-0.5 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors leading-none">OK</button>
              <button onClick={() => { setEditingXp(false); setXpInput('') }} className="text-stone-400 hover:text-stone-700 transition-colors leading-none">
                <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" /><line x1="8.5" y1="1.5" x2="1.5" y2="8.5" />
                </svg>
              </button>
            </div>
          )}
          {canLevelUp && (isGm || isOwner) && (
            <button onClick={() => { setShowLevelUpModal(true); setLevelUpHpInput('') }}
              className="w-full text-xs py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif transition-colors animate-pulse">
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
                <line x1="5" y1="8" x2="5" y2="2" /><polyline points="2,5 5,2 8,5" />
              </svg>
              {t('levelUp.title', { level: level + 1 })}
            </button>
          )}
        </div>
      </div>
    </SheetRow>
  )
}
