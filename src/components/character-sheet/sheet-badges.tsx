import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import type { SpellDetail, TraitDetail, SkillDetail, FeatureDetail } from '../../lib/dnd-api'
import type { InfoModalData } from './types'
import { parchmentStyle } from './sheet-primitives'
import { getSpellIconUrl } from '../../lib/item-icons'
import { GameIcon } from '../icons/game-icon'
import { useT } from '../../i18n'

// ── Info Modal ────────────────────────────────────────────────────────────────

export function InfoModal({ modal, onClose }: { modal: InfoModalData; onClose: () => void }) {
  let title = '', subtitle = '', body = ''
  if (modal.kind === 'spell') {
    const s = modal.data
    title = s.name; subtitle = `Nivel ${s.level} · ${s.school.name} · ${s.casting_time}`; body = s.desc[0] ?? ''
  } else if (modal.kind === 'trait') {
    title = modal.data.name; subtitle = 'Rasgo racial'; body = modal.data.desc.join('\n\n')
  } else if (modal.kind === 'feature') {
    const f = modal.data
    title = f.name
    subtitle = `Nivel ${f.level} · ${f.subclass ? f.subclass.name : f.class.name}`
    body = f.desc.join('\n\n')
  } else {
    const sk = modal.data; title = sk.name; subtitle = `Pericia · ${sk.ability_score.name}`; body = sk.desc.join('\n\n')
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="border-4 border-double border-stone-700 max-w-md w-full p-6 space-y-3"
        style={{ ...parchmentStyle, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-stone-400 pb-3">
          <div>
            <h3 className="font-bold text-stone-800 font-serif text-lg">{title}</h3>
            <p className="text-xs text-stone-500 font-serif italic mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors leading-none">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
            </svg>
          </button>
        </div>
        {modal.kind === 'spell' && (
          <div className="grid grid-cols-2 gap-1 text-xs text-stone-500 font-serif">
            <span>Alcance: {modal.data.range}</span>
            <span>Duración: {modal.data.duration}</span>
            <span>Componentes: {modal.data.components.join(', ')}</span>
          </div>
        )}
        <p className="text-sm text-stone-700 leading-relaxed font-serif max-h-52 overflow-y-auto italic whitespace-pre-line">{body}</p>
      </div>
    </div>
  )
}

// ── Spell Badge ───────────────────────────────────────────────────────────────

export function SpellBadge({ index, onInfo }: { index: string; onInfo: (s: SpellDetail) => void }) {
  const { data: spell } = useQuery({
    queryKey: dndKeys.spell(index),
    queryFn: () => dndApi.spell(index),
    staleTime: Infinity
  })

  const iconUrl = getSpellIconUrl(spell?.school?.name)

  return (
    <div className="flex items-center gap-2 border border-stone-500 px-2 py-1.5" style={{ background: 'rgba(200,170,110,0.15)' }}>
      {/* Spell icon */}
      <div className="w-8 h-8 shrink-0 flex items-center justify-center overflow-hidden rounded-sm bg-stone-900/10 text-amber-800">
        {iconUrl ? (
          <GameIcon url={iconUrl} title={spell?.school?.name} className="w-5 h-5 opacity-80" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 12 12" fill="currentColor" style={{ opacity: 0.35, color: '#b45309' }}>
            <path d="M6 1L7.2 4.8H11L7.9 7L9.1 10.8L6 8.6L2.9 10.8L4.1 7L1 4.8H4.8Z" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-800 capitalize font-serif truncate">{spell?.name ?? index.replace(/-/g, ' ')}</span>
          {spell && (
            <span className="text-[9px] px-1 bg-stone-100 text-stone-400 font-mono border border-stone-300 rounded-sm">
              Nv.{spell.level}
            </span>
          )}
        </div>
        {spell && <p className="text-[9px] text-stone-600 font-serif italic truncate">{spell.school.name}</p>}
      </div>
      {spell && (
        <button onClick={() => onInfo(spell)}
          className="text-[10px] px-1.5 py-0.5 border border-amber-700/60 text-amber-800 hover:bg-amber-100/50 font-serif transition-colors leading-none shrink-0">
          Ver
        </button>
      )}
    </div>
  )
}

// ── Trait Badge ───────────────────────────────────────────────────────────────

export function TraitBadge({ index, name, isResistance, onInfo }: {
  index: string; name: string; isResistance?: boolean; onInfo: (t: TraitDetail) => void
}) {
  const { data: trait } = useQuery({ queryKey: dndKeys.trait(index), queryFn: () => dndApi.trait(index) })
  return (
    <div
      className={`flex items-center gap-1.5 border-2 px-3 py-1 rounded-full ${isResistance
        ? 'border-blue-600/55 text-blue-900'
        : 'border-amber-700/55 text-stone-700'
        }`}
      style={{
        background: isResistance ? 'rgba(59,130,246,0.1)' : 'rgba(200,148,40,0.16)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), 0 2px 5px rgba(0,0,0,0.12)',
      }}
    >
      {isResistance && (
        <svg width="11" height="12" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
          <path d="M6 1.5L11 3V8C11 11 6 13 6 13S1 11 1 8V3Z" />
        </svg>
      )}
      <span className={`text-xs font-serif font-medium ${isResistance ? 'text-blue-800' : 'text-stone-700'}`}>{name}</span>
      {trait && (
        <button
          onClick={() => onInfo(trait)}
          className={`leading-none transition-colors ${isResistance ? 'text-blue-400 hover:text-blue-700' : 'text-amber-600 hover:text-amber-900'}`}
          title="Info"
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <circle cx="6" cy="6" r="5" />
            <line x1="6" y1="5.5" x2="6" y2="9" />
            <circle cx="6" cy="3.2" r="0.65" fill="currentColor" stroke="none" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Skill Badge ───────────────────────────────────────────────────────────────

export function SkillBadge({ index, onInfo }: { index: string; onInfo: (s: SkillDetail) => void }) {
  const skillIndex = index.replace('skill-', '')
  const { data: skill } = useQuery({ queryKey: dndKeys.skill(skillIndex), queryFn: () => dndApi.skill(skillIndex) })
  return (
    <div className="flex items-center gap-1 border border-amber-700/60 px-2 py-0.5 bg-amber-100/40">
      <span className="text-xs text-amber-800 font-serif capitalize">{skillIndex.replace(/-/g, ' ')}</span>
      {skill && (
        <button onClick={() => onInfo(skill)} className="text-amber-500 hover:text-amber-900 transition-colors leading-none ml-0.5" title="Info">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <circle cx="6" cy="6" r="5" />
            <line x1="6" y1="5.5" x2="6" y2="9" />
            <circle cx="6" cy="3.2" r="0.65" fill="currentColor" stroke="none" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function featureActionTag(desc: string): string | null {
  const d = desc.toLowerCase()
  if (d.includes('bonus action')) return 'Acción bonus'
  if (d.startsWith('as an action') || d.includes('you take the') && d.includes('action')) return 'Acción'
  if (d.includes('reaction')) return 'Reacción'
  return null
}

export function FeatureCard({ index, name, isNew, onInfo, compact, maxLevel }: {
  index: string; name: string; isNew: boolean; onInfo: (f: FeatureDetail) => void; compact?: boolean; maxLevel?: number
}) {
  const t = useT()
  const [expanded, setExpanded] = useState(false)
  const { data: feature } = useQuery({
    queryKey: dndKeys.feature(index),
    queryFn: () => dndApi.feature(index),
    staleTime: Infinity,
  })

  if (maxLevel && feature && feature.level > maxLevel) return null

  const firstPara = feature?.desc[0] ?? ''
  const actionTag = firstPara ? featureActionTag(firstPara) : null
  const hasMore = !compact && feature && (feature.desc.length > 1 || firstPara.length > 200)

  return (
    <div
      className="p-3"
      style={{
        borderRadius: 3,
        background: isNew ? 'rgba(200,140,20,0.07)' : 'rgba(200,170,110,0.09)',
        boxShadow: isNew
          ? 'inset 0 0 0 1px rgba(180,100,15,0.42), 0 2px 5px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,210,100,0.14)'
          : 'inset 0 0 0 1px rgba(109,85,48,0.2), 0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isNew && <span className="text-[9px] px-1.5 py-px bg-amber-700 text-amber-100 font-serif uppercase tracking-wide leading-tight">{t('sheet.new')}</span>}
          {actionTag && <span className="text-[9px] px-1.5 py-px border border-blue-400/50 text-blue-700 font-serif leading-tight">{actionTag}</span>}
          <p className="text-sm font-semibold text-stone-800 font-serif">{name}</p>
        </div>
        {feature && feature.desc.length > 0 && (
          <button onClick={() => onInfo(feature)} className="text-amber-700 hover:text-amber-900 shrink-0 transition-colors leading-none" title="Ver descripción">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <circle cx="6" cy="6" r="5" />
              <line x1="6" y1="5.5" x2="6" y2="9" />
              <circle cx="6" cy="3.2" r="0.65" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}
      </div>
      {!compact && firstPara && (
        <p className={`text-xs text-stone-600 font-serif leading-relaxed mt-1 ${expanded ? '' : 'line-clamp-2'}`}>{firstPara}</p>
      )}
      {!compact && hasMore && (
        <button onClick={() => setExpanded(e => !e)} className="text-[10px] text-stone-400 hover:text-amber-700 mt-1 font-serif transition-colors">
          {expanded ? '▲ menos' : '▼ ver más'}
        </button>
      )}
      {!feature && <p className="text-xs text-stone-400 font-serif italic">Cargando...</p>}
    </div>
  )
}
