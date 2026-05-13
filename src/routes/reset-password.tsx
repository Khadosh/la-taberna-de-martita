import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const form = useForm({
    defaultValues: { password: '', confirm: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      if (value.password !== value.confirm) {
        setError('Las contraseñas no coinciden.')
        return
      }
      const { error } = await supabase.auth.updateUser({ password: value.password })
      if (error) {
        setError(error.message)
      } else {
        setDone(true)
      }
    },
  })

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tavern-fire px-4">
        <div style={cardStyle} className="w-full max-w-sm">
          <div className="border border-amber-900/60 p-px">
            <div className="border border-amber-900/30">
              <div className="px-8 py-10 space-y-6 text-center">
                <div className="space-y-1">
                  <div className="text-3xl mb-3 leading-none">🔥</div>
                  <h1 className="font-display text-amber-200 leading-tight" style={{ fontSize: '1.6rem', letterSpacing: '0.05em' }}>
                    La Taberna
                  </h1>
                  <p className="font-display text-amber-500/90 text-xs tracking-[0.35em] uppercase">de Martita</p>
                </div>
                <div className="flex items-center gap-3 text-amber-600/60">
                  <div className="flex-1 h-px bg-amber-700/40" />
                  <span className="text-xs">✦</span>
                  <div className="flex-1 h-px bg-amber-700/40" />
                </div>
                <p className="text-stone-400 text-sm font-serif">Contraseña actualizada, viajero.</p>
                <button
                  onClick={() => navigate({ to: '/' })}
                  style={btnStyle}
                  className="w-full py-2.5 font-display text-sm tracking-wider transition-all"
                >
                  Entrar a la taberna
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tavern-fire px-4">
      <div style={cardStyle} className="w-full max-w-sm">
        <div className="border border-amber-900/60 p-px">
          <div className="border border-amber-900/30">
            <div className="px-8 py-10 space-y-7">

              <div className="text-center space-y-1">
                <div className="text-3xl mb-3 leading-none">🔥</div>
                <h1 className="font-display text-amber-200 leading-tight" style={{ fontSize: '1.6rem', letterSpacing: '0.05em' }}>
                  La Taberna
                </h1>
                <p className="font-display text-amber-500/90 text-xs tracking-[0.35em] uppercase">de Martita</p>
                <p className="text-stone-600 text-xs font-serif italic pt-1">Elegí una nueva contraseña</p>
              </div>

              <div className="flex items-center gap-3 text-amber-600/60">
                <div className="flex-1 h-px bg-amber-700/40" />
                <span className="text-xs">✦</span>
                <div className="flex-1 h-px bg-amber-700/40" />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-3">
                <form.Field name="password">
                  {(field) => (
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      autoComplete="new-password"
                      autoFocus
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      style={inputStyle}
                      className="w-full px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 font-serif focus:outline-none transition-colors"
                    />
                  )}
                </form.Field>
                <form.Field name="confirm">
                  {(field) => (
                    <input
                      type="password"
                      placeholder="Confirmá la contraseña"
                      autoComplete="new-password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      style={inputStyle}
                      className="w-full px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 font-serif focus:outline-none transition-colors"
                    />
                  )}
                </form.Field>
                {error && (
                  <p className="text-red-400/90 text-xs font-serif text-center border border-red-900/40 px-3 py-1.5 bg-red-950/30">
                    {error}
                  </p>
                )}
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={btnStyle}
                      className="w-full py-2.5 font-display text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? '...' : 'Guardar contraseña'}
                    </button>
                  )}
                </form.Subscribe>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(170deg, #180e06 0%, #0f0804 100%)',
  boxShadow: '0 0 60px rgba(160,70,10,0.12), 0 0 20px rgba(160,70,10,0.06), 0 24px 80px rgba(0,0,0,0.7)',
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(120,70,20,0.4)',
  borderRadius: '2px',
}

const btnStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #9B4A10 0%, #7B3408 100%)',
  color: '#f5d9a8',
  border: '1px solid #6B2C06',
  borderRadius: '2px',
  letterSpacing: '0.1em',
}
