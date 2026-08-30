import "server-only"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { getAuthHeaders, getCartId } from "./cookies"

/**
 * Cart reads.
 *
 * Mutations live in `cart-actions.ts`. They were in this file under a
 * `"use server"` directive, which made every read below a public POST endpoint
 * as a side effect of the writes needing to be form actions.
 *
 * Nothing here is cached across requests. A cart is per-shopper mutable state
 * that the backend also rewrites on its own — re-pricing shipping, dropping a
 * method whose option no longer applies — none of which a storefront cache tag
 * would ever hear about.
 */

/**
 * `+shipping_methods.data` carries the carrier and delivery estimate recorded
 * when the option was chosen. Without it the saved delivery step can only show
 * the method's name and price, losing the promise the customer accepted.
 */
/**
 * `+items.is_tax_inclusive` is requested explicitly rather than relied on
 * arriving with `*items`. Every totals decision in `lib/util/cart-totals.ts`
 * hangs off that one boolean: without it the cart is read as tax-exclusive and
 * the summary quietly prints net figures beside gross line items — the numbers
 * still look plausible, which is what makes it a bad failure.
 */
const CART_FIELDS =
  "*items, *region, *items.product, *items.product.type, *items.variant, *items.thumbnail, *items.metadata, +items.total, +items.is_tax_inclusive, *promotions, +shipping_methods.name, +shipping_methods.data"

export const retrieveCart = cache(
  async (
    cartId?: string,
    fields: string = CART_FIELDS
  ): Promise<HttpTypes.StoreCart | null> => {
    const id = cartId || (await getCartId())

    if (!id) {
      return null
    }

    return sdk.client
      .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
        method: "GET",
        query: { fields },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      })
      .then(({ cart }) => cart)
      .catch(() => null)
  }
)

/**
 * Shipping options for the current cart.
 *
 * This was `cache: "force-cache"` — per-shopper delivery availability held in a
 * shared cache, which is the exact data that must never be cached.
 */
export const listCartOptions = cache(
  async (): Promise<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }> => {
    const cartId = await getCartId()

    if (!cartId) {
      return { shipping_options: [] }
    }

    return sdk.client
      .fetch<{ shipping_options: HttpTypes.StoreCartShippingOption[] }>(
        "/store/shipping-options",
        {
          query: { cart_id: cartId },
          headers: { ...(await getAuthHeaders()) },
          cache: "no-store",
        }
      )
      .catch(() => ({ shipping_options: [] }))
  }
)
