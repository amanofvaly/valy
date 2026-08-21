import { convertToLocale } from "@lib/util/money"
import { headlineSpecs } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import QuantityStepper from "@modules/cart/components/quantity-stepper"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SpecInline } from "@modules/common/components/spec-block"
import Thumbnail from "@modules/products/components/thumbnail"

/**
 * One line of the cart.
 *
 * The specification line is the same component the product card and the product
 * page use, so a shopper checking that they configured the right machine sees
 * the same three figures they chose it by rather than a bare "Variant: 6 x
 * 12TB / 64GB".
 *
 * Prices come off `item.total`, which is gross on a tax-inclusive cart. That
 * matters: the summary below adds up gross figures, and a net line item here
 * would make the column stop reconciling.
 */

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  /** `preview` is the read-only form used in the checkout summary. */
  type?: "full" | "preview"
}

const Item = ({ item, currencyCode, type = "full" }: ItemProps) => {
  const specs = headlineSpecs(item.variant?.product?.metadata, 2)
  const lineTotal = item.total ?? 0
  const originalTotal = item.original_total ?? 0
  const discounted = lineTotal < originalTotal

  const maxQuantity = item.variant?.manage_inventory
    ? (item.variant.inventory_quantity ?? undefined)
    : undefined

  return (
    <li
      className="grid grid-cols-[72px_1fr] gap-4 py-5 sm:grid-cols-[96px_1fr_auto] sm:gap-6"
      data-testid="product-row"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="pressable block"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          title={item.product_title ?? undefined}
          metadata={item.variant?.product?.metadata}
          size="full"
          compactPlate
        />
      </LocalizedClientLink>

      <div className="flex min-w-0 flex-col gap-1.5">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="text-base font-medium text-ink hover:text-accent"
          data-testid="product-title"
        >
          {item.product_title}
        </LocalizedClientLink>

        {item.variant?.title && (
          <p
            className="font-mono text-xs tabular text-muted"
            data-testid="product-variant"
          >
            {item.variant.title}
          </p>
        )}

        <SpecInline rows={specs} />

        {type === "full" && (
          <div className="mt-2">
            <QuantityStepper
              lineId={item.id}
              quantity={item.quantity}
              max={maxQuantity}
              data-testid="product-select-button"
            />
          </div>
        )}
      </div>

      <div className="col-start-2 flex items-baseline justify-between gap-2 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start">
        {type === "preview" && (
          <span className="font-mono text-xs tabular text-muted">
            {item.quantity} x
          </span>
        )}
        <span
          className="font-mono text-base tabular text-ink"
          data-testid="product-price"
        >
          {convertToLocale({ amount: lineTotal, currency_code: currencyCode })}
        </span>
        {discounted && (
          <span
            className="font-mono text-xs tabular text-muted line-through"
            data-testid="product-original-price"
          >
            {convertToLocale({
              amount: originalTotal,
              currency_code: currencyCode,
            })}
          </span>
        )}
        {item.quantity > 1 && type === "full" && (
          <span
            className="font-mono text-2xs tabular text-muted"
            data-testid="product-unit-price"
          >
            {convertToLocale({
              amount: lineTotal / item.quantity,
              currency_code: currencyCode,
            })}{" "}
            each
          </span>
        )}
      </div>
    </li>
  )
}

export default Item
