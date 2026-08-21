import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import CartTotals from "@modules/common/components/cart-totals"
import { HttpTypes } from "@medusajs/types"

/**
 * The order summary beside checkout.
 *
 * On a phone it comes first and collapses to the total, because someone filling
 * in an address does not need eleven line items above the first field — but the
 * figure they are about to pay must never be hidden from them.
 */
const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => (
  <aside className="lg:sticky lg:top-24 lg:self-start">
    <details
      open
      className="rounded-lg border border-line lg:open:[&>summary]:hidden"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-sm text-ink lg:hidden">
        Order summary
      </summary>

      <div className="flex flex-col gap-5 p-5 pt-0 lg:pt-5">
        <h2 className="text-base font-medium text-ink">Order summary</h2>

        <ItemsPreviewTemplate cart={cart} />

        <CartTotals
          totals={cart}
          shippingLabel={cart.shipping_methods?.at(-1)?.name}
        />
      </div>
    </details>
  </aside>
)

export default CheckoutSummary
