import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The account landing page.
 *
 * The previous version rendered its whole body inside `hidden small:block`, so
 * on a phone the account page was empty below the nav. There is one version
 * now, and it leads with the orders — which is the only reason anybody signs
 * in to a hardware store.
 */

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => (
  <div className="flex flex-col gap-8" data-testid="overview-page-wrapper">
    <header className="flex flex-col gap-1">
      {/* A customer record without a first name — an admin user linked to one,
          most commonly — otherwise renders a dangling "Hello ". */}
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        <span data-testid="welcome-message" data-value={customer?.first_name}>
          {customer?.first_name ? `Hello ${customer.first_name}` : "Your account"}
        </span>
      </h1>
      <p className="text-sm text-muted">
        Signed in as{" "}
        <span data-testid="customer-email" data-value={customer?.email}>
          {customer?.email}
        </span>
      </p>
    </header>

    <section aria-labelledby="recent-orders">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 id="recent-orders" className="text-lg font-semibold text-ink">
          Recent orders
        </h2>
        {!!orders?.length && (
          <LocalizedClientLink
            href="/account/orders"
            className="text-sm text-accent hover:text-accent-strong"
          >
            All orders
          </LocalizedClientLink>
        )}
      </div>

      {orders?.length ? (
        <ul
          className="divide-y divide-line border-y border-line"
          data-testid="orders-wrapper"
        >
          {orders.slice(0, 5).map((order) => (
            <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
              <LocalizedClientLink
                href={`/account/orders/details/${order.id}`}
                data-testid="open-order-button"
                className="pressable-tint flex items-center justify-between gap-4 rounded py-4"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className="font-mono text-sm tabular text-ink"
                    data-testid="order-id"
                    data-value={order.display_id}
                  >
                    #{order.display_id}
                  </span>
                  <span
                    className="text-xs text-muted"
                    data-testid="order-created-date"
                  >
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {" · "}
                    {order.items?.length ?? 0}{" "}
                    {(order.items?.length ?? 0) === 1 ? "line" : "lines"}
                  </span>
                </span>

                <span
                  className="shrink-0 font-mono text-sm tabular text-ink"
                  data-testid="order-amount"
                >
                  {convertToLocale({
                    amount: order.total,
                    currency_code: order.currency_code,
                  })}
                </span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="rounded-lg border border-dashed border-line-strong px-5 py-10 text-center text-sm text-muted"
          data-testid="no-orders-message"
        >
          No orders yet.
        </p>
      )}
    </section>

    <section aria-labelledby="account-state">
      <h2 id="account-state" className="mb-3 text-lg font-semibold text-ink">
        Your details
      </h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <div className="flex flex-col gap-1 bg-paper p-4">
          <dt className="text-xs text-muted">Profile</dt>
          <dd
            className="font-mono text-2xl font-medium tabular text-ink"
            data-testid="customer-profile-completion"
            data-value={getProfileCompletion(customer)}
          >
            {getProfileCompletion(customer)}%
          </dd>
          <dd className="text-xs text-muted">complete</dd>
        </div>
        <div className="flex flex-col gap-1 bg-paper p-4">
          <dt className="text-xs text-muted">Addresses</dt>
          <dd
            className="font-mono text-2xl font-medium tabular text-ink"
            data-testid="addresses-count"
            data-value={customer?.addresses?.length || 0}
          >
            {customer?.addresses?.length || 0}
          </dd>
          <dd className="text-xs text-muted">saved</dd>
        </div>
      </dl>
    </section>
  </div>
)

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  if (customer.addresses?.find((addr) => addr.is_default_billing)) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
