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
        /*
         * `*addresses` as well as `*orders`.
         *
         * `fields` replaces the default selection rather than adding to it, so
         * asking for orders alone meant the customer came back without an
         * address book. Everything that reads `customer.addresses` — the
         * account overview's count, the default-billing lookup, and checkout's
         * offer to reuse a saved address — saw an empty list for a customer
         * who had several, and checkout put a blank form in front of someone
         * whose address it already held.
         */
        query: { fields: "*orders,*addresses" },
        headers: authHeaders,
        cache: "no-store",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }
)
