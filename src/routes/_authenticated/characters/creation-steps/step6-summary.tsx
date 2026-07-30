import { CLASS_ICONS } from '../../../../lib/class-meta'
import { ABILITY_ABBR } from '../../../../lib/dnd-backgrounds'
import { abilityModifier, modifierColor, ABILITY_LABELS } from '../../../../lib/dnd-api'
import { StepTitle, inputStyle, cardStyle } from './primitives'
import type { Draft, Stats } from '../character-creation-steps'
import { STAT_KEYS } from '../character-creation-steps'
import { useI18n } from '../../../../i18n'

interface Step6Props {
  draft: Draft
  patch: (u: Partial<Draft>) => void
  raceDetail: any
  classDetail: any
  totalStats: Stats
  selectedBg: any
  userCampaigns: Array<{ id: string; name: string }>
  error: string | null
}

export function Step6Summary({ draft, patch, raceDetail, classDetail, totalStats, selectedBg, userCampaigns, error }: Step6Props) {
  const { t, locale } = useI18n()
  const classIcon = CLASS_ICONS[draft.classIndex] ?? '🎲'
  return (
    <div className="space-y-6">
      <StepTitle>{t('creation.storyAndSummary')}</StepTitle>
      <textarea
        placeholder={t('creation.backstoryPlaceholder')}
        value={draft.backstory} onChange={e => patch({ backstory: e.target.value })}
        rows={6} style={inputStyle}
        className="w-full px-4 py-3 text-stone-200 placeholder-stone-600 font-serif focus:outline-none resize-none text-sm"
      />
      <div className="space-y-1.5">
        <label className="text-xs text-stone-500 font-display tracking-widest uppercase font-serif">{t('creation.campaign')} <span className="text-stone-700 normal-case">{t('creation.optional')}</span></label>
        <select value={draft.campaignId} onChange={e => patch({ campaignId: e.target.value })}
          style={inputStyle} className="w-full px-4 py-2.5 text-stone-200 font-serif focus:outline-none text-sm font-serif">
          <option value="">{t('creation.noCampaign')}</option>
          {userCampaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={cardStyle} className="p-4 space-y-3 text-sm">
        <p className="text-xs text-stone-500 font-display tracking-widest uppercase mb-3 font-serif">{t('creation.summary')}</p>
        <div className="flex items-center gap-3 mb-2">
          {draft.classIndex ? (
            <img
              src={`/assets/images/classes/${draft.classIndex}_avatar.png`}
              className="w-10 h-10 rounded-full border border-tavern-gold/40 bg-stone-950 object-cover"
              alt=""
            />
          ) : (
            <span className="text-2xl">{classIcon}</span>
          )}
          <div>
            <p className="text-stone-200 font-serif font-semibold">{draft.name}</p>
            <p className="text-stone-500 text-xs font-serif capitalize">{raceDetail?.name} · {classDetail?.name} · {t('creation.level')} {draft.level}</p>
            {selectedBg && <p className="text-stone-600 text-xs font-serif">{t('creation.backgroundLabel')} {selectedBg.name}</p>}
          </div>
        </div>
        {selectedBg && draft.bgBonus2 && draft.bgBonus1 && (
          <div className="flex gap-2 flex-wrap pb-2">
            <span className="text-xs text-amber-400/80 border border-amber-900/40 px-2 py-0.5 font-serif">
              {selectedBg.name}: +2 {ABILITY_ABBR[locale][draft.bgBonus2]} · +1 {ABILITY_ABBR[locale][draft.bgBonus1]}
            </span>
          </div>
        )}
        <div className="grid grid-cols-6 gap-1 pt-2 border-t border-stone-800">
          {STAT_KEYS.map(k => (
            <div key={k} className="text-center">
              <p className="text-[10px] text-stone-600 font-display tracking-wider uppercase">{ABILITY_LABELS[k]}</p>
              <p className="text-sm font-mono font-bold text-stone-200">{totalStats[k] || '—'}</p>
              {totalStats[k] > 0 && <p className={`text-[10px] font-mono ${modifierColor(totalStats[k])}`}>{abilityModifier(totalStats[k])}</p>}
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-red-400/90 text-xs font-serif text-center border border-red-900/40 px-3 py-1.5 bg-red-950/30">
          {error}
        </p>
      )}
    </div>
  )
}
