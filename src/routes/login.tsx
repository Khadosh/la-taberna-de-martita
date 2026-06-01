import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword(value)
        if (error) { setError(error.message) } else { navigate({ to: '/' }) }
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp(value)
        if (error) { setError(error.message) }
        else if (data.session) { navigate({ to: '/' }) }
        else { setEmailSent(true) }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(value.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) { setError(error.message) } else { setEmailSent(true) }
      }
    },
  })

  const switchMode = (next: typeof mode) => { setMode(next); setError(null); setEmailSent(false) }

  const modeLabel = mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Enviar email'

  return (
    <div className="min-h-screen flex items-center justify-center bg-tavern-fire px-4" style={loginPageStyle}>
      {/* React 19 SEO Metadata Hoisting */}
      <title>
        {mode === 'login'
          ? 'Entrar a la Taberna | La Taberna de Martita'
          : mode === 'register'
          ? 'Registrarse | La Taberna de Martita'
          : 'Recuperar Cuenta | La Taberna de Martita'}
      </title>
      <meta name="description" content="Accedé a tus personajes, campañas y herramientas de combate en tiempo real para D&D 5e." />

      {/* Card */}
      <div className="w-full max-w-sm" style={cardStyle}>

        {/* Outer decorative border */}
        <div className="border border-amber-900/60 p-px">
          <div className="border border-amber-900/30">

            <div className="px-8 py-10 space-y-7">

              {/* Brand */}
              <div className="text-center space-y-1">
                <img src="/favicon.svg" alt="" className="w-12 h-12 mx-auto mb-1" />
                <h1 className="font-display text-amber-200 leading-tight" style={{ fontSize: '1.6rem', letterSpacing: '0.05em' }}>
                  La Taberna
                </h1>
                <p className="font-display text-amber-500/90 text-xs tracking-[0.35em] uppercase">
                  de Martita
                </p>
                <p className="text-stone-600 text-xs font-serif italic pt-1">
                  {emailSent
                    ? 'Revisá tu email, viajero'
                    : mode === 'forgot'
                    ? 'Recuperá tu acceso'
                    : 'Bienvenido, viajero'}
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 text-amber-600/60">
                <div className="flex-1 h-px bg-amber-700/40" />
                <span className="text-xs">✦</span>
                <div className="flex-1 h-px bg-amber-700/40" />
              </div>

              {/* Email sent state */}
              {emailSent ? (
                <div className="text-center space-y-4">
                  <p className="text-stone-400 text-sm font-serif">
                    {mode === 'forgot'
                      ? 'Te mandamos un link para recuperar tu contraseña.'
                      : 'Confirmá tu cuenta desde el email.'}
                  </p>
                  <button onClick={() => switchMode('login')} className={linkClass}>
                    ← Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <>
                  {/* Form */}
                  <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }} className="space-y-3">
                    <form.Field name="email">
                      {(field) => (
                        <input
                          type="email"
                          placeholder="Email"
                          autoComplete="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          style={inputStyle}
                          className="w-full px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 font-serif focus:outline-none transition-colors"
                        />
                      )}
                    </form.Field>

                    {mode !== 'forgot' && (
                      <form.Field name="password">
                        {(field) => (
                          <input
                            type="password"
                            placeholder="Contraseña"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            style={inputStyle}
                            className="w-full px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 font-serif focus:outline-none transition-colors"
                          />
                        )}
                      </form.Field>
                    )}

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
                          {isSubmitting ? '...' : modeLabel}
                        </button>
                      )}
                    </form.Subscribe>
                  </form>

                  {/* Mode switchers */}
                  <div className="space-y-2 text-center">
                    {mode === 'login' && (
                      <>
                        <button onClick={() => switchMode('register')} className={linkClass}>
                          ¿Sin cuenta? Registrate
                        </button>
                        <button onClick={() => switchMode('forgot')} className={`${linkClass} text-stone-600`}>
                          Olvidé mi contraseña
                        </button>
                      </>
                    )}
                    {mode !== 'login' && (
                      <button onClick={() => switchMode('login')} className={linkClass}>
                        ← Volver al inicio de sesión
                      </button>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const loginPageStyle: React.CSSProperties = {
  backgroundImage: 'linear-gradient(rgba(10, 5, 2, 0.78), rgba(10, 5, 2, 0.88)), url("/assets/images/login_bg.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}

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

const linkClass = 'block text-xs text-stone-500 hover:text-amber-500/80 transition-colors font-serif'
