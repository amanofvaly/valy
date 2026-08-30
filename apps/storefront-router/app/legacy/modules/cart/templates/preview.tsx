"use client"

import BuildItem from "@modules/cart/components/build-item"
import Item from "@modules/cart/components/item"
import { groupCartLines } from "@lib/util/cart-builds"
import { cn } from "@lib/util/cn"
import { HttpTypes } from "@medusajs/types"

/**
 * The read-only item list in the checkout summary. Same components as the cart,
 * in their `preview` form: no quantity control and no remove, because changing
 * what you are buying halfway through paying for it is not a thing to make
 * easy.
 *
 * A configured machine stays grouped here too. The summary is the last place
 * the buyer checks what they configured, so it is the last place that should
 * present it as seven unrelated products.
 */
const ItemsPreviewTemplate = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const groups = groupCartLines(cart.items)

  return (
    <ul
      className={cn(
        "divide-y divide-line border-y border-line",
        groups.length > 4 && "no-scrollbar max-h-[420px] overflow-y-auto"
      )}
      data-testid="items-table"
    >
      {groups.map((group) =>
        group.kind === "build" ? (
          <BuildItem
            key={group.id}
            group={group}
            type="preview"
            currencyCode={cart.currency_code}
          />
        ) : (
          <Item
            key={group.id}
            item={group.item}
            type="preview"
            currencyCode={cart.currency_code}
          />
        )
      )}
    </ul>
  )
}

export default ItemsPreviewTemplate
