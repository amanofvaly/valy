"use client"

import { initiatePaymentSession } from "@lib/data/cart-actions"
import { isCashfree } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import {
  CardBrandMarks,
  UpiBrandMarks,
} from "@modules/checkout/components/payment-brand-marks"
import PaymentButton from "@modules/checkout/components/payment-button"
import Step from "@modules/checkout/components/step"
import StepActions from "@modules/checkout/components/step-actions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

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
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const isOpen = searchParams.get("step") === "payment"

  useEffect(() => setError(null), [isOpen])

  /*
   * Open the session as soon as the step is, rather than when a button is
   * pressed.
   *
   * Cashfree's drop-in is handed a payment session id and renders the whole
   * form itself, so there is nothing for the customer to fill in here and
   * nothing to ask them first — the modal offers card, UPI, netbanking and
   * wallets whatever we might have pre-selected. The session therefore has to
   * exist before the pay button can do anything, and creating it here means the
   * button opens the form on the first press instead of the second.
   */
  useEffect(() => {
    if (!isOpen || !cashfreeProvider) {
      return
    }

    const activeSession = cart.payment_collection?.payment_sessions?.find(
      (session) => session.status === "pending"
    )

    if (activeSession?.provider_id === cashfreeProvider.id) {
      return
    }

    let cancelled = false

    initiatePaymentSession(cart, { provider_id: cashfreeProvider.id }).catch(
      (sessionError: unknown) => {
        if (!cancelled) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Payment could not be prepared. Try again."
          )
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [isOpen, cashfreeProvider, cart])

  /* A pending session belonging to Cashfree is what `PaymentButton` needs. */
  const cashfreeSessionReady = !!cart.payment_collection?.payment_sessions?.some(
    (session) =>
      session.status === "pending" && isCashfree(session.provider_id)
  )

  const paymentReady = !!cart.payment_collection?.payment_sessions?.some(
    (session) => session.status === "pending"
  )

  return (
    <Step
      index={3}
      /*
       * "Review and pay", not "Payment method": the method is chosen inside
       * Cashfree's form, so naming this step after a choice it does not offer
       * only promised something the page could not deliver. What it is for is
       * the last look before money moves — the total, the terms, one action.
       */
      title="Review and pay"
      step="payment"
      complete={!isOpen && paymentReady}
      editTestId="edit-payment-button"
    >
      {isOpen ? (
        <div className="flex flex-col gap-6">
          {cashfreeProvider ? (
            /*
             * No chooser. Cashfree's form offers card, UPI, netbanking and
             * wallets on one screen, so picking one here only asked the same
             * question twice — and picking wrongly used to send the customer
             * to a form for the method they had not chosen.
             */
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <CardBrandMarks />
                <UpiBrandMarks />
              </div>
              <p className="max-w-prose text-sm leading-6 text-muted">
                Cards, UPI, netbanking and wallets. Your details are entered on
                Cashfree&rsquo;s secure form, which opens over this page.
              </p>
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
            . Payment opens over this page.
          </p>

          <StepActions className="static mx-0 border-0 bg-transparent p-0 backdrop-blur-none supports-[backdrop-filter]:bg-transparent sm:mx-0 sm:px-0">
            {/*
              The order is placed from here now. This used to be a "continue"
              that navigated to a dedicated page holding the card fields; with
              the drop-in there is nothing on that page to fill in, so it was a
              screen that asked for nothing and cost a click.

              Until the session exists, `PaymentButton` cannot tell which
              provider it is rendering for and falls back to "Select a payment
              method" — which is no longer a thing anyone can do. It stands in
              as a disabled Place order instead, for the moment it takes the
              effect above to open the session.
            */}
            {cashfreeSessionReady ? (
              <PaymentButton
                cart={cart}
                label="Place order"
                data-testid="submit-order-button"
              />
            ) : (
              <Button
                variant="action"
                size="large"
                block
                className="lg:w-auto"
                disabled
                isLoading={!error}
                data-testid="submit-order-button"
              >
                Place order
              </Button>
            )}
            <ErrorMessage
              error={error}
              data-testid="payment-method-error-message"
            />
          </StepActions>
        </div>
      ) : paymentReady ? (
        <p className="text-sm text-muted">Ready to pay.</p>
      ) : null}
    </Step>
  )
}

export default Payment
