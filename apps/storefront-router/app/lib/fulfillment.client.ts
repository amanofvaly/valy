import {
  canShowBackendMessage,
  messageForReason,
  reasonFromCode,
  type ShippingAvailability,
} from "@lib/util/shipping-availability"

/*
 * Browser-side twin of `@lib/data/fulfillment`.
 *
 * The reason mapping is the legacy one, unchanged — only the transport moves.
 * The request goes to our own `/api/cart` route so the publishable key and the
 * cart cookie stay on the server, and the route passes the backend's `code`
 * straight through so the shopper still gets the specific wording.
 */
export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
): Promise<{ id: string; availability: ShippingAvailability }> => {
  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        operation: "calculate-shipping",
        optionId,
        cartId,
        ...(data ? { data } : {}),
      }),
    })
    const body = (await response.json().catch(() => ({}))) as Record<string, any>

    if (!response.ok) {
      const reason = reasonFromCode(body?.code as string | undefined)
      return {
        id: optionId,
        availability: {
          available: false,
          reason,
          message:
            body?.message && canShowBackendMessage(reason)
              ? String(body.message)
              : messageForReason(reason),
        },
      }
    }

    const option = body?.shippingOption
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
