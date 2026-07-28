/**
 * Renderiza un SVG de game-icons como máscara CSS en vez de como `<img>`.
 *
 * Los SVGs se generan sin `fill` (ver scripts/build-game-icons.mjs), así que solo
 * aportan silueta. Usarlos como `mask-image` sobre un fondo `currentColor` hace
 * que el ícono tome el color del texto del contenedor — el mismo ícono lee bien
 * sobre pergamino claro y sobre madera oscura, que es justo lo que necesitan el
 * inventario y las tarjetas de tienda al alternar entre estado normal y activo.
 */
export function GameIcon({ url, className = '', title }: { url: string; className?: string; title?: string }) {
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={`inline-block bg-current ${className}`}
      style={{
        maskImage: `url(${url})`,
        WebkitMaskImage: `url(${url})`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  )
}
