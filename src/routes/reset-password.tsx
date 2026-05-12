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
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-full max-w-sm space-y-4 p-8 text-center">
          <h1 className="text-3xl font-bold text-amber-200">The Tavern</h1>
          <p className="text-stone-300">Contraseña actualizada.</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
          >
            Ir al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-3xl font-bold text-center text-amber-200">Nueva contraseña</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          <form.Field name="password">
            {(field) => (
              <input
                type="password"
                placeholder="Nueva contraseña"
                autoComplete="new-password"
                autoFocus
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-stone-800 text-stone-100 border border-stone-700 focus:outline-none focus:border-amber-500"
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
                className="w-full px-4 py-2 rounded-lg bg-stone-800 text-stone-100 border border-stone-700 focus:outline-none focus:border-amber-500"
              />
            )}
          </form.Field>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? '...' : 'Guardar contraseña'}
              </button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
