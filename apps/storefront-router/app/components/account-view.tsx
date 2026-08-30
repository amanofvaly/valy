import type { HttpTypes } from "@medusajs/types"
import AccountPageHeader from "@modules/account/components/page-header"
import AddressBook from "@modules/account/components/address-book"
import OrderOverview from "@modules/account/components/order-overview"
import Overview from "@modules/account/components/overview"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import ProfilePhone from "@modules/account/components/profile-phone"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import AccountLayout from "@modules/account/templates/account-layout"
import LoginTemplate from "@modules/account/templates/login-template"

type Account = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[]
  regions: HttpTypes.StoreRegion[]
}

/*
 * The account area's pages, under one shell.
 *
 * Next served these as parallel routes (`@dashboard` / `@login`), which has no
 * equivalent here, so the shell picks the page instead. Signed out, every
 * account URL shows the sign-in form — the same thing the `@login` slot did.
 */
export default function AccountView({
  page,
  customer,
  orders,
  regions,
  countryCode,
}: Account & {
  page: "overview" | "profile" | "addresses" | "orders"
  countryCode: string
}) {
  if (!customer) {
    return (
      <AccountLayout customer={null}>
        <LoginTemplate />
      </AccountLayout>
    )
  }

  const region =
    regions.find((r) =>
      r.countries?.some((c) => c.iso_2?.toLowerCase() === countryCode.toLowerCase())
    ) ?? regions[0]

  return (
    <AccountLayout customer={customer}>
      {page === "overview" && <Overview customer={customer} orders={orders} />}

      {page === "profile" && (
        <div className="w-full" data-testid="profile-page-wrapper">
          <AccountPageHeader
            title="Profile"
            description="Your name, how we reach you, and the address the invoice is raised against."
          />
          <div className="flex w-full flex-col">
            <ProfileName customer={customer} />
            <ProfileEmail customer={customer} />
            <ProfilePhone customer={customer} />
            <ProfileBillingAddress customer={customer} regions={regions} />
          </div>
        </div>
      )}

      {page === "addresses" && region && (
        <div className="w-full" data-testid="addresses-page-wrapper">
          <AccountPageHeader
            title="Addresses"
            description="Saved here, they fill themselves in at checkout. Add as many as you need."
          />
          <AddressBook customer={customer} region={region} />
        </div>
      )}

      {page === "orders" && (
        <div className="w-full" data-testid="orders-page-wrapper">
          <AccountPageHeader
            title="Orders"
            description="Every order, its invoice and the test sheet for the machine. To return something inside the seven-day window, email support@valy.in."
          />
          <div className="flex flex-col gap-10">
            <OrderOverview orders={orders} />
            <div className="border-t border-line pt-8">
              <TransferRequestForm />
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  )
}
