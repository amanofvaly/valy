import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { clx } from "@modules/common/components/ui"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import { isManual } from "@lib/constants"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"

  return (
    <RadioGroupPrimitive.Item
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "pressable flex w-full flex-col gap-2 rounded-lg border px-4 py-3.5 text-left",
        selectedPaymentOptionId === paymentProviderId
          ? "border-accent bg-accent-wash"
          : "border-line hover:border-line-strong"
      )}
    >
      <span className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <Radio checked={selectedPaymentOptionId === paymentProviderId} />
          <span className="text-sm text-ink">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </span>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden sm:block" />
          )}
        </span>
        <span className="text-muted">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </span>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="text-2xs sm:hidden" />
      )}
      {children}
    </RadioGroupPrimitive.Item>
  )
}

export default PaymentContainer

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "15px",
          color: "#15181c",
          "::placeholder": {
            color: "#666c75",
          },
        },
      },
      classes: {
        base: "block h-11 w-full rounded border border-line bg-paper px-3 pt-3.5 hover:border-line-strong focus:border-accent focus:outline-none",
        focus: "border-accent",
        invalid: "border-danger",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <span className="mt-2 block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Card details
            </span>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
          </span>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
