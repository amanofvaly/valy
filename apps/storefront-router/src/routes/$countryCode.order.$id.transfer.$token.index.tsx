import { createFileRoute } from "@tanstack/react-router"
import { PageShell } from "../../app/components/page-shell"
import TransferActions from "@modules/order/components/transfer-actions"

/**
 * An order transfer request.
 *
 * The page a customer lands on from an email asking them to hand an order to
 * somebody else — so it says plainly what accepting means, and equally plainly
 * that ignoring it is a valid answer.
 */
export const Route = createFileRoute("/$countryCode/order/$id/transfer/$token/")({
  head: () => ({ meta: [{ title: "Transfer request · Valy" }] }),
  component: TransferRoute,
})

function TransferRoute() {
  const { id, token } = Route.useParams()
  return (
    <PageShell>
      <div className="container-page max-w-xl py-12 lg:py-20">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
              Transfer request
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Someone has asked to take over this order.
            </h1>
            <p className="font-mono text-sm tabular text-muted">{id}</p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
            <p className="text-sm leading-6 text-muted">
              <strong className="font-medium text-ink">If you accept</strong>, the
              order moves to their account. They will see the invoice, the
              delivery details and the warranty, and they become the person we
              deal with about it. You will not.
            </p>
            <p className="text-sm leading-6 text-muted">
              <strong className="font-medium text-ink">If you do nothing</strong>
              , nothing happens. The order stays yours. You do not need to decline
              for that to be true — declining just tells them so.
            </p>
          </div>

          <p className="text-sm leading-6 text-muted">
            If you were not expecting this, close the page and email{" "}
            <a href="mailto:support@valy.in" className="text-accent hover:text-accent-strong">
              support@valy.in
            </a>
            .
          </p>

          <TransferActions id={id} token={token} />
        </div>
      </div>
    </PageShell>
  )
}
