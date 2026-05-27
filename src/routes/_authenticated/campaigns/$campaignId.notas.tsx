import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import type { Tables } from '../../../lib/database.types'

export const Route = createFileRoute('/_authenticated/campaigns/$campaignId/notas')({
  component: SessionNotesTab,
})

type SessionNote = Tables<'session_notes'> & {
  author?: {
    username: string | null
  } | null
}

function SessionNotesTab() {
  const { campaignId } = Route.useParams()
  const { session } = Route.useRouteContext() as { session: Session }
  const queryClient = useQueryClient()

  // Selected note and active action
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [isFormActive, setIsFormActive] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isPrivate, setIsPrivate] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch session notes (join author profile for username)
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['session-notes', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_notes')
        .select('*, author:profiles(username)')
        .eq('campaign_id', campaignId)
        .order('session_date', { ascending: false })
      if (error) throw error
      return data as SessionNote[]
    },
  })

  const selectedNote = notes.find(n => n.id === selectedNoteId)

  // Setup form for creating
  const startCreate = () => {
    setTitle('')
    setBody('')
    setSessionDate(new Date().toISOString().split('T')[0])
    setIsPrivate(false)
    setIsEditing(false)
    setIsFormActive(true)
  }

  // Setup form for editing
  const startEdit = (note: SessionNote) => {
    setTitle(note.title)
    setBody(note.body)
    setSessionDate(note.session_date ? new Date(note.session_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    setIsPrivate(note.is_private)
    setIsEditing(true)
    setIsFormActive(true)
  }

  // Submit Note Form (insert/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    try {
      const payload = {
        campaign_id: campaignId,
        title: title.trim(),
        body: body.trim(),
        is_private: isPrivate,
        session_date: new Date(sessionDate).toISOString(),
        author_id: session.user.id,
      }

      if (isEditing && selectedNoteId) {
        const { error } = await supabase
          .from('session_notes')
          .update(payload)
          .eq('id', selectedNoteId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('session_notes')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        if (data) {
          setSelectedNoteId(data.id)
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['session-notes', campaignId] })
      setIsFormActive(false)
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving session note:', err)
    } finally {
      setSaving(false)
    }
  }

  // Delete Note
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota de sesión?')) return
    try {
      const { error } = await supabase
        .from('session_notes')
        .delete()
        .eq('id', id)
      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['session-notes', campaignId] })
      if (selectedNoteId === id) {
        setSelectedNoteId(null)
      }
    } catch (err) {
      console.error('Error deleting session note:', err)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Fecha desconocida'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row overflow-hidden bg-table-wood">
      {/* Sidebar: Notes List */}
      <div className="w-full md:w-80 border-r-2 border-stone-900 bg-stone-950 flex flex-col shrink-0 overflow-y-auto max-h-[40vh] md:max-h-none">
        <div className="p-4 border-b border-stone-850 flex items-center justify-between sticky top-0 bg-stone-950 z-10">
          <h2 className="text-sm font-display tracking-widest text-amber-100 uppercase">Diario de Sesión</h2>
          <button
            onClick={startCreate}
            className="px-3 py-1 text-xs font-serif bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-700/40 rounded transition-colors"
          >
            + Nueva Nota
          </button>
        </div>

        <div className="flex-1 divide-y divide-stone-900">
          {isLoading ? (
            <p className="p-4 text-xs italic text-stone-500 font-serif">Cargando notas...</p>
          ) : notes.length === 0 ? (
            <p className="p-4 text-xs italic text-stone-500 font-serif">Aún no hay notas escritas.</p>
          ) : (
            notes.map(note => {
              const isSelected = note.id === selectedNoteId && !isFormActive
              return (
                <button
                  key={note.id}
                  onClick={() => {
                    setSelectedNoteId(note.id)
                    setIsFormActive(false)
                  }}
                  className={`w-full text-left p-4 hover:bg-stone-900/50 transition-colors flex flex-col gap-1 ${
                    isSelected ? 'bg-amber-950/20 border-l-2 border-amber-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <span className="text-sm font-serif font-semibold text-amber-100 line-clamp-1">
                      {note.title}
                    </span>
                    {note.is_private && (
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-red-950/60 border border-red-800/30 text-red-400 font-mono tracking-wider uppercase rounded">
                        Oculta
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-serif">
                    <span>{formatDate(note.session_date)}</span>
                    <span className="italic max-w-[120px] truncate">
                      por {note.author?.username || 'Viajero'}
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main Area: Detail View or Form */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-start justify-center">
        {isFormActive ? (
          /* Create / Edit Form */
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-8 relative space-y-4"
          >
            <span className="absolute -top-[3px] -left-[3px] w-3 h-3 border-t-2 border-l-2 border-stone-900" />
            <span className="absolute -top-[3px] -right-[3px] w-3 h-3 border-t-2 border-r-2 border-stone-900" />
            <span className="absolute -bottom-[3px] -left-[3px] w-3 h-3 border-b-2 border-l-2 border-stone-900" />
            <span className="absolute -bottom-[3px] -right-[3px] w-3 h-3 border-b-2 border-r-2 border-stone-900" />

            <h3 className="text-lg font-display tracking-wider text-stone-950 font-bold border-b border-stone-400/30 pb-2">
              {isEditing ? 'Editar Entrada de Diario' : 'Nueva Entrada de Diario'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-serif font-bold text-stone-700">Título de la Sesión *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Sesión 12: Las minas de Phandelver"
                  className="w-full bg-amber-50/50 border border-stone-400/60 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-stone-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-serif font-bold text-stone-700">Fecha de la Aventura</label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full bg-amber-50/50 border border-stone-400/60 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-stone-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-serif font-bold text-stone-700">Detalles / Resumen de la Bitácora *</label>
              <textarea
                required
                rows={12}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="El grupo exploró el pasadizo oeste. Nos emboscaron 3 trasgos..."
                className="w-full bg-amber-50/50 border border-stone-400/60 rounded p-3 text-sm focus:outline-none focus:border-stone-800 font-serif leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-400/20">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-850 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-serif text-stone-700 font-semibold">
                  Privado (Ocultar a los jugadores, visible solo para ti y el DM)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormActive(false)}
                  className="px-4 py-1.5 text-xs font-serif text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-serif bg-stone-900 text-amber-100 hover:bg-stone-800 rounded transition-colors disabled:opacity-40"
                >
                  {saving ? 'Guardando...' : 'Guardar Entrada'}
                </button>
              </div>
            </div>
          </form>
        ) : selectedNote ? (
          /* View Details */
          <div className="w-full max-w-2xl bg-parchment-grid bg-papyrus-texture text-stone-900 border border-parchment-sienna/40 shadow-tavern-glow rounded-md p-6 sm:p-10 relative space-y-6">
            <span className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-2 border-l-2 border-stone-900" />
            <span className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-2 border-r-2 border-stone-900" />
            <span className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-2 border-l-2 border-stone-900" />
            <span className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-2 border-r-2 border-stone-900" />

            <div className="flex justify-between items-start border-b border-stone-400/40 pb-4 gap-4">
              <div>
                <h3 className="text-2xl font-display font-bold text-stone-950 leading-tight">
                  {selectedNote.title}
                </h3>
                <p className="text-xs font-serif italic text-stone-650 mt-1">
                  Fecha de sesión: {formatDate(selectedNote.session_date)}
                </p>
              </div>

              {selectedNote.is_private && (
                <span className="text-[10px] px-2 py-0.5 bg-red-900/10 border border-red-800/40 text-red-950 uppercase tracking-widest font-mono rounded">
                  Oculta
                </span>
              )}
            </div>

            {/* Note Content */}
            <div className="text-stone-850 font-serif leading-relaxed whitespace-pre-wrap text-sm sm:text-base pr-2 max-h-[60vh] overflow-y-auto">
              {selectedNote.body}
            </div>

            {/* Author + Actions */}
            <div className="border-t border-stone-400/30 pt-4 flex items-center justify-between text-xs font-serif italic text-stone-600">
              <span>Registrado por: {selectedNote.author?.username || 'Viajero'}</span>

              {selectedNote.author_id === session.user.id && (
                <div className="flex gap-3">
                  <button
                    onClick={() => startEdit(selectedNote)}
                    className="text-stone-600 hover:text-stone-950 underline transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedNote.id)}
                    className="text-red-700 hover:text-red-900 underline transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center bg-stone-900/10 border border-stone-800/20 rounded p-12 max-w-sm">
            <span className="text-4xl block mb-3">📖</span>
            <p className="text-stone-400 font-serif italic">Selecciona una entrada de diario de la lista lateral o redacta una nueva.</p>
          </div>
        )}
      </div>
    </div>
  )
}
