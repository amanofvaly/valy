"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StatusPage from "@modules/common/components/status-page"
import { Button } from "@modules/common/components/ui"
import { useEffect } from "react"

/**
 * The checkout's own error boundary.
 *
 * Separate from the storefront's because the reassurance a customer needs here
 * is specific: whether they have been charged. Saying so first is the whole
 * point of this page existing.
 */
export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Checkout render failed:", error)
  }, [error])

  return (
    <StatusPage
      eyebrow="Checkout"
      title="Something went wrong before we took payment."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="secondary">
            <LocalizedClientLink href="/cart">Back to cart</LocalizedClientLink>
          </Button>
        </>
      }
    >
      <p>
        <strong className="font-medium text-ink">
          You have not been charged.
        </strong>{" "}
        Your cart is intact and nothing has been ordered. Trying again is safe —
        it will not place two orders.
      </p>
      <p>
        If it keeps failing, email{" "}
        <a
          href="mailto:support@valy.in"
          className="text-accent hover:text-accent-strong"
        >
          support@valy.in
        </a>
        {error.digest && (
          <>
            {" "}
            with{" "}
            <span className="font-mono text-sm text-ink">{error.digest}</span>
          </>
        )}{" "}
        and we will take the order manually.
      </p>
    </StatusPage>
  )
}
