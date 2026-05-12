import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
  session: Session | null
}

export function getRouter(queryClient: QueryClient) {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: { queryClient, session: null },
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
