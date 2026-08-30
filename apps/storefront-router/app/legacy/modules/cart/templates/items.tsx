import BuildItem from "@modules/cart/components/build-item"
import Item from "@modules/cart/components/item"
import { groupCartLines } from "@lib/util/cart-builds"
import { HttpTypes } from "@medusajs/types"

/**
 * The cart's line items.
 *
 * A list rather than a table: the old version was a five-column table whose
 * "Price" column was hidden below 1024px, leaving a header row on a phone with
 * nothing under one of its headings.
 *
 * Lines are grouped before they are rendered. A configured machine arrives as
 * six or seven separate line items — see `cart-builds.ts` — and showing them as
 * six or seven rows would make one purchase look like a mistake.
 */
const ItemsTemplate = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const groups = groupCartLines(cart.items)

  return (
    <ul className="divide-y divide-line border-y border-line">
      {groups.map((group) =>
        group.kind === "build" ? (
          <BuildItem
            key={group.id}
            group={group}
            currencyCode={cart.currency_code}
          />
        ) : (
          <Item
            key={group.id}
            item={group.item}
            currencyCode={cart.currency_code}
          />
        )
      )}
    </ul>
  )
}

export default ItemsTemplate
