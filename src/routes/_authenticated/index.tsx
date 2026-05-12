import { createFileRoute } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
})

function Dashboard() {
  const { session } = Route.useRouteContext() as { session: Session }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-amber-200">The Tavern</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            Sign out
          </button>
        </div>
        <p className="text-stone-400">Welcome, {session.user.email}</p>
      </div>
    </div>
  )
}
