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
