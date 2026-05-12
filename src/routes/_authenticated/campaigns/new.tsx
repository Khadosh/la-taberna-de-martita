import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export const Route = createFileRoute('/_authenticated/campaigns/new')({
  component: NewCampaign,
})

function NewCampaign() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = Route.useRouteContext() as { session: Session }
  const [error, setError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      setError(null)
      const { error } = await supabase
        .from('campaigns')
        .insert({ name: value.name.trim(), dm_id: session.user.id })
      if (error) {
        setError(error.message)
        return
      }
      await queryClient.invalidateQueries({ queryKey: ['campaigns', 'gm'] })
      navigate({ to: '/' })
    },
  })

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <h1 className="text-2xl font-bold text-amber-200">Nueva campaña</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <input
                type="text"
                placeholder="Nombre de la campaña"
                autoFocus
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-stone-800 text-stone-100 border border-stone-700 focus:outline-none focus:border-amber-500"
              />
            )}
          </form.Field>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="flex-1 py-2 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800 transition-colors text-sm"
            >
              Cancelar
            </button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-sm"
                >
                  {isSubmitting ? '...' : 'Crear'}
                </button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  )
}
