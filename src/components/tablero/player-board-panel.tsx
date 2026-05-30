import { useState } from 'react'
import { usePlayerBoardPanel } from './use-player-board-panel'
import { InventoryPanel } from '../character-sheet/inventory-panel'
import { TabHechizos } from '../character-sheet/tab-hechizos'
import { InfoModal } from '../character-sheet/sheet-badges'
import { CONDITIONS, getSpellSlots } from '../../lib/dnd-constants'
import { SLOT_LABELS } from '../../lib/equip-slots'
import type { SheetJson, InfoModalData } from '../character-sheet/types'

type Tab = 'stats' | 'inventario' | 'conjuros' | 'notas'

const COND_COLORS: Record<string, string> = {
  'Envenenado': 'bg-green-900/60 text-green-300 border-green-700/50',
  'Hechizado': 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  'Paralizado': 'bg-yellow-900/60 text-yellow-300 border-yellow-700/50',
  'Asustado': 'bg-orange-900/60 text-orange-300 border-orange-700/50',
}
const condClass = (cond: string, active: boolean) => {
  const custom = COND_COLORS[cond]
  if (active) return custom ?? 'bg-red-900/60 text-red-300 border-red-700/50'
  return 'bg-stone-900/60 text-stone-600 border-stone-700/40'
}

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const STAT_ES = { str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' }

interface Props {
  characterId: string | undefined
  campaignId: string
  userId: string
}

export function PlayerBoardPanel({ characterId, campaignId, userId }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('stats')
  const [modal, setModal] = useState<InfoModalData | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')

  const panel = usePlayerBoardPanel(characterId, campaignId)
  const { character, inventory, notes, adjustHp, toggleCondition, toggleSlot,
    togglePreparedSpell, addKnownSpell, removeKnownSpell,
    patchCurrency, toggleEquip, equipToSlot, moveEquipSlot, addNote } = panel

  if (!characterId || !character) return null

  const sheet = character.sheet_json as SheetJson
  const stats = (character.stats as Record<string, number>) ?? {}
  const maxHp = sheet.max_hp ?? 10
  const currentHp = character.current_hp ?? maxHp
  const hpPct = Math.max(0, Math.min((currentHp / maxHp) * 100, 100))
  const hpColor = hpPct > 50 ? '#16a34a' : hpPct > 25 ? '#d97706' : '#dc2626'
  const ac = character.armor_class ?? (10 + Math.floor(((stats.dex ?? 10) - 10) / 2))
  const conditions = (character.conditions as string[]) ?? []
  const maxSlots = getSpellSlots(character.class, character.level)
  const isSpellcaster = maxSlots.some(s => s > 0)
  const equippedSlots = (sheet.equipped_slots ?? {}) as Record<string, string>

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'stats', icon: '⚔', label: 'Personaje' },
    { id: 'inventario', icon: '🎒', label: 'Inventario' },
    { id: 'conjuros', icon: '✦', label: 'Conjuros' },
    { id: 'notas', icon: '📜', label: 'Notas' },
  ]

  return (
    <>
      {/* Trigger tab — always visible on right edge */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1 py-3 px-1.5 rounded-l-lg transition-all hover:px-2"
          style={{ background: 'rgba(10,5,2,0.88)', border: '1px solid rgba(80,50,20,0.5)', borderRight: 'none', boxShadow: '-4px 0 16px rgba(0,0,0,0.5)' }}
          title="Abrir panel de personaje"
        >
          {character.portrait_url
            ? <img src={character.portrait_url} alt="" className="w-8 h-8 rounded-full object-cover object-top border border-amber-900/60" />
            : <span className="text-amber-600 text-lg">⚔</span>
          }
          <svg width="8" height="12" viewBox="0 0 8 12" fill="none" stroke="rgba(180,120,50,0.7)" strokeWidth="1.5" strokeLinecap="round">
            <polyline points="6,1 1,6 6,11" />
          </svg>
        </button>
      )}

      {/* Floating panel */}
      <div
        className="absolute right-0 top-0 h-full z-40 flex flex-col transition-transform duration-200"
        style={{
          width: 340,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          background: 'rgba(8,4,2,0.96)',
          backdropFilter: 'blur(8px)',
          borderLeft: '1px solid rgba(80,50,20,0.4)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(80,50,20,0.3)' }}>
          {character.portrait_url && (
            <img src={character.portrait_url} alt="" className="w-7 h-7 rounded-full object-cover object-top border border-amber-900/60 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-200 truncate font-serif">{character.name}</p>
            <p className="text-[10px] text-stone-500 font-serif">{character.class} · Nv {character.level}</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-stone-600 hover:text-stone-300 transition-colors text-lg leading-none shrink-0">✕</button>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 flex" style={{ borderBottom: '1px solid rgba(80,50,20,0.3)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-xs font-serif transition-colors flex flex-col items-center gap-0.5 ${tab === t.id ? 'text-amber-400' : 'text-stone-600 hover:text-stone-400'}`}
              style={{ borderBottom: tab === t.id ? '2px solid #d97706' : '2px solid transparent' }}
              title={t.label}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className="text-[9px] tracking-wide uppercase">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── PERSONAJE ── */}
          {tab === 'stats' && (
            <div className="p-4 space-y-4">
              {/* HP */}
              <div>
                <p className="text-[9px] text-stone-500 uppercase tracking-widest font-serif mb-2">Puntos de Vida</p>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(40,20,10,0.8)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${hpPct}%`, backgroundColor: hpColor }} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjustHp(-5)} className="w-8 h-7 text-[10px] font-mono border border-red-900/60 text-red-500 hover:bg-red-900/20 rounded transition-colors">-5</button>
                  <button onClick={() => adjustHp(-1)} className="w-7 h-7 text-sm font-mono border border-stone-700 text-stone-500 hover:bg-stone-800 rounded transition-colors">−</button>
                  <div className="flex-1 text-center font-mono">
                    <span className="text-lg font-bold text-amber-200">{currentHp}</span>
                    <span className="text-stone-600 text-xs">/{maxHp}</span>
                  </div>
                  <button onClick={() => adjustHp(1)} className="w-7 h-7 text-sm font-mono border border-stone-700 text-stone-500 hover:bg-stone-800 rounded transition-colors">+</button>
                  <button onClick={() => adjustHp(5)} className="w-8 h-7 text-[10px] font-mono border border-green-900/60 text-green-500 hover:bg-green-900/20 rounded transition-colors">+5</button>
                </div>
              </div>

              {/* CA */}
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[9px] text-stone-500 uppercase tracking-widest font-serif">CA</p>
                  <p className="text-3xl font-bold text-amber-300 font-mono">{ac}</p>
                </div>
                {/* Stats grid */}
                <div className="flex-1 grid grid-cols-3 gap-1">
                  {STAT_KEYS.map(k => {
                    const val = stats[k] ?? 10
                    const mod = Math.floor((val - 10) / 2)
                    return (
                      <div key={k} className="text-center rounded py-1" style={{ background: 'rgba(20,10,5,0.6)', border: '1px solid rgba(60,35,15,0.4)' }}>
                        <p className="text-[8px] text-stone-600 uppercase font-serif">{STAT_ES[k]}</p>
                        <p className="text-sm font-bold text-stone-300 font-mono leading-tight">{val}</p>
                        <p className="text-[9px] font-mono text-amber-600/80">{mod >= 0 ? `+${mod}` : mod}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <p className="text-[9px] text-stone-500 uppercase tracking-widest font-serif mb-2">Condiciones</p>
                <div className="flex flex-wrap gap-1">
                  {CONDITIONS.map(cond => {
                    const active = conditions.includes(cond)
                    return (
                      <button key={cond} onClick={() => toggleCondition(cond)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-serif transition-colors ${condClass(cond, active)}`}>
                        {cond}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Equipped items summary */}
              {Object.keys(equippedSlots).length > 0 && (
                <div>
                  <p className="text-[9px] text-stone-500 uppercase tracking-widest font-serif mb-2">Equipado</p>
                  <div className="space-y-1">
                    {Object.entries(equippedSlots).map(([slot, itemId]) => {
                      const item = inventory.find(i => i.id === itemId)
                      if (!item) return null
                      return (
                        <div key={slot} className="flex items-center gap-2 text-[10px] font-serif">
                          <span className="text-stone-600 w-14 truncate">{SLOT_LABELS[slot as keyof typeof SLOT_LABELS] ?? slot}</span>
                          <span className="text-stone-300 flex-1 truncate">{item.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INVENTARIO ── */}
          {tab === 'inventario' && character && (
            <InventoryPanel
              characterId={character.id}
              inventory={inventory as any}
              sheet={sheet}
              isOwner={true}
              ac={ac}
              toggleEquip={toggleEquip}
              equipToSlot={equipToSlot}
              moveEquipSlot={moveEquipSlot}
              patchCurrency={patchCurrency}
              currency={sheet.currency ?? { gold: 0, silver: 0, copper: 0 }}
              strScore={stats.str ?? 10}
            />
          )}

          {/* ── CONJUROS ── */}
          {tab === 'conjuros' && (
            <TabHechizos
              spells={sheet.spells ?? []}
              preparedSpells={sheet.prepared_spells ?? []}
              maxSlots={maxSlots}
              slotsUsed={sheet.spell_slots_used ?? {}}
              characterClass={character.class}
              characterLevel={character.level}
              characterStats={stats}
              isOwner={true}
              isSpellcaster={isSpellcaster}
              setModal={setModal}
              toggleSlot={toggleSlot}
              onTogglePrepared={togglePreparedSpell}
              onAddKnownSpell={addKnownSpell}
              onRemoveKnownSpell={removeKnownSpell}
            />
          )}

          {/* ── NOTAS ── */}
          {tab === 'notas' && (
            <div className="p-4 space-y-3">
              {/* Add note form */}
              <div className="space-y-2">
                <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Título..."
                  className="w-full px-2 py-1.5 text-xs font-serif bg-stone-900 border border-stone-700 text-stone-200 rounded focus:outline-none focus:border-amber-700 placeholder-stone-600" />
                <textarea value={noteBody} onChange={e => setNoteBody(e.target.value)} placeholder="Nota..."
                  rows={3}
                  className="w-full px-2 py-1.5 text-xs font-serif bg-stone-900 border border-stone-700 text-stone-200 rounded focus:outline-none focus:border-amber-700 placeholder-stone-600 resize-none" />
                <button
                  onClick={async () => { if (noteTitle.trim()) { await addNote(noteTitle, noteBody, userId); setNoteTitle(''); setNoteBody('') } }}
                  disabled={!noteTitle.trim()}
                  className="w-full py-1.5 text-xs font-serif bg-amber-900/40 border border-amber-700/50 text-amber-300 hover:bg-amber-900/60 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors"
                >
                  Guardar nota
                </button>
              </div>

              <div style={{ borderTop: '1px solid rgba(80,50,20,0.3)' }} className="pt-3 space-y-2">
                {notes.length === 0 && <p className="text-stone-600 text-xs font-serif italic text-center py-4">Sin notas de campaña.</p>}
                {notes.map(note => (
                  <div key={note.id} className="rounded p-2.5 space-y-1"
                    style={{ background: 'rgba(20,10,5,0.6)', border: '1px solid rgba(60,35,15,0.4)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-amber-200 font-serif leading-tight">{note.title}</p>
                      {note.is_private && <span className="text-[8px] text-stone-600 font-serif italic shrink-0">privada</span>}
                    </div>
                    {note.body && <p className="text-[10px] text-stone-400 font-serif leading-relaxed whitespace-pre-wrap">{note.body}</p>}
                    <p className="text-[8px] text-stone-700 font-mono">{new Date(note.created_at).toLocaleDateString('es-AR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && <InfoModal modal={modal} onClose={() => setModal(null)} />}
    </>
  )
}
