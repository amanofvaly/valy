import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { RoutePending } from "../components/route-pending"
import { checkoutQuery } from "../data/session"
import { CheckoutScreen } from "../screens/session-screens"

export const Route = createFileRoute("/$countryCode/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({ step: typeof search.step === "string" ? search.step : undefined }),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(checkoutQuery())
    if (!data) throw notFound()
    return data
  },
  pendingComponent: RoutePending,
  component: MarketCheckout,
})

function MarketCheckout() {
  const { data } = useSuspenseQuery(checkoutQuery())
  if (!data) throw notFound()
  return <CheckoutScreen data={data} activeStep={Route.useSearch().step} />
}
