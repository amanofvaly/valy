"use client"

import Item from "@modules/cart/components/item"
import { cn } from "@lib/util/cn"
import { HttpTypes } from "@medusajs/types"

/**
 * The read-only item list in the checkout summary. Same line-item component as
 * the cart, in its `preview` form: no quantity control, because changing what
 * you are buying halfway through paying for it is not a thing to make easy.
 */
const ItemsPreviewTemplate = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const items = [...(cart.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  return (
    <ul
      className={cn(
        "divide-y divide-line border-y border-line",
        items.length > 4 && "no-scrollbar max-h-[420px] overflow-y-auto"
      )}
      data-testid="items-table"
    >
      {items.map((item) => (
        <Item
          key={item.id}
          item={item}
          type="preview"
          currencyCode={cart.currency_code}
        />
      ))}
    </ul>
  )
}

export default ItemsPreviewTemplate
