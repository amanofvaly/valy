import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { absoluteUrl, DEFAULT_COUNTRY } from "../../app/lib/market"
import { ProductPending } from "../components/route-pending"
import { productQuery, productExtrasQuery } from "../data/catalogue"
import { ProductScreen } from "../screens/catalogue-screens"

export const Route = createFileRoute("/products/$handle")({
  validateSearch: (search: Record<string, unknown>) => ({
    v_id: typeof search.v_id === "string" ? search.v_id : undefined,
  }),
  loader: async ({ context, params }) => {
    void context.queryClient.prefetchQuery(productExtrasQuery({ countryCode: DEFAULT_COUNTRY, handle: params.handle }))
    const data = await context.queryClient.ensureQueryData(productQuery({ countryCode: DEFAULT_COUNTRY, handle: params.handle }))
    if (!data.product || !data.region) throw notFound()
    return data
  },
  pendingComponent: ProductPending,
  head: ({ loaderData, params }) => {
    const product = loaderData?.product
    const description =
      product?.subtitle ||
      product?.description?.split("\n")[0] ||
      `${product?.title ?? "Product"} from Valy.`
    return {
      meta: [
        { title: `${product?.title || "Product"} · Valy` },
        { name: "description", content: description },
        { property: "og:title", content: product?.title || "Product" },
        { property: "og:description", content: description },
        ...(product?.thumbnail ? [{ property: "og:image", content: product.thumbnail }] : []),
      ],
      links: [{ rel: "canonical", href: absoluteUrl(`/products/${params.handle}`) }],
    }
  },
  component: ProductRoute,
})

function ProductRoute() {
  const { handle } = Route.useParams()
  const { v_id } = Route.useSearch()
  const { data } = useSuspenseQuery(productQuery({ countryCode: DEFAULT_COUNTRY, handle }))
  if (!data.product || !data.region) throw notFound()
  return <ProductScreen product={data.product} region={data.region} countryCode={DEFAULT_COUNTRY} variantId={v_id} />
}
