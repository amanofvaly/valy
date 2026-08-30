import { Link, useLocation, useRouterState } from "@tanstack/react-router"
import { cn } from "@modules/common/components/ui"
import { countryFromPath, marketPath } from "~/lib/market"

type Props = Omit<React.ComponentProps<typeof Link>, "to" | "children"> & {
  href: string
  showPending?: boolean
  children?: React.ReactNode
}

export default function LocalizedLink({ href, showPending, children, ...props }: Props) {
  const countryCode = countryFromPath(useLocation().pathname)
  const to = marketPath(countryCode, href)
  /*
   * `location` is the target the router is moving to and updates the moment a
   * link is activated; `resolvedLocation` is the last committed one. Comparing
   * against `resolvedLocation` lit the spinner on the link for the page you
   * were already on and never during the navigation itself.
   */
  const pending = useRouterState({
    select: (state) =>
      state.status === "pending" &&
      state.location.pathname === to &&
      state.resolvedLocation?.pathname !== to,
  })

  return (
    <Link to={to} preload="intent" {...props}>
      {children}
      {showPending && pending ? <LinkPending /> : null}
    </Link>
  )
}

export function LinkPending({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading" className={cn("ml-1.5 inline-flex animate-pending-appear", className)}>
      <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />
    </span>
  )
}
