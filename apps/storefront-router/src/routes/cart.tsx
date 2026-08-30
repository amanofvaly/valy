import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { RoutePending } from "../components/route-pending"
import { cartQuery } from "../data/session"
import { CartScreen } from "../screens/session-screens"

export const Route = createFileRoute("/cart")({
  loader: ({ context }) => context.queryClient.ensureQueryData(cartQuery()),
  pendingComponent: RoutePending,
  head: () => ({ meta: [{ title: "Cart · Valy" }, { name: "description", content: "View your cart" }] }),
  component: CartRoute,
})

function CartRoute() {
  const { data } = useSuspenseQuery(cartQuery())
  return <CartScreen {...data} />
}
