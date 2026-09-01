import { HttpTypes } from "@medusajs/types"
import React from "react"
import AccountNav from "../components/account-nav"

/**
 * The account shell.
 *
 * Signed out, this renders the sign-in and registration forms; signed in, a nav
 * rail beside the page. Those are different layouts and it now says so, rather
 * than always emitting a two-column grid — with the nav absent, `{customer &&
 * <AccountNav/>}` collapsed to nothing and the *content* became the grid's
 * first child, so the sign-in form was rendered into the 220px nav column.
 *
 * The old footer here pointed at `/customer-service`, a route that does not
 * exist. It now points at the two pages that answer the questions someone in
 * their account actually has, plus a real address to write to.
 */
const AccountLayout: React.FC<{
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}> = ({ customer, children }) => {
  if (!customer) {
    // The forms centre themselves; there is nothing to sit beside them.
    return (
      <div className="container-page py-12 lg:py-20" data-testid="account-page">
        {children}
      </div>
    )
  }

  return (
    <div className="container-page py-8 lg:py-12" data-testid="account-page">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">
        <AccountNav customer={customer} />
        <div className="min-w-0">{children}</div>
      </div>

      <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium text-ink">Need a hand?</h2>
          <p className="max-w-prose text-sm leading-6 text-muted">
            Drive replacement, adding a bay, or anything the machine is doing
            that it should not be.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a
            href="mailto:support@valy.in"
            className="text-accent hover:text-accent-strong"
          >
            support@valy.in
          </a>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
