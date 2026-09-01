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
 * POST /admin/shipping-orchestrator/orders/:id/cancel
 *
 * Cancels an order from the order desk, including whatever it has already
 * become in Shiprocket, and returns the customer's money first.
 *
 * Medusa refuses to cancel an order that still has a live fulfilment, so this
 * cancels the fulfilments first. That is not just sequencing: cancelling a
 * fulfilment is what reaches Shiprocket, through the provider's
 * `cancelFulfillment`, and it is what credits the freight back if a courier had
 * already been booked.
 *
 * Refused once a parcel is moving. Shiprocket can only cancel before pickup —
 * after that the way back is an RTO, and letting the button look like it worked
 * would leave a cancelled order and a parcel still on its way to the customer.
 *
 * ## Why the refund is issued here rather than left to `cancelOrderWorkflow`
 *
 * `cancelOrderWorkflow` already refunds captured payments, via
 * `refundCapturedPaymentsWorkflow` -> `refundPaymentsWorkflow`. That path is
 * not safe to rely on, and production order #1 is the proof: it was cancelled,
 * Medusa recorded a -1672.70 refund transaction and `summary.refunded_total`
 * of the full amount, and Cashfree had no refund at all. The money never moved
 * and every screen said it had.
 *
 * The reason is in core: `refundPaymentsStep` is
 * `paymentModule.refundPayment(...).catch(e => logger.error(...))`, so a
 * provider failure becomes a log line, and the workflow then writes the ledger
 * row from its *input* — the refunds it meant to make — rather than from the
 * ones that succeeded.
 *
 * The singular `refundPaymentWorkflow` has neither problem: its step is a bare
 * `await` that throws, and its order transaction is written only after that
 * step returns. So we run it ourselves, per captured payment, and only cancel
 * once the money is actually back.
 *
 * If a refund fails we do **not** cancel. Cancelling anyway would hand the
 * order to `cancelOrderWorkflow`, whose implicit refund would retry the same
 * failing provider call and write exactly the phantom ledger row this route
 * exists to prevent. Better a live order and a visible error than a cancelled
 * one whose books lie.
 */

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const body = (req.body ?? {}) as { refund?: boolean }
  const shouldRefund = body.refund !== false

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "canceled_at",
      "currency_code",
      "fulfillments.id",
      "fulfillments.canceled_at",
      "fulfillments.data",
      ...PAYMENT_MONEY_FIELDS,
    ],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  if (order.canceled_at) {
    return res.status(409).json({ message: "Already cancelled." })
  }

  const owing = paymentsOwing(order)
  const owedTotal = owing.reduce((sum, payment) => sum + payment.owed, 0)

  /*
   * Cancelling without refunding is not expressible today: `cancelOrderWorkflow`
   * always runs `refundCapturedPaymentsWorkflow` and takes no flag to suppress
   * it. Rather than accept the request and quietly refund anyway — which is the
   * kind of lie about money this route was rewritten to remove — say so.
   */
  if (!shouldRefund && owedTotal > MONEY_EPSILON) {
    return res.status(400).json({
      message:
        `This order has ${owedTotal.toFixed(2)} ${order.currency_code?.toUpperCase() ?? ""} still captured. ` +
        "Medusa always returns captured money when an order is cancelled, so cancelling " +
        "without a refund is not possible from here. Refund it, or settle and refund outside the system first.",
      captured_outstanding: owedTotal,
    })
  }

  const live = (order.fulfillments ?? []).filter((f: any) => !f.canceled_at)

  const moving = live.find((f: any) => {
    const state = String(f.data?.shipment_state ?? "")
    return state && state !== "awaiting_pickup"
  })

  if (moving) {
    return res.status(409).json({
      message:
        `Already picked up by the courier (${moving.data?.shipment_status_label ?? "in transit"}). ` +
        `Cancel is only possible before pickup — this needs an RTO in Shiprocket.`,
    })
  }

  const {
    cancelOrderFulfillmentWorkflow,
    cancelOrderWorkflow,
    refundPaymentWorkflow,
  } =
    // Lazily, like the ship route: a static core-flows import re-registers
    // the core workflows and stops the server booting.
    //
    // Via `@medusajs/medusa`, which re-exports core-flows and depends on it
    // directly. Importing "@medusajs/core-flows" resolves locally only
    // through hoisting — under a strict install it is not a dependency of
    // this app and the Docker build cannot find it.
    await import("@medusajs/medusa/core-flows")

  // --- Money first, and loudly. ---
  const refunds: {
    payment_id: string
    amount: number
    ok: boolean
    error?: string
  }[] = []

  for (const payment of owing) {
    try {
      await refundPaymentWorkflow(req.scope).run({
        input: {
          payment_id: payment.id,
          amount: payment.owed,
          created_by: req.auth_context?.actor_id,
          note: `Order #${order.display_id} cancelled from the order desk`,
        },
      })

      refunds.push({ payment_id: payment.id, amount: payment.owed, ok: true })
    } catch (e: any) {
      refunds.push({
        payment_id: payment.id,
        amount: payment.owed,
        ok: false,
        error: e.message,
      })
    }
  }

  const failed = refunds.filter((refund) => !refund.ok)

  if (failed.length) {
    logger.error(
      `[ShippingOrchestrator] Order #${order.display_id} not cancelled: ` +
        `${failed.length} refund(s) failed — ${failed.map((f) => f.error).join("; ")}`
    )

    return res.status(409).json({
      message:
        `The refund failed, so the order has not been cancelled — cancelling now would ` +
        `record a refund that never happened. Fix the cause and try again.`,
      refunds,
    })
  }

  try {
    for (const fulfillment of live) {
      await cancelOrderFulfillmentWorkflow(req.scope).run({
        input: { order_id: id, fulfillment_id: fulfillment.id },
      })
    }

    // Every captured payment is now fully refunded, so this workflow's own
    // refund step finds `captured - refunded <= 0` and correctly does nothing.
    await cancelOrderWorkflow(req.scope).run({ input: { order_id: id } })

    logger.info(
      `[ShippingOrchestrator] Cancelled order #${order.display_id}, ` +
        `${live.length} fulfilment(s), and refunded ${refunds.length} payment(s)`
    )

    return res.json({
      ok: true,
      canceled_fulfillments: live.length,
      refunds,
      refunded_total: refunds.reduce((sum, refund) => sum + refund.amount, 0),
    })
  } catch (e: any) {
    logger.error(
      `[ShippingOrchestrator] Could not cancel order #${order.display_id}: ${e.message}`
    )
    return res.status(500).json({ message: e.message, refunds })
  }
}
