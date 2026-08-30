import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { RoutePending } from "../components/route-pending"
import { accountQuery } from "../data/session"
import { AccountScreen } from "../screens/session-screens"
import { DEFAULT_COUNTRY } from "../../app/lib/market"

export const Route = createFileRoute("/account/orders")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery()),
  pendingComponent: RoutePending,
  head: () => ({ meta: [{ title: "Orders · Valy" }, { name: "description", content: "Overview of your previous orders." }] }),
  component: AccountRoute,
})

function AccountRoute() {
  const { data } = useSuspenseQuery(accountQuery())
  return <AccountScreen {...data} page="orders" countryCode={DEFAULT_COUNTRY} />
}
