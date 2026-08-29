"use client"

import { isCashfree, isManual, isStripeLike } from "@lib/constants"
import { useCashfree } from "@modules/checkout/components/cashfree/context"
import { placeOrder } from "@lib/data/cart-actions"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
  label?: string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
  label,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isCashfree(paymentSession?.provider_id):
      return (
        <CashfreePaymentButton
          notReady={notReady}
          cart={cart}
          label={label}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return (
        <Button variant="action" disabled>
          Select a payment method
        </Button>
      )
  }
}

/**
 * Pay with Cashfree, then place the order.
 *
 * Two calls in one press, and the order matters. `pay()` runs first and only
 * resolves once Cashfree has an outcome — a card authorised, a 3-D Secure
 * challenge answered, a UPI request approved in the customer's app. Only then
 * is the cart completed, and completing it makes Medusa ask our provider what
 * happened, which asks Cashfree. So the order is created against Cashfree's
 * answer rather than against the browser's claim about it: a customer who
 * closes the 3-D Secure modal gets an error here and no order, and a payment
 * that succeeded but whose browser never came back is picked up by the
 * webhook.
 */
const CashfreePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
  label = "Place order",
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  label?: string
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const cashfree = useCashfree()

  if (cashfree?.usesInlineQrAction) {
    return null
  }

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const paymentSessionId = (session?.data as Record<string, unknown>)
    ?.payment_session_id as string | undefined

  const handlePayment = async () => {
    if (!cashfree || !paymentSessionId) {
      setErrorMessage("The payment form is not ready yet.")
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    const result = await cashfree.pay(paymentSessionId)

    if (!result.ok) {
      setErrorMessage(result.message)
      setSubmitting(false)
      return
    }

    /*
     * Not reset on the way out: `placeOrder` navigates to the confirmation
     * page, and re-enabling the button first gives a customer a live "Place
     * order" to press twice while the redirect is in flight.
     */
    await placeOrder().catch((error: Error) => {
      setErrorMessage(error.message)
      setSubmitting(false)
    })
  }

  return (
    <>
      <Button
        variant="action"
        block
        className="lg:w-auto"
        size="large"
        disabled={notReady || !cashfree?.ready}
        isLoading={submitting}
        onClick={handlePayment}
        data-testid={dataTestId}
      >
        {label}
      </Button>
      <ErrorMessage error={errorMessage} data-testid="cashfree-payment-error" />
    </>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        variant="action"
        block
        className="lg:w-auto"
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <>
      <Button
        variant="action"
        block
        className="lg:w-auto"
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid="submit-order-button"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
