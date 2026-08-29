"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import CashfreeFields from "@modules/checkout/components/cashfree/fields"
import PaymentButton from "@modules/checkout/components/payment-button"
import { CardBrandMarks } from "@modules/checkout/components/payment-brand-marks"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type DedicatedPaymentProps = {
  cart: HttpTypes.StoreCart
  method: "card" | "upi"
}

const DedicatedPayment = ({ cart, method }: DedicatedPaymentProps) => {
  const amount = convertToLocale({
    amount: cart.total,
    currency_code: cart.currency_code,
  })

  return (
    <main className="container-page flex min-h-[calc(100vh-9rem)] items-start justify-center py-10 sm:items-center sm:py-16">
      <section
        aria-labelledby="payment-heading"
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1
            id="payment-heading"
            className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            {method === "card" ? "Secure Checkout" : "Pay with UPI"}
          </h1>
          
          {method === "card" && (
            <div className="mt-5">
              <CardBrandMarks large />
            </div>
          )}
          <p className="mt-2 text-sm pt-8 leading-6 text-muted"> Order total:
            {amount}
          </p>
        </div>

        <div>
          <CashfreeFields
            showMethodChooser={false}
            autoStartQr
            showUpiCollectFallback={false}
          />

          <div className="mt-6 flex flex-col items-center gap-4">
            <PaymentButton
              cart={cart}
              label={method === "card" ? `Pay ${amount}` : "Open UPI app"}
              data-testid="complete-payment-button"
            />
            <LocalizedClientLink
              href="/checkout?step=payment"
              className="pressable-tint text-sm font-medium text-muted underline underline-offset-4 hover:text-ink"
              data-testid="cancel-payment-button"
            >
              Cancel payment
            </LocalizedClientLink>
          </div>
        </div>

      </section>
    </main>
  )
}

export default DedicatedPayment
