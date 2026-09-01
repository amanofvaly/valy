import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /admin/shipping-orchestrator/orders/:id/complete
 *
 * Closes an order out by hand.
 *
 * Most orders reach the Completed queue on their own — delivered and paid, or
 * cancelled and refunded, or simply with nothing outstanding either way. This
 * is the additional route for the ones that never will: an order settled
 * offline, a goodwill write-off, anything where the money moved somewhere
 * Medusa cannot see.
 *
 * Medusa's own admin exposes no way to do this, though the workflow and the
 * core endpoint both exist. The order module refuses to complete a cancelled
 * order and has no other precondition — completing is an operator's assertion
 * that they are finished, not a claim that the books balance, which is why the
 * confirmation in the UI has to spell out what is still outstanding.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: ["id", "display_id", "status", "canceled_at"],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  if (order.status === "completed") {
    return res.status(409).json({ message: "Already completed." })
  }

  if (order.canceled_at || order.status === "canceled") {
    return res.status(409).json({
      message:
        "A cancelled order cannot be completed. It leaves the queues once its refund has settled.",
    })
  }

  const { completeOrderWorkflow } = await import("@medusajs/medusa/core-flows")

  try {
    await completeOrderWorkflow(req.scope).run({ input: { orderIds: [id] } })

    logger.info(
      `[ShippingOrchestrator] Completed order #${order.display_id} manually`
    )

    return res.json({ ok: true })
  } catch (e: any) {
    logger.error(
      `[ShippingOrchestrator] Could not complete order #${order.display_id}: ${e.message}`
    )
    return res.status(500).json({ message: e.message })
  }
}
