import { BarsThree, Envelope, Phone, XMark } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { cartItemCount } from "@lib/util/cart-builds"
import { ValyMark } from "@modules/common/components/valy-mark"
import { countryFromPath, DEFAULT_COUNTRY, marketPath } from "~/lib/market"
import { shellQuery } from "../../src/data/catalogue"
import { cartQuery } from "../../src/data/session"

const navLinks = [
  ["/products/valy-flow", "Flow"], ["/categories/parts", "Parts"],
  ["/store", "All Products"], ["/compatibility", "Compatibility"],
  ["/getting-started", "Getting started"],
] as const
const learnLinks = [
  ["/compatibility", "What fits what"], ["/getting-started", "Getting started"],
  ["/getting-started#raid", "RAID calculator"], ["/getting-started#capacity", "How much space do I need"],
] as const
const policyLinks = [
  ["/refund-cancellations", "Refunds & Cancellations"], ["/shipping-delivery", "Shipping & Delivery"],
  ["/terms", "Terms of sale"], ["/privacy", "Privacy"],
] as const

export function PageShell({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const countryCode = countryFromPath(location.pathname)
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: cartData } = useQuery(cartQuery())
  const { data: shell } = useQuery(shellQuery())
  const count = cartItemCount(cartData?.cart?.items)
  const localPath = countryCode === DEFAULT_COUNTRY ? location.pathname : location.pathname.replace(new RegExp(`^/${countryCode}(?=/|$)`), "") || "/"

  const switchMarket = (nextCountry: string) => {
    setMenuOpen(false)
    void navigate({ to: marketPath(nextCountry, localPath) })
  }
  const navLink = (href: string, label: string, className: string) => (
    <Link key={href} to={marketPath(countryCode, href)} preload="intent" className={className} onClick={() => setMenuOpen(false)}>{label}</Link>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky inset-x-0 top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <nav className="container-page flex h-14 items-center gap-2 sm:h-16 sm:gap-4" aria-label="Main">
          <button type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="pressable-tint -ml-2 inline-flex h-10 w-10 items-center justify-center rounded lg:hidden">{menuOpen ? <XMark /> : <BarsThree />}</button>
          <Link to={marketPath(countryCode, "/")} preload="intent" className="pressable -ml-1 flex shrink-0 items-center gap-2 rounded px-1 text-lg font-semibold tracking-tight text-ink"><ValyMark className="h-5 w-5 shrink-0" /><span>Valy</span></Link>
          <ul className="ml-4 hidden items-center gap-1 lg:flex">{navLinks.map(([href, label]) => <li key={href}>{navLink(href, label, "pressable-tint inline-flex items-center rounded px-3 py-2 text-sm text-muted hover:text-ink")}</li>)}</ul>
          <div className="ml-auto flex items-center gap-1">
            {navLink("/account", "Account", "pressable-tint hidden rounded px-3 py-2 text-sm text-muted hover:text-ink sm:inline-flex")}
            <Link to={marketPath(countryCode, "/cart")} preload="intent" className="pressable-tint rounded px-3 py-2 text-sm text-muted hover:text-ink">Cart{count ? ` (${count})` : ""}</Link>
          </div>
        </nav>
        {menuOpen ? <div className="absolute inset-x-0 top-full border-b border-line bg-paper shadow-lg lg:hidden"><div className="container-page flex max-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto py-4">
          {navLinks.map(([href, label]) => navLink(href, label, "pressable-tint rounded px-3 py-3 text-lg font-medium text-ink"))}
          <div className="my-3 border-t border-line" />
          {navLink("/account", "Account", "pressable-tint rounded px-3 py-2.5 text-base text-muted")}
          {navLink("/cart", `Cart${count ? ` (${count})` : ""}`, "pressable-tint rounded px-3 py-2.5 text-base text-muted")}
          {shell?.regions?.length ? <label className="mt-4 flex items-center justify-between gap-4 border-t border-line px-3 pt-5 text-sm text-muted">Market<select value={countryCode} onChange={(event) => switchMarket(event.target.value)} className="rounded border border-line bg-paper px-3 py-2 text-ink">{shell.regions.flatMap((region) => region.countries || []).map((country) => <option key={country.iso_2} value={country.iso_2?.toLowerCase()}>{country.display_name}</option>)}</select></label> : null}
        </div></div> : null}
      </header>
      <main id="content" className="flex-1">{children ?? <Outlet />}</main>
      <footer className="mt-20 border-t border-line bg-surface">
        <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-5 lg:py-16">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-1">
            <Link to={marketPath(countryCode, "/")} className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink"><ValyMark className="h-5 w-5" />Valy Homelabs</Link>
            <p className="max-w-xs text-sm leading-6 text-muted">Home Servers for everyone. Keep your photographs and your films and your work on hardware you own.</p>
            <a href="mailto:support@valy.in" className="pressable flex w-fit items-center gap-2 rounded text-sm text-ink hover:text-accent"><Envelope className="text-muted" />support@valy.in</a>
            <a href="tel:+919971779734" className="pressable flex w-fit items-center gap-2 rounded text-sm text-ink hover:text-accent"><Phone className="text-muted" />+91 99717 79734</a>
            {navLink("/contact", "Contact us", "pressable w-fit rounded text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-accent")}
          </div>
          {shell?.categories?.filter((category) => !category.parent_category_id).length ? <FooterColumn title="Catalogue">{shell.categories.filter((category) => !category.parent_category_id).map((category) => navLink(`/categories/${category.handle}`, category.name, "text-sm text-muted hover:text-ink"))}</FooterColumn> : null}
          {shell?.collections?.length ? <FooterColumn title="Where to start">{shell.collections.map((collection) => navLink(`/collections/${collection.handle}`, collection.title, "text-sm text-muted hover:text-ink"))}</FooterColumn> : null}
          <FooterColumn title="Learn">{learnLinks.map(([href, label]) => navLink(href, label, "text-sm text-muted hover:text-ink"))}</FooterColumn>
          <FooterColumn title="Policy">{policyLinks.map(([href, label]) => navLink(href, label, "text-sm text-muted hover:text-ink"))}</FooterColumn>
        </div>
        <div className="border-t border-line"><div className="container-page flex flex-col gap-4 py-6 text-2xs text-muted sm:flex-row sm:justify-between"><p>Powered by Medusa, Cashfree, Shiprocket, Mastercard, ICICI Bank, TrueNAS</p><p>© {new Date().getFullYear()} Valy Homelabs</p></div></div>
      </footer>
    </div>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode[] }) {
  return <div className="flex flex-col gap-3"><h2 className="text-xs font-medium text-ink">{title}</h2><div className="flex flex-col gap-2.5">{children}</div></div>
}
