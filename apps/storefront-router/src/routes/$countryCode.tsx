import { Outlet, createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { DEFAULT_COUNTRY } from "../../app/lib/market"
import { RoutePending } from "../components/route-pending"
import { marketQuery } from "../data/catalogue"

export const Route = createFileRoute("/$countryCode")({
  beforeLoad: async ({ context, params, location }) => {
    const countryCode = params.countryCode.toLowerCase()
    if (!/^[a-z]{2}$/.test(countryCode)) throw notFound()
    if (countryCode === DEFAULT_COUNTRY) {
      const pathname = location.pathname.replace(new RegExp(`^/${DEFAULT_COUNTRY}(?=/|$)`), "") || "/"
      throw redirect({ to: `${pathname}${location.searchStr}`, statusCode: 308 })
    }
    const enabled = await context.queryClient.ensureQueryData(marketQuery(countryCode))
    if (!enabled) throw notFound()
    return { countryCode }
  },
  pendingComponent: RoutePending,
  component: Outlet,
})
