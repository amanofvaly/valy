import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Shipping from "@modules/checkout/components/shipping"
import Step from "@modules/checkout/components/step"
import { Suspense } from "react"

function StepLoading({
  cart,
  step,
  activeStep,
}: {
  cart: HttpTypes.StoreCart
  step: "delivery" | "payment"
  activeStep?: string
}) {
  const isDelivery = step === "delivery"

  return (
    <Step
      index={isDelivery ? 2 : 3}
      title={isDelivery ? "Delivery" : "Payment"}
      step={step}
      complete={
        isDelivery
          ? (cart.shipping_methods?.length ?? 0) > 0
          : !!cart.payment_collection?.payment_sessions?.some(
              (session) => session.status === "pending"
            )
      }
      enabled={
        isDelivery
          ? !!cart.shipping_address && !!cart.billing_address && !!cart.email
          : (cart.shipping_methods?.length ?? 0) > 0
      }
    >
      {activeStep === step && (
        <div className="flex items-center gap-2 py-4 text-muted">
          <Loader className="animate-spin" />
          <span className="text-sm">
            {isDelivery
              ? "Checking delivery options for your address…"
              : "Loading payment methods…"}
          </span>
        </div>
      )}
    </Step>
  )
}

export default function CheckoutForm({
  cart,
  customer,
  activeStep,
  shippingMethods = [],
  paymentMethods = [],
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  activeStep?: string
  shippingMethods?: HttpTypes.StoreCartShippingOption[]
  paymentMethods?: HttpTypes.StorePaymentProvider[]
}) {
  if (!cart) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods} />
    </div>
  )
}
