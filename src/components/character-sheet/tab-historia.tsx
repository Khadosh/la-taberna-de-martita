import { SheetLabel } from './sheet-primitives'

interface TabHistoriaProps {
  backstory: string | null | undefined
  isOwner: boolean
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
  onDelete: () => void
}

export function TabHistoria({ backstory, isOwner, confirmDelete, setConfirmDelete, onDelete }: TabHistoriaProps) {
  return (
    <div className="p-6 space-y-4">
      <SheetLabel>Historia del Personaje</SheetLabel>
      {backstory ? (
        <p className="text-sm text-stone-700 font-serif italic leading-relaxed whitespace-pre-wrap mt-2">{backstory}</p>
      ) : (
        <p className="text-stone-400 font-serif italic text-sm text-center py-10">Sin historia registrada.</p>
      )}

      {isOwner && (
        <div className="pt-6 border-t border-stone-500/30">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-stone-400/70 hover:text-red-600 font-serif italic transition-colors"
            >
              Eliminar personaje...
            </button>
          ) : (
            <div className="p-3 border border-red-900/30 bg-red-900/5 text-center space-y-2">
              <p className="text-xs text-red-900 font-serif">¿Eliminar a este personaje? No hay vuelta atrás.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 text-xs border border-stone-400 font-serif hover:bg-stone-100/30 transition-colors">
                  Cancelar
                </button>
                <button onClick={onDelete} className="flex-1 py-1.5 text-xs bg-red-900 text-white font-serif hover:bg-red-800 transition-colors">
                  Sí, borrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
