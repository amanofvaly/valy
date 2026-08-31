import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { OrderPending } from "../components/route-pending"
import { orderQuery } from "../data/session"
import { OrderScreen } from "../screens/session-screens"

export const Route = createFileRoute("/order/$id/confirmed")({
  loader: async ({ context, params }) => {
    const order = await context.queryClient.ensureQueryData(orderQuery(params.id))
    if (!order) throw notFound()
    return order
  },
  pendingComponent: OrderPending,
  head: () => ({ meta: [{ title: "Order Confirmed · Valy" }, { name: "description", content: "You purchase was successful" }] }),
  component: OrderRoute,
})

function OrderRoute() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(orderQuery(id))
  if (!data) throw notFound()
  return <OrderScreen order={data} />
}
