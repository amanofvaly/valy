import { createContext, useContext } from "react"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"

const DestinationContext = createContext<string | null>(null)

export default function Link({ href, children, ...props }: Omit<React.ComponentProps<typeof RouterLink>, "to"> & { href: string }) {
  return (
    <DestinationContext.Provider value={href}>
      <RouterLink to={href} preload="intent" {...props}>{children}</RouterLink>
    </DestinationContext.Provider>
  )
}

export function useLinkStatus() {
  const href = useContext(DestinationContext)
  const pending = useRouterState({ select: (state) => state.status === "pending" && state.location.pathname === href })
  return { pending }
}
