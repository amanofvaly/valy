import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MONEY_EPSILON, PAYMENT_MONEY_FIELDS } from "../../../order-money"

/**
 * POST /admin/shipping-orchestrator/orders/:id/reconcile
 *
 * Asks the payment provider what it actually holds, and reports where that
 * disagrees with Medusa.
 *
 * A refund row in Medusa is not evidence that money moved. Core's plural
 * `refundPaymentsWorkflow` catches provider failures into the log and writes
 * its ledger entry from the refunds it *intended*, so an order can read as
 * fully refunded with nothing having left. Even a refund the provider accepted
 * comes back `PENDING` and may later turn `FAILED` or `ONHOLD` with no webhook
 * we currently listen for. The provider is the only source of truth.
 *
 * This route deliberately only *reports*. It does not re-issue refunds — that
 * is the refund route's job, and doing it here would make a diagnostic into
 * something that spends money. Nor can it repair the ledger: Medusa exposes no
 * way to remove an order transaction, so a phantom entry stays visible until
 * it is corrected by hand.
 */

type ProviderRefund = {
  id: string
  amount: number
  status: string
  settled: boolean
}

/** A provider that can be asked what it has refunded. Not all can. */
type RefundListingProvider = {
  listRefunds(
    data: Record<string, unknown> | undefined
  ): Promise<ProviderRefund[]>
}

const canListRefunds = (provider: unknown): provider is RefundListingProvider =>
  typeof (provider as RefundListingProvider)?.listRefunds === "function"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const paymentModule = req.scope.resolve(Modules.PAYMENT) as any

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "currency_code",
      "summary",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.data",
      ...PAYMENT_MONEY_FIELDS,
    ],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  /*
   * Payment providers live in the payment module's own container, not the
   * request scope, so there is no public way to reach one from a route. This
   * goes through the module's provider service, which is how the module itself
   * dispatches `refundPayment`. Guarded, because it is past the public API and
   * a Medusa upgrade could move it.
   */
  const providerService = paymentModule?.paymentProviderService_

  if (!providerService?.retrieveProvider) {
    return res.status(501).json({
      message:
        "This build of Medusa does not expose payment providers to reconcile against.",
    })
  }

  const payments = (order.payment_collections ?? []).flatMap(
    (collection: any) => collection.payments ?? []
  )

  const results: any[] = []

  for (const payment of payments) {
    const medusaRefunded = (payment.refunds ?? []).reduce(
      (sum: number, refund: any) => sum + Number(refund.amount ?? 0),
      0
    )

    let provider: unknown

    try {
      provider = providerService.retrieveProvider(payment.provider_id)
    } catch {
      results.push({
        payment_id: payment.id,
        provider_id: payment.provider_id,
        checked: false,
        reason: "Provider is no longer registered",
        medusa_refunded: medusaRefunded,
      })
      continue
    }

    if (!canListRefunds(provider)) {
      results.push({
        payment_id: payment.id,
        provider_id: payment.provider_id,
        checked: false,
        reason: "This provider cannot list refunds",
        medusa_refunded: medusaRefunded,
      })
      continue
    }

    try {
      const providerRefunds = await provider.listRefunds(payment.data)

      const settled = providerRefunds
        .filter((refund) => refund.settled)
        .reduce((sum, refund) => sum + refund.amount, 0)
      const inFlight = providerRefunds
        .filter((refund) => !refund.settled)
        .reduce((sum, refund) => sum + refund.amount, 0)

      results.push({
        payment_id: payment.id,
        provider_id: payment.provider_id,
        checked: true,
        medusa_refunded: medusaRefunded,
        provider_settled: settled,
        provider_in_flight: inFlight,
        // Positive means Medusa believes more was returned than the provider
        // can account for: money the books say is gone and is not.
        drift: medusaRefunded - (settled + inFlight),
        refunds: providerRefunds,
      })
    } catch (e: any) {
      results.push({
        payment_id: payment.id,
        provider_id: payment.provider_id,
        checked: false,
        reason: e.message,
        medusa_refunded: medusaRefunded,
      })
    }
  }

  const drifted = results.filter(
    (row) => row.checked && Math.abs(row.drift) > MONEY_EPSILON
  )

  const ledgerRefunded = Number(order.summary?.refunded_total ?? 0)
  const rowRefunded = payments.reduce(
    (sum: number, payment: any) =>
      sum +
      (payment.refunds ?? []).reduce(
        (inner: number, refund: any) => inner + Number(refund.amount ?? 0),
        0
      ),
    0
  )

  if (drifted.length) {
    logger.warn(
      `[ShippingOrchestrator] Order #${order.display_id} disagrees with its provider on ` +
        drifted.map((row) => `${row.payment_id}: ${row.drift}`).join(", ")
    )
  }

  return res.json({
    ok: drifted.length === 0,
    order_id: order.id,
    display_id: order.display_id,
    currency_code: order.currency_code,
    // The ledger's claim against the refund rows. This is the phantom the
    // order desk surfaces; the per-payment `drift` above is the provider's.
    ledger_refunded: ledgerRefunded,
    refund_rows_total: rowRefunded,
    phantom_refund: Math.max(0, ledgerRefunded - rowRefunded),
    payments: results,
  })
}
