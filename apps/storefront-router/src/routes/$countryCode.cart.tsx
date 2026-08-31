import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { CartPending } from "../components/route-pending"
import { cartQuery } from "../data/session"
import { CartScreen } from "../screens/session-screens"

export const Route = createFileRoute("/$countryCode/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
  pendingComponent: CartPending,
  component: () => <CartScreen {...useSuspenseQuery(cartQuery()).data} />,
})
