import { notFound as tanstackNotFound, redirect as tanstackRedirect, useLocation, useNavigate, useParams as useRouterParams, useRouter } from "@tanstack/react-router"
import { useMemo } from "react"
import { countryFromPath } from "~/lib/market"

/*
 * Next's navigation hooks hand back the same object on every render, and code
 * written against them puts that object in effect dependency arrays. Rebuilding
 * it here on each render made those effects run every render instead of once:
 * the checkout address step, whose effect calls `router.refresh()`, re-rendered
 * itself into an infinite loop that froze the tab. Every value below is memoised
 * on what it is actually derived from.
 */

export function useParams() {
  const params = useRouterParams({ strict: false })
  const pathname = useLocation().pathname
  return useMemo(
    () => ({ ...params, countryCode: "countryCode" in params ? params.countryCode : countryFromPath(pathname) }),
    [params, pathname]
  )
}
export const usePathname = () => useLocation().pathname
export function useSearchParams() {
  const searchStr = useLocation().searchStr
  return useMemo(() => new URLSearchParams(searchStr), [searchStr])
}
export function useNextRouter() {
  const navigate = useNavigate()
  const router = useRouter()
  return useMemo(
    () => ({
      push: (to: string) => navigate({ to }),
      replace: (to: string) => navigate({ to, replace: true }),
      back: () => router.history.back(),
      forward: () => router.history.forward(),
      refresh: () => router.invalidate(),
      prefetch: (to: string) => router.preloadRoute({ to }),
    }),
    [navigate, router]
  )
}
export { useNextRouter as useRouter }
export const notFound = () => { throw tanstackNotFound() }
export const redirect = (to: string) => { throw tanstackRedirect({ to }) }
