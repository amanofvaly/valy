import { QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { routeTree } from "./routeTree.gen"
import { RoutePending } from "./components/route-pending"
import { registerRefresh } from "../app/lib/client-refresh"

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPendingMs: 0,
    defaultPendingMinMs: 250,
    defaultPendingComponent: RoutePending,
    defaultPreload: "intent",
    scrollRestoration: true,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })
  registerRefresh(queryClient, () => router.invalidate())
  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
