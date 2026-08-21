import "server-only"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

/**
 * Regions, read live.
 *
 * A module-level `Map` used to hold these for the life of the process with
 * nothing able to invalidate it, so a region edited in admin stayed wrong until
 * the instance recycled. `React.cache` replaces it: identical calls collapse to
 * one fetch *within a single request* — which is what stops the layout, the
 * page and `generateMetadata` each asking separately — and nothing at all
 * survives between requests, so every visitor reads current data.
 */

export const listRegions = cache(
  async (): Promise<HttpTypes.StoreRegion[]> =>
    sdk.client
      .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
        method: "GET",
        cache: "no-store",
      })
      .then(({ regions }) => regions)
      .catch(() => [])
)

export const retrieveRegion = cache(
  async (id: string): Promise<HttpTypes.StoreRegion | null> =>
    sdk.client
      .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
        method: "GET",
        cache: "no-store",
      })
      .then(({ region }) => region)
      .catch(() => null)
)

export const getRegion = cache(
  async (countryCode: string): Promise<HttpTypes.StoreRegion | null> => {
    const regions = await listRegions()

    if (!regions.length) {
      return null
    }

    const wanted = countryCode?.toLowerCase()

    const match = regions.find((region) =>
      region.countries?.some((c) => c?.iso_2?.toLowerCase() === wanted)
    )

    return match ?? null
  }
)
