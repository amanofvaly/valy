"use client"

import { setAddresses } from "@lib/data/cart-actions"
import { HttpTypes } from "@medusajs/types"
import Step from "@modules/checkout/components/step"
import { useRouter, useSearchParams } from "next/navigation"
import { useActionState, useEffect, useRef } from "react"
import { marketPath } from "~/lib/market"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import StepActions from "../step-actions"
import { SubmitButton } from "../submit-button"

/**
 * Step one: where it goes.
 *
 * There is no separate billing address and no checkbox offering one. The
 * invoice is raised against the delivery address, which is what it was for
 * every order this store has taken; the alternative was a checkbox that
 * unfolded a second copy of the longest form on the site, one step before
 * paying, to serve a case nobody had asked for.
 */
const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isOpen = searchParams.get("step") === "address"

  const [message, formAction] = useActionState(setAddresses, null)
  const submittedCart =
    message && typeof message !== "string" ? message.cart : null
  const currentCart = submittedCart ?? cart

  // One advance per submission. `router.refresh()` below causes a re-render, so
  // an effect that could run twice for the same result would keep re-triggering
  // itself; this makes that impossible rather than relying on the dependencies.
  const advanced = useRef<unknown>(null)

  useEffect(() => {
    if (!message || typeof message === "string" || advanced.current === message) {
      return
    }

    advanced.current = message

    // This is a step change, not a page navigation. Keep the completed address
    // mounted while the server refreshes delivery data in the background. The
    // path has to be the canonical one for the market — the default market is
    // served unprefixed, so `/in/checkout` is a redirect, not a destination.
    window.history.replaceState(
      null,
      "",
      `${marketPath(message.countryCode, "/checkout")}?step=delivery`
    )
    router.refresh()
  }, [message, router])

  return (
    <Step
      index={1}
      title="Address"
      step="address"
      complete={!!currentCart?.shipping_address && !!currentCart?.email}
      editTestId="edit-address-button"
    >
      {isOpen ? (
        <form action={formAction} className="flex flex-col gap-2">
          <ShippingAddress customer={customer} cart={cart} />

          <StepActions>
            <SubmitButton
              variant="action"
              size="large"
              className="w-full lg:w-auto"
              data-testid="submit-address-button"
            >
              Continue to delivery
            </SubmitButton>
            <ErrorMessage
              error={typeof message === "string" ? message : null}
              data-testid="address-error-message"
            />
          </StepActions>
        </form>
      ) : (
        currentCart?.shipping_address && (
          <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
            <div
              className="flex flex-col gap-0.5"
              data-testid="shipping-address-summary"
            >
              <dt className="text-xs font-medium text-ink">Delivering to</dt>
              <dd className="text-muted">
                {currentCart.shipping_address.first_name}{" "}
                {currentCart.shipping_address.last_name}
                <br />
                {currentCart.shipping_address.address_1}
                {currentCart.shipping_address.address_2 && (
                  <>
                    <br />
                    {currentCart.shipping_address.address_2}
                  </>
                )}
                <br />
                {currentCart.shipping_address.city}{" "}
                {currentCart.shipping_address.postal_code}
                <br />
                {currentCart.shipping_address.country_code?.toUpperCase()}
              </dd>
            </div>

            <div
              className="flex flex-col gap-0.5"
              data-testid="shipping-contact-summary"
            >
              <dt className="text-xs font-medium text-ink">Contact</dt>
              <dd className="text-muted">
                {currentCart.shipping_address.phone}
                <br />
                {currentCart.email}
              </dd>
            </div>
          </dl>
        )
      )}
    </Step>
  )
}

export default Addresses
