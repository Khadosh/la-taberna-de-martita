import { useState } from 'react'

type CoinKey = 'gold' | 'silver' | 'copper'

interface CurrencyPlatesProps {
  currency: { gold: number; silver: number; copper: number }
  isOwner: boolean
  patchCurrency: (patch: Partial<{ gold: number; silver: number; copper: number }>) => void
}

const COIN_CONFIG = [
  {
    key: 'gold' as CoinKey, label: 'MO',
    hi: '#e8c548', mid: '#c89e28', base: '#a87c14', drk: '#7a5808', bdr: '#5a4008',
    text: '#fde68a', rivetHi: '#fef9c3',
  },
  {
    key: 'silver' as CoinKey, label: 'MP',
    hi: '#dcdce8', mid: '#b8b8c4', base: '#94949e', drk: '#707078', bdr: '#505058',
    text: '#f0f0f8', rivetHi: '#ffffff',
  },
  {
    key: 'copper' as CoinKey, label: 'MC',
    hi: '#d8905a', mid: '#b87038', base: '#96501e', drk: '#743010', bdr: '#542008',
    text: '#fcd5b0', rivetHi: '#fee8d0',
  },
] as const

const RIVET_POSITIONS = [
  { top: 3, left: 3 },
  { top: 3, right: 3 },
  { bottom: 3, left: 3 },
  { bottom: 3, right: 3 },
] as const

export function CurrencyPlates({ currency, isOwner, patchCurrency }: CurrencyPlatesProps) {
  const [editingCoin, setEditingCoin] = useState<CoinKey | null>(null)
  const [coinInput, setCoinInput] = useState('')

  return (
    <div className="px-3 py-3 flex gap-2 shrink-0" style={{ background: 'rgba(5,2,0,0.45)', borderBottom: '1px solid rgba(0,0,0,0.5)' }}>
      {COIN_CONFIG.map(({ key, label, hi, mid, base, drk, bdr, text, rivetHi }) => (
        <div key={key}
          onClick={() => { if (isOwner) { setEditingCoin(key); setCoinInput('') } }}
          className="relative flex flex-col items-center justify-center select-none"
          style={{
            flex: 1,
            paddingTop: 10, paddingBottom: 8,
            borderRadius: 6,
            cursor: isOwner ? 'pointer' : 'default',
            background: `linear-gradient(150deg, ${hi} 0%, ${mid} 30%, ${base} 65%, ${drk} 100%)`,
            border: `1.5px solid ${bdr}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), inset 1px 0 0 rgba(255,255,255,0.14), inset 0 -2px 0 rgba(0,0,0,0.35), inset -1px 0 0 rgba(0,0,0,0.2), 0 3px 7px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)`,
          }}
        >
          {RIVET_POSITIONS.map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', width: 4, height: 4, borderRadius: '50%',
              background: `radial-gradient(circle at 36% 30%, ${rivetHi} 0%, ${mid} 55%, ${bdr} 100%)`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.7)',
              ...pos,
            }} />
          ))}

          {editingCoin === key ? (
            <input autoFocus
              className="bg-transparent outline-none text-center font-mono font-bold"
              style={{ width: 40, fontSize: 16, color: text, borderBottom: `1px solid ${text}` }}
              value={coinInput}
              onBlur={() => setEditingCoin(null)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  patchCurrency({ [key]: currency[key] + (parseInt(coinInput) || 0) })
                  setEditingCoin(null)
                }
              }}
              onChange={e => setCoinInput(e.target.value)}
            />
          ) : (
            <span className="font-bold font-mono leading-tight" style={{ fontSize: 18, color: text, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>
              {currency[key]} <span className="font-bold uppercase tracking-widest mt-0.5" style={{ fontSize: 8, color: text, opacity: 0.72 }}>{label}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
