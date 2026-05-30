import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BACKGROUNDS } from '../../lib/dnd-backgrounds'
import { SheetLabel, SheetRow } from './sheet-primitives'
import { dndApi, dndKeys } from '../../lib/dnd-api'
import type { SheetJson } from './types'

interface TabHistoriaProps {
  backstory: string | null | undefined
  sheet: SheetJson
  isOwner: boolean
  characterClass: string
  characterLevel: number
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
  onDelete: () => void
  patchSheet: (p: Partial<SheetJson>) => Promise<void>
}

export function TabHistoria({ backstory, sheet, isOwner, characterClass, characterLevel, confirmDelete, setConfirmDelete, onDelete, patchSheet }: TabHistoriaProps) {
  const [pickingBackground, setPickingBackground] = useState(false)
  const [pickingSubclass, setPickingSubclass] = useState(false)

  const bgData = sheet.background ? BACKGROUNDS[sheet.background] : null
  const classKey = characterClass.toLowerCase()
  const { data: subclassDetail } = useQuery({
    queryKey: dndKeys.subclass(sheet.subclass ?? ''),
    queryFn: () => dndApi.subclass(sheet.subclass!),
    enabled: !!sheet.subclass,
    staleTime: Infinity,
  })
  const { data: classSubclasses } = useQuery({
    queryKey: dndKeys.classSubclasses(classKey),
    queryFn: () => dndApi.classSubclasses(classKey),
    enabled: pickingSubclass,
    staleTime: Infinity,
  })

  const handleSelect = async (key: string) => {
    await patchSheet({ background: key })
    setPickingBackground(false)
  }

  const handleSubclassSelect = async (index: string) => {
    await patchSheet({ subclass: index })
    setPickingSubclass(false)
  }

  return (
    <div>
      {/* Especialidad */}
      {(sheet.subclass || isOwner) && (
        <SheetRow>
          <div className="flex-1 p-5">
            <div className="flex items-center justify-between mb-3">
              <SheetLabel>Especialidad</SheetLabel>
              {isOwner && (
                <button
                  onClick={() => setPickingSubclass(v => !v)}
                  className="text-[10px] font-serif transition-colors"
                  style={{ color: '#9a7540' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#78350f')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9a7540')}
                >
                  {pickingSubclass ? 'cancelar' : sheet.subclass ? 'cambiar' : 'elegir'}
                </button>
              )}
            </div>

            {pickingSubclass && (
              <div className="mb-4 grid gap-1.5">
                {!classSubclasses && <p className="text-xs font-serif italic" style={{ color: '#7a5828' }}>Cargando opciones...</p>}
                {classSubclasses?.results.map((sc: { index: string; name: string }) => (
                  <button key={sc.index} onClick={() => handleSubclassSelect(sc.index)}
                    className="w-full text-left border px-3 py-2 transition-colors"
                    style={sheet.subclass === sc.index
                      ? { border: '1px solid rgba(180,100,20,0.6)', background: 'rgba(180,100,20,0.08)', color: '#78350f' }
                      : { border: '1px solid rgba(109,85,48,0.25)', color: '#5c3d18' }
                    }
                    onMouseEnter={e => { if (sheet.subclass !== sc.index) e.currentTarget.style.background = 'rgba(109,85,48,0.06)' }}
                    onMouseLeave={e => { if (sheet.subclass !== sc.index) e.currentTarget.style.background = '' }}
                  >
                    <span className="text-sm font-semibold font-serif capitalize">{sc.name}</span>
                  </button>
                ))}
              </div>
            )}

            {!pickingSubclass && subclassDetail && (
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-base" style={{ color: '#3d2510' }}>{subclassDetail.name}</h4>
                {subclassDetail.subclass_flavor && (
                  <p className="text-[10px] uppercase tracking-widest font-semibold font-serif" style={{ color: '#9a7540' }}>
                    {subclassDetail.subclass_flavor} · Nv {characterLevel}
                  </p>
                )}
                {subclassDetail.desc && (
                  <p className="text-sm font-serif italic leading-relaxed" style={{ color: '#5c3d18' }}>{subclassDetail.desc}</p>
                )}
              </div>
            )}

            {!pickingSubclass && !sheet.subclass && (
              <p className="font-serif italic text-sm text-center py-4" style={{ color: '#7a5828' }}>
                {isOwner ? 'Sin especialidad elegida.' : 'Sin especialidad registrada.'}
              </p>
            )}
          </div>
        </SheetRow>
      )}

      {/* Trasfondo */}
      <SheetRow>
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between mb-3">
            <SheetLabel>Trasfondo</SheetLabel>
            {isOwner && (
              <button
                onClick={() => setPickingBackground(v => !v)}
                className="text-[10px] font-serif transition-colors"
                style={{ color: '#9a7540' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#78350f')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9a7540')}
              >
                {pickingBackground ? 'cancelar' : bgData ? 'cambiar' : 'elegir'}
              </button>
            )}
          </div>

          {/* Picker */}
          {pickingBackground && (
            <div className="mb-4 grid gap-1.5">
              {Object.entries(BACKGROUNDS).map(([key, bg]) => (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className="w-full text-left border px-3 py-2 transition-colors"
                  style={sheet.background === key
                    ? { border: '1px solid rgba(180,100,20,0.6)', background: 'rgba(180,100,20,0.08)', color: '#78350f' }
                    : { border: '1px solid rgba(109,85,48,0.25)', color: '#5c3d18' }
                  }
                  onMouseEnter={e => { if (sheet.background !== key) e.currentTarget.style.background = 'rgba(109,85,48,0.06)' }}
                  onMouseLeave={e => { if (sheet.background !== key) e.currentTarget.style.background = '' }}
                >
                  <span className="text-sm font-semibold font-serif">{bg.name}</span>
                  <span className="text-xs font-serif ml-2" style={{ color: '#9a7540' }}>
                    {bg.skills.join(', ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Current background display */}
          {!pickingBackground && bgData && (
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-base" style={{ color: '#3d2510' }}>{bgData.name}</h4>

              <p className="text-xs font-serif italic leading-relaxed" style={{ color: '#5c3d18' }}>
                {bgData.desc}
              </p>

              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold font-serif mb-1.5" style={{ color: '#9a7540' }}>
                  Competencias en habilidades
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {bgData.skills.map(skill => (
                    <span key={skill} className="text-xs font-serif px-2 py-0.5"
                      style={{ background: 'rgba(109,85,48,0.1)', border: '1px solid rgba(109,85,48,0.25)', color: '#5c3d18' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest font-semibold font-serif mb-1" style={{ color: '#9a7540' }}>
                  Herramienta / Instrumento
                </p>
                <p className="text-xs font-serif" style={{ color: '#5c3d18' }}>{bgData.tool}</p>
              </div>
            </div>
          )}

          {!pickingBackground && !bgData && (
            <p className="font-serif italic text-sm text-center py-4" style={{ color: '#7a5828' }}>
              {isOwner ? 'Sin trasfondo. Elegí uno para ver sus rasgos.' : 'Sin trasfondo registrado.'}
            </p>
          )}
        </div>
      </SheetRow>

      {/* Historia del personaje */}
      <SheetRow className="border-t border-stone-500/30">
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
