import { ABILITY_LABELS } from '../../lib/dnd-api'

const STAT_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

export function fmtMod(m: number) { return m >= 0 ? `+${m}` : String(m) }

function statBodyRgb(val: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (val - 6) / 14))
  return [
    Math.round(78 + t * 26),
    Math.round(61 + t * 20),
    Math.round(16 + t * 16),
  ]
}

function modBadgeColors(mod: number): { bg: string; text: string } {
  if (mod >= 4) return { bg: 'rgb(10,52,14)', text: 'rgb(138,222,145)' }
  if (mod >= 3) return { bg: 'rgb(16,60,20)', text: 'rgb(148,226,154)' }
  if (mod >= 2) return { bg: 'rgb(22,68,24)', text: 'rgb(155,230,160)' }
  if (mod >= 1) return { bg: 'rgb(30,74,26)', text: 'rgb(162,234,152)' }
  if (mod === 0) return { bg: 'rgb(54,48,14)', text: 'rgb(215,205,145)' }
  if (mod >= -1) return { bg: 'rgb(82,38,10)', text: 'rgb(232,175,130)' }
  if (mod >= -2) return { bg: 'rgb(86,20,14)', text: 'rgb(235,150,128)' }
  return { bg: 'rgb(66,12,10)', text: 'rgb(225,138,120)' }
}

interface StatGridProps {
  stats: Record<string, number>
  profBonus: number
  savingThrows?: { index: string }[]
}

export function StatGrid({ stats, profBonus, savingThrows }: StatGridProps) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3" style={{ overflow: 'visible' }}>
      {STAT_KEYS.map(k => {
        const val = stats[k] ?? 10
        const mod = Math.floor((val - 10) / 2)
        const hasSave = savingThrows?.some(st => st.index === k)
        const displayMod = mod + (hasSave ? profBonus : 0)
        const [r, g, b] = statBodyRgb(val)
        const badge = modBadgeColors(displayMod)
        const hi = `rgb(${r + 26},${g + 19},${b + 7})`
        const mid = `rgb(${r + 10},${g + 7},${b + 2})`
        const base = `rgb(${r},${g},${b})`
        const drk = `rgb(${r - 14},${g - 10},${b - 4})`
        const bdr = `rgb(${r - 28},${g - 20},${b - 7})`
        const rivetHi = `rgb(${r + 55},${g + 42},${b + 16})`
        return (
          <div
            key={k}
            className="relative select-none flex flex-col items-center"
            style={{
              borderRadius: 7,
              background: `linear-gradient(225deg, ${hi} 0%, ${mid} 35%, ${base} 65%, ${drk} 100%)`,
              border: `2px solid ${bdr}`,
              boxShadow: `
                inset 0 0 0 1px rgba(240,205,110,0.22),
                0 6px 16px rgba(0,0,0,0.75),
                0 3px 6px rgba(0,0,0,0.5),
                0 1px 2px rgba(0,0,0,0.6)
              `,
              padding: '7px 5px 7px',
              transform: 'translateY(-1px)',
            }}
          >
            {([{ top: 3, left: 3 }, { top: 3, right: 3 }, { bottom: 3, left: 3 }, { bottom: 3, right: 3 }] as React.CSSProperties[]).map((pos, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 5, height: 5,
                borderRadius: '50%',
                background: `radial-gradient(circle at 36% 30%, ${rivetHi} 0%, ${mid} 50%, ${bdr} 100%)`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,220,100,0.25)',
                ...pos,
              }} />
            ))}
            <p style={{
              fontSize: 9, letterSpacing: '0.15em', fontFamily: 'Georgia, serif',
              color: `rgb(${r + 62},${g + 48},${b + 20})`, textTransform: 'uppercase',
              textShadow: '0 1px 2px rgba(0,0,0,0.75)', marginBottom: 1,
            }}>
              {ABILITY_LABELS[k]}
            </p>
            <p style={{
              fontSize: 28, fontWeight: 700, fontFamily: 'Georgia, serif',
              color: '#ecd9aa', lineHeight: 1.1,
              textShadow: '0 3px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.85)',
              margin: '1px 0 6px',
            }}>
              {val}
            </p>
            <div className="w-[80%] text-center rounded-4 border border-black/65 py-0.5 mb-[-15px] rounded"
              style={{
                background: badge.bg,
                boxShadow: `
                  inset 0 0 0 1px rgba(255,220,130,0.1),
                  0 3px 7px rgba(0,0,0,0.75),
                  0 1px 2px rgba(0,0,0,0.55)
                `,
              }}>
              <span style={{
                fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                color: badge.text, textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                letterSpacing: '0.04em', lineHeight: hasSave ? 1.2 : undefined,
              }}>
                {fmtMod(displayMod)}{hasSave && `★`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
