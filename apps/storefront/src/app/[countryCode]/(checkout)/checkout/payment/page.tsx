import { isCashfree } from "@lib/constants"
import { retrieveCart } from "@lib/data/cart"
import DedicatedPayment from "@modules/checkout/components/dedicated-payment"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Secure payment",
}

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>
}) {
  const [cart, params] = await Promise.all([retrieveCart(), searchParams])

  if (!cart) {
    return notFound()
  }

  const method = params.method === "upi" ? "upi" : "card"
  const session = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  if (
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    !cart.shipping_methods?.length ||
    !isCashfree(session?.provider_id)
  ) {
    redirect("/checkout?step=payment")
  }

  return (
    <PaymentWrapper cart={cart} cashfreeMethod={method}>
      <DedicatedPayment cart={cart} method={method} />
    </PaymentWrapper>
  )
}
