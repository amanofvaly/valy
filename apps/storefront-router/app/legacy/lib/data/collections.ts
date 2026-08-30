import "server-only"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

/**
 * Collections, read live and deduplicated within a request.
 *
 * Collections are the curated sets — "Starting out", "Plex builds" — that cut
 * across the category tree. A Medusa product belongs to exactly one, which is
 * why the lineup itself is the Machines category rather than a collection.
 */

export const retrieveCollection = cache(
  async (id: string): Promise<HttpTypes.StoreCollection | null> =>
    sdk.client
      .fetch<{ collection: HttpTypes.StoreCollection }>(
        `/store/collections/${id}`,
        { cache: "no-store" }
      )
      .then(({ collection }) => collection)
      .catch(() => null)
)

/**
 * Keyed on a string, not on the options object. `React.cache` matches calls by
 * argument identity, so a caller passing `{ limit: "100" }` inline would miss
 * the cache on every render and re-fetch.
 */
const listCollectionsCached = cache(
  async (
    queryJson: string
  ): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> =>
    sdk.client
      .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
        "/store/collections",
        {
          query: {
            limit: "100",
            offset: "0",
            ...(JSON.parse(queryJson) as Record<string, string>),
          },
          cache: "no-store",
        }
      )
      .then(({ collections, count }) => ({
        collections,
        count: count ?? collections.length,
      }))
      .catch(() => ({ collections: [], count: 0 }))
)

export const listCollections = (queryParams: Record<string, string> = {}) =>
  listCollectionsCached(JSON.stringify(queryParams))

export const getCollectionByHandle = cache(
  async (handle: string): Promise<HttpTypes.StoreCollection | null> =>
    sdk.client
      .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
        query: { handle },
        cache: "no-store",
      })
      .then(({ collections }) => collections[0] ?? null)
      .catch(() => null)
)
