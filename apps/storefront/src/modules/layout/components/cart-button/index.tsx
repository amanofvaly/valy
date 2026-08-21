import { retrieveCart } from "@lib/data/cart"
import CartCount from "./cart-count"

/**
 * The cart link in the header. Reads the real count on the server; the client
 * component below adds whatever is currently in flight, so the number moves on
 * the press rather than on the response.
 */
export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)

  const count =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0

  return <CartCount serverCount={count} />
}
