import "server-only"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

/**
 * Customer reads. Sign-in, sign-up and profile writes live in
 * `customer-actions.ts`.
 *
 * This was `cache: "force-cache"` — one shopper's name, email, order history
 * and address book held in a shared cache keyed by a tag no webhook could name.
 */

export const retrieveCustomer = cache(
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!("authorization" in authHeaders)) {
      return null
    }

    return sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: { fields: "*orders" },
        headers: authHeaders,
        cache: "no-store",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }
)
