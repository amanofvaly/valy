import { convertToLocale } from "@lib/util/money"
import { formatDeliveryEstimate } from "@lib/util/shipping-availability"
import { HttpTypes } from "@medusajs/types"

/**
 * Where it is going and how.
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
      <h2 id="delivery-details" className="mb-3 text-lg font-semibold text-ink">
        Delivery
      </h2>

      <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
        <div
          className="flex flex-col gap-0.5"
          data-testid="shipping-address-summary"
        >
          <dt className="text-xs font-medium text-ink">Address</dt>
          <dd className="text-muted">
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
            {order.shipping_address?.city}{" "}
            {order.shipping_address?.postal_code}
            <br />
            {order.shipping_address?.country_code?.toUpperCase()}
          </dd>
        </div>

        <div
          className="flex flex-col gap-0.5"
          data-testid="shipping-contact-summary"
        >
          <dt className="text-xs font-medium text-ink">Contact</dt>
          <dd className="text-muted">
            {order.shipping_address?.phone}
            <br />
            {order.email}
          </dd>
        </div>

        <div
          className="flex flex-col gap-0.5"
          data-testid="shipping-method-summary"
        >
          <dt className="text-xs font-medium text-ink">Method</dt>
          <dd className="text-muted">
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
          </dd>
        </div>
      </dl>
    </section>
  )
}

export default ShippingDetails
