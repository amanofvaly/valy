import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  // The cart and the customer do not depend on each other.
  const [cart, customer, params] = await Promise.all([
    retrieveCart(),
    retrieveCustomer(),
    searchParams,
  ])

  if (!cart) {
    return notFound()
  }

  return (
    <div className="container-page grid grid-cols-1 gap-10 py-8 lg:grid-cols-[1fr_380px] lg:gap-16 lg:py-12">
      <div className="order-2 lg:order-1">
        <PaymentWrapper cart={cart}>
          <CheckoutForm
            cart={cart}
            customer={customer}
            activeStep={params.step}
          />
        </PaymentWrapper>
      </div>

      {/* First on a phone, so the total is visible before the form. */}
      <div className="order-1 lg:order-2">
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
