import { retrieveCart } from "@lib/data/cart"
import { cartItemCount } from "@lib/util/cart-builds"
import CartCount from "./cart-count"

/**
 * The cart link in the header. Reads the real count on the server; the client
 * component below adds whatever is currently in flight, so the number moves on
 * the press rather than on the response.
 */
export default async function CartButton() {
  const cart = await retrieveCart().catch(() => null)

  // A configured machine counts as one, matching the cart page and the
  // checkout summary. Seven lines and nine units for one purchase would make
  // the badge disagree with every screen it leads to.
  const count = cartItemCount(cart?.items)

  return <CartCount serverCount={count} />
}
