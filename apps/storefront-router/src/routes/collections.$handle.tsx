import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { DEFAULT_COUNTRY } from "../../app/lib/market"
import { BrowsePending } from "../components/route-pending"
import { browseQuery, collectionQuery } from "../data/catalogue"
import { CollectionScreen } from "../screens/catalogue-screens"

export const Route = createFileRoute("/collections/$handle")({
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
  loader: async ({ context, params, deps }) => {
    const countryCode = DEFAULT_COUNTRY
    const record = await context.queryClient.ensureQueryData(
      collectionQuery({ countryCode, handle: params.handle, page: 1 })
    )
    if (!record) throw notFound()
    await context.queryClient.ensureQueryData(
      browseQuery({ countryCode, ...deps, collectionId: record.collection.id })
    )
    return record
  },
  pendingComponent: BrowsePending,
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.collection?.title || "Collection"} · Valy` },
  ] }),
  component: BrowseRoute,
})

function BrowseRoute() {
  const params = Route.useParams()
  const search = Route.useSearch()
  const countryCode = DEFAULT_COUNTRY
  const record = useSuspenseQuery(collectionQuery({ countryCode, handle: params.handle, page: 1 })).data
  if (!record) throw notFound()
  const { data } = useSuspenseQuery(browseQuery({
    countryCode,
    page: search.page ?? 1,
    sortBy: search.sortBy,
    optionValueIds: search.optionValueIds,
    collectionId: record.collection.id,
  }))
  return (
    <CollectionScreen
      collection={record.collection}
      data={data}
      countryCode={countryCode}
      sortBy={search.sortBy}
      page={search.page ? String(search.page) : undefined}
      optionValueIds={search.optionValueIds}
    />
  )
}
