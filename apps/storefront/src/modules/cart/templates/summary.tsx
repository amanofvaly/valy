"use client"

import { Button, Text } from "@modules/common/components/ui"

import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import {
  goodsTotal,
  hasDeliveryDetails,
  isTaxInclusiveCart,
  shippingTotal,
} from "@lib/util/cart-totals"
import { convertToLocale } from "@lib/util/money"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

/** One-line destination, enough to recognise which address this is. */
function formatDestination(address?: HttpTypes.StoreCartAddress | null) {
  if (!address) return ""

  return [
    address.address_1,
    address.city,
    address.postal_code,
    address.country_code?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ")
}

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
 */
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

  return (
    <div className="flex flex-col gap-y-4">
      {knowsDelivery && (
        <div
          className="flex flex-col gap-y-1 rounded-rounded border border-ui-border-base bg-ui-bg-subtle p-4"
          data-testid="cart-delivery-summary"
        >
          <div className="flex items-start justify-between gap-x-4">
            <Text className="txt-small-plus text-ui-fg-base">
              Continue where you left off
            </Text>
            <LocalizedClientLink
              href="/checkout?step=delivery"
              className="txt-small text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-delivery-link"
            >
              Edit
            </LocalizedClientLink>
          </div>
          <Text className="txt-small text-ui-fg-subtle">
            Delivering to {destination}
          </Text>
          {shippingMethod?.name && (
            <Text className="txt-small text-ui-fg-subtle">
              via {shippingMethod.name}
            </Text>
          )}
        </div>
      )}

      <DiscountCode cart={cart} />
      <Divider />

      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle">
        <div className="flex items-center justify-between">
          <span>
            Subtotal{" "}
            <span className="text-ui-fg-muted">
              ({cart.items?.length ?? 0}{" "}
              {(cart.items?.length ?? 0) === 1 ? "item" : "items"})
            </span>
          </span>
          <span data-testid="cart-subtotal" data-value={goods}>
            {convertToLocale({ amount: goods, currency_code })}
          </span>
        </div>

        {!!discount && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount}
            >
              - {convertToLocale({ amount: discount, currency_code })}
            </span>
          </div>
        )}

        {knowsDelivery && (
          <div className="flex items-center justify-between">
            <span>
              Shipping
              {shippingMethod?.name && (
                <span className="text-ui-fg-muted"> · {shippingMethod.name}</span>
              )}
            </span>
            <span
              data-testid="cart-shipping"
              data-value={shippingTotal(cart)}
            >
              {convertToLocale({ amount: shippingTotal(cart), currency_code })}
            </span>
          </div>
        )}
      </div>

      {knowsDelivery ? (
        <>
          <Divider />
          <div className="flex items-center justify-between text-ui-fg-base txt-medium">
            <span>Total</span>
            <span
              className="txt-xlarge-plus"
              data-testid="cart-total"
              data-value={cart.total ?? 0}
            >
              {convertToLocale({ amount: cart.total ?? 0, currency_code })}
            </span>
          </div>
          {taxInclusive && !!cart.tax_total && (
            <Text className="txt-small text-ui-fg-muted text-right">
              Inclusive of{" "}
              {convertToLocale({ amount: cart.tax_total, currency_code })} GST
            </Text>
          )}
        </>
      ) : (
        // No address and no delivery method: shipping and tax are unknown, not
        // zero, and there is no honest total to show yet.
        <Text
          className="txt-small text-ui-fg-subtle"
          data-testid="cart-totals-pending"
        >
          Shipping{taxInclusive ? "" : " and taxes"} calculated at checkout
          {taxInclusive && ". Prices include GST."}
        </Text>
      )}

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-10">Go to checkout</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
