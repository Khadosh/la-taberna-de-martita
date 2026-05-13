import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { CLASS_ICONS } from '../../../lib/class-meta'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId_/session')({
  component: DmSession,
})

// ── Types ────────────────────────────────────────────────────────────────────

type Character = {
  id: string
  name: string
  class: string
  race: string
  level: number
  stats: Record<string, number>
  current_hp: number | null
  armor_class: number | null
  conditions: string[]
  sheet_json: { hit_die?: number; saving_throws?: string[] }
}

type Npc = {
  id: string
  name: string
  currentHp: number
  maxHp: number
  initiative: number
}

type Combatant =
  | { kind: 'player'; characterId: string; initiative: number }
  | { kind: 'npc'; npc: Npc }

const getInitiative = (c: Combatant) => c.kind === 'player' ? c.initiative : c.npc.initiative

const CONDITIONS = [
  'Cegado', 'Hechizado', 'Ensordecido', 'Asustado', 'Agarrado',
  'Incapacitado', 'Invisible', 'Paralizado', 'Petrificado',
  'Envenenado', 'Derribado', 'Restringido', 'Aturdido', 'Inconsciente',
]

// ── Component ────────────────────────────────────────────────────────────────

function DmSession() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()
  const npcInputRef = useRef<HTMLInputElement>(null)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Combat state (local — ephemeral per session)
  const [combatActive, setCombatActive] = useState(false)
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [currentTurn, setCurrentTurn] = useState(0)
  const [npcInput, setNpcInput] = useState('')

  // Notes state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [noteSaving, setNoteSaving] = useState(false)

  // Inline editing
  const [editingHp, setEditingHp] = useState<string | null>(null)
  const [editingNpcHp, setEditingNpcHp] = useState<string | null>(null)
  const [editingNpcInit, setEditingNpcInit] = useState<string | null>(null)
  const [conditionPickerFor, setConditionPickerFor] = useState<string | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', campaignId).single()
      if (error) throw error
      return data
    },
  })

  const { data: characters = [] } = useQuery({
    queryKey: ['campaign-characters', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('campaign_id', campaignId)
      if (error) throw error
      return data as unknown as Character[]
    },
    refetchInterval: 5000,
  })

  const { data: latestNote } = useQuery({
    queryKey: ['session-note', campaignId],
    queryFn: async () => {
      const { data } = await supabase
        .from('session_notes')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      return data
    },
  })

  useEffect(() => {
    if (latestNote) {
      setNoteId(latestNote.id)
      setNoteTitle(latestNote.title)
      setNoteBody(latestNote.body)
    }
  }, [latestNote])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const maxHpFor = (c: Character) => {
    const sheet = c.sheet_json as { hit_die?: number }
    const hitDie = sheet.hit_die ?? 8
    const conMod = Math.floor(((c.stats.con ?? 10) - 10) / 2)
    return hitDie + conMod
  }

  const currentHpFor = (c: Character) => c.current_hp ?? maxHpFor(c)
  const acFor = (c: Character) => c.armor_class ?? (10 + Math.floor(((c.stats.dex ?? 10) - 10) / 2))

  const patchCharacter = async (id: string, patch: Record<string, unknown>) => {
    await supabase.from('characters').update(patch as never).eq('id', id)
    queryClient.invalidateQueries({ queryKey: ['campaign-characters', campaignId] })
  }

  // ── Combat ───────────────────────────────────────────────────────────────

  const startCombat = () => {
    const list: Combatant[] = characters.map(c => {
      const dexMod = Math.floor(((c.stats.dex ?? 10) - 10) / 2)
      const init = Math.ceil(Math.random() * 20) + dexMod
      return { kind: 'player', characterId: c.id, initiative: init }
    })
    list.sort((a, b) => getInitiative(b) - getInitiative(a))
    setCombatants(list)
    setCurrentTurn(0)
    setCombatActive(true)
    setTimeout(() => npcInputRef.current?.focus(), 100)
  }

  const endCombat = () => {
    setCombatActive(false)
    setCombatants([])
    setCurrentTurn(0)
  }

  const nextTurn = () => setCurrentTurn(t => (t + 1) % combatants.length)

  const addNpc = () => {
    const raw = npcInput.trim()
    if (!raw) return
    const match = raw.match(/^(.+?)\s+(\d+)$/)
    const name = match ? match[1] : raw
    const hp = match ? parseInt(match[2]) : 10
    const init = Math.ceil(Math.random() * 20)
    const npc: Npc = { id: crypto.randomUUID(), name, currentHp: hp, maxHp: hp, initiative: init }
    const newCombatant: Combatant = { kind: 'npc', npc }
    setCombatants(prev => {
      const list = [...prev, newCombatant]
      list.sort((a, b) => getInitiative(b) - getInitiative(a))
      return list
    })
    setNpcInput('')
    npcInputRef.current?.focus()
  }

  const updateNpc = (id: string, patch: Partial<Npc>) => {
    setCombatants(prev =>
      prev.map(c => c.kind === 'npc' && c.npc.id === id ? { ...c, npc: { ...c.npc, ...patch } } : c)
    )
  }

  const removeNpc = (id: string) => {
    setCombatants(prev => {
      const next = prev.filter(c => !(c.kind === 'npc' && c.npc.id === id))
      const newLen = next.length
      setCurrentTurn(t => Math.min(t, Math.max(0, newLen - 1)))
      return next
    })
  }

  const setPlayerInitiative = (characterId: string, init: number) => {
    setCombatants(prev => {
      const list = prev.map(c =>
        c.kind === 'player' && c.characterId === characterId ? { ...c, initiative: init } : c
      )
      list.sort((a, b) => getInitiative(b) - getInitiative(a))
      return list
    })
  }

  // ── Notes auto-save ──────────────────────────────────────────────────────

  const saveNote = useCallback(async (title: string, body: string, id: string | null) => {
    setNoteSaving(true)
    if (id) {
      await supabase.from('session_notes').update({ title: title || 'Sin título', body }).eq('id', id)
    } else {
      const { data } = await supabase.from('session_notes').insert({
        campaign_id: campaignId,
        author_id: session.user.id,
        title: title || 'Sin título',
        body,
        is_private: false,
        session_date: new Date().toISOString(),
      }).select().single()
      if (data) setNoteId(data.id)
    }
    queryClient.invalidateQueries({ queryKey: ['session-note', campaignId] })
    setNoteSaving(false)
  }, [campaignId, session.user.id, queryClient])

  const scheduleNoteSave = (title: string, body: string) => {
    if (notesTimer.current) clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(() => saveNote(title, body, noteId), 1500)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const sortedCombatants = combatActive ? combatants : []

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-900 px-6 py-3 flex items-center gap-4 shrink-0">
        <Link to="/campaigns/$campaignId" params={{ campaignId }} className="text-amber-400 hover:text-amber-200 text-sm font-serif transition-colors">
          ← {campaign?.name ?? 'Campaña'}
        </Link>
        <div className="w-px h-4 bg-stone-700" />
        <span className="text-stone-300 font-serif text-sm">Pantalla del DM</span>
        <div className="flex-1" />
        {combatActive ? (
          <button onClick={endCombat} className="text-xs px-3 py-1.5 border border-stone-600 text-stone-400 hover:border-red-700 hover:text-red-400 font-serif transition-colors">
            Fin de combate
          </button>
        ) : (
          <button onClick={startCombat} disabled={characters.length === 0}
            className="text-xs px-4 py-1.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors">
            ⚔ Iniciar combate
          </button>
        )}
      </header>

      {/* Main panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Party */}
        <aside className="w-72 border-r border-stone-800 flex flex-col overflow-y-auto bg-stone-900/50">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Partido · {characters.length}</p>
          </div>
          <div className="flex-1 px-3 pb-4 space-y-2">
            {characters.length === 0 && (
              <p className="text-stone-600 text-xs font-serif italic px-1 pt-2">Ningún personaje asignado a esta campaña.</p>
            )}
            {characters.map(c => {
              const maxHp = maxHpFor(c)
              const curHp = currentHpFor(c)
              const ac = acFor(c)
              const hpPct = Math.max(0, Math.min((curHp / maxHp) * 100, 100))
              const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
              const conds: string[] = (c.conditions as string[]) ?? []
              return (
                <div key={c.id} className="bg-stone-900 border border-stone-700 rounded-lg p-3 space-y-2">
                  {/* Name row */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CLASS_ICONS[c.class] ?? '🎲'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-100 truncate">{c.name}</p>
                      <p className="text-xs text-stone-500 capitalize">{c.race} {c.class} · Nv.{c.level}</p>
                    </div>
                    <span className="text-xs text-stone-500 font-mono bg-stone-800 px-1.5 py-0.5 rounded">CA {ac}</span>
                  </div>

                  {/* HP */}
                  <div>
                    <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden mb-1">
                      <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => patchCharacter(c.id, { current_hp: Math.max(0, curHp - 1) })}
                        className="w-5 h-5 text-xs border border-stone-700 text-stone-400 hover:bg-stone-800 rounded leading-none">−</button>
                      {editingHp === c.id ? (
                        <input autoFocus defaultValue={curHp} onBlur={e => { patchCharacter(c.id, { current_hp: parseInt(e.target.value) || 0 }); setEditingHp(null) }}
                          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                          className="w-10 text-center text-sm font-mono bg-transparent border-b border-stone-500 focus:outline-none text-amber-300" />
                      ) : (
                        <button onClick={() => setEditingHp(c.id)} className="text-sm font-mono text-amber-300 hover:text-amber-100 min-w-[2rem] text-center">
                          {curHp}
                        </button>
                      )}
                      <button onClick={() => patchCharacter(c.id, { current_hp: Math.min(maxHp, curHp + 1) })}
                        className="w-5 h-5 text-xs border border-stone-700 text-stone-400 hover:bg-stone-800 rounded leading-none">+</button>
                      <span className="text-xs text-stone-600 ml-1">/ {maxHp}</span>
                      <button onClick={() => patchCharacter(c.id, { current_hp: maxHp })}
                        className="ml-auto text-xs text-stone-600 hover:text-green-500 transition-colors" title="Curar completo">✦</button>
                    </div>
                  </div>

                  {/* Conditions */}
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
                </div>
              )
            })}
          </div>
        </aside>

        {/* RIGHT: Initiative / Combat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {!combatActive ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <p className="text-stone-600 font-serif text-lg">⚔</p>
                <p className="text-stone-500 font-serif text-sm">Cuando empiece el combate, la iniciativa se<br/>tira automáticamente para todos los jugadores.</p>
                <button onClick={startCombat} disabled={characters.length === 0}
                  className="px-6 py-2.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-40 text-amber-100 font-serif transition-colors">
                  ⚔ Iniciar combate
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Turn controls */}
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={nextTurn}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-100 font-serif text-sm transition-colors">
                    Siguiente turno →
                  </button>
                  <span className="text-xs text-stone-500 font-serif">
                    Turno {currentTurn + 1} de {combatants.length}
                  </span>
                </div>

                {/* Combatant list */}
                {sortedCombatants.map((combatant, idx) => {
                  const isActive = idx === currentTurn
                  if (combatant.kind === 'player') {
                    const c = characters.find(x => x.id === combatant.characterId)
                    if (!c) return null
                    const maxHp = maxHpFor(c)
                    const curHp = currentHpFor(c)
                    const hpPct = Math.max(0, Math.min((curHp / maxHp) * 100, 100))
                    const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
                    return (
                      <CombatantRow
                        key={c.id}
                        isActive={isActive}
                        icon={CLASS_ICONS[c.class] ?? '🎲'}
                        name={c.name}
                        initiative={combatant.initiative}
                        onInitiativeChange={v => setPlayerInitiative(c.id, v)}
                        hp={curHp} maxHp={maxHp} hpPct={hpPct} hpColor={hpColor}
                        onHpChange={v => patchCharacter(c.id, { current_hp: v })}
                        tag={<span className="text-xs text-stone-500 font-serif">Jugador</span>}
                      />
                    )
                  } else {
                    const npc = combatant.npc
                    const hpPct = Math.max(0, Math.min((npc.currentHp / npc.maxHp) * 100, 100))
                    const hpColor = hpPct > 50 ? 'bg-green-700' : hpPct > 25 ? 'bg-amber-600' : 'bg-red-700'
                    return (
                      <CombatantRow
                        key={npc.id}
                        isActive={isActive}
                        icon="⚔"
                        name={npc.name}
                        initiative={npc.initiative}
                        onInitiativeChange={v => updateNpc(npc.id, { initiative: v })}
                        hp={npc.currentHp} maxHp={npc.maxHp} hpPct={hpPct} hpColor={hpColor}
                        onHpChange={v => updateNpc(npc.id, { currentHp: v })}
                        onRemove={() => removeNpc(npc.id)}
                        tag={<span className="text-xs text-stone-600 font-serif">NPC</span>}
                        editingHpId={editingNpcHp}
                        setEditingHpId={setEditingNpcHp}
                        editingInitId={editingNpcInit}
                        setEditingInitId={setEditingNpcInit}
                        entityId={npc.id}
                      />
                    )
                  }
                })}

                {/* Add NPC */}
                <div className="mt-4 flex items-center gap-2 border-t border-stone-800 pt-4">
                  <input
                    ref={npcInputRef}
                    value={npcInput}
                    onChange={e => setNpcInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && npcInput.trim() && addNpc()}
                    placeholder='Goblin Guardián 18  ←  nombre [hp opcional]'
                    className="flex-1 px-3 py-2 bg-stone-900 border border-stone-700 text-stone-300 text-sm font-serif placeholder-stone-700 focus:outline-none focus:border-stone-500"
                  />
                  <button onClick={addNpc} disabled={!npcInput.trim()}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 font-serif text-sm transition-colors">
                    + NPC
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Session notes */}
          <div className="border-t border-stone-800 bg-stone-900/50 px-6 py-4 shrink-0 h-52">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs tracking-widest text-stone-500 uppercase font-serif">Notas de sesión</p>
              {noteSaving && <span className="text-xs text-stone-600 font-serif italic">Guardando...</span>}
              {!noteSaving && noteId && <span className="text-xs text-stone-700 font-serif italic">Guardado</span>}
            </div>
            <input
              value={noteTitle}
              onChange={e => { setNoteTitle(e.target.value); scheduleNoteSave(e.target.value, noteBody) }}
              placeholder="Título de la sesión"
              className="w-full bg-transparent border-b border-stone-800 text-stone-300 font-serif text-sm mb-2 pb-1 focus:outline-none focus:border-stone-600 placeholder-stone-700"
            />
            <textarea
              value={noteBody}
              onChange={e => { setNoteBody(e.target.value); scheduleNoteSave(noteTitle, e.target.value) }}
              placeholder="Anotá lo que pasa en la sesión..."
              className="w-full bg-transparent text-stone-400 font-serif text-sm resize-none focus:outline-none placeholder-stone-700 h-24"
            />
          </div>
        </main>
      </div>
    </div>
  )
}

// ── CombatantRow ─────────────────────────────────────────────────────────────

function CombatantRow({
  isActive, icon, name, initiative, onInitiativeChange,
  hp, maxHp, hpPct, hpColor, onHpChange, onRemove, tag,
  editingHpId, setEditingHpId, editingInitId, setEditingInitId, entityId,
}: {
  isActive: boolean
  icon: string
  name: string
  initiative: number
  onInitiativeChange: (v: number) => void
  hp: number
  maxHp: number
  hpPct: number
  hpColor: string
  onHpChange: (v: number) => void
  onRemove?: () => void
  tag: React.ReactNode
  editingHpId?: string | null
  setEditingHpId?: (id: string | null) => void
  editingInitId?: string | null
  setEditingInitId?: (id: string | null) => void
  entityId?: string
}) {
  const [localEditHp, setLocalEditHp] = useState(false)
  const [localEditInit, setLocalEditInit] = useState(false)
  const isEditingHp = entityId && setEditingHpId ? editingHpId === entityId : localEditHp
  const isEditingInit = entityId && setEditingInitId ? editingInitId === entityId : localEditInit
  const startEditHp = () => entityId && setEditingHpId ? setEditingHpId(entityId) : setLocalEditHp(true)
  const stopEditHp = () => entityId && setEditingHpId ? setEditingHpId(null) : setLocalEditHp(false)
  const startEditInit = () => entityId && setEditingInitId ? setEditingInitId(entityId) : setLocalEditInit(true)
  const stopEditInit = () => entityId && setEditingInitId ? setEditingInitId(null) : setLocalEditInit(false)

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
      isActive
        ? 'border-amber-700 bg-amber-950/40 shadow-sm shadow-amber-900/30'
        : 'border-stone-800 bg-stone-900/30'
    }`}>
      {/* Active indicator */}
      <div className="w-3 shrink-0 text-center">
        {isActive && <span className="text-amber-400 text-xs">→</span>}
      </div>

      {/* Initiative */}
      <div className="w-8 shrink-0 text-center">
        {isEditingInit ? (
          <input autoFocus defaultValue={initiative}
            onBlur={e => { onInitiativeChange(parseInt(e.target.value) || 0); stopEditInit() }}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-8 text-center text-sm font-mono bg-transparent border-b border-stone-600 focus:outline-none text-stone-300"
          />
        ) : (
          <button onClick={startEditInit} className="text-sm font-mono text-stone-400 hover:text-stone-200 transition-colors w-full">
            {initiative}
          </button>
        )}
      </div>

      {/* Icon + name */}
      <span className="text-base shrink-0">{icon}</span>
      <div className="w-32 shrink-0">
        <p className="text-sm font-semibold text-stone-200 truncate">{name}</p>
        <div className="mt-0.5">{tag}</div>
      </div>

      {/* HP bar */}
      <div className="flex-1">
        <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-1">
          <div className={`h-full rounded-full transition-all ${hpColor}`} style={{ width: `${hpPct}%` }} />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onHpChange(Math.max(0, hp - 1))} className="w-5 h-5 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none">−</button>
          <button onClick={() => onHpChange(Math.max(0, hp - 5))} className="w-6 h-4 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none font-mono">-5</button>
          {isEditingHp ? (
            <input autoFocus defaultValue={hp}
              onBlur={e => { onHpChange(parseInt(e.target.value) || 0); stopEditHp() }}
              onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-10 text-center text-sm font-mono bg-transparent border-b border-stone-500 focus:outline-none text-amber-300"
            />
          ) : (
            <button onClick={startEditHp} className="text-sm font-mono text-amber-300 hover:text-amber-100 min-w-[2.5rem] text-center">
              {hp === 0 ? <span className="text-red-500">💀</span> : hp}
            </button>
          )}
          <button onClick={() => onHpChange(Math.min(maxHp, hp + 1))} className="w-5 h-5 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none">+</button>
          <button onClick={() => onHpChange(Math.min(maxHp, hp + 5))} className="w-6 h-4 text-xs border border-stone-700 text-stone-500 hover:bg-stone-800 rounded leading-none font-mono">+5</button>
          <span className="text-xs text-stone-700 ml-1">/ {maxHp}</span>
        </div>
      </div>

      {/* Remove NPC */}
      {onRemove && (
        <button onClick={onRemove} className="text-stone-700 hover:text-red-500 transition-colors text-sm shrink-0">✕</button>
      )}
    </div>
  )
}
