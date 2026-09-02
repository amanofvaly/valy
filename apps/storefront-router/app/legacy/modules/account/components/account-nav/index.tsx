"use client"

import { signout } from "@lib/data/customer-actions"
import { cn } from "@lib/util/cn"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import User from "@modules/common/icons/user"
import { useParams, usePathname } from "next/navigation"
import { marketPath } from "~/lib/market"

/**
 * The account sidebar, and on a phone a row of links.
 *
 * One list of destinations rather than the two divergent copies this had — a
 * desktop rail and a completely separate mobile screen that only appeared on
 * `/account` and hid every link once you were inside one of them.
 */

const LINKS = [
  { href: "/account", label: "Overview", icon: User, testId: "overview-link" },
  {
    href: "/account/profile",
    label: "Profile",
    icon: User,
    testId: "profile-link",
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    icon: MapPin,
    testId: "addresses-link",
  },
  {
    href: "/account/orders",
    label: "Orders",
    icon: Package,
    testId: "orders-link",
  },
]

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const isActive = (href: string) => route === marketPath(countryCode, href)

  return (
    <nav aria-label="Account" data-testid="account-nav">
      <p className="mb-4 hidden text-sm text-muted lg:block">
        Signed in as{" "}
        <span className="text-ink" data-testid="customer-email">
          {customer?.email}
        </span>
      </p>

      {/* Horizontal and scrollable on a phone, a rail from `lg` up. */}
      <ul className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map((link) => {
          const Icon = link.icon
          const active = isActive(link.href)

          return (
            <li key={link.href} className="shrink-0">
              <LocalizedClientLink
                href={link.href}
                data-testid={link.testId}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex items-center gap-2 rounded px-3 py-2 text-sm",
                  active
                    ? "bg-surface font-medium text-ink"
                    : "text-muted hover:bg-surface hover:text-ink"
                )}
              >
                <Icon size={16} />
                {link.label}
                <ChevronDown className="-rotate-90 lg:hidden" size={14} />
              </LocalizedClientLink>
            </li>
          )
        })}

        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-line lg:pt-4">
          <button
            type="button"
            onClick={() => signout(countryCode)}
            data-testid="logout-button"
            className="pressable flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-muted hover:bg-surface hover:text-ink"
          >
            <ArrowRightOnRectangle />
            Sign out
          </button>
        </li>
      </ul>
    </nav>
  )
}

export default AccountNav
