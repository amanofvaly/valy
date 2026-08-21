"use client"

import { setAddresses } from "@lib/data/cart-actions"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import Step from "@modules/checkout/components/step"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"
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
  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart.shipping_address, cart.billing_address)
      : true
  )

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <Step
      index={1}
      title="Address"
      step="address"
      complete={!!cart?.shipping_address && !!cart?.email}
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
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        cart?.shipping_address && (
          <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
            <div
              className="flex flex-col gap-0.5"
              data-testid="shipping-address-summary"
            >
              <dt className="text-xs font-medium text-ink">Delivering to</dt>
              <dd className="text-muted">
                {cart.shipping_address.first_name}{" "}
                {cart.shipping_address.last_name}
                <br />
                {cart.shipping_address.address_1}
                {cart.shipping_address.address_2 && (
                  <>
                    <br />
                    {cart.shipping_address.address_2}
                  </>
                )}
                <br />
                {cart.shipping_address.city} {cart.shipping_address.postal_code}
                <br />
                {cart.shipping_address.country_code?.toUpperCase()}
              </dd>
            </div>

            <div
              className="flex flex-col gap-0.5"
              data-testid="shipping-contact-summary"
            >
              <dt className="text-xs font-medium text-ink">Contact</dt>
              <dd className="text-muted">
                {cart.shipping_address.phone}
                <br />
                {cart.email}
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
                    {cart.billing_address?.first_name}{" "}
                    {cart.billing_address?.last_name}
                    <br />
                    {cart.billing_address?.address_1}
                    <br />
                    {cart.billing_address?.city}{" "}
                    {cart.billing_address?.postal_code}
                    <br />
                    {cart.billing_address?.country_code?.toUpperCase()}
                  </>
                )}
                {!!cart.metadata?.gstin && (
                  <>
                    <br />
                    <span className="font-mono text-xs text-ink">
                      GSTIN {String(cart.metadata.gstin)}
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
