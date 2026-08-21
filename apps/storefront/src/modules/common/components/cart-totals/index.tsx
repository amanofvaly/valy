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
    <div className="flex flex-col gap-3">
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Subtotal</dt>
          <dd
            className="font-mono tabular text-ink"
            data-testid="cart-subtotal"
            data-value={goods}
          >
            {convertToLocale({ amount: goods, currency_code })}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">
            Shipping
            {shippingLabel && <span className="text-muted"> · {shippingLabel}</span>}
          </dt>
          <dd
            className="font-mono tabular text-ink"
            data-testid="cart-shipping"
            data-value={shipping}
          >
            {convertToLocale({ amount: shipping, currency_code })}
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

        {/* Tax is additive only when prices exclude it. When they include it,
            adding a tax row would double-count what the subtotal already
            contains, so it becomes a note under the total instead. */}
        {!taxInclusive && (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Taxes</dt>
            <dd
              className="font-mono tabular text-ink"
              data-testid="cart-taxes"
              data-value={tax_total || 0}
            >
              {convertToLocale({ amount: tax_total ?? 0, currency_code })}
            </dd>
          </div>
        )}
      </dl>

      <hr className="border-0 border-t border-line" />

      <div className="flex items-baseline justify-between gap-4">
        <span className="text-base font-medium text-ink">Total</span>
        <span
          className="font-mono text-xl font-medium tabular text-ink"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>

      {taxInclusive && !!tax_total && (
        <p
          className="text-right text-2xs text-muted"
          data-testid="cart-taxes"
          data-value={tax_total}
        >
          Inclusive of {convertToLocale({ amount: tax_total, currency_code })}{" "}
          GST
        </p>
      )}
    </div>
  )
}

export default CartTotals
