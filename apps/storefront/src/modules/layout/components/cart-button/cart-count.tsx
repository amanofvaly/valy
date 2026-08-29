"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useOptimisticCart } from "@modules/cart/context/optimistic-cart"
import { cn } from "@lib/util/cn"
import { useHeaderStatus } from "@modules/layout/components/header-status"

/**
 * `Cart (3)`, where the 3 already counts the thing you just pressed add on.
 *
 * The server count and the in-flight delta are added here rather than in a
 * store, so there is no second copy of the cart to keep in step.
 */
const CartCount = ({ serverCount }: { serverCount: number }) => {
  const { delta } = useOptimisticCart()
  /*
   * The cart gives up its slot on a phone whenever a page has claimed the
   * header. It is a link out of a page the reader is halfway through, showing
   * a count that stays zero until they finish it, and the row it occupies is
   * the one place the page has to say what is being built. From `lg` there is
   * room for both and nothing changes.
   *
   * Asked of the header store rather than of the pathname: the page that needs
   * the room is the page that says so, and a list of route patterns in the
   * cart button would be a second place to keep that fact.
   */
  const claimed = useHeaderStatus() !== null
  const count = serverCount + delta

  return (
    <LocalizedClientLink
      href="/cart"
      className={cn(
        "pressable-tint shrink-0 rounded px-3 py-2 text-sm text-muted hover:text-ink",
        claimed && "hidden lg:inline-flex"
      )}
      data-testid="nav-cart-link"
    >
      Cart
      <span
        className={cn(
          "ml-1 font-mono tabular",
          count > 0 ? "text-ink" : "text-muted"
        )}
        data-testid="cart-count"
      >
        ({count})
      </span>
    </LocalizedClientLink>
  )
}

export default CartCount
