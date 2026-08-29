import CheckoutIdentity from "@modules/checkout/components/checkout-identity"
import CheckoutWordmark from "@modules/checkout/components/checkout-wordmark"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import Image from "next/image"
import { Suspense } from "react"

/**
 * Checkout runs outside the main shell on purpose: no nav, no footer, no
 * catalogue links. The only way out is back to the cart, which is the one
 * navigation someone in the middle of paying actually wants.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <nav className="container-page flex h-14 items-center justify-between sm:h-16">
          <LocalizedClientLink
            href="/cart"
            className="pressable-tint -ml-2 flex flex-1 basis-0 items-center gap-1.5 rounded px-2 py-2 text-sm text-muted hover:text-ink"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="hidden sm:block">Back to cart</span>
            <span className="sm:hidden">Back</span>
          </LocalizedClientLink>

          <CheckoutWordmark />

          {/*
           * Streamed, so the header paints with the rest of the page. The
           * customer is the only thing here that needs the API, and a checkout
           * header that waits on it is a blank bar above a form.
           */}
          <div className="flex flex-1 basis-0 justify-end">
            <Suspense fallback={null}>
              <CheckoutIdentity />
            </Suspense>
          </div>
        </nav>
      </header>

      <div className="relative flex-1" data-testid="checkout-container">
        {children}
      </div>

      <footer className="border-t border-line py-5">
        <div className="container-page flex items-center justify-center gap-2 text-xs text-muted">
          <span>Secured by</span>
          <Image
            src="/images/cashfree-mark.svg"
            width={18}
            height={18}
            alt=""
          />
          <span className="font-medium text-ink">Cashfree Payments</span>
        </div>
      </footer>
    </div>
  )
}
