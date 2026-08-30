import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { RoutePending } from "../components/route-pending"
import { orderQuery } from "../data/session"
import { OrderScreen } from "../screens/session-screens"

export const Route = createFileRoute("/$countryCode/order/$id/confirmed")({
  loader: async ({ context, params }) => {
    const order = await context.queryClient.ensureQueryData(orderQuery(params.id))
    if (!order) throw notFound()
    return order
  },
  pendingComponent: RoutePending,
  component: MarketOrder,
})

function MarketOrder() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(orderQuery(id))
  if (!data) throw notFound()
  return <OrderScreen order={data} />
}
