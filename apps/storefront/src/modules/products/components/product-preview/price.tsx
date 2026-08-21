import { cn } from "@lib/util/cn"
import { VariantPrice } from "types/global"

/**
 * A price in a grid. Monospaced and tabular so a column of them lines up at the
 * decimal, which is the only way a shopper can compare four cards at a glance.
 */
export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const onSale = price.price_type === "sale"

  return (
    <>
      {onSale && (
        <span
          className="font-mono text-xs tabular text-muted line-through"
          data-testid="original-price"
        >
          {price.original_price}
        </span>
      )}
      <span
        className={cn(
          "font-mono text-sm font-medium tabular",
          onSale ? "text-danger" : "text-ink"
        )}
        data-testid="price"
      >
        {price.calculated_price}
      </span>
    </>
  )
}
