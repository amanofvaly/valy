import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

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

          <LocalizedClientLink
            href="/"
            className="pressable rounded px-1 text-lg font-semibold tracking-tight text-ink"
            data-testid="store-link"
          >
            Valy
          </LocalizedClientLink>

          <div className="flex flex-1 basis-0 justify-end">
            <span className="hidden text-2xs text-muted sm:inline">
              Secure checkout
            </span>
          </div>
        </nav>
      </header>

      <div className="relative flex-1" data-testid="checkout-container">
        {children}
      </div>

      <footer className="border-t border-line py-5">
        <p className="container-page text-2xs text-muted">
          Prices include GST. A tax invoice is raised against your GSTIN if you
          add one.
        </p>
      </footer>
    </div>
  )
}
