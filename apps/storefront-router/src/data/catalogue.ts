import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import type { HttpTypes } from "@medusajs/types"
import { getBrowseData } from "../../app/lib/browse.server"
import { getCategory, getCollection, getFlowPrice, getProduct, getProductExtras, getRegion, listCategories, listCollections, listProducts, listRegions } from "../../app/lib/medusa.server"

type StoreInput = {
  countryCode: string
  page: number
}

export type StoreData = {
  products: HttpTypes.StoreProduct[]
  count: number
  region: HttpTypes.StoreRegion | null
}

const fetchStore = createServerFn({ method: "GET" })
  .validator((data: StoreInput) => data)
  .handler(async ({ data }) => {
    const query = new URLSearchParams({
      limit: "12",
      offset: String((data.page - 1) * 12),
      order: "-created_at",
    })
    const result = await listProducts(data.countryCode, query)
    return JSON.parse(JSON.stringify(result)) as any
  })

export const storeQuery = (input: StoreInput) => queryOptions({
  queryKey: ["store", input.countryCode, input.page],
  queryFn: () => fetchStore({ data: input }) as Promise<StoreData>,
})

type ProductInput = {
  countryCode: string
  handle: string
}

const fetchProduct = createServerFn({ method: "GET" })
  .validator((data: ProductInput) => data)
  .handler(async ({ data }) => {
    const result = await getProduct(data.countryCode, data.handle)
    return JSON.parse(JSON.stringify(result)) as any
  })

export const productQuery = (input: ProductInput) => queryOptions({
  queryKey: ["product", input.countryCode, input.handle],
  queryFn: () => fetchProduct({ data: input }) as Promise<{
    product: HttpTypes.StoreProduct | null
    region: HttpTypes.StoreRegion | null
  }>,
})

type ListingInput = StoreInput & { handle: string }

const fetchCategory = createServerFn({ method: "GET" })
  .validator((data: ListingInput) => data)
  .handler(async ({ data }) => {
    const category = await getCategory(data.handle)
    if (!category) return null
    const query = new URLSearchParams({
      limit: "12",
      offset: String((data.page - 1) * 12),
      category_id: category.id,
    })
    const products = await listProducts(data.countryCode, query)
    return JSON.parse(JSON.stringify({ category, ...products })) as any
  })

export const categoryQuery = (input: ListingInput) => queryOptions({
  queryKey: ["category", input.countryCode, input.handle, input.page],
  queryFn: () => fetchCategory({ data: input }) as Promise<null | StoreData & {
    category: HttpTypes.StoreProductCategory
  }>,
})

const fetchCollection = createServerFn({ method: "GET" })
  .validator((data: ListingInput) => data)
  .handler(async ({ data }) => {
    const collection = await getCollection(data.handle)
    if (!collection) return null
    const query = new URLSearchParams({
      limit: "12",
      offset: String((data.page - 1) * 12),
      collection_id: collection.id,
    })
    const products = await listProducts(data.countryCode, query)
    return JSON.parse(JSON.stringify({ collection, ...products })) as any
  })

export const collectionQuery = (input: ListingInput) => queryOptions({
  queryKey: ["collection", input.countryCode, input.handle, input.page],
  queryFn: () => fetchCollection({ data: input }) as Promise<null | StoreData & {
    collection: HttpTypes.StoreCollection
  }>,
})

const fetchMarket = createServerFn({ method: "GET" })
  .validator((countryCode: string) => countryCode)
  .handler(async ({ data }) => Boolean(await getRegion(data)))

export const marketQuery = (countryCode: string) => queryOptions({
  queryKey: ["market", countryCode],
  queryFn: () => fetchMarket({ data: countryCode }),
  staleTime: 5 * 60_000,
})

const fetchShell = createServerFn({ method: "GET" }).handler(async () => {
  const [categories, collections, regions] = await Promise.all([
    listCategories(),
    listCollections(),
    listRegions(),
  ])
  return JSON.parse(JSON.stringify({ categories, collections, regions })) as any
})

export const shellQuery = () => queryOptions({
  queryKey: ["storefront", "shell"],
  queryFn: () => fetchShell() as Promise<{
    categories: HttpTypes.StoreProductCategory[]
    collections: HttpTypes.StoreCollection[]
    regions: HttpTypes.StoreRegion[]
  }>,
  staleTime: 5 * 60_000,
})

const fetchFlowPrice = createServerFn({ method: "GET" })
  .validator((countryCode: string) => countryCode)
  .handler(async ({ data }) => getFlowPrice(data))

export const flowPriceQuery = (countryCode: string) => queryOptions({
  queryKey: ["flow-price", countryCode],
  queryFn: () => fetchFlowPrice({ data: countryCode }),
  staleTime: 5 * 60_000,
})

export type ProductExtras = Awaited<ReturnType<typeof getProductExtras>>

const fetchProductExtras = createServerFn({ method: "GET" })
  .validator((data: ProductInput) => data)
  .handler(async ({ data }) => {
    const result = await getProductExtras(data.countryCode, data.handle)
    return JSON.parse(JSON.stringify(result)) as any
  })

export const productExtrasQuery = (input: ProductInput) => queryOptions({
  queryKey: ["product-extras", input.countryCode, input.handle],
  queryFn: () => fetchProductExtras({ data: input }) as Promise<ProductExtras>,
  staleTime: 60_000,
})


/*
 * A browse page's data, read with the old store's own catalogue code.
 *
 * `listProductsWithSort`, `listStoreFacets` and `listCategories` are the
 * legacy modules unchanged — reusing them is what keeps sorting, faceting,
 * filtering and the browsable-category scoping identical to the old store
 * rather than reimplemented here.
 */
export type BrowseInput = {
  countryCode: string
  page: number
  sortBy?: string
  optionValueIds?: string[]
  categoryId?: string
  collectionId?: string
}

const fetchBrowse = createServerFn({ method: "GET" })
  .validator((data: BrowseInput) => data)
  .handler(async ({ data }) =>
    JSON.parse(JSON.stringify(await getBrowseData(data))) as any
  )

export const browseQuery = (input: BrowseInput) => queryOptions({
  queryKey: ["browse", input],
  queryFn: () => fetchBrowse({ data: input }) as Promise<{
    products: HttpTypes.StoreProduct[]
    count: number
    facets: any[]
    categories: HttpTypes.StoreProductCategory[]
  }>,
})
