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
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword(value)
        if (error) {
          setError(error.message)
        } else {
          navigate({ to: '/' })
        }
      } else {
        const { data, error } = await supabase.auth.signUp(value)
        if (error) {
          setError(error.message)
        } else if (data.session) {
          navigate({ to: '/' })
        } else {
          setEmailSent(true)
        }
      }
    },
  })

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-full max-w-sm space-y-4 p-8 text-center">
          <h1 className="text-3xl font-bold text-amber-200">The Tavern</h1>
          <p className="text-stone-300">Check your email for a confirmation link to complete your registration.</p>
          <button
            onClick={() => { setEmailSent(false); setMode('login') }}
            className="text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-3xl font-bold text-center text-amber-200">The Tavern</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          <form.Field name="email">
            {(field) => (
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-stone-800 text-stone-100 border border-stone-700 focus:outline-none focus:border-amber-500"
              />
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <input
                type="password"
                placeholder="Password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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
                {isSubmitting
                  ? '...'
                  : mode === 'login' ? 'Enter the Tavern' : 'Create Account'}
              </button>
            )}
          </form.Subscribe>
        </form>
        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null) }}
          className="w-full text-sm text-center text-stone-400 hover:text-stone-200 transition-colors"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
