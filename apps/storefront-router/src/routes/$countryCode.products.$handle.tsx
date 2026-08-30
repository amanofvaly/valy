import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { absoluteUrl } from "../../app/lib/market"
import { RoutePending } from "../components/route-pending"
import { productQuery, productExtrasQuery } from "../data/catalogue"
import { ProductScreen } from "../screens/catalogue-screens"

export const Route = createFileRoute("/$countryCode/products/$handle")({
  validateSearch: (search: Record<string, unknown>) => ({ v_id: typeof search.v_id === "string" ? search.v_id : undefined }),
  loader: async ({ context, params }) => {
    void context.queryClient.prefetchQuery(productExtrasQuery({ countryCode: params.countryCode.toLowerCase(), handle: params.handle }))
    const data = await context.queryClient.ensureQueryData(productQuery(params))
    if (!data.product || !data.region) throw notFound()
    return data
  },
  pendingComponent: RoutePending,
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
      links: [{ rel: "canonical", href: absoluteUrl(`/${params.countryCode}/products/${params.handle}`) }],
    }
  },
  component: MarketProduct,
})

function MarketProduct() {
  const params = Route.useParams()
  const { v_id } = Route.useSearch()
  const { data } = useSuspenseQuery(productQuery(params))
  if (!data.product || !data.region) throw notFound()
  return <ProductScreen product={data.product} region={data.region} countryCode={params.countryCode} variantId={v_id} />
}
