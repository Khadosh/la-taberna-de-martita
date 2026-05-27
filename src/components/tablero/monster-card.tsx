import { useState } from 'react'
import { type CreatureRow, crLabel as crLabelFn } from '../../lib/encounter-generator'
import { hpAtLevel, xpAtLevel } from './use-encounter-generator'
import { CornerBracket } from '../combat/combat-helpers'
import { ABILITY_KEYS, type AbilityKey, DND_IMG_BASE, ROLE_BADGE, ROLE_COL_HEADER, abMod } from './encounter-constants'
import { ROLE_ICONS } from './encounter-icons'
import { CountStepper, SpecialAbilityTag } from './encounter-sub-components'
import { getMonsterSpells } from '../../data/monster-spells'

function SpellEditor({ defaultSpells, value, onChange }: {
  defaultSpells: string[]
  value: string[] | undefined
  onChange: (v: string[] | undefined) => void
}) {
  const active = value ?? defaultSpells
  const [input, setInput] = useState('')

  function addSpell(raw: string) {
    const trimmed = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (!trimmed || active.includes(trimmed)) return
    onChange([...active, trimmed])
  }

  function removeSpell(s: string) {
    const next = active.filter(x => x !== s)
    onChange(next.length > 0 ? next : [])
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSpell(input)
      setInput('')
    }
  }

  const isDefault = value === undefined && defaultSpells.length > 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[#8a6b3e] font-serif">Hechizos al spawnear</label>
        {!isDefault && defaultSpells.length > 0 && (
          <button type="button" onClick={() => onChange(undefined)}
            className="text-[8px] text-[#8a6b3e] hover:text-[#bc9434] transition-colors cursor-pointer font-mono"
          >reset</button>
        )}
      </div>
      <div className="flex flex-wrap gap-1 min-h-[22px]">
        {active.map(s => (
          <span key={s}
            className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-sm font-mono"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}
          >
            {s.replace(/-/g, ' ')}
            <button type="button" onClick={() => removeSpell(s)}
              className="ml-0.5 opacity-60 hover:opacity-100 cursor-pointer leading-none"
            >×</button>
          </span>
        ))}
        {active.length === 0 && (
          <span className="text-[9px] text-[#8a6b3e]/60 font-mono italic">ninguno</span>
        )}
      </div>
      <input
        type="text" value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) { addSpell(input); setInput('') } }}
        placeholder="fireball, shield... (Enter para añadir)"
        className="w-full px-2 py-1 bg-black/40 border border-[#3c2414] text-[#d5b88a] text-[10px] font-mono focus:outline-none focus:border-[#bc9434] rounded-sm placeholder:text-[#8a6b3e]/50"
      />
    </div>
  )
}

export function MonsterRowEditorModal({ row, onClose, onUpdate }: {
  row: CreatureRow
  onClose: () => void
  onUpdate: (patch: Partial<CreatureRow>) => void
}) {
  const [local, setLocal] = useState<CreatureRow>({ ...row })
  const level = local.level ?? 1
  const effectiveHp = local.hp !== undefined ? hpAtLevel(local.hp, level) : undefined
  const effectiveXp = xpAtLevel(row.xp, level)
  const set = (patch: Partial<CreatureRow>) => setLocal(prev => ({ ...prev, ...patch }))

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative p-5 w-full max-w-sm space-y-4 z-10 overflow-y-auto max-h-[90vh] shadow-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
          border: '6px solid #23140a',
          borderRadius: '8px',
          boxShadow: '0 15px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.9), 0 0 0 1px #120a05',
        }}
      >
        <CornerBracket rotation={0} />
        <CornerBracket rotation={270} />
        <CornerBracket rotation={90} />
        <CornerBracket rotation={180} />

        <div className="flex items-center justify-between border-b border-[#3c2414] pb-2">
          <span className="text-sm font-serif font-bold text-[#d5b88a]">{row.name}</span>
          <button onClick={onClose} className="text-[#bc9434] hover:text-[#d5b88a] text-base leading-none transition-colors cursor-pointer">✕</button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8a6b3e] font-serif w-14 shrink-0">Nivel</label>
          <CountStepper value={level} onChange={v => set({ level: Math.max(1, Math.min(20, v)) })} />
          <span className="text-[10px] font-mono text-[#d5b88a]/70">
            {effectiveHp !== undefined && `PG ${effectiveHp} · `}{effectiveXp} XP
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#8a6b3e] font-serif">Estadísticas</label>
          <div className="grid grid-cols-6 gap-1">
            {ABILITY_KEYS.map(stat => (
              <div key={stat} className="flex flex-col items-center gap-0.5">
                <span className="text-[9px] text-[#8a6b3e] uppercase font-mono">{stat}</span>
                <input
                  type="number" min={1} max={30}
                  value={local[stat] ?? ''}
                  onChange={e => set({ [stat]: parseInt(e.target.value) || undefined })}
                  className="w-full px-0.5 py-0.5 bg-black/40 border border-[#3c2414] text-[#d5b88a] text-[10px] font-mono text-center focus:outline-none focus:border-[#bc9434] no-spinners rounded-sm"
                />
                {local[stat] !== undefined && (
                  <span className="text-[8px] font-mono text-[#8a6b3e]/60">{abMod(local[stat]!)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8a6b3e] font-serif w-14 shrink-0">Velocidad</label>
          <input
            value={local.speed ?? ''}
            onChange={e => set({ speed: e.target.value })}
            className="flex-1 px-2 py-1 bg-black/40 border border-[#3c2414] text-[#e0d1b8] text-xs font-mono focus:outline-none focus:border-[#bc9434] rounded-sm"
          />
        </div>

        {local.specialAbilities && local.specialAbilities.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-[#8a6b3e] font-serif">Habilidades especiales</label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {local.specialAbilities.map(sa => (
                <div key={sa.name} className="bg-black/30 border border-[#3c2414] px-2 py-1.5 rounded-sm">
                  <p className="text-[10px] font-bold text-[#d5b88a] font-serif mb-0.5">{sa.name}</p>
                  <p className="text-[9px] text-[#e0d1b8]/70 font-serif leading-relaxed">{sa.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <SpellEditor
          defaultSpells={getMonsterSpells(row.monsterIndex)}
          value={local.customSpells}
          onChange={v => set({ customSpells: v })}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-[#3c2414]">
          <button onClick={onClose} className="text-xs text-[#8a6b3e] hover:text-[#bc9434] font-serif transition-colors cursor-pointer">
            Cancelar
          </button>
          <button
            onClick={() => { onUpdate(local); onClose() }}
            className="px-4 py-1.5 border font-serif text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-sm"
            style={{
              background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
              borderColor: '#bc9434',
              color: '#ffffff',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(180deg, #bc9434 0%, #8a6b3e 100%)'}
            onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)'}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}

export function MonsterCard({ row, role, index, unitLevel, onEdit, onLevelChange }: {
  row: CreatureRow; role: string; index: number; unitLevel: number
  onEdit: () => void
  onLevelChange: (delta: number) => void
}) {
  const imgUrl = `${DND_IMG_BASE}/api/2014/images/monsters/${row.monsterIndex}.png`
  const [imgOk, setImgOk] = useState(true)
  const effectiveHp = row.hp !== undefined ? hpAtLevel(row.hp, unitLevel) : undefined

  return (
    <div
      onClick={onEdit}
      className="parchment-card border rounded-sm overflow-hidden flex flex-col transition-all duration-300 relative cursor-pointer"
      style={{
        background: 'linear-gradient(to bottom, #fcf8ee, #f5eedc)',
        borderColor: '#b8a983',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(250,235,215,0.5)',
      }}
    >
      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-[#b8a983]/60 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-[#b8a983]/60 pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 border-b border-l border-[#b8a983]/60 pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 border-b border-r border-[#b8a983]/60 pointer-events-none" />

      <div className="h-20 bg-[#f1ebd9] overflow-hidden flex items-center justify-center relative">
        {imgOk
          ? <img src={imgUrl} alt={row.name} onError={() => setImgOk(false)} className="w-full h-full object-cover object-top opacity-90 transition-all duration-300 card-image" />
          : <span className="text-[#5c4322] text-xs font-serif font-bold">{row.name.charAt(0)}</span>
        }
        <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors" />
      </div>

      <div className="px-2 py-1.5 flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-1 flex-wrap justify-between">
          <span className="text-[10px] text-[#1c0d02] font-serif leading-tight truncate flex-1 font-bold">
            {row.name.toUpperCase()}<span className="text-[#8a6b3e] ml-0.5 font-mono text-[9px]">#{index + 1}</span>
          </span>
          <span className={`text-[7px] px-1 py-0.5 border font-serif tracking-wide shrink-0 rounded-sm font-semibold flex items-center gap-0.5 ${ROLE_BADGE[role] ?? ''}`}>
            {ROLE_ICONS[role as keyof typeof ROLE_ICONS]}
            <span>{ROLE_COL_HEADER[role]?.label ?? role}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-2 text-[9px] font-mono text-[#5c4322] border-t border-b border-[#b8a983]/40 py-1">
          <div className="flex justify-between border-r border-[#b8a983]/20 pr-1">
            <span>CR</span>
            <strong className="text-[#1c0d02]">{crLabelFn(row.cr)}</strong>
          </div>
          <div className="flex justify-between pl-1">
            <span>CA</span>
            <strong className="text-[#1c0d02]">{row.ac}</strong>
          </div>
          <div className="flex justify-between border-r border-[#b8a983]/20 pr-1">
            <span>PG</span>
            {effectiveHp !== undefined
              ? <strong className="text-[#1c0d02]">{effectiveHp}</strong>
              : <span className="text-stone-400 animate-pulse">…</span>}
          </div>
          <div className="flex justify-between pl-1">
            <span>Dmg</span>
            {row.damageStr !== undefined
              ? <strong className="text-[#1c0d02]">{row.damageStr}</strong>
              : <span className="text-stone-400 animate-pulse">…</span>}
          </div>
        </div>

        {row.str !== undefined && (
          <div className="grid grid-cols-6 gap-px">
            {ABILITY_KEYS.map(stat => (
              <div key={stat} className="flex flex-col items-center">
                <span className="text-[6px] text-[#8a6b3e] uppercase font-mono font-bold">{stat}</span>
                <span className="text-[8px] text-[#2d1808] font-mono font-bold">{row[stat as AbilityKey] ?? '—'}</span>
              </div>
            ))}
          </div>
        )}

        {row.speed && <span className="text-[7px] font-mono text-[#5c4322]">Velocidad: {row.speed}</span>}

        {row.specialAbilities && row.specialAbilities.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {row.specialAbilities.slice(0, 3).map(sa => (
              <SpecialAbilityTag key={sa.name} sa={sa} />
            ))}
            {row.specialAbilities.length > 3 && (
              <span className="text-[7px] text-[#8a6b3e] font-mono self-center ml-0.5 font-bold">+{row.specialAbilities.length - 3}</span>
            )}
          </div>
        )}

        {(role === 'magic' || role === 'support') && (() => {
          const spells = row.customSpells ?? getMonsterSpells(row.monsterIndex)
          if (spells.length === 0) return null
          return (
            <div className="flex flex-wrap gap-0.5 border-t border-[#b8a983]/40 pt-1">
              {spells.slice(0, 4).map(s => (
                <span key={s} className="text-[6px] px-1 py-px rounded-sm font-mono"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}>
                  {s.replace(/-/g, ' ')}
                </span>
              ))}
              {spells.length > 4 && (
                <span className="text-[6px] text-purple-500 font-mono font-bold">+{spells.length - 4}</span>
              )}
            </div>
          )
        })()}

        <div className="flex items-center gap-1 border-t border-[#b8a983]/40 pt-1 mt-0.5" onClick={e => e.stopPropagation()}>
          <span className="text-[8px] text-[#5c4322] font-serif flex-1 font-semibold">Nivel</span>
          <button onClick={() => onLevelChange(-1)}
            className="w-4 h-4 text-[#8a6b3e] hover:text-[#1c0d02] text-xs leading-none flex items-center justify-center transition-colors cursor-pointer font-bold select-none">−</button>
          <span className="text-[9px] font-mono text-[#1c0d02] w-4 text-center font-bold">{unitLevel}</span>
          <button onClick={() => onLevelChange(1)}
            className="w-4 h-4 text-[#8a6b3e] hover:text-[#1c0d02] text-xs leading-none flex items-center justify-center transition-colors cursor-pointer font-bold select-none">+</button>
        </div>
      </div>
    </div>
  )
}
