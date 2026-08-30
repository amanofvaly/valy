import { notFound as tanstackNotFound, redirect as tanstackRedirect, useLocation, useNavigate, useParams as useRouterParams, useRouter } from "@tanstack/react-router"
import { countryFromPath } from "~/lib/market"

export function useParams() {
  const params = useRouterParams({ strict: false })
  const pathname = useLocation().pathname
  return { ...params, countryCode: "countryCode" in params ? params.countryCode : countryFromPath(pathname) }
}
export const usePathname = () => useLocation().pathname
export const useSearchParams = () => new URLSearchParams(useLocation().searchStr)
export function useNextRouter() {
  const navigate = useNavigate()
  const router = useRouter()
  return {
    push: (to: string) => navigate({ to }),
    replace: (to: string) => navigate({ to, replace: true }),
    back: () => router.history.back(),
    forward: () => router.history.forward(),
    refresh: () => router.invalidate(),
    prefetch: (to: string) => router.preloadRoute({ to }),
  }
}
export { useNextRouter as useRouter }
export const notFound = () => { throw tanstackNotFound() }
export const redirect = (to: string) => { throw tanstackRedirect({ to }) }
