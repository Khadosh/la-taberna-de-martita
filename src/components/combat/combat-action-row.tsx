interface CombatActionRowProps {
  isExternalActive: boolean
  hit: boolean | null
  setHit: (v: boolean) => void
  damageInput: string
  setDamageInput: (v: string) => void
  calcResult: any
  onConfirm: () => void
}

export function CombatActionRow({
  isExternalActive,
  hit,
  setHit,
  damageInput,
  setDamageInput,
  calcResult,
  onConfirm,
}: CombatActionRowProps) {
  if (isExternalActive) {
    return (
      <div style={{
        textAlign: 'center', fontSize: 11, color: '#d5b88a', fontStyle: 'italic',
        padding: '8px 0', border: '1px dashed #3c2414', borderRadius: 4, background: 'rgba(0,0,0,0.2)',
      }}>
        ⏳ Esperando resolución del atacante...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      {calcResult.isHealing ? (
        <button
          onClick={() => setHit(true)}
          style={{
            flex: 1, height: 36, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
            background: 'linear-gradient(180deg, #15803d 0%, #166534 100%)',
            border: '2px solid #22c55e', color: '#fcd34d',
            boxShadow: '0 0 12px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          💚 Cura
        </button>
      ) : (
        <>
          <button
            onClick={() => setHit(true)}
            style={{
              flex: 1, height: 36, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
              opacity: hit === false ? 0.4 : 1,
              ...(hit === true
                ? {
                    background: 'linear-gradient(180deg, #3d6a45 0%, #1c3521 100%)',
                    border: '2px solid #528c5c', color: '#fcd34d',
                    boxShadow: '0 0 12px rgba(74,222,128,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4)',
                  }
                : { background: 'linear-gradient(180deg, #27272a 0%, #09090b 100%)', border: '1px solid #3c2414', color: '#d5b88a' })
            }}
          >
            ✔ Acierto
          </button>
          <button
            onClick={() => setHit(false)}
            style={{
              flex: 1, height: 36, fontSize: 13, fontWeight: 'bold', cursor: 'pointer', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', outline: 'none',
              opacity: hit === true ? 0.4 : 1,
              ...(hit === false
                ? {
                    background: 'linear-gradient(180deg, #881337 0%, #4c0519 100%)',
                    border: '2px solid #f43f5e', color: '#fda4af',
                    boxShadow: '0 0 12px rgba(244,63,94,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -3px 0 rgba(0,0,0,0.4)',
                  }
                : { background: 'linear-gradient(180deg, #27272a 0%, #09090b 100%)', border: '1px solid #3c2414', color: '#d5b88a' })
            }}
          >
            ✕ Fallo
          </button>
        </>
      )}

      {(hit !== null || calcResult.isHealing) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 145 }}>
          <input
            type="number"
            placeholder={calcResult.isHealing ? 'Cura' : 'Daño'}
            value={damageInput}
            onChange={e => setDamageInput(e.target.value)}
            className="no-spinners"
            style={{
              width: 62, height: 34, background: '#0a0502', border: '1px solid #5a3c1e', borderRadius: 4,
              color: calcResult.isHealing ? '#86efac' : '#fca5a5',
              textAlign: 'center', fontSize: 14, fontFamily: 'monospace', outline: 'none',
            }}
          />
          <button
            onClick={onConfirm}
            style={{
              flex: 1, height: 34,
              background: 'linear-gradient(180deg, #8a6b3e 0%, #5c4322 100%)',
              border: '1px solid #d5b88a', color: '#f5f5f4', fontSize: 11, fontWeight: 'bold', borderRadius: 4,
              cursor: 'pointer', transition: 'all 0.15s', textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
