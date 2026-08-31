import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { DEFAULT_COUNTRY } from "../../app/lib/market"
import { BrowsePending } from "../components/route-pending"
import { browseQuery } from "../data/catalogue"
import { StoreScreen } from "../screens/catalogue-screens"

export const Route = createFileRoute("/store")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
    sortBy: typeof search.sortBy === "string" ? search.sortBy : undefined,
    optionValueIds: Array.isArray(search.optionValueIds)
      ? (search.optionValueIds as string[])
      : typeof search.optionValueIds === "string"
        ? [search.optionValueIds]
        : undefined,
  }),
  loaderDeps: ({ search }) => ({
    page: search.page ?? 1,
    sortBy: search.sortBy,
    optionValueIds: search.optionValueIds,
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(browseQuery({ countryCode: DEFAULT_COUNTRY, ...deps })),
  pendingComponent: BrowsePending,
  head: () => ({ meta: [
    { title: "All Products · Valy" },
    { name: "description", content: "Preconfigured servers, storage, cases, network parts, and a lot more to setup your homelab." },
  ] }),
  component: StoreRoute,
})

function StoreRoute() {
  const search = Route.useSearch()
  const countryCode = DEFAULT_COUNTRY
  const { data } = useSuspenseQuery(browseQuery({
    countryCode,
    page: search.page ?? 1,
    sortBy: search.sortBy,
    optionValueIds: search.optionValueIds,
  }))
  return (
    <StoreScreen
      data={data}
      countryCode={countryCode}
      sortBy={search.sortBy}
      page={search.page ? String(search.page) : undefined}
      optionValueIds={search.optionValueIds}
    />
  )
}
