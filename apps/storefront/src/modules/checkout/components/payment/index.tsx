"use client"

import { initiatePaymentSession } from "@lib/data/cart-actions"
import { isCashfree } from "@lib/constants"
import { cn } from "@lib/util/cn"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import {
  CardBrandMarks,
  UpiBrandMarks,
} from "@modules/checkout/components/payment-brand-marks"
import Step from "@modules/checkout/components/step"
import StepActions from "@modules/checkout/components/step-actions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type CheckoutPaymentMethod = "card" | "upi"

const METHODS: Array<{
  id: CheckoutPaymentMethod
  name: string
  note: string
}> = [
  {
    id: "card",
    name: "Credit or Debit Card",
    note: "Bank cards with secure verification.",
  },
  {
    id: "upi",
    name: "UPI",
    note: "Use any UPI app to pay",
  },
]

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const cashfreeProvider = availablePaymentMethods.find((method) =>
    isCashfree(method.id)
  )
  const [selectedMethod, setSelectedMethod] =
    useState<CheckoutPaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const isOpen = searchParams.get("step") === "payment"

  useEffect(() => setError(null), [isOpen])

  const handleSubmit = async () => {
    if (!selectedMethod || !cashfreeProvider) {
      setError("Choose Card or UPI to continue.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const activeSession = cart.payment_collection?.payment_sessions?.find(
        (session) => session.status === "pending"
      )

      if (activeSession?.provider_id !== cashfreeProvider.id) {
        await initiatePaymentSession(cart, {
          provider_id: cashfreeProvider.id,
        })
      }

      router.push(`${pathname}/payment?method=${selectedMethod}`)
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Payment could not be prepared. Try again."
      )
      setIsLoading(false)
    }
  }

  const paymentReady = !!cart.payment_collection?.payment_sessions?.some(
    (session) => session.status === "pending"
  )

  return (
    <Step
      index={3}
      title="Payment method"
      step="payment"
      complete={!isOpen && paymentReady}
      editTestId="edit-payment-button"
    >
      {isOpen ? (
        <div className="flex flex-col gap-6">
          {cashfreeProvider ? (
            <div
              role="radiogroup"
              aria-label="Payment method"
              className="grid grid-cols-2 gap-3"
            >
              {METHODS.map((method) => {
                const selected = selectedMethod === method.id

                return (
                  <button
                    key={method.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setSelectedMethod(method.id)
                      setError(null)
                    }}
                    className={cn(
                      "pressable min-h-28 rounded-lg bg-paper px-4 py-4 text-left ring-1 ring-inset transition-[box-shadow,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      selected
                        ? "bg-accent-wash ring-2 ring-accent"
                        : "ring-line hover:ring-line-strong active:bg-surface"
                    )}
                    data-testid={`payment-method-${method.id}`}
                  >
                    <span className="block text-[0.9375rem] font-semibold leading-6 text-ink">
                      {method.name}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted">
                      {method.note}
                    </span>
                    <span className="mt-4 block">
                      {method.id === "card" ? (
                        <CardBrandMarks />
                      ) : (
                        <UpiBrandMarks />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p role="alert" className="text-sm leading-6 text-danger">
              Card and UPI payments are unavailable right now. Try again later.
            </p>
          )}

          <p className="max-w-prose text-sm leading-6 text-muted">
            Placing the order confirms you accept our{" "}
            <LocalizedClientLink
              href="/terms"
              className="text-accent hover:text-accent-strong"
            >
              terms of sale
            </LocalizedClientLink>{" "}
            and{" "}
            <LocalizedClientLink
              href="/privacy"
              className="text-accent hover:text-accent-strong"
            >
              privacy policy
            </LocalizedClientLink>
            . Payment is completed on the next screen.
          </p>

          <StepActions className="static mx-0 border-0 bg-transparent p-0 backdrop-blur-none supports-[backdrop-filter]:bg-transparent sm:mx-0 sm:px-0">
            <Button
              variant="action"
              size="large"
              block
              className="lg:w-auto"
              disabled={!selectedMethod || !cashfreeProvider}
              isLoading={isLoading}
              onClick={handleSubmit}
              data-testid="continue-to-payment-button"
            >
              Place order
            </Button>
            <ErrorMessage
              error={error}
              data-testid="payment-method-error-message"
            />
          </StepActions>
        </div>
      ) : paymentReady ? (
        <p className="text-sm text-muted">Ready to choose Card or UPI.</p>
      ) : null}
    </Step>
  )
}

export default Payment
