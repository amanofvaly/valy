"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import {
  canShowBackendMessage,
  messageForReason,
  reasonFromCode,
  ShippingAvailability,
} from "@lib/util/shipping-availability"
import { getAuthHeaders } from "./cookies"

/**
 * Which delivery options this cart can actually use.
 *
 * Deliberately uncached. The answer depends on the cart's contents, its
 * delivery address and the merchant's current settings, and nothing revalidates
 * the "fulfillment" tag when any of those change — so a cached copy kept
 * offering an option the backend had already withdrawn, which then disappeared
 * on the next render.
 */
export const listCartShippingMethods = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
        },
        headers,
        cache: "no-store",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
}

/**
 * Price one calculated shipping option.
 *
 * Returns an availability verdict rather than `null` on failure: when the
 * backend refuses to price an option it says *why* (unknown address, outside
 * the delivery area, carrier down, not set up yet), and the customer deserves
 * to see that instead of a silently disabled row.
 *
 * The JS SDK's FetchError keeps only the message, dropping the `code` field, so
 * this reads the response body directly.
 */
export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
): Promise<{ id: string; availability: ShippingAvailability }> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((await getAuthHeaders()) as Record<string, string>),
  }

  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (publishableKey) {
    headers["x-publishable-api-key"] = publishableKey
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  try {
    const res = await fetch(
      `${backendUrl}/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ cart_id: cartId, ...(data ? { data } : {}) }),
        cache: "no-store",
      }
    )

    const body = await res.json().catch(() => ({}) as Record<string, unknown>)

    if (!res.ok) {
      const reason = reasonFromCode(body?.code as string | undefined)
      return {
        id: optionId,
        availability: {
          available: false,
          reason,
          // Only reasons written for shoppers get the backend's own wording.
          // Configuration gaps name admin screens and settings, so they always
          // fall back to generic customer copy.
          message:
            body?.message && canShowBackendMessage(reason)
              ? String(body.message)
              : messageForReason(reason),
        },
      }
    }

    const option = (
      body as
        | {
            shipping_option?: {
              amount?: unknown
              calculated_price?: {
                courier_name?: unknown
                estimated_delivery_days?: unknown
              }
            }
          }
        | undefined
    )?.shipping_option

    const amount = option?.amount

    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return {
        id: optionId,
        availability: {
          available: false,
          reason: "not_available",
          message: messageForReason("not_available"),
        },
      }
    }

    // The orchestrator returns these alongside the price so the customer can
    // see what the difference between tiers actually buys them.
    const courier = option?.calculated_price?.courier_name
    const days = option?.calculated_price?.estimated_delivery_days

    return {
      id: optionId,
      availability: {
        available: true,
        amount,
        courierName: typeof courier === "string" ? courier : undefined,
        estimatedDays: typeof days === "number" ? days : undefined,
      },
    }
  } catch {
    return {
      id: optionId,
      availability: {
        available: false,
        reason: "temporarily_unavailable",
        message: messageForReason("temporarily_unavailable"),
      },
    }
  }
}
