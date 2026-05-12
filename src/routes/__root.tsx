import { Outlet, createRootRouteWithContext, useRouter } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect } from 'react'
import type { RouterContext } from '../router'
import { supabase } from '../lib/supabase'

import '../styles.css'

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return { session }
  },
  component: RootComponent,
})

function RootComponent() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate()
    })
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <>
      <Outlet />
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
      />
      <ReactQueryDevtools />
    </>
  )
}
