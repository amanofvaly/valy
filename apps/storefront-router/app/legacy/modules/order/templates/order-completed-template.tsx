import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import CheckCircle from "@modules/common/icons/check-circle"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import PaymentDetails from "@modules/order/components/payment-details"
import ShipmentStatus from "@modules/order/components/shipment-status"
import ShippingDetails from "@modules/order/components/shipping-details"

/**
 * The order confirmation.
 *
 * This is the page a customer keeps — the confirmation email links back to it,
 * and it gets opened in eighteen months to check what is actually in the
 * machine. So it carries the full specification of every line.
 *
 * It is deliberately four blocks and no more: what happened, what you bought,
 * where it is going and how it was paid for, and what happens next. It used to
 * be seven, with "Method" appearing under both delivery and payment, the email
 * printed twice, and a heading over the items that only said they were the
 * items. Each piece was defensible and the page as a whole was a maze.
 */
export default function OrderCompletedTemplate({
  order,
}: {
  order: HttpTypes.StoreOrder
}) {
  const placedOn = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="container-page max-w-3xl py-10 lg:py-16">
      <div
        className="flex flex-col gap-10"
        data-testid="order-complete-container"
      >
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-base font-normal text-accent">
              <CheckCircle size={16} className="shrink-0" aria-hidden="true" />
              Order successfully placed
            </h1>
            <p className="text-base text-muted">
              Order#{" "}
              <span
                className="font-mono tabular text-ink"
                data-testid="order-id"
              >
                {order.display_id}
              </span>
            </p>
          </div>
          <p className="text-sm text-muted" data-testid="order-date">
            Placed on {placedOn}
          </p>
        </header>

        <section aria-label="Items">
          <Items order={order} />
          <div className="mt-5">
            <CartTotals
              totals={order}
              shippingLabel={order.shipping_methods?.at(-1)?.name}
            />
          </div>
        </section>

        {/*
         * Delivery and payment sit together because they answer the same
         * question — what did I just agree to — and neither is long enough to
         * earn a full-width band of its own.
         */}
        <div className="grid grid-cols-1 gap-8 border-t border-line pt-8 sm:grid-cols-2">
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          {/* Renders itself away until a courier has actually been booked. */}
          <ShipmentStatus order={order} />
        </div>

        <Help />
      </div>
    </div>
  )
}
