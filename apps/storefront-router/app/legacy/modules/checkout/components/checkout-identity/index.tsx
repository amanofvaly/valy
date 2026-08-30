import type { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Who is checking out, in the header's right-hand slot.
 *
 * That slot held the words "Secure checkout", which is a claim every checkout
 * makes and none of them need to: the padlock is in the address bar and the
 * page says nothing else about security. Meanwhile the offer worth making —
 * sign in and the address fills itself in — was a banner sitting on top of the
 * form, pushing the thing it was offering to save you further down the screen.
 *
 * So the offer moves up here, where it costs no vertical space at all, and the
 * form starts at the top of the page.
 *
 * It carries a return path. Signing in from checkout used to land on the
 * account dashboard with the order left behind, which is the version of this
 * link that is worse than not having one.
 */
const CheckoutIdentity = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {

  if (customer) {
    return (
      <span
        className="hidden max-w-[16ch] truncate text-2xs text-muted sm:inline"
        data-testid="checkout-customer-email"
      >
        {customer.email}
      </span>
    )
  }

  return (
    <LocalizedClientLink
      href={`/account?redirect=${encodeURIComponent("/checkout?step=address")}`}
      className="pressable-tint -mr-2 rounded px-2 py-2 text-sm text-muted hover:text-ink"
      data-testid="checkout-sign-in-link"
    >
      Sign in
    </LocalizedClientLink>
  )
}

export default CheckoutIdentity
