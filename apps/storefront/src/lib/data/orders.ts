import "server-only"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

/**
 * Order reads. Transfer requests live in `order-actions.ts`.
 *
 * Both of these were `cache: "force-cache"` — one customer's order history in a
 * shared cache. `React.cache` deduplicates them inside a single request, which
 * is what stops the order confirmation page fetching the same order for its
 * metadata and again for its body.
 */

/**
 * `+items.is_tax_inclusive` for the same reason the cart requests it: the order
 * confirmation runs the same totals helpers, and without that field it would
 * show a net subtotal above gross line items on the one page a customer keeps.
 */
const ORDER_FIELDS =
  "*payment_collections.payments,*items,*items.metadata,+items.is_tax_inclusive,*items.variant,*items.product,*items.product.type,*shipping_methods"

export const retrieveOrder = cache(
  async (id: string): Promise<HttpTypes.StoreOrder> =>
    sdk.client
      .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
        method: "GET",
        query: { fields: ORDER_FIELDS },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      })
      .then(({ order }) => order)
      .catch((err) => medusaError(err))
)

export const listOrders = cache(
  async (
    limit: number = 10,
    offset: number = 0,
    filters?: Record<string, unknown>
  ): Promise<HttpTypes.StoreOrder[]> =>
    sdk.client
      .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
        method: "GET",
        query: {
          limit,
          offset,
          order: "-created_at",
          fields:
          "*items,+items.metadata,+items.is_tax_inclusive,*items.variant,*items.product",
          ...filters,
        },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      })
      .then(({ orders }) => orders)
      .catch((err) => medusaError(err))
)
