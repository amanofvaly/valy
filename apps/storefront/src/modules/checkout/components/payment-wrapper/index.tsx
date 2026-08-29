"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isCashfree, isStripeLike } from "@lib/constants"
import { CashfreeProvider } from "@modules/checkout/components/cashfree/context"
import type { CashfreeMethod } from "@modules/checkout/components/cashfree/context"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  cashfreeMethod?: CashfreeMethod
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({
  cart,
  cashfreeMethod,
  children,
}) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  /*
   * The mode comes off the session rather than out of the storefront's own
   * environment. The backend already decided which Cashfree account this
   * order was created against, and a storefront configured for the other one
   * would load an SDK that cannot pay the session it was handed.
   */
  if (isCashfree(paymentSession?.provider_id)) {
    const mode =
      (paymentSession?.data as Record<string, unknown> | undefined)?.mode ===
      "production"
        ? "production"
        : "sandbox"
    const paymentSessionId =
      ((paymentSession?.data as Record<string, unknown> | undefined)
        ?.payment_session_id as string | undefined) ?? null

    return (
      <CashfreeProvider
        mode={mode}
        paymentSessionId={paymentSessionId}
        initialMethod={cashfreeMethod}
      >
        {children}
      </CashfreeProvider>
    )
  }

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
