import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  MONEY_EPSILON,
  PAYMENT_MONEY_FIELDS,
  paymentsOwing,
} from "../../../order-money"

/**
 * POST /admin/shipping-orchestrator/orders/:id/refund
 *
 * Returns money to the customer. `{ amount }` refunds that much; omitted, it
 * refunds everything still owed.
 *
 * Provider-agnostic by construction. `refundPaymentWorkflow` dispatches through
 * `paymentModule.refundPayment` -> `paymentProviderService.refundPayment`,
 * which resolves the provider from `payment.provider_id` on the payment row
 * itself. Adding the other three providers needs no change here.
 *
 * Deliberately the *singular* workflow, one payment at a time. The plural
 * `refundPaymentsWorkflow` swallows provider errors into the log and then
 * writes its ledger rows from the refunds it intended rather than the ones that
 * happened — which is how production order #1 came to show a full refund that
 * Cashfree had never issued.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const body = (req.body ?? {}) as {
    amount?: number
    note?: string
    refund_reason_id?: string
  }

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: ["id", "display_id", "currency_code", ...PAYMENT_MONEY_FIELDS],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  const owing = paymentsOwing(order)
  const owedTotal = owing.reduce((sum, payment) => sum + payment.owed, 0)

  if (!owing.length) {
    return res.status(400).json({
      message: "Nothing to refund — every captured payment has been returned.",
    })
  }

  if (body.amount !== undefined && body.amount > owedTotal + MONEY_EPSILON) {
    return res.status(400).json({
      message:
        `Cannot refund ${body.amount} — only ${owedTotal.toFixed(2)} is still ` +
        `captured on this order.`,
    })
  }

  /*
   * A partial refund is spread across payments oldest-first rather than being
   * aimed at one, because which payment a part-refund lands on is an internal
   * detail the operator did not ask about — they asked to return an amount.
   */
  let remaining = body.amount ?? owedTotal
  const plan: { payment_id: string; amount: number }[] = []

  for (const payment of owing) {
    if (remaining <= MONEY_EPSILON) {
      break
    }

    const amount = Math.min(payment.owed, remaining)
    plan.push({ payment_id: payment.id, amount })
    remaining -= amount
  }

  const { refundPaymentWorkflow } = await import("@medusajs/medusa/core-flows")

  const refunds: {
    payment_id: string
    amount: number
    ok: boolean
    error?: string
  }[] = []

  for (const entry of plan) {
    try {
      await refundPaymentWorkflow(req.scope).run({
        input: {
          payment_id: entry.payment_id,
          amount: entry.amount,
          created_by: req.auth_context?.actor_id,
          note: body.note ?? `Refunded from the order desk`,
          refund_reason_id: body.refund_reason_id,
        },
      })

      refunds.push({ ...entry, ok: true })
    } catch (e: any) {
      refunds.push({ ...entry, ok: false, error: e.message })
    }
  }

  const failed = refunds.filter((refund) => !refund.ok)
  const refunded = refunds
    .filter((refund) => refund.ok)
    .reduce((sum, refund) => sum + refund.amount, 0)

  if (failed.length) {
    logger.error(
      `[ShippingOrchestrator] Refund on order #${order.display_id} failed: ` +
        failed.map((f) => f.error).join("; ")
    )

    // 207: some money may have moved. Saying "failed" would be as wrong as the
    // silent success this route was written to replace.
    return res.status(refunded > 0 ? 207 : 500).json({
      ok: false,
      message: failed.map((f) => f.error).join("; "),
      refunds,
      refunded_total: refunded,
    })
  }

  logger.info(
    `[ShippingOrchestrator] Refunded ${refunded} on order #${order.display_id}`
  )

  return res.json({ ok: true, refunds, refunded_total: refunded })
}
