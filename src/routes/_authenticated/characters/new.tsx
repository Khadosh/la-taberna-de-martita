import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { dndApi, dndKeys } from '../../../lib/dnd-api'
import type { SpellDetail } from '../../../lib/dnd-api'
import { BACKGROUNDS } from '../../../lib/dnd-backgrounds'
import { getExpertiseCount, SUBCLASS_SELECTION_LEVELS } from '../../../lib/class-choices'
import {
  type Draft, type Stats, EMPTY_STATS, STAT_KEYS, rollAll
} from './character-creation-steps'
import { inputStyle, cardStyle, btnStyle } from './creation-steps/primitives'
import { Step1BasicInfo } from './creation-steps/step1-basic-info'
import { Step2Stats } from './creation-steps/step2-stats'
import { Step4Proficiencies } from './creation-steps/step4-proficiencies'
import { Step5Spells } from './creation-steps/step5-spells'
import { Step6Summary } from './creation-steps/step6-summary'

export const Route = createFileRoute('/_authenticated/characters/new')({
  component: NewCharacter,
})

function NewCharacter() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = Route.useRouteContext() as { session: Session }

  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [spellModal, setSpellModal] = useState<SpellDetail | null>(null)
  const [statMode, setStatMode] = useState<'rolled' | 'manual'>('rolled')
  const [draft, setDraft] = useState<Draft>({
    name: '', raceIndex: '', classIndex: '', subclassIndex: '', level: 1,
    rolledValues: rollAll(),
    stats: EMPTY_STATS,
    backgroundKey: '', bgBonus2: '', bgBonus1: '',
    skillProficiencies: [], spells: [], backstory: '', campaignId: '',
    expertise: [],
  })

  const patch = (update: Partial<Draft>) => setDraft(d => ({ ...d, ...update }))

  const { data: races } = useQuery({ queryKey: dndKeys.races, queryFn: dndApi.races })
  const { data: classes } = useQuery({ queryKey: dndKeys.classes, queryFn: dndApi.classes })
  const { data: raceDetail } = useQuery({
    queryKey: dndKeys.race(draft.raceIndex),
    queryFn: () => dndApi.race(draft.raceIndex),
    enabled: !!draft.raceIndex,
  })
  const { data: classDetail } = useQuery({
    queryKey: dndKeys.klass(draft.classIndex),
    queryFn: () => dndApi.klass(draft.classIndex),
    enabled: !!draft.classIndex,
  })
  const { data: classSubclasses } = useQuery({
    queryKey: dndKeys.classSubclasses(draft.classIndex),
    queryFn: () => dndApi.classSubclasses(draft.classIndex),
    enabled: !!draft.classIndex,
  })
  const { data: userCampaigns = [] } = useQuery({
    queryKey: ['campaigns', 'all', session.user.id],
    queryFn: async () => {
      const [gm, player] = await Promise.all([
        supabase.from('campaigns').select('id, name').eq('dm_id', session.user.id),
        supabase.from('campaign_players').select('campaigns(id, name)').eq('user_id', session.user.id),
      ])
      const gmList = gm.data ?? []
      const playerList = (player.data ?? []).flatMap(r => r.campaigns ? [r.campaigns as { id: string; name: string }] : [])
      const seen = new Set<string>()
      return [...gmList, ...playerList].filter(c => seen.has(c.id) ? false : (seen.add(c.id), true))
    },
  })
  const { data: classSpells } = useQuery({
    queryKey: dndKeys.classSpells(draft.classIndex),
    queryFn: () => dndApi.classSpells(draft.classIndex),
    enabled: !!draft.classIndex && !!classDetail?.spellcasting,
  })

  const selectedBg = draft.backgroundKey ? BACKGROUNDS[draft.backgroundKey] : null
  const backgroundBonuses: Partial<Stats> = selectedBg && draft.bgBonus2 && draft.bgBonus1
    ? { [draft.bgBonus2]: 2, [draft.bgBonus1]: 1 }
    : {}
  const totalStats = STAT_KEYS.reduce<Stats>((acc, k) => {
    acc[k] = (draft.stats[k] || 0) + (backgroundBonuses[k] ?? 0)
    return acc
  }, { ...EMPTY_STATS })

  const isCaster = !!classDetail?.spellcasting
  const totalSteps = isCaster ? 5 : 4

  const canProceed = (): boolean => {
    if (step === 1) {
      const basicOk = !!(draft.name.trim() && draft.raceIndex && draft.classIndex)
      const bgOk = !!(draft.backgroundKey && draft.bgBonus2 && draft.bgBonus1 && draft.bgBonus2 !== draft.bgBonus1)
      return basicOk && bgOk
    }
    if (step === 2) {
      if (statMode === 'manual') return STAT_KEYS.every(k => draft.stats[k] >= 3 && draft.stats[k] <= 15)
      const unassigned = STAT_KEYS.filter(k => !draft.stats[k])
      return unassigned.length === 0 && new Set(Object.values(draft.stats)).size === 6
    }
    if (step === 3) {
      const choices = classDetail?.proficiency_choices[0]
      const skillsOk = !choices || draft.skillProficiencies.length === choices.choose
      const expectedExpertise = getExpertiseCount(draft.classIndex, draft.level)
      const expertiseOk = (draft.expertise ?? []).length === expectedExpertise
      return skillsOk && expertiseOk
    }
    return true
  }

  const handleSave = async () => {
    setError(null)
    const subclassReqLevel = SUBCLASS_SELECTION_LEVELS[draft.classIndex] ?? 1
    const shouldSaveSubclass = draft.level >= subclassReqLevel && draft.subclassIndex
    const expectedExpertise = getExpertiseCount(draft.classIndex, draft.level)
    const expertiseToSave = (draft.expertise ?? []).slice(0, expectedExpertise)

    const { error } = await supabase.from('characters').insert({
      user_id: session.user.id,
      name: draft.name.trim(),
      race: draft.raceIndex,
      class: draft.classIndex,
      level: draft.level,
      stats: totalStats,
      backstory: draft.backstory || null,
      campaign_id: draft.campaignId || null,
      sheet_json: {
        base_stats: draft.stats,
        background: draft.backgroundKey || null,
        background_bonuses: backgroundBonuses,
        background_skills: selectedBg?.skills ?? [],
        skill_proficiencies: draft.skillProficiencies,
        expertise: expertiseToSave,
        weapon_proficiencies: classDetail?.proficiencies.map((p: any) => p.index) ?? [],
        spells: draft.spells,
        hit_die: classDetail?.hit_die ?? 8,
        saving_throws: classDetail?.saving_throws.map((s: any) => s.index) ?? [],
        ...(shouldSaveSubclass ? { subclass: draft.subclassIndex } : {}),
      },
    })
    if (error) { setError(error.message); return }
    await queryClient.invalidateQueries({ queryKey: ['characters'] })
    navigate({ to: '/' })
  }


  return (
    <div className="min-h-screen bg-stone-tavern text-stone-100">
      <header className="border-b border-stone-800/80 px-4 sm:px-8 py-3 flex items-center justify-between gap-2" style={headerStyle}>
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="w-7 h-7" />
          <div className="hidden sm:block">
            <h1 className="font-display text-amber-200/90 text-base leading-tight tracking-wide">La Taberna</h1>
            <p className="font-display text-amber-500/80 text-[0.6rem] tracking-[0.3em] uppercase leading-none">de Martita</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-display text-amber-500/70 text-xs tracking-widest uppercase hidden sm:block">Nuevo personaje</p>
          <span className="text-xs text-stone-600 font-serif">Paso {step} de {totalSteps}</span>
        </div>
      </header>

      <div className={`${step === 1 ? 'max-w-6xl' : 'max-w-2xl'} mx-auto px-4 sm:px-8 py-8`}>
        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-6 h-6 flex items-center justify-center text-xs font-display transition-colors ${
                i + 1 < step ? 'text-amber-600 border border-amber-800/60' :
                i + 1 === step ? 'text-amber-300 border border-amber-600' :
                'text-stone-700 border border-stone-800'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < totalSteps - 1 && <div className={`flex-1 h-px mx-1 ${i + 1 < step ? 'bg-amber-800/60' : 'bg-stone-800'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Step1BasicInfo draft={draft} patch={patch}
            races={races} classes={classes}
            raceDetail={raceDetail} classDetail={classDetail} classSubclasses={classSubclasses}
            selectedBg={selectedBg} />
        )}
        {step === 2 && (
          <Step2Stats draft={draft} patch={patch} statMode={statMode} setStatMode={setStatMode} />
        )}
        {step === 3 && classDetail && (
          <Step4Proficiencies draft={draft} patch={patch} classDetail={classDetail} selectedBg={selectedBg} />
        )}
        {step === 4 && isCaster && classSpells && (
          <Step5Spells draft={draft} patch={patch}
            classSpells={classSpells} classDetail={classDetail} setSpellModal={setSpellModal} />
        )}
        {step === totalSteps && (
          <Step6Summary draft={draft} patch={patch}
            raceDetail={raceDetail} classDetail={classDetail}
            totalStats={totalStats} selectedBg={selectedBg}
            userCampaigns={userCampaigns} error={error} />
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate({ to: '/' })}
            className="flex-1 py-2.5 border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-stone-200 transition-colors text-sm font-serif"
          >
            {step === 1 ? 'Cancelar' : '← Atrás'}
          </button>
          {step < totalSteps ? (
            <button
              onClick={() => canProceed() && setStep(s => s + 1)}
              disabled={!canProceed()}
              style={canProceed() ? btnStyle : {}}
              className={`flex-1 py-2.5 text-sm font-display tracking-wider transition-all ${!canProceed() ? 'border border-stone-800 text-stone-700 cursor-not-allowed' : ''}`}
            >
              Siguiente →
            </button>
          ) : (
            <button onClick={handleSave} style={btnStyle}
              className="flex-1 py-2.5 font-display text-sm tracking-wider transition-all">
              Crear personaje
            </button>
          )}
        </div>
      </div>

      {spellModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSpellModal(null)}>
          <div onClick={e => e.stopPropagation()} style={modalStyle} className="max-w-md w-full p-6 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-amber-200 tracking-wide">{spellModal.name}</h3>
                <p className="text-xs text-stone-500 mt-0.5 font-serif">
                  Nv. {spellModal.level} · {spellModal.school.name} · {spellModal.casting_time}
                </p>
              </div>
              <button onClick={() => setSpellModal(null)} className="text-stone-600 hover:text-stone-300 text-lg leading-none ml-4">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-500 font-serif border-t border-stone-800 pt-3">
              <span>Alcance: {spellModal.range}</span>
              <span>Duración: {spellModal.duration}</span>
              <span>Componentes: {spellModal.components.join(', ')}</span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed font-serif max-h-48 overflow-y-auto">{spellModal.desc[0]}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const headerStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #100c08 0%, #0c0a08 100%)',
}

const modalStyle: CSSProperties = {
  background: 'linear-gradient(170deg, #180e06 0%, #0f0804 100%)',
  border: '1px solid rgba(120,70,20,0.4)',
}

// Re-export shared styles for step components that need them inline
export { inputStyle, cardStyle }
