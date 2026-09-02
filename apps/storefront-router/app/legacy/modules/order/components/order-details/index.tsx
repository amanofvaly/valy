import { HttpTypes } from "@medusajs/types"
import { orderNumber } from "@lib/util/order-number"
import { Badge } from "@modules/common/components/ui"

/**
 * The facts about an order, as a definition list. The order number is
 * monospaced because it is the thing a customer reads out on a call.
 */
const OrderDetails = ({
  order,
  showStatus,
}: {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 sm:grid-cols-4">
      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted">Order number</dt>
        <dd
          className="font-mono text-sm tabular text-ink"
          data-testid="order-id"
        >
          {orderNumber(order)}
        </dd>
      </div>

      <div className="flex flex-col gap-1">
        <dt className="text-xs text-muted">Placed</dt>
        <dd className="text-sm text-ink" data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </dd>
      </div>

      <div className="col-span-2 flex flex-col gap-1">
        <dt className="text-xs text-muted">Confirmation sent to</dt>
        <dd className="truncate text-sm text-ink" data-testid="order-email">
          {order.email}
        </dd>
      </div>

      {showStatus && (
        <>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted">Fulfilment</dt>
            <dd data-testid="order-status">
              <Badge
                color={
                  order.fulfillment_status === "fulfilled" ? "green" : "grey"
                }
              >
                {formatStatus(order.fulfillment_status)}
              </Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted">Payment</dt>
            <dd data-testid="order-payment-status">
              <Badge
                color={order.payment_status === "captured" ? "green" : "grey"}
              >
                {formatStatus(order.payment_status)}
              </Badge>
            </dd>
          </div>
        </>
      )}
    </dl>
  )
}

export default OrderDetails
