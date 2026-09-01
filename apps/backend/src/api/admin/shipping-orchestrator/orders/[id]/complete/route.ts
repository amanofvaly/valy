import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  MONEY_EPSILON,
  PAYMENT_MONEY_FIELDS,
  paymentTotals,
} from "../../../order-money"

/**
 * POST /admin/shipping-orchestrator/orders/:id/complete
 *
 * Closes an order out by hand.
 *
 * Most orders reach Completed on their own — delivered and paid, cancelled and
 * refunded, or simply with nothing outstanding either way. This is the
 * additional route for the ones that never will: settled offline, written off,
 * or owing money that cannot be moved any more.
 *
 * ## Why this does not just call `completeOrderWorkflow`
 *
 * Medusa's order module refuses to complete a cancelled order outright —
 * `completeOrder_` collects them into `notAllowed` and throws. And "cancelled,
 * and settled outside the system" is exactly the case a manual completion is
 * for. Production order #1 is the example: it was paid in Cashfree's sandbox,
 * the keys were switched to live, and the live gateway now 404s on that order
 * id, so the refund the books already recorded can never actually be issued.
 * Nothing is owed to anyone — the money was never real — but no automatic rule
 * will ever agree, and the order would sit in Needs attention for ever.
 *
 * So completion is recorded in the order's own metadata, which works for every
 * order including cancelled ones, and `completeOrderWorkflow` is additionally
 * run when Medusa permits it so `order.status` agrees where it can.
 *
 * A note is required whenever money is still outstanding. This is the one
 * action that silences a money warning, and an unexplained override of a money
 * warning is how the original problem stayed invisible for three days.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const orderModule = req.scope.resolve(Modules.ORDER) as any

  const body = (req.body ?? {}) as { note?: string }

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "status",
      "canceled_at",
      "total",
      "currency_code",
      "metadata",
      "summary",
      ...PAYMENT_MONEY_FIELDS,
    ],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  if (order.metadata?.desk_completed_at) {
    return res.status(409).json({ message: "Already closed by hand." })
  }

  if (order.status === "completed") {
    return res.status(409).json({ message: "Already completed." })
  }

  const totals = paymentTotals(order)
  const captured = totals.reduce((sum, p) => sum + p.captured, 0)
  const refunded = totals.reduce((sum, p) => sum + p.refunded, 0)
  const held = captured - refunded
  const cancelled = Boolean(order.canceled_at)

  const refundOwed = cancelled ? held : Math.max(0, held - Number(order.total))
  const customerOwes = cancelled
    ? 0
    : Math.max(0, Number(order.total) - held)
  const ledgerRefunded = Number(order.summary?.refunded_total ?? 0)
  const phantom = Math.max(0, ledgerRefunded - refunded)

  const outstanding = Math.max(refundOwed, customerOwes, phantom)

  if (outstanding > MONEY_EPSILON && !body.note?.trim()) {
    return res.status(400).json({
      message:
        `This order still has ${outstanding.toFixed(2)} ${String(order.currency_code).toUpperCase()} unaccounted for. ` +
        "Closing it by hand hides that from the money queues, so say why.",
      outstanding,
    })
  }

  const completion = {
    desk_completed_at: new Date().toISOString(),
    desk_completed_by: req.auth_context?.actor_id ?? "unknown",
    desk_completed_note: body.note?.trim() || null,
    // What was still unaccounted for at the moment it was closed, so the row
    // can keep saying so rather than quietly reading as settled.
    desk_completed_outstanding: outstanding > MONEY_EPSILON ? outstanding : 0,
  }

  await orderModule.updateOrders(id, {
    metadata: { ...(order.metadata ?? {}), ...completion },
  })

  /*
   * Where Medusa allows it, move the real status too, so this screen and the
   * stock admin agree. A cancelled order simply cannot take it, and that is
   * not a failure — the metadata above is the record either way.
   */
  let statusCompleted = false

  if (!cancelled) {
    try {
      const { completeOrderWorkflow } = await import(
        "@medusajs/medusa/core-flows"
      )
      await completeOrderWorkflow(req.scope).run({ input: { orderIds: [id] } })
      statusCompleted = true
    } catch (e: any) {
      logger.warn(
        `[ShippingOrchestrator] Order #${order.display_id} closed by hand, but ` +
          `Medusa would not set status=completed: ${e.message}`
      )
    }
  }

  logger.info(
    `[ShippingOrchestrator] Order #${order.display_id} closed by hand by ` +
      `${completion.desk_completed_by}` +
      (outstanding > MONEY_EPSILON
        ? ` with ${outstanding} unaccounted for: ${completion.desk_completed_note}`
        : "")
  )

  return res.json({
    ok: true,
    status_completed: statusCompleted,
    outstanding: completion.desk_completed_outstanding,
  })
}
