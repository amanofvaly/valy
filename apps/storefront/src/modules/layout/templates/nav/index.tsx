import { getLocale } from "@lib/data/locale-actions"
import { listLocales } from "@lib/data/locales"
import { listRegions } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import CountrySelect from "@modules/layout/components/country-select"
import LanguageSelect from "@modules/layout/components/language-select"
import SideMenu from "@modules/layout/components/side-menu"
import { Suspense } from "react"

/**
 * The site header.
 *
 * Nothing in this component awaits anything. The header used to be an async
 * component that read regions, locales and the locale cookie before it could
 * render a single link, which meant the top of every page waited on three round
 * trips to display a wordmark.
 *
 * The two things that do need the API — the cart count, and the region and
 * language controls inside the mobile menu — stream in behind their own
 * boundaries. Both are places where a slightly late arrival costs nothing: the
 * cart link is already there and already clickable, and the region controls sit
 * inside a panel that is closed.
 *
 * The nav names the five things a visitor might be here for. "Compatibility" is
 * top-level on purpose: Synology uses that slot to express a restriction, and
 * this store uses it for the opposite.
 */

/*
 * Flow leads, and it points at the machine rather than at a category holding
 * one product.
 *
 * Machines and Services are deliberately absent. There is one machine, so a
 * category page for it is a list of length one standing between the visitor and
 * the thing they came for. And a service is an add-on to a machine — "Photo
 * library migration" is not a purchase that means anything to someone who does
 * not own a Flow yet — so services are sold where they apply, in the
 * configurator and on the machine page, not browsed in the catalogue.
 */
const NAV_LINKS = [
  { href: "/products/valy-flow", label: "Flow" },
  { href: "/categories/parts", label: "Parts" },
  { href: "/store", label: "All Products" },
  { href: "/compatibility", label: "Compatibility" },
  { href: "/getting-started", label: "Getting started" },
]

export default function Nav() {
  return (
    <header className="sticky inset-x-0 top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <nav
        className="container-page flex h-14 items-center gap-2 sm:h-16 sm:gap-4"
        aria-label="Main"
      >
        <div className="lg:hidden">
          <SideMenu links={NAV_LINKS}>
            <Suspense fallback={null}>
              <RegionControls />
            </Suspense>
          </SideMenu>
        </div>

        <LocalizedClientLink
          href="/"
          className="pressable -ml-1 rounded px-1 text-lg font-semibold tracking-tight text-ink"
          data-testid="nav-store-link"
        >
          Valy
        </LocalizedClientLink>

        <ul className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <LocalizedClientLink
                href={link.href}
                showPending
                className="pressable-tint inline-flex items-center rounded px-3 py-2 text-sm text-muted hover:text-ink"
              >
                {link.label}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1">
          <LocalizedClientLink
            href="/account"
            className="pressable-tint hidden rounded px-3 py-2 text-sm text-muted hover:text-ink sm:inline-flex"
            data-testid="nav-account-link"
          >
            Account
          </LocalizedClientLink>

          <Suspense
            fallback={
              <LocalizedClientLink
                href="/cart"
                className="pressable-tint rounded px-3 py-2 text-sm text-muted hover:text-ink"
                data-testid="nav-cart-link"
              >
                Cart
              </LocalizedClientLink>
            }
          >
            <CartButton />
          </Suspense>
        </div>
      </nav>
    </header>
  )
}

/**
 * Region and language pickers, streamed into the mobile menu's footer. They
 * live inside a closed panel, so arriving a moment after the header costs the
 * visitor nothing.
 */
async function RegionControls() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions(),
    listLocales(),
    getLocale(),
  ])

  return (
    <>
      {!!locales?.length && (
        <LanguageSelect locales={locales} currentLocale={currentLocale} />
      )}
      {!!regions.length && <CountrySelect regions={regions} />}
    </>
  )
}
