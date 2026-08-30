import { convertToLocale } from "@lib/util/money"
import { headlineSpecs } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import { SpecInline } from "@modules/common/components/spec-block"
import Thumbnail from "@modules/products/components/thumbnail"

/**
 * One line of an order.
 *
 * Carries the same specification line as the cart and the product card, which
 * matters most here: this is the page a customer keeps, and eighteen months
 * later "6 x 12TB / 32GB, 24 dB(A)" is what tells them what they own.
 */
const Item = ({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}) => {
  const specs = headlineSpecs(item.variant?.product?.metadata, 2)
  const total = item.total ?? 0

  return (
    <li
      className="grid grid-cols-[64px_1fr_auto] items-start gap-4 py-4"
      data-testid="product-row"
    >
      <Thumbnail
        thumbnail={item.thumbnail}
        title={item.product_title ?? undefined}
        metadata={item.variant?.product?.metadata}
        size="full"
        compactPlate
      />

      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-medium text-ink" data-testid="product-name">
          {item.product_title}
        </p>
        {item.variant?.title && (
          <p
            className="font-mono text-2xs tabular text-muted"
            data-testid="product-variant"
          >
            {item.variant.title}
          </p>
        )}
        <SpecInline rows={specs} />
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <span
          className="font-mono text-sm tabular text-ink"
          data-testid="product-price"
        >
          {convertToLocale({ amount: total, currency_code: currencyCode })}
        </span>
        <span className="font-mono text-2xs tabular text-muted">
          <span data-testid="product-quantity">{item.quantity}</span> ×{" "}
          <span data-testid="product-unit-price">
            {convertToLocale({
              amount: total / item.quantity,
              currency_code: currencyCode,
            })}
          </span>
        </span>
      </div>
    </li>
  )
}

export default Item
