"use client"

import { isCashfree } from "@lib/constants"
import { HttpTypes } from "@medusajs/types"
import Step from "@modules/checkout/components/step"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useSearchParams } from "next/navigation"
import PaymentButton from "../payment-button"
import StepActions from "../step-actions"

/**
 * The last step.
 *
 * The consent line used to reference "Medusa Store's Privacy Policy" — stock
 * copy from the starter, on the screen where someone agrees to terms before
 * paying. It now names this store's own policies and links to them, because a
 * consent statement that points at a document the customer cannot read is not
 * consent.
 */
const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()
  const isOpen = searchParams.get("step") === "review"

  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending"
  )

  const paidByGiftcard =
    !!(cart as unknown as Record<string, unknown>)?.gift_cards &&
    ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])
      ?.length > 0 &&
    cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  /*
   * Cashfree has no review step.
   *
   * Its card and UPI inputs are iframes, and an iframe that is unmounted takes
   * the half-typed card with it — so the fields cannot be filled in one step
   * and paid from the next. That leaves two honest arrangements: ask for the
   * card under "Review", which is not what the word means, or let the payment
   * step be the last one. This is the second. The consent line and the button
   * move up there with the fields, and nothing is left here to show.
   */
  if (isCashfree(activeSession?.provider_id)) {
    return null
  }

  return (
    <Step index={4} title="Review" step="review" enabled={false}>
      {isOpen && previousStepsCompleted && (
        <div className="flex flex-col gap-4">
          <p className="max-w-prose text-sm leading-6 text-muted">
            Placing the order confirms you have read and accept our{" "}
            <LocalizedClientLink
              href="/terms"
              className="text-accent hover:text-accent-strong"
            >
              terms of sale
            </LocalizedClientLink>
            , including the seven-day return window and the three-year warranty,
            and our{" "}
            <LocalizedClientLink
              href="/privacy"
              className="text-accent hover:text-accent-strong"
            >
              privacy policy
            </LocalizedClientLink>
            .
          </p>

          <StepActions>
            <PaymentButton cart={cart} data-testid="submit-order-button" />
          </StepActions>
        </div>
      )}
    </Step>
  )
}

export default Review
