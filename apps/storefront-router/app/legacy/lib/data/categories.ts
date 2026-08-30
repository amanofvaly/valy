import "server-only"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

/**
 * Categories, read live and deduplicated within a request.
 *
 * This file carried neither `"use server"` nor `server-only` before, which made
 * it the one data module whose safety depended on nobody importing it into a
 * client component by accident.
 *
 * Every cached function here takes a **primitive** key. `React.cache` matches
 * calls by argument identity, not by value, so a function taking `string[]` or
 * an options object is never a cache hit: `generateMetadata` and the page body
 * each `await props.params` and get a different array instance, and the request
 * goes out twice for the same data. That is exactly the duplicate fetch this
 * overhaul is meant to remove, so the cached layer is keyed on strings and the
 * exported functions marshal into it.
 */

const listCategoriesCached = cache(
  async (
    queryJson: string
  ): Promise<HttpTypes.StoreProductCategory[]> =>
    sdk.client
      .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
        "/store/product-categories",
        {
          query: {
            fields:
              "*category_children,*parent_category,*parent_category.parent_category",
            limit: 100,
            ...(JSON.parse(queryJson) as Record<string, unknown>),
          },
          cache: "no-store",
        }
      )
      .then(({ product_categories }) => product_categories)
      .catch(() => [])
)

export const listCategories = (query?: Record<string, unknown>) =>
  listCategoriesCached(JSON.stringify(query ?? {}))

const getCategoryByHandleCached = cache(
  async (handle: string): Promise<HttpTypes.StoreProductCategory | null> =>
    sdk.client
      .fetch<HttpTypes.StoreProductCategoryListResponse>(
        `/store/product-categories`,
        {
          query: {
            fields: "*category_children,*parent_category",
            handle,
          },
          cache: "no-store",
        }
      )
      .then(({ product_categories }) => product_categories[0] ?? null)
      .catch(() => null)
)

export const getCategoryByHandle = (categoryHandle: string[]) =>
  getCategoryByHandleCached(categoryHandle.join("/"))

/**
 * Top-level categories with their immediate children, for the nav and footer.
 */
export const listNavCategories = cache(
  async (): Promise<HttpTypes.StoreProductCategory[]> => {
    const categories = await listCategories({ limit: 100 })
    return categories.filter((c) => !c.parent_category_id)
  }
)

/**
 * Every category id, for a browse surface that is not scoped to one.
 *
 * `/store` lists the whole catalogue, and "the whole catalogue" is not the same
 * thing as "every published product". The Flow configurator's components — the
 * unbranded drive, the memory, the setup service — have to stay published so
 * they can be added to a cart, but they belong to no category and have no
 * meaning outside a build. Scoping the query to categories excludes them with a
 * correct count and correct pagination, which post-filtering a page of results
 * cannot do: it leaves holes in some pages and drops products off the end.
 */
export const listBrowsableCategoryIds = cache(
  async (): Promise<string[]> => {
    const categories = await listCategories({ limit: 100 })
    return categories.map((c) => c.id)
  }
)
