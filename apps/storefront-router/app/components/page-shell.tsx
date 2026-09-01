import { BarsThree, Envelope, XMark } from "@medusajs/icons"
import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { cartItemCount } from "@lib/util/cart-builds"
import { ValyMark } from "@modules/common/components/valy-mark"
import { countryFromPath, DEFAULT_COUNTRY, marketPath } from "~/lib/market"
import { shellQuery } from "../../src/data/catalogue"
import { cartQuery } from "../../src/data/session"
import { PoweredBy } from "./powered-by"

const navLinks = [
  ["/products/valy-flow", "Flow"],
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
      {/*
       * A sign-off, not a directory. With one machine in the catalogue there is
       * nothing here to browse, so the footer carries the two things still
       * worth reaching for at the foot of a page — a person to talk to, and the
       * terms the purchase runs on — and gives the brand line the size it was
       * always writing at.
       *
       * The Catalogue and "Where to start" columns that used to sit here were
       * built from the shell query, so they arrived a beat after the markup and
       * the grid re-flowed under the reader on first paint. Everything below is
       * static, which is the other half of why it is laid out this way.
       */}
      <footer className="mt-20 border-t border-line bg-surface">
        <div className="container-page flex flex-col gap-10 py-14 lg:flex-row lg:items-start lg:justify-between lg:gap-20 lg:py-16">
          <div className="flex max-w-lg flex-col gap-5">
            <Link to={marketPath(countryCode, "/")} className="pressable flex w-fit items-center gap-2 rounded text-lg font-semibold tracking-tight text-ink"><ValyMark className="h-5 w-5 shrink-0" />Valy Homelabs</Link>
            <p className="text-pretty text-lg leading-8 text-muted lg:text-xl lg:leading-9">Home servers for everyone. Keep your photographs, films and work on hardware you own.</p>
          </div>
          <div className="flex flex-col gap-6 lg:items-end">
            <div className="flex flex-col gap-3 lg:items-end">
              <a href="mailto:support@valy.in" className="pressable flex w-fit items-center gap-2.5 rounded text-base text-ink hover:text-accent"><Envelope className="shrink-0 text-muted" />support@valy.in</a>
              {navLink("/contact", "Contact us", "pressable w-fit rounded text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-accent")}
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 lg:justify-end" aria-label="Policies">{policyLinks.map(([href, label]) => navLink(href, label, "pressable rounded text-xs text-muted hover:text-ink"))}</nav>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="container-page flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <PoweredBy />
            <p className="text-xs text-muted">© {new Date().getFullYear()} Valy Homelabs</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

