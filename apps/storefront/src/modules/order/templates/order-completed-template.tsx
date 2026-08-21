import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import PaymentDetails from "@modules/order/components/payment-details"
import ShippingDetails from "@modules/order/components/shipping-details"

/**
 * The order confirmation.
 *
 * This is the page a customer keeps — it is what the confirmation email links
 * back to, and what gets opened in eighteen months to check what is actually in
 * the machine. So it carries the full specification of every line rather than
 * just a name and a price.
 *
 * Totals are on the same gross basis as the line items above them, and the GST
 * contained in the total is stated rather than left to be inferred.
 */
export default function OrderCompletedTemplate({
  order,
}: {
  order: HttpTypes.StoreOrder
}) {
  return (
    <div className="container-page max-w-3xl py-10 lg:py-16">
      <div
        className="flex flex-col gap-8"
        data-testid="order-complete-container"
      >
        <header className="flex flex-col gap-3">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-signal">
            Order placed
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Thank you. We are building it.
          </h1>
          <p className="max-w-prose text-base leading-7 text-muted">
            A confirmation is on its way to your inbox, with a GST invoice
            attached.
          </p>
        </header>

        <OrderDetails order={order} />

        <section aria-labelledby="what-you-ordered">
          <h2
            id="what-you-ordered"
            className="mb-3 text-lg font-semibold text-ink"
          >
            What you ordered
          </h2>
          <Items order={order} />
          <div className="mt-5">
            <CartTotals
              totals={order}
              shippingLabel={order.shipping_methods?.at(-1)?.name}
            />
          </div>
        </section>

        <ShippingDetails order={order} />
        <PaymentDetails order={order} />
        <Help />
      </div>
    </div>
  )
}
