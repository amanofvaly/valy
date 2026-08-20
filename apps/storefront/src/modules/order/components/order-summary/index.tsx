import { goodsTotal, isTaxInclusiveCart } from "@lib/util/cart-totals"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (!amount) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  // Same basis rule as the cart and checkout summaries: with tax-inclusive
  // prices `order.subtotal` has the tax stripped back out, so it would not
  // match the line items on the same page.
  const taxInclusive = isTaxInclusiveCart(order)
  const goods = goodsTotal(order)

  return (
    <div>
      <h2 className="text-base-semi">Order Summary</h2>
      <div className="text-small-regular text-ui-fg-base my-2">
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>Subtotal</span>
          <span>{getAmount(goods)}</span>
        </div>
        <div className="flex flex-col gap-y-1">
          {order.discount_total > 0 && (
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span>- {getAmount(order.discount_total)}</span>
            </div>
          )}
          {order.gift_card_total > 0 && (
            <div className="flex items-center justify-between">
              <span>Discount</span>
              <span>- {getAmount(order.gift_card_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>{getAmount(order.shipping_total)}</span>
          </div>
          {!taxInclusive && (
            <div className="flex items-center justify-between">
              <span>Taxes</span>
              <span>{getAmount(order.tax_total)}</span>
            </div>
          )}
        </div>
        <div className="h-px w-full border-b border-gray-200 border-dashed my-4" />
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>Total</span>
          <span>{getAmount(order.total)}</span>
        </div>
        {taxInclusive && !!order.tax_total && (
          <div className="flex justify-end text-ui-fg-muted">
            <span>Inclusive of {getAmount(order.tax_total)} GST</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderSummary
