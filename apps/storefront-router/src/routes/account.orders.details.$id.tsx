import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { PageShell } from "../../app/components/page-shell"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { RoutePending } from "../components/route-pending"
import { orderQuery } from "../data/session"
import { orderNumber } from "../../app/legacy/lib/util/order-number"

export const Route = createFileRoute("/account/orders/details/$id")({
  loader: async ({ context, params }) => {
    const order = await context.queryClient.ensureQueryData(orderQuery(params.id))
    if (!order) throw notFound()
    return order
  },
  pendingComponent: RoutePending,
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `Order #${orderNumber(loaderData)} · Valy` : "Order · Valy" },
    { name: "description", content: "View your order" },
  ] }),
  component: OrderDetailsRoute,
})

function OrderDetailsRoute() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(orderQuery(id))
  if (!data) throw notFound()
  return <PageShell><OrderDetailsTemplate order={data} /></PageShell>
}
