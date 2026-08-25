import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import Step from "@modules/checkout/components/step"
import { Suspense } from "react"

async function ShippingStep({ cart }: { cart: HttpTypes.StoreCart }) {
  const shippingMethods = await listCartShippingMethods(cart.id)

  if (!shippingMethods) {
    return null
  }

  return (
    <Shipping cart={cart} availableShippingMethods={shippingMethods} />
  )
}

async function PaymentStep({ cart }: { cart: HttpTypes.StoreCart }) {
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!paymentMethods) {
    return null
  }

  return <Payment cart={cart} availablePaymentMethods={paymentMethods} />
}

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
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  activeStep?: string
}) {
  if (!cart) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <Addresses cart={cart} customer={customer} />

      <Suspense
        fallback={
          <StepLoading cart={cart} step="delivery" activeStep={activeStep} />
        }
      >
        <ShippingStep cart={cart} />
      </Suspense>

      <Suspense
        fallback={
          <StepLoading cart={cart} step="payment" activeStep={activeStep} />
        }
      >
        <PaymentStep cart={cart} />
      </Suspense>

      <Review cart={cart} />
    </div>
  )
}
