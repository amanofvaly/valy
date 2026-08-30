import "server-only"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

/**
 * Which payment providers this region offers.
 *
 * Was `cache: "force-cache"`. Enabling or disabling a provider in admin has to
 * take effect on the next checkout, not whenever a cache entry happens to be
 * evicted.
 */
export const listCartPaymentMethods = cache(
  async (
    regionId: string
  ): Promise<HttpTypes.StorePaymentProvider[] | null> =>
    sdk.client
      .fetch<HttpTypes.StorePaymentProviderListResponse>(
        `/store/payment-providers`,
        {
          method: "GET",
          query: { region_id: regionId },
          headers: { ...(await getAuthHeaders()) },
          cache: "no-store",
        }
      )
      .then(({ payment_providers }) =>
        payment_providers.sort((a, b) => (a.id > b.id ? 1 : -1))
      )
      .catch(() => null)
)
