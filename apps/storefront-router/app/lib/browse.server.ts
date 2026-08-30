import { listCategories, listBrowsableCategoryIds } from "@lib/data/categories"
import { listProductsWithSort, listStoreFacets } from "@lib/data/products"

/*
 * A browse page's data, read with the old store's own catalogue code.
 *
 * Reusing `listProductsWithSort`, `listStoreFacets` and `listCategories`
 * unchanged is what keeps sorting, faceting, filtering and the
 * browsable-category scoping identical to the old store. This module is
 * server-only — it is imported statically so the server-function transform
 * strips it from the client bundle.
 */
export async function getBrowseData(input: {
  countryCode: string
  page: number
  sortBy?: string
  optionValueIds?: string[]
  categoryId?: string
  collectionId?: string
}) {
  const queryParams: Record<string, unknown> = { limit: 12 }
  if (input.collectionId) queryParams.collection_id = [input.collectionId]
  if (input.categoryId) queryParams.category_id = [input.categoryId]
  if (!input.collectionId && !input.categoryId) {
    queryParams.category_id = await listBrowsableCategoryIds()
  }

  const [result, facets, categories] = await Promise.all([
    listProductsWithSort({
      page: input.page,
      queryParams: queryParams as never,
      sortBy: (input.sortBy || "created_at") as never,
      countryCode: input.countryCode,
      optionValueIds: input.optionValueIds as never,
    }),
    listStoreFacets().catch(() => [] as any[]),
    listCategories({ limit: 200 }).catch(() => [] as any[]),
  ])

  return {
    products: result.response.products,
    count: result.response.count,
    facets,
    categories,
  }
}
