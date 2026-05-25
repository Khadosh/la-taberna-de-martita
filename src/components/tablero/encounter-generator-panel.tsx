import { useState, useEffect, useRef } from 'react'
import { type useEncounterGenerator, ENVIRONMENTS, LOOT_ITEM_OPTIONS, xpAtLevel, hpAtLevel } from './use-encounter-generator'
import { type Difficulty, crLabel as crLabelFn } from '../../lib/encounter-generator'
import { DIFFICULTY_LABELS, ROLE_COL_HEADER, DND_IMG_BASE } from './encounter-constants'
import { getEnvironmentIconSvg, getArchetypeIcon, ROLE_ICONS, SkullIcon } from './encounter-icons'
import { CountStepper, XpGauge, MonsterSearchAdd } from './encounter-sub-components'
import { MonsterCard, MonsterRowEditorModal } from './monster-card'

const DIFFICULTY_ACTIVE: Record<Difficulty, string> = {
  easy: 'border-emerald-700 bg-emerald-950/60 text-emerald-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
  medium: 'border-amber-700 bg-amber-950/60 text-amber-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
  hard: 'border-orange-800 bg-orange-950/60 text-orange-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
  deadly: 'border-red-950 bg-red-950/60 text-red-400 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]',
}
const INACTIVE = 'border-[#3c2414] bg-[#1a0f07]/50 text-stone-400 hover:border-[#8a6b3e] hover:text-[#d5b88a]'

export function EncounterGeneratorPanel({ encounterGen }: { encounterGen: ReturnType<typeof useEncounterGenerator> }) {
  const {
    selectedEnv, setSelectedEnv,
    selectedArchetypeIds, setSelectedArchetypeIds,
    difficulty, setDifficulty,
    rows, units, loot,
    noResults, isSpawning, loadingDetails,
    adjustedXp, thresholds,
    availableArchetypes, archetypesForEnv,
    generateNew, updateRowCount, updateRowLevel, updateUnitLevel, updateRowField, removeRow, addManualRow,
    updateCurrency, updateItemQty, updateItemName, removeItem, addItem,
    regenerateLoot, clearDraft, spawnEncounter,
  } = encounterGen

  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [archetypeDropdownOpen, setArchetypeDropdownOpen] = useState(false)
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false)
  const editingRow = editingRowId ? rows.find(r => r.id === editingRowId) ?? null : null

  const envRef = useRef<HTMLDivElement>(null)
  const archetypeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (envRef.current && !envRef.current.contains(e.target as Node)) setEnvDropdownOpen(false)
      if (archetypeRef.current && !archetypeRef.current.contains(e.target as Node)) setArchetypeDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasRows = rows.length > 0
  const archetypeList = archetypesForEnv.length > 0 ? archetypesForEnv : availableArchetypes

  const totalCompositionXp = rows.reduce((acc, row) => {
    const rowCount = (['melee', 'ranged', 'magic', 'support'] as const).reduce((sum, r) => sum + row.counts[r], 0)
    return acc + xpAtLevel(row.xp, row.level ?? 1) * rowCount
  }, 0)

  return (
    <>
      <div className="p-5 space-y-5">

        {/* Zone + Archetype */}
        <div className="grid grid-cols-[1.2fr_2fr] gap-4">
          <div className="space-y-1 relative" ref={envRef}>
            <div className="flex items-center justify-between h-5">
              <label className="text-xs text-[#8a6b3e] font-serif uppercase tracking-wider leading-none">Zona</label>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setEnvDropdownOpen(v => !v)}
                className="w-full h-[38px] flex items-center justify-between pl-3 pr-3 bg-black/40 border border-[#3c2414] hover:border-[#bc9434] text-[#d5b88a] text-xs font-serif focus:outline-none focus:border-[#bc9434] cursor-pointer rounded-sm text-left transition-colors relative"
              >
                <div className="flex items-center gap-2">
                  {getEnvironmentIconSvg(selectedEnv, "w-4 h-4 text-[#bc9434] shrink-0")}
                  <span>{selectedEnv}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {archetypesForEnv.length > 0 && (
                    <span className="text-[9px] font-mono text-[#bc9434] bg-[#2a1a0e] border border-[#5a3c1e] px-1.5 py-0.5 rounded-sm">
                      LVL {Math.min(...archetypesForEnv.map(a => a.levelRange[0]))}-{Math.max(...archetypesForEnv.map(a => a.levelRange[1]))}
                    </span>
                  )}
                  <span className="text-[10px] text-[#bc9434]">▼</span>
                </div>
              </button>
            </div>

            {envDropdownOpen && (
              <div className="border border-[#5a3c1e] bg-[#1a0f07] rounded-sm absolute left-0 z-30 shadow-2xl mt-1.5 w-[380px] p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {ENVIRONMENTS.map(env => {
                    const isSelected = selectedEnv === env
                    const envDesc: Record<string, string> = {
                      'Bosque': 'Bosques salvajes y senderos umbríos',
                      'Subterráneo': 'Cavernas profundas y túneles oscuros',
                      'Cripta': 'Catacumbas antiguas y profanadas',
                      'Planicie': 'Llanuras abiertas y campos de batalla',
                      'Castillo': 'Fortalezas de piedra y pasillos reales',
                      'Averno': 'Tierras infernales de fuego y azufre',
                      'Costa': 'Acantilados y playas de agua salada',
                      'Montaña': 'Picos elevados y senderos rocosos',
                    }
                    return (
                      <button
                        key={env}
                        type="button"
                        onClick={() => { setSelectedEnv(env); setEnvDropdownOpen(false) }}
                        className={`flex items-center gap-2 p-1.5 bg-black/40 border transition-all rounded-sm text-left group cursor-pointer ${
                          isSelected
                            ? 'border-[#bc9434] bg-[#2c1a0e]/40 shadow-[0_0_8px_rgba(188,148,52,0.25)]'
                            : 'border-[#3c2414] hover:border-[#8a6b3e] hover:bg-[#2c1a0e]/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#2a1a0e] border-[#bc9434] text-[#d5b88a]'
                            : 'bg-black/20 border-[#3c2414] text-[#8a6b3e] group-hover:text-[#bc9434] group-hover:border-[#8a6b3e]'
                        }`}>
                          {getEnvironmentIconSvg(env, "w-4 h-4 shrink-0")}
                        </div>
                        <div className="flex flex-col min-w-0 leading-tight">
                          <span className={`text-[11px] font-serif font-bold transition-colors ${
                            isSelected ? 'text-[#d5b88a]' : 'text-[#e0d1b8] group-hover:text-[#d5b88a]'
                          }`}>{env}</span>
                          <span className="text-[8px] text-stone-500 font-serif leading-none truncate">{envDesc[env] ?? ''}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1 relative" ref={archetypeRef}>
            <div className="flex items-center justify-between h-5">
              <label className="text-xs text-[#8a6b3e] font-serif uppercase tracking-wider leading-none">Arquetipo</label>
              {selectedArchetypeIds.length > 0 && (
                <span className="text-[10px] text-[#8a6b3e]/70 font-serif leading-none">{selectedArchetypeIds.length} seleccionado{selectedArchetypeIds.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1 min-h-[38px] px-2 py-1 border border-[#3c2414] bg-black/30 rounded-sm w-full relative">
              {selectedArchetypeIds.length === 0 && (
                <span className="text-xs text-stone-600 font-serif italic pl-1">Seleccionar arquetipos...</span>
              )}
              {selectedArchetypeIds.map(id => {
                const arch = archetypeList.find(a => a.id === id) ?? availableArchetypes.find(a => a.id === id)
                if (!arch) return null
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2c1a0e] border border-[#5a3c1e] text-[#d5b88a] text-[10px] font-serif rounded-sm h-[26px]">
                    {getArchetypeIcon(id, "w-3 h-3 text-[#bc9434] shrink-0")}
                    <span>{arch.name}</span>
                    <button
                      onClick={() => setSelectedArchetypeIds(selectedArchetypeIds.filter(x => x !== id))}
                      className="text-[#bc9434] hover:text-red-400 leading-none ml-0.5 cursor-pointer">×</button>
                  </span>
                )
              })}
              <button
                onClick={() => setArchetypeDropdownOpen(v => !v)}
                className="ml-auto text-[#bc9434] hover:text-[#d5b88a] text-xs px-1 transition-colors cursor-pointer"
              >▼</button>
            </div>
            {archetypeDropdownOpen && (
              <div className="border border-[#5a3c1e] bg-[#1a0f07] max-h-56 overflow-y-auto custom-scrollbar rounded-sm absolute left-0 right-0 z-30 shadow-2xl mt-1.5 p-1 space-y-0.5">
                {archetypeList.filter(a => !selectedArchetypeIds.includes(a.id)).length === 0 ? (
                  <p className="text-xs text-[#8a6b3e] font-serif italic px-3 py-2 text-center">Todos seleccionados</p>
                ) : archetypeList.filter(a => !selectedArchetypeIds.includes(a.id)).map(a => (
                  <button key={a.id}
                    onClick={() => { setSelectedArchetypeIds([...selectedArchetypeIds, a.id]); setArchetypeDropdownOpen(false) }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#e0d1b8] hover:bg-[#2c1a0e] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer flex items-center gap-2.5 rounded-sm border border-transparent hover:border-[#8a6b3e]/40">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-black/30 border border-[#3c2414] text-[#bc9434] shrink-0">
                      {getArchetypeIcon(a.id, "w-3 h-3")}
                    </div>
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className="text-[8px] font-mono text-[#8a6b3e] bg-[#2a1a0e] border border-[#3c2414] px-1 py-0.5 rounded-sm">
                      NIV {a.levelRange[0]}-{a.levelRange[1]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Difficulty + generate */}
        <div className="space-y-1">
          <label className="text-xs text-[#8a6b3e] font-serif uppercase tracking-wider">Dificultad</label>
          <div className="flex">
            <div className="flex flex-1">
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d, i) => {
                const skullColors = { easy: '#10b981', medium: '#d97706', hard: '#ea580c', deadly: '#dc2626' }
                return (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 font-serif text-xs transition-colors border-y border-r cursor-pointer flex items-center justify-center gap-1.5 ${i === 0 ? 'border-l rounded-l-sm' : ''} ${i === 3 ? 'rounded-r-sm' : ''} ${difficulty === d ? DIFFICULTY_ACTIVE[d] : INACTIVE}`}
                    style={{ borderColor: '#3c2414' }}
                  >
                    <SkullIcon color={skullColors[d]} className="w-3.5 h-3.5 shrink-0" />
                    <span>{DIFFICULTY_LABELS[d]}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={generateNew}
              disabled={selectedArchetypeIds.length === 0}
              className="px-6 py-2 border font-serif text-sm font-semibold tracking-widest transition-all ml-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
              style={{
                background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
                borderColor: '#bc9434',
                color: '#ffffff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)',
              }}
              onMouseOver={e => { if (selectedArchetypeIds.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #bc9434 0%, #8a6b3e 100%)' }}
              onMouseOut={e => { if (selectedArchetypeIds.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)' }}
            >
              GENERAR
            </button>
          </div>
        </div>

        {noResults && (
          <p className="text-xs text-red-400 font-serif italic">
            Sin monstruos disponibles para este arquetipo y nivel del grupo.
          </p>
        )}

        <>
          {/* Creature table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif" style={{ color: '#8a6b3e' }}>
                Composición{units.length > 0 ? ` · ${units.length} criatura${units.length !== 1 ? 's' : ''}` : ''}
                {loadingDetails && <span className="ml-2 text-[#bc9434] italic animate-pulse">cargando stats…</span>}
              </span>
              {hasRows && (
                <button onClick={generateNew} className="text-[10px] text-[#bc9434] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer">
                  Regenerar
                </button>
              )}
            </div>
            <div className="border border-[#3c2414] bg-black/20 rounded-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#3c2414] bg-black/30">
                    <th className="text-left text-[#8a6b3e] font-normal font-serif py-2 pl-3 pr-2">Criatura</th>
                    <th className="text-center text-[#8a6b3e] font-normal font-serif py-2 px-2 text-[10px]">Niv.</th>
                    {(['melee', 'ranged', 'magic', 'support'] as const).map(role => (
                      <th key={role} className="text-center font-normal px-2 py-2">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {ROLE_ICONS[role]}
                          <span className="hidden sm:inline text-[#8a6b3e]">{ROLE_COL_HEADER[role].label}</span>
                        </div>
                      </th>
                    ))}
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className="border-b border-[#23140a]/60 hover:bg-[#2c1a0e]/20 transition-colors">
                      <td className="py-2 pl-3 pr-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#8a6b3e] bg-[#1a0f07] shrink-0 relative">
                            <img
                              src={`${DND_IMG_BASE}/api/2014/images/monsters/${row.monsterIndex}.png`}
                              alt={row.name}
                              className="w-full h-full object-cover object-top"
                              onError={e => { e.currentTarget.style.display = 'none' }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 leading-none">
                              <span className="text-[#d5b88a] font-serif font-bold text-[11px]">{row.name}</span>
                              <span className="text-[#8a6b3e] font-mono text-[9px]">CR {crLabelFn(row.cr)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-stone-500 font-mono mt-0.5">
                              {row.hp !== undefined && <span>PG {hpAtLevel(row.hp, row.level ?? 1)}</span>}
                              <span>·</span>
                              <span>{xpAtLevel(row.xp, row.level ?? 1)} XP</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <CountStepper value={row.level ?? 1} onChange={v => updateRowLevel(row.id, v - (row.level ?? 1))} />
                      </td>
                      {(['melee', 'ranged', 'magic', 'support'] as const).map(role => (
                        <td key={role} className="px-1 py-1.5 text-center">
                          <CountStepper
                            value={row.counts[role]}
                            activeColor={ROLE_COL_HEADER[role].color}
                            onChange={v => updateRowCount(row.id, role, v - row.counts[role])}
                          />
                        </td>
                      ))}
                      <td className="py-2 pr-2 text-center">
                        <button onClick={() => removeRow(row.id)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm leading-none cursor-pointer">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-t border-[#3c2414] text-[9px] font-mono text-[#d5b88a]">
                <MonsterSearchAdd onAdd={addManualRow} />
                <span>TOTAL XP: {totalCompositionXp}</span>
              </div>
            </div>
          </div>

          {hasRows && (
            <>
              {/* Individual cards */}
              <div className="grid grid-cols-3 gap-2">
                {rows.flatMap(row =>
                  (['melee', 'ranged', 'magic', 'support'] as const).flatMap(role =>
                    Array.from({ length: row.counts[role] }, (_, i) => {
                      const unitLevel = row.unitLevels?.[`${role}-${i}`] ?? row.level ?? 1
                      return (
                        <MonsterCard key={`${row.id}-${role}-${i}`} row={row} role={role} index={i}
                          unitLevel={unitLevel}
                          onEdit={() => setEditingRowId(row.id)}
                          onLevelChange={delta => updateUnitLevel(row.id, role, i, delta)} />
                      )
                    })
                  )
                )}
              </div>

              <XpGauge adjustedXp={adjustedXp} thresholds={thresholds} />

              {/* Loot */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#bc9434]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span className="text-xs font-serif" style={{ color: '#8a6b3e' }}>Botín</span>
                  </div>
                  <button onClick={regenerateLoot} className="text-[10px] text-[#bc9434] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer">
                    Regenerar botín
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {(['gp', 'sp', 'cp'] as const).map(coin => {
                    const labels = {
                      gp: { es: 'po', color: 'text-amber-300', focus: 'focus:border-amber-400', coinBg: 'from-yellow-300 to-amber-500 border-amber-600' },
                      sp: { es: 'pp', color: 'text-stone-300', focus: 'focus:border-stone-400', coinBg: 'from-stone-200 to-stone-400 border-stone-500' },
                      cp: { es: 'pc', color: 'text-orange-400', focus: 'focus:border-orange-500', coinBg: 'from-orange-300 to-orange-600 border-orange-700' },
                    }
                    const { es, color, focus, coinBg } = labels[coin]
                    return (
                      <div key={coin} className="flex items-center gap-1.5">
                        <input
                          type="number" min={0}
                          value={loot.currency[coin]}
                          onChange={e => updateCurrency({ [coin]: parseInt(e.target.value) || 0 })}
                          className={`w-14 px-2 py-1 bg-black/40 border border-[#3c2414] text-xs font-mono text-center ${color} focus:outline-none ${focus} no-spinners rounded-sm`}
                        />
                        <div className="flex items-center gap-1 shrink-0 select-none">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${coinBg} border shadow-sm`} />
                          <span className={`text-[10px] font-serif ${color}`}>{es}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-1.5">
                  {loot.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <select
                        value={item.name}
                        onChange={e => updateItemName(item.id, e.target.value)}
                        className="flex-1 px-2 py-1 bg-black/40 border border-[#3c2414] text-[#d5b88a] text-xs font-serif focus:outline-none focus:border-[#bc9434] appearance-none cursor-pointer rounded-sm"
                      >
                        {LOOT_ITEM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <CountStepper value={item.qty} onChange={v => updateItemQty(item.id, v)} />
                      <button onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm shrink-0 cursor-pointer">×</button>
                    </div>
                  ))}
                  <button onClick={addItem}
                    className="text-xs text-[#bc9434] hover:text-[#d5b88a] font-serif transition-colors cursor-pointer">
                    + Agregar ítem
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#3c2414] mt-2">
                <button
                  onClick={clearDraft}
                  className="text-xs text-[#8a6b3e] hover:text-[#bc9434] font-serif transition-colors cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar
                </button>
                <button
                  onClick={spawnEncounter}
                  disabled={isSpawning || units.length === 0}
                  className="px-5 py-2 border font-serif text-sm font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                  style={{
                    background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
                    borderColor: '#bc9434',
                    color: '#ffffff',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)',
                  }}
                  onMouseOver={e => { if (!isSpawning && units.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #bc9434 0%, #8a6b3e 100%)' }}
                  onMouseOut={e => { if (!isSpawning && units.length > 0) e.currentTarget.style.background = 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)' }}
                >
                  {isSpawning ? (
                    <span className="w-3 h-3 border border-amber-300 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-[#fcd34d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <polygon points="12,2 22,7.5 22,16.5 12,22 2,16.5 2,7.5" />
                      <polygon points="12,2 12,8 2,7.5" />
                      <polygon points="12,2 12,8 22,7.5" />
                      <polygon points="12,8 22,7.5 17,14" />
                      <polygon points="12,8 2,7.5 7,14" />
                      <polygon points="12,8 7,14 17,14" />
                      <polygon points="7,14 17,14 12,22" />
                      <polygon points="2,16.5 7,14 12,22" />
                      <polygon points="22,16.5 17,14 12,22" />
                      <polygon points="2,7.5 2,16.5 7,14" />
                      <polygon points="22,7.5 22,16.5 17,14" />
                    </svg>
                  )}
                  Invocar al tablero
                </button>
              </div>
            </>
          )}
        </>
      </div>

      {editingRow && (
        <MonsterRowEditorModal
          row={editingRow}
          onClose={() => setEditingRowId(null)}
          onUpdate={patch => updateRowField(editingRow.id, patch)}
        />
      )}
    </>
  )
}
