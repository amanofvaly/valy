import { convertToLocale } from "@lib/util/money"
import { formatDeliveryEstimate } from "@lib/util/shipping-availability"
import { HttpTypes } from "@medusajs/types"

/**
 * Where it is going and how.
 *
 * Written out rather than labelled. An address needs no field called "Address"
 * above it, and a phone number is recognisably a phone number — the labels were
 * naming the obvious, and one of them, "Method", collided with the identically
 * named field under payment.
 *
 * The carrier and estimate are read from `shipping_methods.data` — the promise
 * that was accepted at checkout — rather than being recomputed from today's
 * rates, which could quote something different from what the customer agreed to.
 */
const ShippingDetails = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const method = order.shipping_methods?.at(-1)
  const methodData = method?.data as
    | { courier_name?: string; estimated_delivery_days?: number }
    | null

  const promise = [
    formatDeliveryEstimate(methodData?.estimated_delivery_days),
    methodData?.courier_name,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <section aria-labelledby="delivery-details">
      <h2
        id="delivery-details"
        className="mb-3 text-base font-semibold text-ink"
      >
        Delivery
      </h2>

      <address className="text-sm not-italic leading-6 text-muted">
        <span data-testid="shipping-address-summary">
          {order.shipping_address?.first_name}{" "}
          {order.shipping_address?.last_name}
          <br />
          {order.shipping_address?.address_1}
          {order.shipping_address?.address_2 && (
            <>
              <br />
              {order.shipping_address.address_2}
            </>
          )}
          <br />
          {order.shipping_address?.city} {order.shipping_address?.postal_code}
          <br />
          {order.shipping_address?.country_code?.toUpperCase()}
        </span>

        {/*
         * The phone and not the email: the email is stated once, at the top of
         * the confirmation, and printing it again here was the page telling the
         * customer their own address twice.
         */}
        {order.shipping_address?.phone && (
          <>
            <br />
            <span data-testid="shipping-contact-summary">
              {order.shipping_address.phone}
            </span>
          </>
        )}
      </address>

      <p
        className="mt-3 text-sm leading-6 text-muted"
        data-testid="shipping-method-summary"
      >
        {method?.name}{" "}
        <span className="font-mono tabular">
          {convertToLocale({
            amount: method?.total ?? 0,
            currency_code: order.currency_code,
          })}
        </span>
        {promise && (
          <>
            <br />
            <span data-testid="delivery-option-detail">{promise}</span>
          </>
        )}
      </p>
    </section>
  )
}

export default ShippingDetails
