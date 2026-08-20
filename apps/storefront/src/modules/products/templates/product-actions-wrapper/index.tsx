import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Price and availability, read live on every request.
 *
 * The page around this is prerendered and may be minutes old, which is fine for
 * a title or a photo. It is not fine for a price: a stale one looks entirely
 * normal and is only caught when the checkout total disagrees with the page.
 * So this fetch skips the cache, and the surrounding Suspense boundary keeps
 * the rest of the page instant while it runs.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
    live: true,
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  return <ProductActions product={product} region={region} />
}
