import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { CheckoutPending } from "../components/route-pending"
import { checkoutQuery } from "../data/session"
import { CheckoutScreen } from "../screens/session-screens"

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({ step: typeof search.step === "string" ? search.step : undefined }),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(checkoutQuery())
    if (!data) throw notFound()
    return data
  },
  pendingComponent: CheckoutPending,
  head: () => ({ meta: [{ title: "Checkout · Valy" }] }),
  component: CheckoutRoute,
})

function CheckoutRoute() {
  const { data } = useSuspenseQuery(checkoutQuery())
  if (!data) throw notFound()
  return <CheckoutScreen data={data} activeStep={Route.useSearch().step} />
}
