"use client"

import {
  goodsTotal,
  isTaxInclusiveCart,
  shippingTotal,
} from "@lib/util/cart-totals"
import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_total?: number | null
    item_subtotal?: number | null
    original_item_total?: number | null
    shipping_total?: number | null
    discount_total?: number | null
    discount_subtotal?: number | null
    items?: { is_tax_inclusive?: boolean | null }[] | null
  }
  /** Name of the chosen delivery method, shown so the shipping row explains itself. */
  shippingLabel?: string | null
}

/**
 * The order summary for checkout and order confirmation, where the address and
 * delivery method are known and every figure below is real.
 *
 * The cart page uses its own summary instead — it cannot know shipping or tax,
 * and this table has no way to say so.
 */
const CartTotals: React.FC<CartTotalsProps> = ({ totals, shippingLabel }) => {
  const { currency_code, total, tax_total } = totals

  const taxInclusive = isTaxInclusiveCart(totals)
  const goods = goodsTotal(totals)
  const shipping = shippingTotal(totals)

  // With tax-inclusive prices the discount has to be quoted gross too, or the
  // rows stop adding up to the total.
  const discount = taxInclusive
    ? (totals.discount_total ?? 0)
    : (totals.discount_subtotal ?? 0)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span data-testid="cart-subtotal" data-value={goods}>
            {convertToLocale({ amount: goods, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>
            Shipping
            {shippingLabel && (
              <span className="text-ui-fg-muted"> · {shippingLabel}</span>
            )}
          </span>
          <span data-testid="cart-shipping" data-value={shipping}>
            {convertToLocale({ amount: shipping, currency_code })}
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
        {/* Tax is additive only when prices exclude it. When they include it,
            adding a tax row would double-count what the subtotal already
            contains, so it becomes a note under the total instead. */}
        {!taxInclusive && (
          <div className="flex justify-between">
            <span className="flex gap-x-1 items-center ">Taxes</span>
            <span data-testid="cart-taxes" data-value={tax_total || 0}>
              {convertToLocale({ amount: tax_total ?? 0, currency_code })}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      {taxInclusive && !!tax_total && (
        <div className="flex justify-end txt-small text-ui-fg-muted">
          <span data-testid="cart-taxes" data-value={tax_total}>
            Inclusive of{" "}
            {convertToLocale({ amount: tax_total, currency_code })} GST
          </span>
        </div>
      )}
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
