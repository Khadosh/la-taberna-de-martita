import {
  CrossedSwordsIcon,
  BowIcon,
  ThrownIcon,
  SpellIcon,
  TOKEN_SIZE,
} from './combat-helpers'
import type { TokenData, Pos } from './combat-types'
import { useT } from '../../i18n'

type RangeConfig = {
  label: string
  normal: number
  long: number
  status: 'ok' | 'too_far' | 'disadvantage_long'
  disadvantageThreat?: boolean
}

interface CombatModePanelProps {
  selectedMode: 'melee' | 'ranged' | 'thrown' | 'spell'
  setSelectedMode: (mode: 'melee' | 'ranged' | 'thrown' | 'spell') => void
  rangeConfig: RangeConfig
  distanceFtGrid: number
  attackerChar: any
  attackerInventory: any[]
  attackerNpcSpells?: string[]
  attackerToken?: TokenData
  selectedWeaponId: string | null
  setSelectedWeaponId: (id: string | null) => void
  selectedSpellIndex: string | null
  setSelectedSpellIndex: (idx: string | null) => void
  spellDetail: any
  groupedAttackerSpells: Record<number, { index: string; name: string }[]>
  aoeActive: boolean
  setAoeActive: (v: boolean) => void
  aoeType: 'circle' | 'cube' | 'line'
  setAoeType: (t: 'circle' | 'cube' | 'line') => void
  aoeRadius: number
  setAoeRadius: (r: number) => void
  aoePosition: Pos | null
  setAoePosition: (pos: Pos | null) => void
  targetsInAoE: string[]
  tokens: TokenData[]
  toPos: Pos
}

const MODES = [
  { id: 'melee' as const,  labelKey: 'combat.modeMelee' as const,  icon: <CrossedSwordsIcon /> },
  { id: 'ranged' as const, labelKey: 'combat.modeRanged' as const, icon: <BowIcon /> },
  { id: 'thrown' as const, labelKey: 'combat.modeThrown' as const, icon: <ThrownIcon /> },
  { id: 'spell' as const,  labelKey: 'combat.modeSpell' as const,  icon: <SpellIcon /> },
]

export function CombatModePanel({
  selectedMode, setSelectedMode,
  rangeConfig, distanceFtGrid,
  attackerChar, attackerInventory, attackerNpcSpells,
  attackerToken,
  selectedWeaponId, setSelectedWeaponId,
  selectedSpellIndex, setSelectedSpellIndex,
  spellDetail, groupedAttackerSpells,
  aoeActive, setAoeActive,
  aoeType, setAoeType,
  aoeRadius, setAoeRadius,
  aoePosition, setAoePosition,
  targetsInAoE, tokens, toPos,
}: CombatModePanelProps) {
  const t = useT()
  return (
    <>
      {/* Mode selector icons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {MODES.map(m => {
          const isSel = selectedMode === m.id
          return (
            <button key={m.id} onClick={() => setSelectedMode(m.id)}
              style={{
                flex: 1, height: 38, borderRadius: 4, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                border: isSel ? '1px solid #d5b88a' : '1px solid #3c2414',
                background: isSel ? 'rgba(213, 184, 138, 0.15)' : 'rgba(0,0,0,0.45)',
                color: isSel ? '#d5b88a' : '#8a6b3e',
                boxShadow: isSel ? '0 0 8px rgba(213,184,138,0.2)' : 'none',
                transition: 'all 0.15s',
              }}
              title={t(m.labelKey)}
            >
              {m.icon}
              <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t(m.labelKey)}</span>
            </button>
          )
        })}
      </div>

      {/* Mode config panel */}
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 4, padding: '8px 10px', marginBottom: 12, border: '1px solid #3c2414' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: 10, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('combat.actionConfig')}
        </p>

        {selectedMode === 'melee' && (
          <div style={{ fontSize: 11, color: '#e7e5e4' }}>
            {attackerToken?.kind === 'npc' && attackerToken.weapons && attackerToken.weapons.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 6px 0' }}>
                <span style={{ fontSize: 11 }}>{t('combat.npcWeapon')}</span>
                <select value={selectedWeaponId ?? ''}
                  onChange={e => setSelectedWeaponId(e.target.value || null)}
                  style={{ flex: 1, background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', padding: '2px 4px', fontSize: 11, borderRadius: 3, outline: 'none' }}
                >
                  <option value="">-- Daño General ({attackerToken.damage || 'Sin daño'}) --</option>
                  {attackerToken.weapons.map((w, idx) => (
                    <option key={idx} value={String(idx)}>{w.name} ({w.damage})</option>
                  ))}
                </select>
              </div>
            )}
            <p style={{ margin: '4px 0' }}>⚔️ {t('combat.weapon')} <strong style={{ color: '#d5b88a' }}>{rangeConfig.label}</strong></p>
            <p style={{ margin: '4px 0' }}>📏 {t('combat.range')} <strong>{rangeConfig.normal} ft</strong></p>
            {rangeConfig.status === 'too_far' && (
              <p style={{ margin: '6px 0 0 0', color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>
                ⚠️ {t('combat.outOfMeleeRange', { distance: distanceFtGrid, range: rangeConfig.normal })}
              </p>
            )}
          </div>
        )}

        {selectedMode === 'ranged' && (
          <div style={{ fontSize: 11, color: '#e7e5e4' }}>
            {attackerToken?.kind === 'npc' && attackerToken.weapons && attackerToken.weapons.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 6px 0' }}>
                <span style={{ fontSize: 11 }}>{t('combat.npcWeapon')}</span>
                <select value={selectedWeaponId ?? ''}
                  onChange={e => setSelectedWeaponId(e.target.value || null)}
                  style={{ flex: 1, background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', padding: '2px 4px', fontSize: 11, borderRadius: 3, outline: 'none' }}
                >
                  <option value="">-- Daño General ({attackerToken.damage || 'Sin daño'}) --</option>
                  {attackerToken.weapons.map((w, idx) => (
                    <option key={idx} value={String(idx)}>{w.name} ({w.damage})</option>
                  ))}
                </select>
              </div>
            )}
            <p style={{ margin: '4px 0' }}>🏹 {t('combat.weapon')} <strong style={{ color: '#d5b88a' }}>{rangeConfig.label}</strong></p>
            <p style={{ margin: '4px 0' }}>📏 {t('combat.shotRange')} <strong>{rangeConfig.normal}/{rangeConfig.long} ft</strong></p>
            {rangeConfig.status === 'too_far' && (
              <p style={{ margin: '6px 0 0 0', color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>
                ❌ Fuera de rango máximo ({distanceFtGrid} ft &gt; {rangeConfig.long} ft)
              </p>
            )}
            {rangeConfig.status === 'disadvantage_long' && (
              <p style={{ margin: '6px 0 0 0', color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                ⚠️ Rango Largo: Ataque con DESVENTAJA
              </p>
            )}
            {rangeConfig.disadvantageThreat && (
              <p style={{ margin: '4px 0 0 0', color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                ⚠️ Amenaza en cuerpo a cuerpo: Ataque con DESVENTAJA
              </p>
            )}
          </div>
        )}

        {selectedMode === 'thrown' && (
          <div style={{ fontSize: 11, color: '#e7e5e4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '2px 0 6px 0' }}>
              <span style={{ fontSize: 11 }}>{t('combat.item')}</span>
              {attackerChar ? (
                <select value={selectedWeaponId ?? ''}
                  onChange={e => setSelectedWeaponId(e.target.value || null)}
                  style={{ flex: 1, background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', padding: '2px 4px', fontSize: 11, borderRadius: 3, outline: 'none' }}
                >
                  <option value="">-- Lanzamiento Genérico --</option>
                  {attackerInventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name} (x{item.quantity})</option>
                  ))}
                </select>
              ) : (
                <span style={{ color: '#a8a29e' }}>{t('combat.anyThrowable')}</span>
              )}
            </div>
            <p style={{ margin: '4px 0' }}>📏 {t('combat.throwRange')} <strong>{rangeConfig.normal}/{rangeConfig.long} ft</strong></p>
            {rangeConfig.status === 'too_far' && (
              <p style={{ margin: '6px 0 0 0', color: '#f87171', fontSize: 10, fontWeight: 'bold' }}>
                ❌ Fuera de rango máximo ({distanceFtGrid} ft &gt; {rangeConfig.long} ft)
              </p>
            )}
            {rangeConfig.status === 'disadvantage_long' && (
              <p style={{ margin: '6px 0 0 0', color: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}>
                ⚠️ Rango Largo: Ataque con DESVENTAJA
              </p>
            )}
          </div>
        )}

        {selectedMode === 'spell' && (
          <div style={{ fontSize: 11, color: '#e7e5e4', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{t('combat.spell')}</span>
              {(attackerChar || (attackerNpcSpells?.length ?? 0) > 0) ? (
                <select value={selectedSpellIndex ?? ''}
                  onChange={e => { setSelectedSpellIndex(e.target.value || null); setAoeActive(false); setAoePosition(null) }}
                  style={{ flex: 1, background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', padding: '2px 4px', fontSize: 11, borderRadius: 3, outline: 'none' }}
                >
                  <option value="">{t('combat.selectSpell')}</option>
                  {Object.keys(groupedAttackerSpells).length > 0 ? (
                    Object.keys(groupedAttackerSpells).map(Number).sort((a, b) => a - b).map(lvl => (
                      <optgroup key={lvl}
                        label={lvl === 0 ? 'TRUCOS (CANTRIPS)' : `CONJUROS DE NIVEL ${lvl}`}
                        style={{ background: '#1c1208', color: '#bc9434', fontStyle: 'normal', fontWeight: 'bold' }}
                      >
                        {groupedAttackerSpells[lvl].map(sp => (
                          <option key={sp.index} value={sp.index} style={{ color: '#d5b88a', fontWeight: 'normal' }}>{sp.name}</option>
                        ))}
                      </optgroup>
                    ))
                  ) : (
                    (attackerChar?.sheet_json.spells ?? attackerNpcSpells ?? []).map((sp: any) => (
                      <option key={sp} value={sp}>{sp.replace(/-/g, ' ').toUpperCase()}</option>
                    ))
                  )}
                </select>
              ) : (
                <span style={{ color: '#a8a29e' }}>{t('combat.genericSpellAttack')}</span>
              )}
            </div>

            {spellDetail && (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 3, fontSize: 10, border: '1px dashed #5a3c1e' }}>
                <p style={{ margin: '2px 0' }}>📏 {t('combat.spellRange')} <strong>{spellDetail.range}</strong></p>
                <p style={{ margin: '2px 0', color: '#fbbf24' }}>
                  ⌛ {t('combat.castingTime')} <strong>{spellDetail.casting_time}</strong> | {t('combat.duration')} <strong>{spellDetail.duration}</strong>
                </p>
                {rangeConfig.status === 'too_far' && (
                  <p style={{ margin: '4px 0 0 0', color: '#f87171', fontWeight: 'bold' }}>
                    ❌ {t('combat.outOfRange', { distance: distanceFtGrid, range: rangeConfig.normal })}
                  </p>
                )}
              </div>
            )}

            {/* AoE configurator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid #3c2414', paddingTop: 6, marginTop: 2 }}>
              <button
                onClick={() => {
                  const next = !aoeActive
                  setAoeActive(next)
                  if (next && !aoePosition && toPos) {
                    setAoePosition({ x: toPos.x + TOKEN_SIZE / 2, y: toPos.y + TOKEN_SIZE / 2 })
                  }
                }}
                style={{
                  background: aoeActive ? 'rgba(239, 68, 68, 0.25)' : '#2d1808',
                  border: '1px solid #784c18', color: aoeActive ? '#ef4444' : '#d5b88a',
                  padding: '3px 8px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                {aoeActive ? t('combat.aoeActive') : t('combat.projectAoe')}
              </button>
              {aoeActive && (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <select value={aoeType} onChange={e => setAoeType(e.target.value as any)}
                    style={{ background: '#1c1208', border: '1px solid #5a3c1e', color: '#d5b88a', fontSize: 9, padding: '2px 3px', borderRadius: 3 }}
                  >
                    <option value="circle">{t('combat.sphere')}</option>
                    <option value="cube">{t('combat.cube')}</option>
                    <option value="line">{t('combat.line')}</option>
                  </select>
                  <input type="number" value={aoeRadius} step={5} min={5} max={120}
                    onChange={e => setAoeRadius(Math.max(5, Math.min(120, parseInt(e.target.value) || 20)))}
                    style={{ width: 28, background: 'rgba(0,0,0,0.6)', border: '1px solid #3c2414', color: '#d5b88a', fontSize: 9, textAlign: 'center', padding: '1px 0' }}
                  />
                  <span style={{ fontSize: 9, opacity: 0.8 }}>ft</span>
                </div>
              )}
            </div>

            {aoeActive && (
              <p style={{ margin: '2px 0 0 0', fontSize: 8, color: '#fbbf24', fontStyle: 'italic' }}>
                {t('combat.clickToReposition')}
              </p>
            )}
            {aoeActive && targetsInAoE.length > 0 && (
              <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#ef4444', fontWeight: 'bold' }}>
                🎯 {t('combat.aoeTargets', { count: targetsInAoE.length })} {targetsInAoE.map(tid => tokens.find(t => t.id === tid)?.name).join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
