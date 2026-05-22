import { type CampaignMap } from './tablero-types'

interface DmMapSelectorProps {
  showMapSelector: boolean
  setShowMapSelector: (show: boolean) => void
  activeMapUrl: string | null
  mapsList: CampaignMap[]
  loadingMaps: boolean
  mapUploading: boolean
  uploadMap: (file: File) => Promise<void>
  fetchMaps: () => Promise<void>
  activateMap: (url: string) => Promise<void>
  deleteMap: (map: CampaignMap) => Promise<void>
}

export function DmMapSelector({
  showMapSelector,
  setShowMapSelector,
  activeMapUrl,
  mapsList,
  loadingMaps,
  mapUploading,
  uploadMap,
  fetchMaps,
  activateMap,
  deleteMap,
}: DmMapSelectorProps) {
  if (!showMapSelector) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h3 className="font-serif text-lg text-amber-500 flex items-center gap-2">
            <span>🗺</span> Biblioteca de Mapas
          </h3>
          <button
            onClick={() => setShowMapSelector(false)}
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Upload Zone */}
        <div className="border border-dashed border-stone-800 hover:border-stone-700 bg-stone-950/40 p-4 rounded text-center transition-colors">
          <input
            type="file"
            id="modal-map-input"
            accept="image/*"
            className="hidden"
            disabled={mapUploading}
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) {
                await uploadMap(f)
                fetchMaps()
              }
              e.target.value = ''
            }}
          />
          <label
            htmlFor="modal-map-input"
            className="cursor-pointer flex flex-col items-center gap-1.5 py-2"
          >
            <span className="text-xl">📤</span>
            <span className="text-xs text-stone-300 font-serif">
              {mapUploading ? 'Subiendo mapa...' : 'Hacé clic para subir una imagen de mapa'}
            </span>
            <span className="text-[10px] text-stone-500 font-mono">PNG, JPG, WEBP (Recomendado máx. 5MB)</span>
          </label>
        </div>

        {/* Maps List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[200px]">
          <p className="text-xs font-serif text-stone-500 uppercase tracking-widest px-1">Mapas subidos</p>

          {loadingMaps ? (
            <div className="text-center py-8 text-stone-500 text-xs font-serif">
              Cargando biblioteca de mapas...
            </div>
          ) : mapsList.length === 0 ? (
            <div className="text-center py-8 text-stone-600 text-xs font-serif italic border border-stone-800/50 rounded">
              No hay mapas subidos aún.
            </div>
          ) : (
            <div className="space-y-1.5">
              {mapsList.map((map) => {
                const isActive = activeMapUrl === map.url
                return (
                  <div
                    key={map.rawName}
                    className={`flex items-center gap-3 p-2 border rounded transition-all ${
                      isActive
                        ? 'bg-amber-950/20 border-amber-800/60'
                        : 'bg-stone-950/40 border-stone-850 hover:border-stone-800'
                    }`}
                  >
                    <img
                      src={map.url}
                      alt={map.name}
                      className="w-10 h-10 object-cover rounded border border-stone-800 bg-stone-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-serif text-stone-200 truncate" title={map.name}>
                        {map.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive ? (
                        <span className="px-2 py-0.5 bg-amber-900/40 border border-amber-800/50 rounded text-[9px] text-amber-300 font-serif">
                          Activo
                        </span>
                      ) : (
                        <button
                          onClick={() => activateMap(map.url)}
                          className="px-2.5 py-1 text-[10px] font-serif bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded transition-colors"
                        >
                          Activar
                        </button>
                      )}
                      <button
                        onClick={() => deleteMap(map)}
                        className="p-1 text-stone-600 hover:text-red-400 transition-colors text-xs"
                        title="Eliminar mapa"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-stone-800 pt-3 flex justify-end">
          <button
            onClick={() => setShowMapSelector(false)}
            className="px-4 py-1.5 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 font-serif text-xs rounded transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
