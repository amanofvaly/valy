import { MedusaError } from "@medusajs/framework/utils"

/**
 * Machine-readable reasons a shipping option can be unavailable.
 *
 * The distinction that matters to the storefront and the admin dashboard is
 * *missing* vs *broken*:
 *
 *  - `NOT_CONFIGURED`  the merchant has not finished setup. Recoverable by an
 *                      admin, and the admin health check tells them how.
 *  - `ADDRESS_INCOMPLETE` we simply do not know enough about the buyer yet.
 *  - `NOT_SERVICEABLE` setup is fine, this destination/tier just is not covered.
 *  - `BLOCKED`         a merchant rule deliberately refuses this destination.
 *  - `PROVIDER_ERROR`  the upstream carrier API failed. Transient / broken.
 *
 * These land on the HTTP response as `code`, so the storefront can render an
 * honest reason instead of a dead radio button or a `NaN` price.
 */
export const ShippingErrorCode = {
  NOT_CONFIGURED: "shipping_not_configured",
  ADDRESS_INCOMPLETE: "shipping_address_incomplete",
  NOT_SERVICEABLE: "shipping_not_serviceable",
  BLOCKED: "shipping_blocked",
  PROVIDER_ERROR: "shipping_provider_error",
} as const

export type ShippingErrorCodeValue =
  (typeof ShippingErrorCode)[keyof typeof ShippingErrorCode]

const ALL_CODES: string[] = Object.values(ShippingErrorCode)

export class ShippingUnavailableError extends MedusaError {
  constructor(
    code: ShippingErrorCodeValue,
    message: string,
    type: string = MedusaError.Types.NOT_ALLOWED
  ) {
    super(type, message, code)
  }
}

/** True when the error already carries one of our reason codes. */
export const isShippingUnavailableError = (e: unknown): boolean =>
  !!e && ALL_CODES.includes((e as { code?: string }).code ?? "")

export const notConfigured = (message: string) =>
  new ShippingUnavailableError(ShippingErrorCode.NOT_CONFIGURED, message)

export const addressIncomplete = (message: string) =>
  new ShippingUnavailableError(ShippingErrorCode.ADDRESS_INCOMPLETE, message)

export const notServiceable = (message: string) =>
  new ShippingUnavailableError(ShippingErrorCode.NOT_SERVICEABLE, message)

export const blocked = (message: string) =>
  new ShippingUnavailableError(ShippingErrorCode.BLOCKED, message)

export const providerError = (message: string) =>
  new ShippingUnavailableError(
    ShippingErrorCode.PROVIDER_ERROR,
    message,
    MedusaError.Types.UNEXPECTED_STATE
  )
