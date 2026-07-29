import { Info } from 'lucide-react'

/**
 * Tarjeta de selección del wizard (raza, clase, trasfondo).
 *
 * Antes era un `<div onClick>` con el botón de info anidado adentro: no recibía
 * foco, no respondía a Enter ni Espacio, y anidaba un control dentro de otro.
 *
 * Ahora es un `<input type="radio">` visualmente oculto dentro de un `<label>`.
 * Eso da gratis lo que un div nunca va a tener: navegación con flechas dentro del
 * grupo, agrupación semántica y el anuncio "opción 3 de 9, seleccionada". El
 * botón de info queda como hermano del label —no adentro— porque un control
 * dentro de otro control es HTML inválido.
 */

type Props = {
  /** Nombre del grupo de radios. Compartido por todas las tarjetas del grupo. */
  group: string
  value: string
  selected: boolean
  onSelect: () => void
  onInfo: () => void
  /** Nombre accesible: lo que anuncia el lector al enfocar la tarjeta. */
  label: string
  /** Texto del botón de info; incluye el nombre para no repetir "ver detalles". */
  infoLabel: string
  /** Ruta de la ilustración de fondo. Sin ella, la tarjeta usa solo color. */
  image?: string
  /** Opacidad y punto de corte del degradado cuando está seleccionada. */
  tint?: { alpha: number; stop: string }
  /** Estilo base para las tarjetas sin ilustración. */
  style?: React.CSSProperties
  className?: string
  children: React.ReactNode
}

const BASE =
  'relative text-left p-3 border transition-all overflow-hidden rounded-sm w-full cursor-pointer block ' +
  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber-400'

export function SelectionCard({
  group, value, selected, onSelect, onInfo, label, infoLabel, image,
  tint = { alpha: 0.3, stop: '55%' }, style, className = '', children,
}: Props) {
  const gradient = selected
    ? `linear-gradient(100deg, rgba(24, 14, 6, 0.96) 25%, rgba(120, 60, 10, ${tint.alpha}) ${tint.stop}, rgba(120, 60, 10, 0.15) 100%)`
    : 'linear-gradient(100deg, rgba(15, 8, 4, 0.98) 25%, rgba(24, 14, 6, 0.8) 55%, rgba(24, 14, 6, 0.45) 100%)'

  const illustrated: React.CSSProperties = {
    backgroundImage: `${gradient}, url('${image}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'right center',
    borderColor: selected ? 'rgba(180, 100, 20, 0.85)' : 'rgba(120, 70, 20, 0.22)',
    boxShadow: selected ? 'inset 0 0 10px rgba(180, 100, 20, 0.25), 0 2px 6px rgba(0, 0, 0, 0.4)' : 'none',
  }

  return (
    <div className="relative">
      <label
        className={`${BASE} ${className}`}
        style={image ? illustrated : style}
      >
        <input
          type="radio"
          name={group}
          value={value}
          checked={selected}
          onChange={onSelect}
          aria-label={label}
          className="sr-only"
        />
        {children}
      </label>

      <button
        type="button"
        onClick={onInfo}
        aria-label={infoLabel}
        className="absolute right-2.5 bottom-2.5 z-20 p-1 flex items-center justify-center rounded-full bg-stone-900/60 border border-stone-850 hover:border-amber-500/60 text-stone-400 hover:text-amber-300 transition-all shadow-sm"
      >
        <Info className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  )
}
