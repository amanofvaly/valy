"use client"

import { useLinkStatus } from "next/link"

/**
 * The pending state for a product card.
 *
 * A grid of forty cards must not sprout forty spinners, and a page-level bar
 * does not tell you *which* card you hit. So the indicator is a ring drawn
 * around the one card whose navigation is in flight, held back for 150ms so a
 * prefetched destination never flashes it.
 */
const CardPending = () => {
  const { pending } = useLinkStatus()

  if (!pending) {
    return null
  }

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 animate-pending-appear rounded-lg ring-2 ring-inset ring-accent"
    />
  )
}

export default CardPending
