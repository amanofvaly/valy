"use client"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart-actions"
import { CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import Step from "@modules/checkout/components/step"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import { Button } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <Step
      index={3}
      title="Payment"
      step="payment"
      complete={!!paymentReady}
      editTestId="edit-payment-button"
    >
      {isOpen ? (
        <div className="flex flex-col gap-5">
          {!paidByGiftcard && !!availablePaymentMethods?.length && (
            <RadioGroupPrimitive.Root
              value={selectedPaymentMethod}
              onValueChange={(value: string) => setPaymentMethod(value)}
              className="flex flex-col gap-2"
            >
              {availablePaymentMethods.map((paymentMethod) =>
                isStripeLike(paymentMethod.id) ? (
                  <StripeCardContainer
                    key={paymentMethod.id}
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                    paymentInfoMap={paymentInfoMap}
                    setCardBrand={setCardBrand}
                    setError={setError}
                    setCardComplete={setCardComplete}
                  />
                ) : (
                  <PaymentContainer
                    key={paymentMethod.id}
                    paymentInfoMap={paymentInfoMap}
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                  />
                )
              )}
            </RadioGroupPrimitive.Root>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium text-ink">Payment method</p>
              <p className="text-sm text-muted" data-testid="payment-method-summary">
                Gift card
              </p>
            </div>
          )}

          <div>
            <Button
              size="large"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
                (!selectedPaymentMethod && !paidByGiftcard)
              }
              data-testid="submit-payment-button"
            >
              {!activeSession && isStripeLike(selectedPaymentMethod)
                ? "Enter card details"
                : "Continue to review"}
            </Button>
            <ErrorMessage
              error={error}
              data-testid="payment-method-error-message"
            />
          </div>
        </div>
      ) : cart && paymentReady && activeSession ? (
        <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-ink">Payment method</dt>
            <dd className="text-muted" data-testid="payment-method-summary">
              {paymentInfoMap[activeSession.provider_id]?.title ||
                activeSession.provider_id}
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-ink">Payment details</dt>
            <dd
              className="flex items-center gap-2 text-muted"
              data-testid="payment-details-summary"
            >
              <span className="grid h-7 w-9 place-items-center rounded border border-line bg-surface">
                {paymentInfoMap[selectedPaymentMethod]?.icon || <CreditCard />}
              </span>
              {isStripeLike(selectedPaymentMethod) && cardBrand
                ? cardBrand
                : "Another step will appear"}
            </dd>
          </div>
        </dl>
      ) : paidByGiftcard ? (
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-medium text-ink">Payment method</p>
          <p className="text-sm text-muted" data-testid="payment-method-summary">
            Gift card
          </p>
        </div>
      ) : null}
    </Step>
  )
}

export default Payment
