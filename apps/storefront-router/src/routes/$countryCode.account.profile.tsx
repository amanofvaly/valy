import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { RoutePending } from "../components/route-pending"
import { accountQuery } from "../data/session"
import { AccountScreen } from "../screens/session-screens"

export const Route = createFileRoute("/$countryCode/account/profile")({
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery()),
  pendingComponent: RoutePending,
  head: () => ({ meta: [{ title: "Profile · Valy" }, { name: "description", content: "View and edit your Valy Homelabs profile." }] }),
  component: AccountRoute,
})

function AccountRoute() {
  const { data } = useSuspenseQuery(accountQuery())
  return <AccountScreen {...data} page="profile" countryCode={Route.useParams().countryCode} />
}
