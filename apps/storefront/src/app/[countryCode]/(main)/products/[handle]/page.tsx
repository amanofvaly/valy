import { getProductByHandle } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import ProductTemplate from "@modules/products/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"

/**
 * A product page.
 *
 * `getProductByHandle` is wrapped in `React.cache`, so the fetch below happens
 * once per page view rather than twice. This route used to cost two identical
 * round trips — roughly 200ms of production latency — because `generateMetadata`
 * and the page body each fetched the product separately.
 */

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

/**
 * The variant-scoped image mechanism. A configured machine shows the machine
 * that was configured, not a generic one — which matters more, not less, now
 * that the configurator is the centre of the machine template.
 */
function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId)

  if (!variant?.images?.length) {
    return product.images
  }

  const variantImageIds = new Set(variant.images.map((i) => i.id))

  return product.images?.filter((i) => variantImageIds.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { handle, countryCode } = await props.params
  const product = await getProductByHandle(handle, countryCode)

  if (!product) {
    notFound()
  }

  const description =
    product.subtitle ||
    product.description?.split("\n")[0] ||
    `${product.title} from Valy.`

  return {
    title: product.title,
    description,
    alternates: { canonical: `/products/${handle}` },
    openGraph: {
      title: product.title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const [{ handle, countryCode }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])

  // Unrelated to each other, so they go out together.
  const [product, region] = await Promise.all([
    getProductByHandle(handle, countryCode),
    getRegion(countryCode),
  ])

  if (!product || !region) {
    notFound()
  }

  return (
    <ProductTemplate
      product={product}
      region={region}
      countryCode={countryCode}
      images={getImagesForVariant(product, searchParams.v_id) ?? []}
    />
  )
}
