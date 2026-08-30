import type { HttpTypes } from "@medusajs/types"
import CheckoutIdentity from "@modules/checkout/components/checkout-identity"
import CheckoutWordmark from "@modules/checkout/components/checkout-wordmark"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

/**
 * Checkout runs outside the main shell on purpose: no nav, no footer, no
 * catalogue links. The only way out is back to the cart, which is the one
 * navigation someone in the middle of paying actually wants.
 */
export default function CheckoutView({
  cart,
  customer,
  shippingOptions,
  paymentProviders,
  activeStep,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  paymentProviders: HttpTypes.StorePaymentProvider[]
  activeStep?: string
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

          <div className="flex flex-1 basis-0 justify-end">
            <CheckoutIdentity customer={customer} />
          </div>
        </nav>
      </header>

      <div className="relative flex-1" data-testid="checkout-container">
        <div className="container-page grid grid-cols-1 gap-10 py-8 lg:grid-cols-[1fr_380px] lg:gap-16 lg:py-12">
          <div className="order-2 lg:order-1">
            <PaymentWrapper cart={cart}>
              <CheckoutForm
                cart={cart}
                customer={customer}
                activeStep={activeStep}
                shippingMethods={shippingOptions}
                paymentMethods={paymentProviders}
              />
            </PaymentWrapper>
          </div>

          {/* First on a phone, so the total is visible before the form. */}
          <div className="order-1 lg:order-2">
            <CheckoutSummary cart={cart} />
          </div>
        </div>
      </div>

      <footer className="border-t border-line py-5">
        <div className="container-page flex items-center justify-center gap-2 text-xs text-muted">
          <span>Secured by</span>
          <img src="/images/cashfree-mark.svg" width={18} height={18} alt="" />
          <span className="font-medium text-ink">Cashfree Payments</span>
        </div>
      </footer>
    </div>
  )
}
