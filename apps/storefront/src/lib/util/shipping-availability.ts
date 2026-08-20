import { HttpTypes } from "@medusajs/types"

/**
 * Why a delivery option cannot be picked.
 *
 * These mirror the reason codes the shipping orchestrator raises on the
 * backend. The distinction the customer actually cares about is whether *they*
 * can do something about it (enter an address) or not (we do not deliver
 * there / something is temporarily wrong on our side).
 */
export type UnavailableReason =
  | "address_incomplete"
  | "not_serviceable"
  | "blocked"
  | "temporarily_unavailable"
  | "not_available"

export type ShippingAvailability =
  | {
      available: true
      amount: number
      /** Carrier carrying the parcel, already white-labelled by the backend. */
      courierName?: string
      /** Only present when the carrier actually gave an estimate. */
      estimatedDays?: number
    }
  | { available: false; reason: UnavailableReason; message: string }

/**
 * "3 days" / "in 1 day" — phrased for a shopper rather than a data field.
 * Returns undefined when there is no estimate, so callers render nothing
 * instead of an empty promise.
 */
export const formatDeliveryEstimate = (days?: number): string | undefined => {
  if (typeof days !== "number" || !Number.isFinite(days) || days <= 0) {
    return undefined
  }
  return days === 1 ? "Arrives in about 1 day" : `Arrives in about ${days} days`
}

/** Backend reason code -> storefront reason. */
export const reasonFromCode = (code?: string): UnavailableReason => {
  switch (code) {
    case "shipping_address_incomplete":
      return "address_incomplete"
    case "shipping_not_serviceable":
      return "not_serviceable"
    case "shipping_blocked":
      return "blocked"
    case "shipping_provider_error":
      return "temporarily_unavailable"
    // A merchant-side configuration gap is not the customer's problem to
    // understand, so it reads as a plain "not available" to them. The admin
    // health check is where the real explanation lives.
    case "shipping_not_configured":
      return "not_available"
    default:
      return "not_available"
  }
}

const DEFAULT_MESSAGES: Record<UnavailableReason, string> = {
  address_incomplete: "Enter your delivery address to see this option.",
  not_serviceable: "Not available for your delivery address.",
  blocked: "Not available for one or more items in your cart.",
  temporarily_unavailable: "Temporarily unavailable. Please try again shortly.",
  not_available: "Currently unavailable.",
}

export const messageForReason = (reason: UnavailableReason): string =>
  DEFAULT_MESSAGES[reason]

/**
 * Whether the backend's own wording is fit to show a customer.
 *
 * Reasons about the customer's own situation (unknown address, outside the
 * delivery area, a rule blocking their items) are written for them and are more
 * specific than anything generic. `not_available` is the bucket for merchant
 * configuration gaps and unclassified failures, where the backend text talks
 * about admin screens and settings — never show that to a shopper.
 */
export const canShowBackendMessage = (reason: UnavailableReason): boolean =>
  reason !== "not_available"

type OptionLike = HttpTypes.StoreCartShippingOption & {
  provider?: { is_enabled?: boolean }
}

/**
 * Decide whether one option can be offered.
 *
 * `calculatedPrices` holds the result of the per-option calculate call for
 * `price_type: "calculated"` options; flat-rate options carry their amount
 * inline. A flat option whose region has no price comes back with `amount`
 * undefined — rendering that unguarded is what produced a `NaN` price next to a
 * clickable radio that then failed with "do not have a price".
 */
export const getShippingAvailability = (
  option: OptionLike,
  calculatedPrices: Record<string, ShippingAvailability>
): ShippingAvailability => {
  // An option whose fulfillment provider is no longer registered can never be
  // fulfilled, whatever price it claims to have.
  if (option.provider && option.provider.is_enabled === false) {
    return {
      available: false,
      reason: "not_available",
      message: messageForReason("not_available"),
    }
  }

  if (option.price_type === "calculated") {
    return (
      calculatedPrices[option.id] ?? {
        available: false,
        reason: "not_available",
        message: messageForReason("not_available"),
      }
    )
  }

  const amount = option.amount
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return {
      available: false,
      reason: "not_available",
      message: messageForReason("not_available"),
    }
  }

  return { available: true, amount }
}
