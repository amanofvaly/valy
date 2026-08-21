"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useOptimisticCart } from "@modules/cart/context/optimistic-cart"
import { cn } from "@lib/util/cn"

/**
 * `Cart (3)`, where the 3 already counts the thing you just pressed add on.
 *
 * The server count and the in-flight delta are added here rather than in a
 * store, so there is no second copy of the cart to keep in step.
 */
const CartCount = ({ serverCount }: { serverCount: number }) => {
  const { delta } = useOptimisticCart()
  const count = serverCount + delta

  return (
    <LocalizedClientLink
      href="/cart"
      className="pressable-tint rounded px-3 py-2 text-sm text-muted hover:text-ink"
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
