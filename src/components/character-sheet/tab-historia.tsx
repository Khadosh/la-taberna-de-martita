import { SheetLabel, SheetRow } from './sheet-primitives'

interface TabHistoriaProps {
  backstory: string | null | undefined
  isOwner: boolean
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
  onDelete: () => void
}

export function TabHistoria({ backstory, isOwner, confirmDelete, setConfirmDelete, onDelete }: TabHistoriaProps) {
  return (
    <div>
      <SheetRow>
        <div className="flex-1 p-5">
          <SheetLabel>Historia del Personaje</SheetLabel>
          {backstory ? (
            <p className="text-sm font-serif italic leading-relaxed whitespace-pre-wrap mt-4" style={{ color: '#3d2510' }}>{backstory}</p>
          ) : (
            <p className="font-serif italic text-sm text-center py-10" style={{ color: '#7a5828' }}>Sin historia registrada.</p>
          )}
        </div>
      </SheetRow>

      {isOwner && (
        <SheetRow className="border-t border-stone-500/30">
          <div className="flex-1 p-4">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-serif italic transition-colors"
                style={{ color: '#a09080' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a09080')}
              >
                Eliminar personaje...
              </button>
            ) : (
              <div className="p-3 text-center space-y-2" style={{ border: '1px solid rgba(127,29,29,0.3)', background: 'rgba(127,29,29,0.04)' }}>
                <p className="text-xs font-serif" style={{ color: '#7f1d1d' }}>¿Eliminar a este personaje? No hay vuelta atrás.</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 text-xs font-serif transition-colors"
                    style={{ border: '1px solid rgba(109,85,48,0.4)', color: '#5c3d18' }}>
                    Cancelar
                  </button>
                  <button onClick={onDelete} className="flex-1 py-1.5 text-xs font-serif transition-colors"
                    style={{ background: '#7f1d1d', color: '#fef2f2' }}>
                    Sí, borrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </SheetRow>
      )}
    </div>
  )
}
