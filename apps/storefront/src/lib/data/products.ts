import "server-only"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

/**
 * Catalogue reads.
 *
 * Uncached on purpose. Prices, stock and publication state come from the
 * database on the request that needs them — a price edited in admin is correct
 * on the next reload, with no redeploy and no purge. `React.cache` deduplicates
 * within one request only, which is what stops `generateMetadata` and the page
 * body fetching the same product twice for one page view.
 *
 * This file is `server-only` rather than `"use server"`. The directive it used
 * to carry turned every export below into a public POST endpoint anybody could
 * call; none of them are form actions.
 */

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,*options,*options.values,+metadata,*type,*tags,*collection,*categories,*images"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
}

export type ProductListResult = {
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<ProductListResult> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  const region = countryCode
    ? await getRegion(countryCode)
    : await retrieveRegion(regionId!)

  if (!region) {
    return { response: { products: [], count: 0 }, nextPage: null }
  }

  const headers = { ...(await getAuthHeaders()) }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region.id,
          fields: PRODUCT_FIELDS,
          ...queryParams,
        },
        headers,
        cache: "no-store",
      }
    )
    .then(({ products, count }) => ({
      response: { products, count },
      nextPage: count > offset + limit ? _pageParam + 1 : null,
      queryParams,
    }))
}

/**
 * One product by handle, deduplicated for the length of the request.
 *
 * The product route used to fetch this twice — once in `generateMetadata` and
 * once in the page body — which cost two round trips for one page view and
 * returned identical data both times.
 */
export const getProductByHandle = cache(
  async (
    handle: string,
    countryCode: string
  ): Promise<HttpTypes.StoreProduct | null> => {
    const region = await getRegion(countryCode)

    if (!region) {
      return null
    }

    return sdk.client
      .fetch<{ products: HttpTypes.StoreProduct[] }>(`/store/products`, {
        method: "GET",
        query: {
          handle,
          limit: 1,
          region_id: region.id,
          fields: PRODUCT_FIELDS,
        },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      })
      .then(({ products }) => products[0] ?? null)
      .catch(() => null)
  }
)

/** The batch size used when a sort has to happen in this process. */
const SORT_SCAN_PAGE = 100
/** Ceiling on that scan, so a catalogue of any size cannot hang a page. */
const SORT_SCAN_MAX = 500

/**
 * A page of products in a chosen order.
 *
 * `created_at` is ordered by the backend, so the count and the page are both
 * exact however large the catalogue grows.
 *
 * Price is not something the store API can order by — `calculated_price` is
 * computed per region at read time — so those two sorts still happen here. The
 * previous implementation fetched a single page of 100, sorted it, and returned
 * `products.length` as the total, which meant the pagination said "100" for a
 * catalogue of any size above that and silently hid everything past the first
 * hundred. It now pages through the matching set up to a stated ceiling and
 * reports the backend's own count, so the figure is right and the cut-off is a
 * decision rather than an accident.
 */
export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
}): Promise<ProductListResult> => {
  const limit = queryParams?.limit || 12
  const currentPage = Math.max(page, 1)

  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )
  const filters: ProductListQueryParams = {
    ...queryParams,
    ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
  }

  if (sortBy === "created_at") {
    return listProducts({
      pageParam: currentPage,
      queryParams: { ...filters, limit, order: "-created_at" },
      countryCode,
    })
  }

  // Price order: scan, sort, then slice the requested page out of the result.
  const collected: HttpTypes.StoreProduct[] = []
  let total = 0
  let scanned = 0

  while (scanned < SORT_SCAN_MAX) {
    const {
      response: { products, count },
    } = await listProducts({
      pageParam: Math.floor(scanned / SORT_SCAN_PAGE) + 1,
      queryParams: { ...filters, limit: SORT_SCAN_PAGE },
      countryCode,
    })

    total = count
    collected.push(...products)
    scanned += products.length

    if (products.length < SORT_SCAN_PAGE || scanned >= count) {
      break
    }
  }

  const sorted = sortProducts(collected, sortBy)
  const start = (currentPage - 1) * limit
  const paginated = sorted.slice(start, start + limit)

  // The count is the backend's, so pagination reflects the real catalogue even
  // where the scan ceiling stopped short of it.
  const reachable = Math.min(total, SORT_SCAN_MAX)

  return {
    response: { products: paginated, count: reachable },
    nextPage: start + limit < reachable ? currentPage + 1 : null,
    queryParams,
  }
}

/**
 * Products a shopper is likely to want next to this one: same category first,
 * then the same collection, never the product itself.
 */
/**
 * Takes the product object, so it is deliberately *not* wrapped in
 * `React.cache`: the cache matches on argument identity and a product object is
 * a fresh reference on every render, which would make every call a miss while
 * looking like a hit. It is called once per page, so there is nothing to
 * deduplicate.
 */
export const listRelatedProducts = (
  async (
    product: HttpTypes.StoreProduct,
    countryCode: string,
    limit = 4
  ): Promise<HttpTypes.StoreProduct[]> => {
    const categoryIds = (product.categories ?? []).map((c) => c.id)

    const query: ProductListQueryParams = { limit: limit + 1 }

    if (categoryIds.length) {
      query.category_id = categoryIds
    } else if (product.collection_id) {
      query.collection_id = [product.collection_id]
    } else {
      return []
    }

    const {
      response: { products },
    } = await listProducts({ queryParams: query, countryCode })

    return products.filter((p) => p.id !== product.id).slice(0, limit)
  }
)

/**
 * Every part whose `fits` metadata names this machine's handle.
 *
 * Medusa cannot filter on a metadata substring, so this reads the parts
 * catalogue and filters here. It is the same one request either way, and the
 * parts catalogue is small enough that the alternative — a metadata index in
 * the backend — would be machinery for a problem that does not exist yet.
 */
export const listCompatibleParts = cache(
  async (
    machineHandle: string,
    countryCode: string
  ): Promise<HttpTypes.StoreProduct[]> => {
    const {
      response: { products },
    } = await listProducts({
      queryParams: { limit: SORT_SCAN_PAGE },
      countryCode,
    })

    return products.filter((p) => {
      if (p.type?.value !== "part") {
        return false
      }
      const fits = p.metadata?.["fits"]
      return typeof fits === "string" && fits.split(",").some((h) => h.trim() === machineHandle)
    })
  }
)

/**
 * The catalogue's global facets.
 *
 * `is_exclusive=false` is doing real work here: it returns only options that
 * are shared across products — RAM, Capacity, Drive type — and leaves out the
 * per-machine Storage bundles, which belong in a configurator and would
 * otherwise fill the sidebar with "4 x 12TB" entries that match one product
 * each.
 *
 * Read on the server. The picker used to fetch this from the browser on mount,
 * so the filter rail arrived one round trip after the page it belongs to.
 */
export const listStoreFacets = cache(
  async (): Promise<HttpTypes.StoreProductOption[]> =>
    sdk.client
      .fetch<{ product_options?: HttpTypes.StoreProductOption[] }>(
        "/store/product-options",
        {
          method: "GET",
          query: { is_exclusive: false, fields: "*values" },
          cache: "no-store",
        }
      )
      .then((r) => r.product_options ?? [])
      .catch(() => [])
)

/**
 * Product types, so a caller can filter by "machine" / "part" / "service"
 * without hardcoding an id that differs between environments.
 */
export const listProductTypes = cache(
  async (): Promise<Record<string, string>> =>
    sdk.client
      .fetch<{ product_types?: { id: string; value: string }[] }>(
        "/store/product-types",
        { method: "GET", query: { limit: 50 }, cache: "no-store" }
      )
      .then((r) =>
        Object.fromEntries((r.product_types ?? []).map((t) => [t.value, t.id]))
      )
      .catch(() => ({}))
)

/**
 * Every product of one kind.
 *
 * Filtering in the query rather than fetching a page and filtering afterwards:
 * the services rail on a machine page was returning nothing because the first
 * twelve products happened to contain no services.
 */
export const listProductsOfType = cache(
  async (
    type: "machine" | "part" | "service",
    countryCode: string,
    limit = 12
  ): Promise<HttpTypes.StoreProduct[]> => {
    const typeIds = await listProductTypes()
    const typeId = typeIds[type]

    if (!typeId) {
      return []
    }

    const {
      response: { products },
    } = await listProducts({
      countryCode,
      queryParams: { limit, type_id: [typeId] } as never,
    })

    return products
  }
)

/**
 * The seven products a Valy Flow build is assembled from, keyed by handle.
 *
 * One request, not seven. The store list endpoint takes repeated `handle`
 * parameters, so the machine, its boot drive, memory, drives, network, graphics
 * and setup service all arrive together with their prices calculated for the
 * region — which is what the configurator needs to print a delta beside every
 * row without a round trip per stage.
 *
 * Cached on the country code, a primitive, so the page body and
 * `generateMetadata` share one fetch. A handle that is missing or unpublished
 * is simply absent from the map; the configurator renders the stages it has
 * data for rather than throwing, so one drafted component degrades a section
 * instead of taking the page down.
 */
export const listFlowProducts = cache(
  async (
    countryCode: string
  ): Promise<Record<string, HttpTypes.StoreProduct>> => {
    const region = await getRegion(countryCode)

    if (!region) {
      return {}
    }

    const handles = [
      "valy-flow",
      "flow-boot-media",
      "flow-memory",
      "flow-storage-drive",
      "flow-network",
      "flow-graphics",
      "flow-setup",
    ]

    const { products } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
    }>(`/store/products`, {
      method: "GET",
      query: {
        handle: handles,
        limit: handles.length,
        region_id: region.id,
        fields: PRODUCT_FIELDS,
      },
      headers: { ...(await getAuthHeaders()) },
      cache: "no-store",
    })

    return Object.fromEntries(
      products.filter((p) => p.handle).map((p) => [p.handle!, p])
    )
  }
)
