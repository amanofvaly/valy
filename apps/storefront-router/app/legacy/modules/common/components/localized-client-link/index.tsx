"use client"

import { cn } from "@modules/common/components/ui"
import Link, { useLinkStatus } from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * A `<Link>` that keeps the current country code in the URL without every call
 * site having to pass it.
 *
 * It also carries the last rung of the responsiveness contract: when a
 * navigation takes long enough to notice, the pending indicator appears **on
 * the element that was clicked**, not somewhere else on screen.
 * `useLinkStatus` only reports inside a `<Link>` subtree, which is why the
 * indicator is a child component rather than something read up here.
 */

type LocalizedClientLinkProps = {
  children?: React.ReactNode
  href: string
  className?: string
  /**
   * Show a spinner in the link while the navigation is pending. Off by
   * default — on a grid of forty product links it would be noise.
   */
  showPending?: boolean
  [x: string]: unknown
}

/**
 * The country prefix, or the configured default.
 *
 * `useParams` returns nothing when there is no matching route segment — inside
 * an error boundary, most notably, which is the one place a broken link is
 * least forgivable. Without this the href becomes `/undefined/cart`.
 */
const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_REGION || "in"

const LocalizedClientLink = ({
  children,
  href,
  showPending,
  ...props
}: LocalizedClientLinkProps) => {
  const params = useParams()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : DEFAULT_COUNTRY

  return (
    <Link href={`/${countryCode}${href}`} {...props}>
      {children}
      {showPending && <LinkPending />}
    </Link>
  )
}

/**
 * The pending dot. Invisible for its first 150ms — see `pending-appear` in the
 * Tailwind config — so a navigation that lands quickly never flashes it.
 */
export const LinkPending = ({ className }: { className?: string }) => {
  const { pending } = useLinkStatus()

  if (!pending) {
    return null
  }

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("ml-1.5 inline-flex animate-pending-appear", className)}
    >
      <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />
    </span>
  )
}

export default LocalizedClientLink
