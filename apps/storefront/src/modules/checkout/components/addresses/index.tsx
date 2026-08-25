"use client"

import { setAddresses } from "@lib/data/cart-actions"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import Step from "@modules/checkout/components/step"
import { useRouter, useSearchParams } from "next/navigation"
import { useActionState, useEffect } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

/**
 * Step one: where it goes, who to invoice, and the GSTIN.
 *
 * The two GSTIN inputs — one on each address — collapse into
 * `cart.metadata.gstin` in `setAddresses`, with billing winning. That is the
 * entity the invoice is raised against, which is also what the backend derives
 * `is_b2b` from.
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

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart.shipping_address, cart.billing_address)
      : true
  )

  const [message, formAction] = useActionState(setAddresses, null)
  const submittedCart =
    message && typeof message !== "string" ? message.cart : null
  const currentCart = submittedCart ?? cart

  useEffect(() => {
    if (!message || typeof message === "string") {
      return
    }

    // This is a step change, not a page navigation. Keep the completed address
    // mounted while the server refreshes delivery data in the background.
    window.history.replaceState(
      null,
      "",
      `/${message.countryCode}/checkout?step=delivery`
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
          <ShippingAddress
            customer={customer}
            checked={sameAsBilling}
            onChange={toggleSameAsBilling}
            cart={cart}
          />

          {!sameAsBilling && (
            <div className="mb-6 flex flex-col gap-4">
              <h3 className="text-base font-medium text-ink">
                Billing address
              </h3>
              <BillingAddress cart={cart} />
            </div>
          )}

          <div>
            <SubmitButton size="large" data-testid="submit-address-button">
              Continue to delivery
            </SubmitButton>
            <ErrorMessage
              error={typeof message === "string" ? message : null}
              data-testid="address-error-message"
            />
          </div>
        </form>
      ) : (
        currentCart?.shipping_address && (
          <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
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

            <div
              className="flex flex-col gap-0.5"
              data-testid="billing-address-summary"
            >
              <dt className="text-xs font-medium text-ink">Invoice to</dt>
              <dd className="text-muted">
                {sameAsBilling ? (
                  "Same as the delivery address."
                ) : (
                  <>
                    {currentCart.billing_address?.first_name}{" "}
                    {currentCart.billing_address?.last_name}
                    <br />
                    {currentCart.billing_address?.address_1}
                    <br />
                    {currentCart.billing_address?.city}{" "}
                    {currentCart.billing_address?.postal_code}
                    <br />
                    {currentCart.billing_address?.country_code?.toUpperCase()}
                  </>
                )}
                {!!currentCart.metadata?.gstin && (
                  <>
                    <br />
                    <span className="font-mono text-xs text-ink">
                      GSTIN {String(currentCart.metadata.gstin)}
                    </span>
                  </>
                )}
              </dd>
            </div>
          </dl>
        )
      )}
    </Step>
  )
}

export default Addresses
