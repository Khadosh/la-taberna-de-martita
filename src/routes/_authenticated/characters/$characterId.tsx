import { createFileRoute, useNavigate } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'

// Components
import { type SheetJson } from '../../../components/character-sheet/types'
import { parchmentStyle, mapBgStyle, sheetStyle, darkFrameStyle, SheetTabBar } from '../../../components/character-sheet/sheet-primitives'
import { InfoModal } from '../../../components/character-sheet/sheet-badges'
import { LevelUpModal } from '../../../components/character-sheet/level-up-modal'
import { ClassChoicesPanel } from '../../../components/character-sheet/class-choices-panel'
import { TabResumen } from '../../../components/character-sheet/tab-resumen'
import { TabPericias } from '../../../components/character-sheet/tab-pericias'
import { TabHechizos } from '../../../components/character-sheet/tab-hechizos'
import { TabHistoria } from '../../../components/character-sheet/tab-historia'
import { InventoryPanel } from '../../../components/character-sheet/inventory-panel'
import { calcAttackBonus, isArmorProficient, isShieldProficient } from '../../../lib/weapon-utils'
import { DiceModule } from '../../../lib/dice'
import { XP_THRESHOLDS, getSpellSlots } from '../../../lib/dnd-constants'
import { useCharacterSheet } from '../../../components/character-sheet/use-character-sheet'

export const Route = createFileRoute('/_authenticated/characters/$characterId')({
  component: CharacterSheet,
})

function CharacterSheet() {
  const { characterId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const navigate = useNavigate()

  const sheetState = useCharacterSheet(characterId)

  const {
    character, isLoading, inventory, campaign, raceDetail, classDetail, classLevels, subclassDetail, subclassFeatureList,
    activeTab, setActiveTab, mobileSection, setMobileSection, modal, setModal, confirmDelete, setConfirmDelete, generatingPortrait, showLevelUpModal, setShowLevelUpModal, showDice, setShowDice,
    levelUpHpInput, setLevelUpHpInput, levelUpSubclass, setLevelUpSubclass, levelUpAsi, setAsi, levelUpFightingStyle, setFightingStyle, levelUpFavoredEnemy, setFavoredEnemy, levelUpNewSpells, setNewSpells, levelUpExpertise, setLevelUpExpertise,
    editingHp, setEditingHp, hpInput, setHpInput, editingMaxHp, setEditingMaxHp, maxHpInput, setMaxHpInput, editingAc, setEditingAc, acInput, setAcInput, editingXp, setEditingXp, xpInput, setXpInput, showConditionPicker, setShowConditionPicker,
    showRestPanel, setShowRestPanel, shortRestHd, setShortRestHd, shortRestHpInput, setShortRestHpInput, showLongRestConfirm, setShowLongRestConfirm, fileInputRef,
    patchSheet, patchCharacter, adjustHp, saveHp, saveMaxHp, saveAc, saveXp, levelUp, toggleCondition, toggleSlot, toggleDeathSave, shortRest, longRest, generatePortrait, handlePortraitUpload, toggleEquip, equipToSlot, moveEquipSlot, maxHp
  } = sheetState

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={parchmentStyle}><p className="text-stone-600 font-serif italic">Consultando los pergaminos...</p></div>
  if (!character) return <div className="min-h-screen flex items-center justify-center" style={parchmentStyle}><p className="text-stone-600 font-serif">Personaje no encontrado.</p></div>

  const isOwner = character.user_id === session.user.id
  const isGm = campaign?.dm_id === session.user.id
  const stats = (character.stats as Record<string, number>) ?? {}
  const sheet = character.sheet_json as SheetJson
  const level = character.level
  const hitDie = sheet.hit_die ?? classDetail?.hit_die ?? 8
  const conMod = Math.floor(((stats.con ?? 10) - 10) / 2)
  const dexMod = Math.floor(((stats.dex ?? 10) - 10) / 2)
  const strMod = Math.floor(((stats.str ?? 10) - 10) / 2)
  const profBonus = Math.ceil(level / 4) + 1
  const passivePerception = 10 + Math.floor(((stats.wis ?? 10) - 10) / 2)
  const maxHpVal = maxHp()
  const currentHp = character.current_hp ?? maxHpVal
  const ac = character.armor_class ?? (10 + dexMod)
  const xp = character.experience_points ?? 0
  const xpForCurrent = XP_THRESHOLDS[level - 1] ?? 0
  const xpForNext = XP_THRESHOLDS[level] ?? null
  const xpPct = xpForNext ? Math.min(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100) : 100
  const canLevelUp = xpForNext !== null && xp >= xpForNext && level < 20
  const hpPct = Math.max(0, Math.min((currentHp / maxHpVal) * 100, 100))
  const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
  const maxSlots = getSpellSlots(character.class, level)
  const deathSaves = sheet.death_saves ?? { successes: 0, failures: 0 }
  const hitDiceAvailable = level - (sheet.hit_dice_used ?? 0)
  const classFeaturesByLevel = classLevels ? Array.from({ length: level }, (_, i) => ({
    level: i + 1,
    features: classLevels.filter(l => l.level === i + 1).flatMap(l => l.features),
  })).filter(l => l.features.length > 0) : []

  const isSpellcaster = maxSlots.some(s => s > 0)

  // Proficiencias de clase
  const classProfIndexes = (classDetail?.proficiencies ?? []).map((p: { index: string }) => p.index)

  // Arma equipada
  const _rawSlots = sheet.equipped_slots ?? {}
  const _weaponId = _rawSlots.main_hand ?? _rawSlots.ranged
  const equippedWeaponName = _weaponId ? inventory.find(i => i.id === _weaponId)?.name : undefined

  // Escudo en off_hand
  const _offHandId = _rawSlots.off_hand
  const _offHandItem = _offHandId ? inventory.find(i => i.id === _offHandId) : undefined
  const hasEquippedShield = !!(_offHandItem?.notes?.startsWith('Escudo') || /\bshield\b/i.test(_offHandItem?.name ?? ''))

  // Resultados de proficiencia
  const gacoResult = equippedWeaponName
    ? calcAttackBonus(equippedWeaponName, sheetState.weaponApiData, strMod, dexMod, profBonus, classProfIndexes, sheet.weapon_proficiencies ?? [])
    : null
  const armorProficient = sheet.equipped_armor
    ? isArmorProficient(sheet.equipped_armor.category, classProfIndexes)
    : true
  const shieldProfOk = hasEquippedShield ? isShieldProficient(classProfIndexes) : true

  const mobileTabs = [
    {
      id: 'personaje' as const, label: 'Personaje', icon: (
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="1" x2="7" y2="11" />
          <line x1="3" y1="8" x2="11" y2="8" />
          <path d="M5 11 L7 16 L9 11" strokeWidth="1.7" />
        </svg>
      )
    },
    {
      id: 'inventario' as const, label: 'Inventario', icon: (
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 5 Q4.5 2 7 2 Q9.5 2 9.5 5" />
          <rect x="1" y="5" width="12" height="8" rx="1.5" />
          <line x1="4.5" y1="9" x2="9.5" y2="9" />
        </svg>
      )
    },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden text-stone-900" style={mapBgStyle}>
      {/* Header */}
      <header className="flex-shrink-0 border-b-2 border-stone-800 bg-stone-900 px-4 sm:px-8 py-2.5 flex items-center gap-3 z-30">
        <button onClick={() => window.history.back()} className="text-amber-400 hover:text-amber-200 text-sm font-serif">← Volver</button>
        <div className="w-px h-4 bg-stone-700 mx-2" />
        <div className="flex-1 truncate">
          <p className="text-amber-200 font-serif font-semibold text-sm truncate">{character.name}</p>
          <p className="text-stone-500 font-serif text-xs truncate capitalize">{character.race} · {character.class} · Nv. {level}</p>
        </div>
        <button onClick={() => setShowDice(true)} className="px-3 py-1 border border-amber-800 text-amber-500 text-xs font-serif bg-amber-900/20 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="1" width="10" height="10" rx="1.5" />
            <circle cx="4" cy="4" r="0.9" fill="currentColor" />
            <circle cx="8" cy="4" r="0.9" fill="currentColor" />
            <circle cx="4" cy="8" r="0.9" fill="currentColor" />
            <circle cx="8" cy="8" r="0.9" fill="currentColor" />
          </svg>
          Dados
        </button>
      </header>

      {/* Mobile section switcher */}
      <div
        className="lg:hidden flex shrink-0"
        style={{ background: 'linear-gradient(180deg, #3a2410 0%, #271608 100%)', borderBottom: '2px solid #180e04' }}
      >
        {mobileTabs.map(tab => {
          const isActive = mobileSection === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setMobileSection(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-serif tracking-wide transition-all"
              style={isActive ? {
                background: 'linear-gradient(180deg, #5a3820 0%, #3e2410 100%)',
                color: '#f0d898',
                fontWeight: 600,
                borderBottom: '2px solid #c8900a',
              } : { color: '#8a6840' }}
            >
              <span style={{ opacity: isActive ? 1 : 0.65 }}>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full lg:max-w-5xl lg:mx-auto lg:px-6 lg:py-8 ">
          <div className="h-full lg:grid lg:grid-cols-12 lg:gap-6 lg:items-stretch">

            {/* Hoja de personaje */}
            <div
              className={`lg:col-span-7 h-full flex flex-col overflow-hidden ${mobileSection === 'inventario' ? 'hidden lg:flex' : ''}`}
              style={sheetStyle}
            >
              {/* Header: Identidad + Retrato */}
              <div className="w-full flex flex-row items-center justify-center pt-2">
                <div className="flex items-stretch flex-shrink-0 mb-2 relative overflow-hidden" style={{ minHeight: '120px' }}>
                  {/* Portrait con frame ornamental */}
                  <div
                    className="w-[108px] flex-shrink-0 relative group"
                    style={{ background: 'rgba(30,18,6,0.85)' }}
                  >
                    <div className="absolute inset-2 overflow-hidden">
                      {character.portrait_url ? (
                        <img src={character.portrait_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ background: 'rgba(30,18,6,0.5)', color: 'rgba(180,130,60,0.4)' }}>
                          <svg width="28" height="36" viewBox="0 0 14 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="7" y1="1" x2="7" y2="13" />
                            <line x1="3" y1="10" x2="11" y2="10" />
                            <path d="M5 13 L7 18.5 L9 13" strokeWidth="1.8" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-2 pointer-events-none" style={{
                      boxShadow: `
                      inset 0 0 0 1px rgba(200,150,50,0.7),
                      inset 0 0 0 3px rgba(20,10,4,0.8),
                      inset 0 0 0 4px rgba(160,110,35,0.5)
                    `,
                    }} />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      border: '2px solid rgba(160,110,35,0.8)',
                      boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6)',
                    }} />
                    {[['top-1 left-1', ''], ['top-1 right-1', 'rotate-90'], ['bottom-1 left-1', '-rotate-90'], ['bottom-1 right-1', 'rotate-180']].map(([pos, rot], i) => (
                      <svg key={i} className={`absolute ${pos} ${rot}`} width="12" height="12" viewBox="0 0 12 12">
                        <path d="M1 6V1h5" stroke="rgba(210,160,50,0.9)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                      </svg>
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                      style={{ background: 'rgba(0,0,0,0.55)' }}>
                      <button onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-serif underline" style={{ color: '#f0dfc0' }}>Subir</button>
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="flex-1 px-5 py-4 flex flex-col justify-center min-w-0">
                    <h1 className="text-[26px] font-bold font-serif leading-none truncate" style={{ color: '#2c1a08' }}>{character.name}</h1>
                    <p className="text-sm font-serif mt-2 capitalize" style={{ color: '#5c3d18' }}>
                      {character.race}
                      <span className="mx-1.5 font-bold" style={{ color: '#b06820' }}>•</span>
                      {character.class}{subclassDetail ? ` (${subclassDetail.name})` : ''}
                    </p>
                    <p className="text-[11px] font-serif tracking-widest uppercase mt-1" style={{ color: '#b06820' }}>Nivel {level}</p>
                    <button
                      onClick={generatePortrait}
                      disabled={generatingPortrait}
                      className="mt-3 self-start text-[10px] px-2.5 py-1 bg-amber-900/10 border border-amber-900/25 text-amber-900 hover:bg-amber-900/20 transition-colors font-serif disabled:opacity-50"
                    >
                      {generatingPortrait ? 'Hechizando...' : 'Retrato IA'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePortraitUpload} />
                  </div>
                </div>
              </div>

              {/* Tabs Bar */}
              <div className="mx-0 my-0 py-2" style={{ borderTop: '2px solid rgba(109,85,48,0.55)' }}>
                <SheetTabBar active={activeTab} onChange={setActiveTab} />
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-2">
                {activeTab === 'resumen' && (
                  <>
                  <ClassChoicesPanel
                    characterClass={character.class}
                    sheet={sheet}
                    level={level}
                    isOwner={isOwner}
                    patchSheet={patchSheet}
                  />
                  <TabResumen
                    {...{
                      stats, sheet, character, raceDetail, isOwner, isGm, currentHp, maxHp: maxHpVal, hitDie, hpPct, hpColor,
                      editingHp, hpInput, setHpInput, setEditingHp, editingMaxHp, maxHpInput, setMaxHpInput, setEditingMaxHp,
                      ac, xp, xpPct, level, xpForCurrent, xpForNext, canLevelUp, editingAc, acInput, setAcInput, setEditingAc,
                      editingXp, xpInput, setXpInput, setEditingXp, dexMod, strMod, profBonus, passivePerception, hitDiceAvailable,
                      conditions: (character.conditions as string[]) ?? [], deathSaves, isStable: currentHp === 0 && deathSaves.successes >= 3,
                      isDead: currentHp === 0 && deathSaves.failures >= 3, currency: sheet.currency ?? { gold: 0, silver: 0, copper: 0 },
                      showRestPanel, setShowRestPanel, showLongRestConfirm, setShowLongRestConfirm, shortRestHd, setShortRestHd,
                      shortRestHpInput, setShortRestHpInput, showConditionPicker, setShowConditionPicker,
                      adjustHp, saveHp, saveMaxHp, saveAc, saveXp, shortRest, longRest, toggleCondition, toggleDeathSave,
                      setShowLevelUpModal, setLevelUpHpInput, setModal, classDetail, raceDetailSpeed: raceDetail?.speed,
                      classFeaturesByLevel, subclassDetail, subclassFeatureList,
                      gacoResult, armorProficient, shieldProfOk,
                    }}
                    patchSheet={patchSheet}
                    patchCharacter={patchCharacter}
                  />
                  </>
                )}
                {activeTab === 'pericias' && (
                  <TabPericias
                    stats={stats}
                    skillProficiencies={sheet.skill_proficiencies ?? []}
                    expertise={sheet.expertise ?? []}
                    weaponProficiencies={sheet.weapon_proficiencies ?? []}
                    profBonus={profBonus}
                    backgroundKey={sheet.background}
                    setModal={setModal}
                  />
                )}
                {activeTab === 'hechizos' && (
                  <TabHechizos
                    spells={sheet.spells ?? []} maxSlots={maxSlots} slotsUsed={sheet.spell_slots_used ?? {}}
                    characterClass={character.class} isOwner={isOwner} isSpellcaster={isSpellcaster}
                    setModal={setModal} toggleSlot={toggleSlot}
                  />
                )}
                {activeTab === 'historia' && (
                  <TabHistoria
                    backstory={character.backstory}
                    sheet={sheet}
                    isOwner={isOwner}
                    confirmDelete={confirmDelete}
                    setConfirmDelete={setConfirmDelete}
                    onDelete={async () => { await supabase.from('characters').delete().eq('id', characterId); navigate({ to: '/' }) }}
                    patchSheet={patchSheet}
                  />
                )}
              </div>
            </div>

            {/* Panel de Inventario */}
            <div
              className={`lg:col-span-5 h-full min-h-0 overflow-hidden ${mobileSection === 'personaje' ? 'hidden lg:flex lg:flex-col' : ''}`}
              style={darkFrameStyle}
            >
              <InventoryPanel
                characterId={characterId}
                inventory={inventory}
                sheet={sheet}
                isOwner={isOwner}
                ac={ac}
                toggleEquip={toggleEquip}
                equipToSlot={equipToSlot}
                moveEquipSlot={moveEquipSlot}
                patchCurrency={(p) => patchSheet({ currency: { ...(sheet.currency ?? { gold: 0, silver: 0, copper: 0 }), ...p } })}
                currency={sheet.currency ?? { gold: 0, silver: 0, copper: 0 }}
                strScore={stats.str ?? 10}
              />
            </div>

          </div>
        </div>
      </main>

      <DiceModule isOpen={showDice} onClose={() => setShowDice(false)} />
      {showLevelUpModal && (
        <LevelUpModal
          character={character} level={level} hitDie={hitDie} conMod={conMod} stats={stats}
          hpInput={levelUpHpInput} setHpInput={setLevelUpHpInput}
          subclass={levelUpSubclass} setSubclass={setLevelUpSubclass}
          asi={levelUpAsi} setAsi={setAsi}
          fightingStyle={levelUpFightingStyle} setFightingStyle={setFightingStyle}
          favoredEnemy={levelUpFavoredEnemy} setFavoredEnemy={setFavoredEnemy}
          newSpells={levelUpNewSpells} setNewSpells={setNewSpells}
          expertise={levelUpExpertise} setExpertise={setLevelUpExpertise}
          currentSubclass={sheet.subclass}
          currentFightingStyle={sheet.fighting_style}
          currentFavoredEnemies={sheet.favored_enemy}
          currentExpertise={sheet.expertise}
          onConfirm={levelUp}
          onCancel={() => setShowLevelUpModal(false)}
        />
      )}
      {modal && <InfoModal modal={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
