import Item from "@modules/cart/components/item"
import { HttpTypes } from "@medusajs/types"

/**
 * The cart's line items.
 *
 * A list rather than a table: the old version was a five-column table whose
 * "Price" column was hidden below 1024px, leaving a header row on a phone with
 * nothing under one of its headings.
 */
const ItemsTemplate = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const items = [...(cart.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <Item key={item.id} item={item} currencyCode={cart.currency_code} />
      ))}
    </ul>
  )
}

export default ItemsTemplate
