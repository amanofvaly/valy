import type { QueryClient } from "@tanstack/react-query"

/*
 * Re-reading the cart after it changes.
 *
 * Under Next these mutations were server actions ending in `revalidateTag`,
 * which is what redrew the page. Nothing replaced that here, so the write
 * landed in Medusa and the screen kept showing the old cart. The router and
 * query client are registered once at startup and used to invalidate.
 */
let queryClient: QueryClient | null = null
let invalidateRouter: (() => Promise<void> | void) | null = null

export function registerRefresh(client: QueryClient, invalidate: () => Promise<void> | void) {
  queryClient = client
  invalidateRouter = invalidate
}

export async function refreshSession() {
  await queryClient?.invalidateQueries({ queryKey: ["session"] })
  await invalidateRouter?.()
}
