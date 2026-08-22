import { declineTransferRequest } from "@lib/data/order-actions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * The landing page for the decline link in a transfer email.
 *
 * The action runs on render, so this page is the receipt for it. Both outcomes
 * say what is now true of the order rather than only whether a request
 * succeeded — that is the part the reader actually needs.
 */
export default async function TransferDecisionPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params
  const { success, error } = await declineTransferRequest(id, token)

  return (
    <div className="container-page max-w-xl py-12 lg:py-20">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          Transfer request
        </p>

        {success ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Transfer declined.
            </h1>
            <p className="text-base leading-7 text-muted">The order stays yours. Nothing has changed and the person who asked has been told.</p>
            <p className="font-mono text-sm tabular text-muted">{id}</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              We could not decline that request.
            </h1>
            <p className="max-w-prose text-base leading-7 text-muted">
              The link may already have been used, or it may have expired.
              Nothing about the order has changed.
            </p>
            {error && (
              <p className="rounded border border-danger bg-danger-wash px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <p className="text-sm leading-6 text-muted">
              Email{" "}
              <a
                href="mailto:support@valy.in"
                className="text-accent hover:text-accent-strong"
              >
                support@valy.in
              </a>{" "}
              and we will sort it out.
            </p>
          </>
        )}

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="secondary">
            <LocalizedClientLink href="/account/orders">
              Your orders
            </LocalizedClientLink>
          </Button>
        </div>
      </div>
    </div>
  )
}
