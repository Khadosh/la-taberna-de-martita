import { useState } from 'react'
import type { Combatant, Npc, BoardToken } from './tablero-types'
import { getDeterministicColor } from './tablero-types'
import { useT } from '../../i18n'

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function HpControls({ curHp, maxHp, onAdjust }: { curHp: number; maxHp: number; onAdjust: (v: number) => void }) {
  const cls = "border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none"
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onAdjust(Math.max(0, curHp - 5))} className={`w-6 h-5 text-[10px] font-mono ${cls}`}>-5</button>
      <button onClick={() => onAdjust(Math.max(0, curHp - 1))} className={`w-5 h-5 text-[10px] ${cls}`}>−</button>
      <span className="text-xs font-mono flex-1 text-center">
        <span className="text-amber-300">{curHp}</span><span className="text-stone-600">/{maxHp}</span>
      </span>
      <button onClick={() => onAdjust(Math.min(maxHp, curHp + 1))} className={`w-5 h-5 text-[10px] ${cls}`}>+</button>
      <button onClick={() => onAdjust(Math.min(maxHp, curHp + 5))} className={`w-6 h-5 text-[10px] font-mono ${cls}`}>+5</button>
    </div>
  )
}

function BoardNpcCard({ bt, isHovered, onEnter, onLeave, toggleNpcHidden, removeNpc, adjustBoardNpcHp }: {
  bt: BoardToken; isHovered: boolean
  onEnter: () => void; onLeave: () => void
  toggleNpcHidden: (id: string) => void
  removeNpc: (id: string) => void
  adjustBoardNpcHp: (id: string, hp: number) => void
}) {
  const t = useT()
  const curHp = bt.current_hp ?? 0
  const maxHp = bt.max_hp ?? 1
  const hpPct = Math.max(0, Math.min((curHp / maxHp) * 100, 100))
  const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
  const tokenColor = getDeterministicColor(bt.entity_id)
  return (
    <div
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={isHovered ? { borderColor: tokenColor, boxShadow: `0 0 10px ${tokenColor}40` } : {}}
      className={`bg-stone-900 border rounded-lg p-2.5 space-y-2 transition-all duration-200 ${isHovered ? 'border-amber-500' : 'border-stone-700'}`}>
      <div className="flex items-center gap-1.5">
        {bt.portrait_url && <img src={bt.portrait_url} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          className="w-7 h-7 rounded-full object-cover object-top border border-stone-700 shrink-0" />}
        <p className="text-xs font-semibold text-stone-200 flex-1 truncate">{bt.label}</p>
        <button onClick={() => toggleNpcHidden(bt.entity_id)}
          className={`shrink-0 transition-colors ${bt.hidden ? 'text-amber-500 hover:text-amber-300' : 'text-stone-500 hover:text-stone-200'}`}
          title={bt.hidden ? t('board.showToPlayers') : t('board.hideFromPlayers')}>
          <EyeIcon hidden={bt.hidden ?? false} />
        </button>
        <button onClick={() => removeNpc(bt.entity_id)} className="text-stone-700 hover:text-red-500 transition-colors text-xs shrink-0">✕</button>
      </div>
      <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
      </div>
      <HpControls curHp={curHp} maxHp={maxHp} onAdjust={v => adjustBoardNpcHp(bt.entity_id, v)} />
    </div>
  )
}

interface DmNpcSidebarProps {
  combatActive: boolean
  combatants: Combatant[]
  boardTokens: BoardToken[]
  hoveredTokenId: string | null
  setHoveredTokenId: (id: string | null) => void
  hoveredGroupId: string | null
  setHoveredGroupId: (id: string | null) => void
  toggleNpcHidden: (id: string) => void
  setNpcHidden: (id: string, hidden: boolean) => void
  updateNpc: (id: string, patch: Partial<Npc>) => void
  removeNpc: (id: string) => void
  adjustBoardNpcHp: (entityId: string, newHp: number) => void
}

export function DmNpcSidebar({
  combatActive, combatants, boardTokens,
  hoveredTokenId, setHoveredTokenId,
  hoveredGroupId, setHoveredGroupId,
  toggleNpcHidden, setNpcHidden, updateNpc, removeNpc, adjustBoardNpcHp,
}: DmNpcSidebarProps) {
  const t = useT()
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleCollapse = (groupId: string) =>
    setCollapsed(prev => { const next = new Set(prev); next.has(groupId) ? next.delete(groupId) : next.add(groupId); return next })

  const toggleGroupVisibility = (tokens: BoardToken[]) => {
    const allHidden = tokens.every(bt => bt.hidden)
    // Use setNpcHidden with explicit value to avoid stale closure issues in forEach
    tokens.forEach(bt => setNpcHidden(bt.entity_id, !allHidden))
  }

  const npcCombatants = combatants.filter(c => c.kind === 'npc') as { kind: 'npc'; npc: Npc }[]
  const npcTokens = boardTokens.filter(bt => bt.kind === 'npc')
  const count = combatActive ? npcCombatants.length : npcTokens.length

  // Group non-combat tokens by spawn_group
  const groups = npcTokens.reduce<{ label: string; groupId: string; tokens: BoardToken[] }[]>((acc, bt) => {
    if (!bt.spawn_group) return acc
    const g = acc.find(x => x.groupId === bt.spawn_group)
    if (g) { g.tokens.push(bt); return acc }
    acc.push({ label: bt.archetype_label ?? t('board.encounter'), groupId: bt.spawn_group, tokens: [bt] })
    return acc
  }, [])
  const ungrouped = npcTokens.filter(bt => !bt.spawn_group)

  return (
    <>
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <p className="text-xs tracking-widest text-stone-500 uppercase font-serif flex-1">NPCs · {count}</p>
        {!combatActive && <span className="text-[9px] text-stone-600 font-serif italic">{t('board.outOfCombat')}</span>}
      </div>

      {combatActive ? (
        npcCombatants.length === 0 ? (
          <p className="text-stone-700 text-xs font-serif italic px-4 pt-1">{t('board.noEnemies')}</p>
        ) : (
          <div className="px-3 pb-4 space-y-2">
            {npcCombatants.map(({ npc }) => {
              const isDead = npc.maxHp > 0 && npc.currentHp === 0
              const hpPct = Math.max(0, Math.min((npc.currentHp / npc.maxHp) * 100, 100))
              const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
              const isHovered = hoveredTokenId === npc.id
              const tokenColor = getDeterministicColor(npc.id)
              return (
                <div key={npc.id}
                  onMouseEnter={() => setHoveredTokenId(npc.id)}
                  onMouseLeave={() => setHoveredTokenId(null)}
                  style={!isDead && isHovered ? { borderColor: tokenColor, boxShadow: `0 0 10px ${tokenColor}40` } : {}}
                  className={`bg-stone-900 border rounded-lg p-2.5 space-y-2 transition-all duration-200 ${isDead ? 'opacity-50 border-stone-800' : isHovered ? 'border-amber-500' : 'border-stone-700'}`}>
                  <div className="flex items-center gap-1.5">
                    {npc.portraitUrl && (
                      <div className="relative shrink-0">
                        <img src={npc.portraitUrl} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          className={`w-7 h-7 rounded-full object-cover object-top border border-stone-700 ${isDead ? 'grayscale' : ''}`} />
                        {isDead && <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 text-[10px]">☠</div>}
                      </div>
                    )}
                    <p className={`text-xs font-semibold flex-1 truncate ${isDead ? 'text-stone-500 line-through' : 'text-stone-200'}`}>{npc.name}</p>
                    {isDead && <span className="text-[9px] px-1 py-0.5 rounded font-bold uppercase shrink-0 bg-stone-800 text-stone-500">{t('board.downed')}</span>}
                    {!isDead && npc.role && (
                      <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase shrink-0 ${
                        npc.role === 'melee' ? 'bg-red-900/50 text-red-400' :
                        npc.role === 'ranged' ? 'bg-green-900/50 text-green-400' :
                        npc.role === 'magic' ? 'bg-purple-900/50 text-purple-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>{npc.role === 'melee' ? 'Mel' : npc.role === 'ranged' ? t('board.roleRanged') : npc.role === 'magic' ? 'Mag' : 'Sop'}</span>
                    )}
                    {npc.level != null && <span className="text-[9px] font-mono text-blue-400/70 shrink-0">Nv{npc.level}</span>}
                    {npc.ac != null && <span className="text-[10px] font-mono text-stone-500 shrink-0">{t('sheet.armorClass')} {npc.ac}</span>}
                    <button onClick={() => toggleNpcHidden(npc.id)}
                      className={`shrink-0 transition-colors ${npc.isHidden ? 'text-amber-500 hover:text-amber-300' : 'text-stone-500 hover:text-stone-200'}`}>
                      <EyeIcon hidden={npc.isHidden ?? false} />
                    </button>
                    <button onClick={() => removeNpc(npc.id)} className="text-stone-700 hover:text-red-500 transition-colors text-xs shrink-0">✕</button>
                  </div>
                  {!isDead && npc.attackBonus != null && (
                    <p className="text-[10px] font-mono text-stone-600">Atq +{npc.attackBonus}{npc.damage ? ` · ${npc.damage}` : ''}</p>
                  )}
                  <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isDead ? 'bg-stone-700' : hpColor}`} style={{ width: `${hpPct}%` }} />
                  </div>
                  <HpControls curHp={isDead ? 0 : npc.currentHp} maxHp={npc.maxHp} onAdjust={v => updateNpc(npc.id, { currentHp: v })} />
                </div>
              )
            })}
          </div>
        )
      ) : (
        npcTokens.length === 0 ? (
          <p className="text-stone-700 text-xs font-serif italic px-4 pt-1">{t('board.noNpcs')}</p>
        ) : (
          <div className="px-3 pb-4 space-y-3">
            {groups.map(group => {
              const isCollapsed = collapsed.has(group.groupId)
              const allHidden = group.tokens.every(bt => bt.hidden)
              const isGroupHovered = hoveredGroupId === group.groupId
              return (
                <div key={group.groupId}>
                  {/* Group header: chevron collapse + label hover + eye toggle */}
                  <div className="flex items-center gap-1 mb-1.5 px-0.5">
                    <button
                      onClick={() => toggleCollapse(group.groupId)}
                      className="shrink-0 text-stone-600 hover:text-stone-300 transition-colors"
                      title={isCollapsed ? t('board.expandGroup') : t('board.collapseGroup')}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                        style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                        <polyline points="2,3.5 5,6.5 8,3.5" />
                      </svg>
                    </button>
                    <div
                      className="flex-1 flex items-center gap-1.5 cursor-default min-w-0"
                      onMouseEnter={() => setHoveredGroupId(group.groupId)}
                      onMouseLeave={() => setHoveredGroupId(null)}
                    >
                      <div className={`flex-1 h-px transition-colors ${isGroupHovered ? 'bg-amber-600/60' : 'bg-stone-700'}`} />
                      <span className={`text-[9px] tracking-widest uppercase font-serif font-semibold transition-colors whitespace-nowrap ${isGroupHovered ? 'text-amber-500' : 'text-stone-600'}`}>
                        {group.label}
                      </span>
                      <div className={`flex-1 h-px transition-colors ${isGroupHovered ? 'bg-amber-600/60' : 'bg-stone-700'}`} />
                    </div>
                    <button
                      onClick={() => toggleGroupVisibility(group.tokens)}
                      className={`shrink-0 transition-colors ${allHidden ? 'text-amber-500 hover:text-amber-300' : 'text-stone-500 hover:text-stone-200'}`}
                      title={allHidden ? t('board.showGroupToPlayers') : t('board.hideGroupFromPlayers')}
                    >
                      <EyeIcon hidden={allHidden} />
                    </button>
                  </div>
                  {!isCollapsed && (
                    <div className="space-y-2">
                      {group.tokens.map(bt => (
                        <BoardNpcCard key={bt.entity_id} bt={bt}
                          isHovered={hoveredTokenId === bt.entity_id || isGroupHovered}
                          onEnter={() => setHoveredTokenId(bt.entity_id)}
                          onLeave={() => setHoveredTokenId(null)}
                          toggleNpcHidden={toggleNpcHidden} removeNpc={removeNpc} adjustBoardNpcHp={adjustBoardNpcHp}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {ungrouped.map(bt => (
              <BoardNpcCard key={bt.entity_id} bt={bt}
                isHovered={hoveredTokenId === bt.entity_id}
                onEnter={() => setHoveredTokenId(bt.entity_id)}
                onLeave={() => setHoveredTokenId(null)}
                toggleNpcHidden={toggleNpcHidden} removeNpc={removeNpc} adjustBoardNpcHp={adjustBoardNpcHp}
              />
            ))}
          </div>
        )
      )}
    </>
  )
}
