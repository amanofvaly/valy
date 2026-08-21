"use client"

import {
  goodsTotal,
  hasDeliveryDetails,
  isTaxInclusiveCart,
  shippingTotal,
} from "@lib/util/cart-totals"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Divider } from "@modules/common/components/ui"

/**
 * The cart page summary.
 *
 * Deliberately not the checkout summary. Shipping and tax depend on a delivery
 * address and a chosen method, and this page has no way to collect either — so
 * when they are missing it says so, rather than printing ₹0.00 for facts it
 * does not have.
 *
 * When the customer already set them at checkout and came back, all the figures
 * are real, so the whole picture is shown — including the address that produced
 * the shipping charge, which is what makes the number explicable.
 *
 * Every figure here is gross, matching the line items above it, because a
 * tax-inclusive store's "subtotal" that quietly strips GST out of a ₹42,000
 * price is not a number anyone asked to see.
 */

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  }
  if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  }
  return "payment"
}

/** One-line destination, enough to recognise which address this is. */
function formatDestination(address?: HttpTypes.StoreCartAddress | null) {
  if (!address) {
    return ""
  }

  return [
    address.address_1,
    address.city,
    address.postal_code,
    address.country_code?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ")
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const currency_code = cart.currency_code

  const goods = goodsTotal(cart)
  const taxInclusive = isTaxInclusiveCart(cart)
  const knowsDelivery = hasDeliveryDetails(cart)

  // Gross discount when prices include tax, so the rows still reconcile to the
  // total. `discount_subtotal` is not on StoreCart's public type, hence the cast.
  const discount = taxInclusive
    ? (cart.discount_total ?? 0)
    : ((cart as { discount_subtotal?: number | null }).discount_subtotal ?? 0)

  const shippingMethod = cart.shipping_methods?.at(-1)
  const destination = formatDestination(cart.shipping_address)
  const itemCount = cart.items?.length ?? 0

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-line p-5">
      {knowsDelivery && (
        <div
          className="flex flex-col gap-1 rounded border border-line bg-surface p-3"
          data-testid="cart-delivery-summary"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ink">
              Continue where you left off
            </p>
            <LocalizedClientLink
              href="/checkout?step=delivery"
              className="shrink-0 text-sm text-accent hover:text-accent-strong"
              data-testid="edit-delivery-link"
            >
              Edit
            </LocalizedClientLink>
          </div>
          <p className="text-xs leading-5 text-muted">
            Delivering to {destination}
          </p>
          {shippingMethod?.name && (
            <p className="text-xs leading-5 text-muted">
              via {shippingMethod.name}
            </p>
          )}
        </div>
      )}

      <DiscountCode cart={cart} />
      <Divider />

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">
            Subtotal{" "}
            <span className="text-muted">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </dt>
          <dd
            className="font-mono tabular text-ink"
            data-testid="cart-subtotal"
            data-value={goods}
          >
            {convertToLocale({ amount: goods, currency_code })}
          </dd>
        </div>

        {!!discount && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Discount</dt>
            <dd
              className="font-mono tabular text-signal"
              data-testid="cart-discount"
              data-value={discount}
            >
              &minus; {convertToLocale({ amount: discount, currency_code })}
            </dd>
          </div>
        )}

        {knowsDelivery && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">
              Shipping
              {shippingMethod?.name && (
                <span className="text-muted"> · {shippingMethod.name}</span>
              )}
            </dt>
            <dd
              className="font-mono tabular text-ink"
              data-testid="cart-shipping"
              data-value={shippingTotal(cart)}
            >
              {convertToLocale({ amount: shippingTotal(cart), currency_code })}
            </dd>
          </div>
        )}
      </dl>

      {knowsDelivery ? (
        <>
          <Divider />
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-base font-medium text-ink">Total</span>
            <span
              className="font-mono text-xl font-medium tabular text-ink"
              data-testid="cart-total"
              data-value={cart.total ?? 0}
            >
              {convertToLocale({ amount: cart.total ?? 0, currency_code })}
            </span>
          </div>
          {taxInclusive && !!cart.tax_total && (
            <p className="-mt-3 text-right text-2xs text-muted">
              Inclusive of{" "}
              {convertToLocale({ amount: cart.tax_total, currency_code })} GST
            </p>
          )}
        </>
      ) : (
        // No address and no delivery method: shipping and tax are unknown, not
        // zero, and there is no honest total to show yet.
        <p
          className="rounded border border-line bg-surface px-3 py-2 text-xs leading-5 text-muted"
          data-testid="cart-totals-pending"
        >
          Shipping{taxInclusive ? "" : " and taxes"} calculated at checkout
          {taxInclusive && ". Prices include GST."}
        </p>
      )}

      <Button asChild size="large" block>
        <LocalizedClientLink
          href={`/checkout?step=${step}`}
          data-testid="checkout-button"
        >
          Go to checkout
        </LocalizedClientLink>
      </Button>
    </div>
  )
}

export default Summary
