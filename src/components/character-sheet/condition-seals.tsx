import type React from 'react'

// Ícono embossed: mismo rojo-marrón de la cera pero más claro
const ICON_COLOR = 'rgba(195,115,62,0.92)'
const ICON_FILTER = 'drop-shadow(0 1.2px 1px rgba(8,2,0,0.82)) drop-shadow(0 -0.5px 0.5px rgba(255,195,130,0.28))'

// ── Íconos SVG por condición ──────────────────────────────────────────────────
const ICON: Record<string, React.ReactNode> = {
  'Cegado': (
    <>
      <ellipse cx="12" cy="12" rx="8" ry="5.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  'Hechizado': (
    <path d="M12 19.5s-8-5.2-8-9.5a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 4.3-8 9.5-8 9.5z" fill="currentColor" />
  ),
  'Ensordecido': (
    <>
      <path d="M9 8a4 4 0 0 1 7.9.8 4 4 0 0 1-1.9 3.7l-1 .5V16H10v-3l-1-.5A4 4 0 0 1 9 8z"
        stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  'Asustado': (
    <>
      <circle cx="12" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <circle cx="9.5" cy="9.5" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="9.5" r="1.2" fill="currentColor" />
      <path d="M9 13c1 1.2 2.5 2 3 2s2-.8 3-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M9 16.5 8 20M12 16.5v3.5M15 16.5l1 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </>
  ),
  'Agarrado': (
    <>
      <rect x="8" y="5" width="8" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="8" y="14" width="8" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="12" y1="10" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  'Incapacitado': (
    <>
      <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="19" y1="5" x2="5" y2="19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  'Invisible': (
    <>
      <path d="M12 4a7 7 0 0 0-7 7v7l2.5-2.5L10 18l2-2 2 2 2.5-2.5L19 18V11a7 7 0 0 0-7-7z"
        stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <circle cx="9.5" cy="10.5" r="1.2" fill="currentColor" opacity="0.5" />
      <circle cx="14.5" cy="10.5" r="1.2" fill="currentColor" opacity="0.5" />
    </>
  ),
  'Paralizado': (
    <path d="M13 2 5 14h7l-1 8 8-12h-7z" fill="currentColor" />
  ),
  'Petrificado': (
    <>
      <path d="M12 3 20 9 16 21 8 21 4 9z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M4 9h16M8 9 12 3M16 9 12 3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8 21 12 9M16 21 12 9" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </>
  ),
  'Envenenado': (
    <>
      <circle cx="12" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="9.5" cy="10" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="10" r="1.2" fill="currentColor" />
      <path d="M9.5 13.5c.7.8 1.6 1.2 2.5 1.2s1.8-.4 2.5-1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M10 4.5 9 2M12 4V2M14 4.5 15 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  'Derribado': (
    <>
      <path d="M12 5v13M7 14l5 6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" y1="5" x2="20" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  'Restringido': (
    <>
      <rect x="4" y="9" width="7" height="6" rx="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="13" y="9" width="7" height="6" rx="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="11" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  'Aturdido': (
    <>
      <path d="M12 2l1.8 5.2H19l-4.4 3.2 1.7 5.2L12 12.4 7.7 15.6l1.7-5.2L5 7.2h5.2L12 2z" fill="currentColor" />
      <circle cx="5.5" cy="17" r="2" fill="currentColor" opacity="0.65" />
      <circle cx="18.5" cy="17" r="2" fill="currentColor" opacity="0.65" />
    </>
  ),
  'Inconsciente': (
    <>
      <path d="M3 12c2.5-4 5.5-6 9-6s6.5 2 9 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M5 12c1.8 2.5 4 4 7 4s5.2-1.5 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M8 17.5l1.5 2M12 18v2M16 17.5l-1.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    </>
  ),
  'Agotamiento I': (
    <>
      <rect x="3" y="9" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="3" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.85" />
    </>
  ),
  'Agotamiento II': (
    <>
      <rect x="3" y="9" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="3" y="9" width="12" height="6" rx="1" fill="currentColor" opacity="0.85" />
    </>
  ),
  'Agotamiento III': (
    <>
      <rect x="3" y="9" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="3" y="9" width="18" height="6" rx="1" fill="currentColor" opacity="0.85" />
    </>
  ),
}

// ── WaxSeal component ─────────────────────────────────────────────────────────

interface WaxSealProps {
  condition: string
  canRemove?: boolean
  onRemove?: () => void
}

export function WaxSeal({ condition, canRemove, onRemove }: WaxSealProps) {
  const icon = ICON[condition]
  if (!icon) return null

  return (
    <div className="relative group flex-shrink-0" style={{ width: 80, height: 80 }}>
      {/* PNG de cera real — transparencia en los bordes */}
      <img
        src="/assets/images/wax seal (1).png"
        alt=""
        aria-hidden
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
      />

      {/* Ícono embossed centrado en el disco interior del sello */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingTop: 2,  // leve ajuste hacia el centro óptico del disco
      }}>
        <svg
          viewBox="0 2 24 24"
          width={22}
          height={22}
          style={{ color: ICON_COLOR, filter: ICON_FILTER, flexShrink: 0 }}
        >
          {icon}
        </svg>
      </div>

      {/* Tooltip + botón quitar combinados */}
      <div
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute"
        style={{
          bottom: '108%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(18,10,4,0.96)',
          color: '#f0dfc0',
          fontSize: 10,
          fontFamily: 'Georgia, serif',
          whiteSpace: 'nowrap',
          border: '1px solid rgba(120,80,30,0.5)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: canRemove ? 'auto' : 'none',
        }}
      >
        <span style={{ padding: '2px 6px 2px 8px' }}>{condition}</span>
        {canRemove && (
          <button
            onClick={onRemove}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderLeft: '1px solid rgba(120,80,30,0.4)',
              color: 'rgba(240,220,190,0.75)',
              fontSize: 9,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '2px 6px',
              lineHeight: 1,
              fontFamily: 'Georgia, serif',
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
