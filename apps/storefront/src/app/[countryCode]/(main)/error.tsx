"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StatusPage from "@modules/common/components/status-page"
import { Button } from "@modules/common/components/ui"
import { useEffect } from "react"

/**
 * The error boundary for the storefront.
 *
 * There was none. Any thrown render — a backend blip, a malformed response —
 * fell through to Next's default screen, which on production says only
 * "Application error: a client-side exception has occurred" with the nav gone
 * and no way back into the site.
 *
 * The most likely cause by far is the backend being unreachable, which is the
 * stated trade-off of reading everything live. So the copy says that, and
 * offers the two things that actually help: try again, or go somewhere that
 * does not need the API.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Storefront render failed:", error)
  }, [error])

  return (
    <StatusPage
      eyebrow="Something broke"
      title="We could not load that."
      actions={
        <>
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="secondary">
            <LocalizedClientLink href="/getting-started">
              Read something instead
            </LocalizedClientLink>
          </Button>
        </>
      }
    >
      <p>
        Usually this means our server is briefly unreachable rather than
        anything being wrong with your order or your account. Nothing has been
        charged and nothing has been lost.
      </p>
      <p>
        If it keeps happening, email{" "}
        <a
          href="mailto:hello@valy.in"
          className="text-accent hover:text-accent-strong"
        >
          hello@valy.in
        </a>
        {error.digest && (
          <>
            {" "}
            and quote{" "}
            <span className="font-mono text-sm text-ink">{error.digest}</span>
          </>
        )}
        .
      </p>
    </StatusPage>
  )
}
