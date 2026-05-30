import { useState } from 'react'
import { CombatBoard } from '../combat-board'
import { DmNpcForm } from './dm-npc-form'
import { DmMapSelector } from './dm-map-selector'
import { DmNpcSidebar } from './dm-npc-sidebar'
import { CLASS_ICONS } from '../../lib/class-meta'
import { CONDITIONS, getSpellSlots } from '../../lib/dnd-constants'
import { maxHpFor, currentHpFor, acFor, getDeterministicColor } from './tablero-types'
import { useEncounterGenerator } from './use-encounter-generator'

interface DmTableroLayoutProps {
  campaignId: string
  dmState: ReturnType<typeof import('./use-dm-tablero').useDmTablero>
}

export function DmTableroLayout({ campaignId, dmState }: DmTableroLayoutProps) {
  const {
    npcInputRef,
    localHp,
    combatActive,
    combatants,
    currentTurn,
    npcInput,
    setNpcInput,
    activeMapUrl,
    externalPositions,
    mapUploading,
    mapsList,
    loadingMaps,
    showMapSelector,
    setShowMapSelector,
    showBestiary,
    setShowBestiary,
    bestiarySearch,
    setBestiarySearch,
    bestiaryQty,
    setBestiaryQty,
    addingMonster,
    showCampaignNpcs,
    setShowCampaignNpcs,
    campaignNpcSearch,
    setCampaignNpcSearch,
    showNpcForm,
    setShowNpcForm,
    npcFormName,
    setNpcFormName,
    npcFormHp,
    setNpcFormHp,
    npcFormAc,
    setNpcFormAc,
    npcFormType,
    setNpcFormType,
    npcFormAttack,
    setNpcFormAttack,
    npcFormDamage,
    setNpcFormDamage,
    npcFormItems,
    npcFormSpells,
    npcFormWeapons,
    npcFormEquipment,
    setNpcFormEquipment,
    editingHp,
    setEditingHp,
    conditionPickerFor,
    setConditionPickerFor,
    showLongRestConfirm,
    setShowLongRestConfirm,
    showNpcBar,
    setShowNpcBar,
    combatLog,
    showLog,
    setShowLog,
    externalTargeting,
    fetchMaps,
    activateMap,
    deleteMap,
    characters,
    filteredMonsters,
    filteredCampaignNpcs,
    patchCharacter,
    adjustCharacterHp,
    onTokenMoved,
    uploadMap,
    startCombat,
    endCombat,
    nextTurn,
    addNpc,
    updateNpc,
    removeNpc,
    toggleNpcHidden,
    setNpcHidden,
    adjustBoardNpcHp,
    boardTokens,
    addNpcFromMonster,
    addNpcFromCampaign,
    createCustomNpc,
    addLootItem,
    updateLootItem,
    removeLootItem,
    addFormWeapon,
    updateFormWeapon,
    removeFormWeapon,
    addFormSpell,
    removeFormSpell,
    partyLongRest,
    handleAttackConfirm,
    tokens,
    allCombatEntities,
    handleSelectionChange,
  } = dmState

  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null)
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  const encounterGen = useEncounterGenerator({ characters, campaignId, addNpcFromMonster })

  return (
    <div className="bg-stone-950 text-stone-100 flex flex-col overflow-hidden w-full" style={{ height: 'calc(100vh - 100px)' }}>
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: Party */}
        <aside className={`transition-all duration-300 ${leftPanelCollapsed ? 'w-0 overflow-hidden opacity-0 border-r-0' : 'w-72 border-r border-stone-800'} flex flex-col overflow-y-auto bg-stone-900/50`}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Partido · {characters.length}</p>
          </div>
          <div className="flex-1 px-3 pb-4 space-y-2">
            {characters.length === 0 && (
              <p className="text-stone-600 text-xs font-serif italic px-1 pt-2">Ningún personaje asignado.</p>
            )}
            {characters.map(c => {
              const maxHp = maxHpFor(c)
              const serverHp = currentHpFor(c)
              const curHp = localHp[c.id] ?? serverHp
              const ac = acFor(c)
              const hpPct = Math.max(0, Math.min((curHp / maxHp) * 100, 100))
              const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
              const conds: string[] = c.conditions ?? []
              const isHovered = hoveredTokenId === c.id
              const tokenColor = getDeterministicColor(c.id)
              return (
                <div key={c.id}
                  onMouseEnter={() => setHoveredTokenId(c.id)}
                  onMouseLeave={() => setHoveredTokenId(null)}
                  style={isHovered ? { borderColor: tokenColor, boxShadow: `0 0 10px ${tokenColor}40` } : {}}
                  className={`bg-stone-900 border rounded-lg p-3 space-y-2 transition-all duration-200 ${isHovered ? 'border-amber-500' : 'border-stone-700'}`}>
                  <div className="flex items-center gap-2">
                    {CLASS_ICONS[c.class] ? (
                      <img
                        src={CLASS_ICONS[c.class]}
                        className="w-6 h-6 rounded-full border border-tavern-gold/40 bg-stone-950 object-cover object-center shrink-0"
                        alt=""
                      />
                    ) : (
                      <span className="text-lg">🎲</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-100 truncate">{c.name}</p>
                      <p className="text-xs text-stone-500 capitalize">{c.race} {c.class} · Nv.{c.level}</p>
                    </div>
                    <span className="text-xs text-stone-500 font-mono bg-stone-800 px-1.5 py-0.5 rounded">CA {ac}</span>
                  </div>
                  <div>
                    <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden mb-1">
                      <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjustCharacterHp(c.id, serverHp, maxHp, curHp - 1)}
                        className="w-5 h-5 text-xs border border-stone-700 text-stone-400 hover:bg-stone-800 rounded leading-none">−</button>
                      {editingHp === c.id ? (
                        <input autoFocus defaultValue={curHp} onBlur={e => { adjustCharacterHp(c.id, serverHp, maxHp, parseInt(e.target.value) || 0); setEditingHp(null) }}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          className="w-10 text-center text-sm font-mono bg-transparent border-b border-stone-500 focus:outline-none text-amber-300" />
                      ) : (
                        <button onClick={() => setEditingHp(c.id)} className="text-sm font-mono text-amber-300 hover:text-amber-100 min-w-[2rem] text-center">
                          {curHp}
                        </button>
                      )}
                      <button onClick={() => adjustCharacterHp(c.id, serverHp, maxHp, curHp + 1)}
                        className="w-5 h-5 text-xs border border-stone-700 text-stone-400 hover:bg-stone-800 rounded leading-none">+</button>
                      <span className="text-xs text-stone-600 ml-1">/ {maxHp}</span>
                      <button onClick={() => adjustCharacterHp(c.id, serverHp, maxHp, maxHp)}
                        className="ml-auto text-xs text-stone-600 hover:text-green-500 transition-colors" title="Curar completo">✦</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {conds.map(cond => (
                      <span key={cond} className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-red-950 border border-red-800 text-red-300 rounded">
                        {cond}
                        <button onClick={() => patchCharacter(c.id, { conditions: conds.filter(x => x !== cond) })} className="text-red-600 hover:text-red-300 ml-0.5">✕</button>
                      </span>
                    ))}
                    <div className="relative">
                      <button onClick={() => setConditionPickerFor(conditionPickerFor === c.id ? null : c.id)}
                        className="px-1.5 py-0.5 text-xs border border-stone-700 text-stone-500 hover:border-stone-500 hover:text-stone-300 rounded transition-colors">
                        + condición
                      </button>
                      {conditionPickerFor === c.id && (
                        <div className="absolute left-0 top-7 z-30 w-44 bg-stone-900 border border-stone-700 rounded shadow-xl max-h-48 overflow-y-auto">
                          {CONDITIONS.filter(x => !conds.includes(x)).map(cond => (
                            <button key={cond} onClick={() => { patchCharacter(c.id, { conditions: [...conds, cond] }); setConditionPickerFor(null) }}
                              className="block w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-800 transition-colors">
                              {cond}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {curHp === 0 && (() => {
                    const ds = c.sheet_json.death_saves ?? { successes: 0, failures: 0 }
                    return (
                      <div className="flex items-center gap-3 pt-1 border-t border-stone-800">
                        <span className="text-xs text-stone-600 font-serif">Muerte:</span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full border ${i < ds.successes ? 'bg-green-600 border-green-500' : 'border-stone-700'}`} />
                          ))}
                        </div>
                        <span className="text-stone-700 text-xs">/</span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full border ${i < ds.failures ? 'bg-red-700 border-red-600' : 'border-stone-700'}`} />
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                  {(() => {
                    const slots = getSpellSlots(c.class, c.level)
                    const used = c.sheet_json.spell_slots_used ?? {}
                    if (!slots.some(s => s > 0)) return null
                    return (
                      <div className="pt-1 border-t border-stone-800 space-y-0.5">
                        {slots.map((max, idx) => {
                          if (max === 0) return null
                          const lvl = idx + 1
                          const u = used[String(lvl)] ?? 0
                          return (
                            <div key={lvl} className="flex items-center gap-1.5">
                              <span className="text-xs text-stone-700 w-4">{lvl}</span>
                              <div className="flex gap-0.5">
                                {Array.from({ length: max }, (_, i) => (
                                  <div key={i} className={`w-2 h-2 rounded-full ${i < (max - u) ? 'bg-amber-600' : 'bg-stone-800 border border-stone-700'}`} />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </aside>

        {/* CENTER: Board */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Floating sidebar collapse buttons */}
          <button
            onClick={() => setLeftPanelCollapsed(c => !c)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-stone-900/90 border border-l-0 border-stone-700 hover:border-amber-600 text-stone-400 hover:text-amber-300 flex items-center justify-center rounded-r shadow-lg transition-all cursor-pointer select-none"
            title={leftPanelCollapsed ? "Mostrar personajes" : "Colapsar personajes"}
          >
            {leftPanelCollapsed ? '▶' : '◀'}
          </button>

          <button
            onClick={() => setRightPanelCollapsed(c => !c)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-stone-900/90 border border-r-0 border-stone-700 hover:border-amber-600 text-stone-400 hover:text-amber-300 flex items-center justify-center rounded-l shadow-lg transition-all cursor-pointer select-none"
            title={rightPanelCollapsed ? "Mostrar NPCs" : "Colapsar NPCs"}
          >
            {rightPanelCollapsed ? '◀' : '▶'}
          </button>
          
          {/* Top Control Bar */}
          <div className="border-b border-stone-800 bg-stone-900/90 px-4 py-2 flex items-center gap-3 shrink-0">
            {combatActive ? (
              <>
                <button onClick={nextTurn}
                  className="px-4 py-1.5 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif text-sm transition-colors">
                  Siguiente →
                </button>
                <span className="text-xs text-stone-500 font-serif font-mono">
                  Turno {currentTurn + 1}/{combatants.length}
                </span>
                <div className="flex-1" />
                <button onClick={endCombat}
                  className="px-3 py-1.5 border border-red-900/50 bg-red-950/60 text-red-200 hover:bg-red-900 hover:border-red-700 hover:text-red-100 font-serif text-xs transition-colors rounded shadow shadow-red-950/50">
                  Fin Combate
                </button>
              </>
            ) : (
              <>
                <button onClick={startCombat} disabled={characters.length === 0}
                  className="px-4 py-1.5 bg-amber-850 hover:bg-amber-800 border border-amber-700/50 text-amber-100 font-serif text-sm transition-colors flex items-center gap-1.5">
                  ⚔ Iniciar combate
                </button>
                <div className="flex-1" />
              </>
            )}

            {/* Map selection modal trigger */}
            <button
              onClick={() => setShowMapSelector(true)}
              className="px-3 py-1.5 font-serif text-xs border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors"
              title="Biblioteca de mapas"
            >
              🗺 Mapas
            </button>

            <button
              onClick={() => { setShowNpcBar(v => !v); setShowBestiary(false); setShowNpcForm(false); setShowCampaignNpcs(false) }}
              className={`px-3 py-1.5 font-serif text-xs transition-colors border ${showNpcBar ? 'border-amber-700 bg-amber-950/40 text-amber-300' : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
            >
              + NPC
            </button>

            {showLongRestConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 font-serif">¿Descanso largo?</span>
                <button onClick={partyLongRest} className="text-xs px-2 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif">Confirmar</button>
                <button onClick={() => setShowLongRestConfirm(false)} className="text-xs text-stone-500 hover:text-stone-300">✕</button>
              </div>
            ) : (
              <button onClick={() => setShowLongRestConfirm(true)} disabled={characters.length === 0}
                className="px-3 py-1.5 border border-stone-700 text-stone-400 hover:border-amber-700 hover:text-amber-400 disabled:opacity-40 font-serif text-xs transition-colors">
                ☀ Descanso
              </button>
            )}
          </div>

          {/* NPC Drawer / creation panel */}
          <DmNpcForm
            campaignId={campaignId}
            showNpcBar={showNpcBar}
            npcInputRef={npcInputRef}
            npcInput={npcInput}
            setNpcInput={setNpcInput}
            addNpc={addNpc}
            showCampaignNpcs={showCampaignNpcs}
            setShowCampaignNpcs={setShowCampaignNpcs}
            campaignNpcSearch={campaignNpcSearch}
            setCampaignNpcSearch={setCampaignNpcSearch}
            filteredCampaignNpcs={filteredCampaignNpcs}
            addNpcFromCampaign={addNpcFromCampaign}
            showBestiary={showBestiary}
            setShowBestiary={setShowBestiary}
            bestiarySearch={bestiarySearch}
            setBestiarySearch={setBestiarySearch}
            bestiaryQty={bestiaryQty}
            setBestiaryQty={setBestiaryQty}
            filteredMonsters={filteredMonsters}
            addingMonster={addingMonster}
            addNpcFromMonster={addNpcFromMonster}
            showNpcForm={showNpcForm}
            setShowNpcForm={setShowNpcForm}
            npcFormName={npcFormName}
            setNpcFormName={setNpcFormName}
            npcFormHp={npcFormHp}
            setNpcFormHp={setNpcFormHp}
            npcFormAc={npcFormAc}
            setNpcFormAc={setNpcFormAc}
            npcFormType={npcFormType}
            setNpcFormType={setNpcFormType}
            npcFormAttack={npcFormAttack}
            setNpcFormAttack={setNpcFormAttack}
            npcFormDamage={npcFormDamage}
            setNpcFormDamage={setNpcFormDamage}
            npcFormItems={npcFormItems}
            npcFormSpells={npcFormSpells}
            npcFormWeapons={npcFormWeapons}
            npcFormEquipment={npcFormEquipment}
            setNpcFormEquipment={setNpcFormEquipment}
            addLootItem={addLootItem}
            updateLootItem={updateLootItem}
            removeLootItem={removeLootItem}
            addFormWeapon={addFormWeapon}
            updateFormWeapon={updateFormWeapon}
            removeFormWeapon={removeFormWeapon}
            addFormSpell={addFormSpell}
            removeFormSpell={removeFormSpell}
            createCustomNpc={createCustomNpc}
            encounterGen={encounterGen}
          />

          <CombatBoard
            tokens={tokens}
            allEntities={allCombatEntities}
            mapUrl={activeMapUrl}
            externalPositions={externalPositions}
            onTokenMoved={onTokenMoved}
            onAttackConfirm={handleAttackConfirm}
            characters={characters as any}
            isPlayer={false}
            externalTargeting={externalTargeting}
            onSelectionChange={handleSelectionChange}
            hoveredTokenId={hoveredTokenId}
            hoveredGroupId={hoveredGroupId}
            onHoverToken={setHoveredTokenId}
          />

          {/* Combat history log — bottom-right, read-only, collapsible */}
          {combatActive && combatLog.length > 0 && (
            <div className="absolute bottom-3 right-3 z-20 w-64 pointer-events-auto" style={{ background: 'rgba(5,3,1,0.72)', border: '1px solid rgba(80,60,20,0.35)', borderRadius: 6 }}>
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-serif text-stone-500 hover:text-stone-300 transition-colors"
                onClick={() => setShowLog(v => !v)}
              >
                <span className="tracking-widest uppercase">Historial</span>
                <span>{showLog ? '▾' : '▴'}</span>
              </button>
              {showLog && (
                <div className="px-2 pb-2 space-y-1 max-h-44 overflow-y-auto">
                  {combatLog.map(entry => (
                    <div key={entry.id} className="text-[10px] font-mono px-2 py-1 rounded flex items-center gap-1.5"
                      style={{ background: 'rgba(0,0,0,0.35)' }}>
                      <span style={{ color: entry.hit ? '#4ade80' : '#f87171' }}>{entry.hit ? '✓' : '✗'}</span>
                      <span className="text-stone-400 truncate flex-1">
                        <span className="text-stone-300">{entry.attackerName}</span>
                        <span className="text-stone-600"> → </span>
                        <span className="text-stone-300">{entry.targetName}</span>
                      </span>
                      {entry.hit && entry.damage != null && entry.damage > 0
                        ? (entry.isHealing
                          ? <span className="text-green-400 font-bold shrink-0 font-mono">+{entry.damage} pg</span>
                          : <span className="text-red-400 font-bold shrink-0 font-mono font-bold">-{entry.damage} pg</span>)
                        : !entry.hit && <span className="text-stone-600 shrink-0 text-[9px]">fallo</span>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* RIGHT: NPCs */}
        <aside className={`transition-all duration-300 ${rightPanelCollapsed ? 'w-0 overflow-hidden opacity-0 border-l-0' : 'w-64 border-l border-stone-800'} flex flex-col overflow-y-auto bg-stone-900/50 shrink-0`}>
          <DmNpcSidebar
            combatActive={combatActive}
            combatants={combatants}
            boardTokens={boardTokens}
            hoveredTokenId={hoveredTokenId}
            setHoveredTokenId={setHoveredTokenId}
            hoveredGroupId={hoveredGroupId}
            setHoveredGroupId={setHoveredGroupId}
            toggleNpcHidden={toggleNpcHidden}
            setNpcHidden={setNpcHidden}
            updateNpc={updateNpc}
            removeNpc={removeNpc}
            adjustBoardNpcHp={adjustBoardNpcHp}
          />
        </aside>
      </div>

      {/* Map selector Library Modal */}
      <DmMapSelector
        showMapSelector={showMapSelector}
        setShowMapSelector={setShowMapSelector}
        activeMapUrl={activeMapUrl}
        mapsList={mapsList}
        loadingMaps={loadingMaps}
        mapUploading={mapUploading}
        uploadMap={uploadMap}
        fetchMaps={fetchMaps}
        activateMap={activateMap}
        deleteMap={deleteMap}
      />
    </div>
  )
}
