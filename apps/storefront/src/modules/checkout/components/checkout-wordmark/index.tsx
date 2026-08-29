"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Lock from "@modules/common/icons/lock"
import { usePathname } from "next/navigation"

/**
 * The header wordmark.
 *
 * On the payment page it takes a lock and reads "Valy Secure" — one mark, not
 * a badge parked next to the name. The earlier steps collect an address and a
 * shipping choice, so they keep the plain wordmark.
 *
 * A client component because Next hands a layout no pathname, and this header
 * lives in the layout shared by both checkout routes.
 */
const CheckoutWordmark = () => {
  const pathname = usePathname()
  const secure = Boolean(pathname?.endsWith("/checkout/payment"))

  return (
    <LocalizedClientLink
      href="/"
      className="pressable flex items-center gap-1.5 rounded px-1 text-lg font-semibold tracking-tight text-ink"
      data-testid="store-link"
    >
      {secure ? (
        <>
          <Lock size={16} className="text-accent" aria-hidden="true" />
          Valy Secure
        </>
      ) : (
        "Valy"
      )}
    </LocalizedClientLink>
  )
}

export default CheckoutWordmark
