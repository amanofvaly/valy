import { getProductPrice } from "@lib/util/get-product-price"
import { cn } from "@lib/util/cn"
import { HttpTypes } from "@medusajs/types"

/**
 * The price, on the GST-inclusive basis the customer will be charged.
 *
 * Stating the basis inline is not decoration: in India an advertised price is
 * legally inclusive of tax, and a shopper comparing this against a listing that
 * quotes ex-GST needs to know which they are looking at.
 */
export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const price = variant ? variantPrice : cheapestPrice

  if (!price) {
    return (
      <div
        className="h-9 w-32 animate-pulse rounded bg-surface"
        aria-label="Price unavailable"
      />
    )
  }

  const onSale = price.price_type === "sale"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {!variant && <span className="text-sm text-muted">From</span>}
        <span
          className={cn(
            "font-mono text-3xl font-medium tabular",
            onSale ? "text-danger" : "text-ink"
          )}
          data-testid="product-price"
          data-value={price.calculated_price_number}
        >
          {price.calculated_price}
        </span>
        {onSale && (
          <span
            className="font-mono text-base tabular text-muted line-through"
            data-testid="original-product-price"
            data-value={price.original_price_number}
          >
            {price.original_price}
          </span>
        )}
        {onSale && (
          <span className="rounded bg-danger-wash px-1.5 py-0.5 font-mono text-2xs text-danger">
            -{price.percentage_diff}%
          </span>
        )}
      </div>
      <p className="text-2xs text-muted">Includes GST</p>
    </div>
  )
}
