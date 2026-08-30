import { createFileRoute } from "@tanstack/react-router"
import { PageShell } from "../../app/components/page-shell"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { acceptTransfer } from "../data/session"

/**
 * The landing page for the transfer link in a transfer email.
 *
 * The action runs before the page renders, so this page is the receipt for it.
 * Both outcomes say what is now true of the order rather than only whether a
 * request succeeded — that is the part the reader actually needs.
 */
export const Route = createFileRoute("/order/$id/transfer/$token/accept")({
  loader: ({ params }) => acceptTransfer(params.id, params.token),
  head: () => ({ meta: [{ title: "Transfer request · Valy" }] }),
  component: DecisionRoute,
})

function DecisionRoute() {
  const { id } = Route.useParams()
  const { success, error } = Route.useLoaderData()

  return (
    <PageShell>
      <div className="container-page max-w-xl py-12 lg:py-20">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
            Transfer request
          </p>

          {success ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Order transferred.
              </h1>
              <p className="text-base leading-7 text-muted">It now belongs to the new owner. They will see the invoice, the delivery details and the warranty from here on.</p>
              <p className="font-mono text-sm tabular text-muted">{id}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                We could not transfer that order.
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
                <a href="mailto:support@valy.in" className="text-accent hover:text-accent-strong">
                  support@valy.in
                </a>{" "}
                and we will sort it out.
              </p>
            </>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary">
              <LocalizedClientLink href="/account/orders">Your orders</LocalizedClientLink>
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
