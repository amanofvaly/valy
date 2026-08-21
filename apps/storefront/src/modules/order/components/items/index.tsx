import { HttpTypes } from "@medusajs/types"
import Item from "@modules/order/components/item"

const Items = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const items = [...(order.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  return (
    <ul
      className="divide-y divide-line border-y border-line"
      data-testid="products-table"
    >
      {items.map((item) => (
        <Item key={item.id} item={item} currencyCode={order.currency_code} />
      ))}
    </ul>
  )
}

export default Items
