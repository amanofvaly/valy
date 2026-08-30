"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Lock from "@modules/common/icons/lock"
import { usePathname } from "next/navigation"

/**
 * The header wordmark.
 *
 * Through checkout it takes a lock and reads "Valy Secure" — one mark, not a
 * badge parked next to the name. Everywhere else it is just the wordmark.
 *
 * It used to appear only on `/checkout/payment`, a page that existed to hold
 * the card fields. Cashfree's drop-in collects the card in its own modal, so
 * that page was removed and this test could never be true again. Covering the
 * whole of checkout is the honest replacement: an address and a phone number
 * are worth a lock too, and the alternative — keying off `?step=payment` —
 * would mean `useSearchParams` in a layout, which drags the whole thing behind
 * a Suspense boundary for the sake of an icon.
 *
 * A client component because Next hands a layout no pathname.
 */
const CheckoutWordmark = () => {
  const pathname = usePathname()
  const secure = Boolean(pathname?.includes("/checkout"))

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
