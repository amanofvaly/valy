import { convertToLocale } from "@lib/util/money"
import { orderNumber } from "@lib/util/order-number"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Badge, Button } from "@modules/common/components/ui"
import Thumbnail from "@modules/products/components/thumbnail"

/**
 * One past order in the list.
 *
 * The old version's "+ N more" arithmetic counted lines against products and
 * only appeared above four items while showing three, so a four-line order
 * displayed three thumbnails and no indication that a fourth existed.
 */
const OrderCard = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const items = order.items ?? []
  const shown = items.slice(0, 3)
  const hidden = items.length - shown.length

  const units = items.reduce((total, item) => total + item.quantity, 0)

  const formatStatus = (str: string) =>
    str.split("_").join(" ").replace(/^./, (c) => c.toUpperCase())

  return (
    <article className="flex flex-col gap-4" data-testid="order-card">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-mono text-sm tabular text-ink">
          #<span data-testid="order-display-id">{orderNumber(order)}</span>
        </h3>
        <span className="text-xs text-muted" data-testid="order-created-at">
          {new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span
          className="font-mono text-xs tabular text-ink"
          data-testid="order-amount"
        >
          {convertToLocale({
            amount: order.total,
            currency_code: order.currency_code,
          })}
        </span>
        <span className="text-xs text-muted">
          {units} {units === 1 ? "item" : "items"}
        </span>
        <Badge
          color={order.fulfillment_status === "fulfilled" ? "green" : "grey"}
          className="ml-auto"
        >
          {formatStatus(order.fulfillment_status)}
        </Badge>
      </div>

      <ul className="flex flex-wrap gap-3">
        {shown.map((item) => (
          <li
            key={item.id}
            className="flex w-24 flex-col gap-1.5"
            data-testid="order-item"
          >
            <Thumbnail
              thumbnail={item.thumbnail}
              title={item.title ?? undefined}
              metadata={item.variant?.product?.metadata}
              size="full"
              compactPlate
            />
            <span className="text-2xs leading-4 text-muted">
              <span className="text-ink" data-testid="item-title">
                {item.title}
              </span>{" "}
              × <span data-testid="item-quantity">{item.quantity}</span>
            </span>
          </li>
        ))}

        {hidden > 0 && (
          <li className="grid w-24 place-items-center rounded-lg border border-dashed border-line-strong text-xs text-muted">
            +{hidden} more
          </li>
        )}
      </ul>

      <div>
        <Button asChild variant="secondary" size="small">
          <LocalizedClientLink
            href={`/account/orders/details/${order.id}`}
            data-testid="order-details-link"
          >
            See details
          </LocalizedClientLink>
        </Button>
      </div>
    </article>
  )
}

export default OrderCard
