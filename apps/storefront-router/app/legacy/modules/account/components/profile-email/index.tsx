import { HttpTypes } from "@medusajs/types"

/**
 * The account email, shown but not editable.
 *
 * It used to be an edit form whose action was a stub — it discarded the input
 * and returned `{ success: true }`, so the customer got a green "Email updated"
 * message and nothing changed. That is worse than not offering it: they would
 * only discover it on the next order confirmation going to the old address.
 *
 * Medusa's store API has no customer-email update, and the address is the
 * identity the auth record is keyed on, so changing it is a support job. This
 * says so.
 */
const ProfileEmail = ({ customer }: { customer: HttpTypes.StoreCustomer }) => (
  <div
    className="flex flex-col gap-1 border-b border-line py-5"
    data-testid="account-email-editor"
  >
    <span className="text-xs text-muted">Email</span>
    <span className="text-sm text-ink" data-testid="current-info">
      {customer.email}
    </span>
    <p className="mt-1 text-xs leading-5 text-muted">
      This is what you sign in with, so we change it by hand. Email{" "}
      <a
        href={`mailto:support@valy.in?subject=Change%20account%20email%20for%20${encodeURIComponent(
          customer.email
        )}`}
        className="text-accent hover:text-accent-strong"
      >
        support@valy.in
      </a>{" "}
      from the current address and we will move it.
    </p>
  </div>
)

export default ProfileEmail
