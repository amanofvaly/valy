import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { RoutePending } from "../components/route-pending"
import { accountQuery } from "../data/session"
import { AccountScreen } from "../screens/session-screens"

export const Route = createFileRoute("/$countryCode/account/addresses")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery()),
  pendingComponent: RoutePending,
  head: () => ({ meta: [{ title: "Addresses · Valy" }, { name: "description", content: "View your addresses" }] }),
  component: AccountRoute,
})

function AccountRoute() {
  const { data } = useSuspenseQuery(accountQuery())
  return <AccountScreen {...data} page="addresses" countryCode={Route.useParams().countryCode} />
}
