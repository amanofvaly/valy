import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * POST /admin/shipping-orchestrator/orders/:id/cancel
 *
 * Cancels an order from the shipping screen, including whatever it has already
 * become in Shiprocket.
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
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "canceled_at",
      "fulfillments.id",
      "fulfillments.canceled_at",
      "fulfillments.data",
    ],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  if (order.canceled_at) {
    return res.status(409).json({ message: "Already cancelled." })
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

  try {
    const { cancelOrderFulfillmentWorkflow, cancelOrderWorkflow } =
      // Lazily, like the ship route: a static core-flows import re-registers
      // the core workflows and stops the server booting.
      await import("@medusajs/core-flows")

    for (const fulfillment of live) {
      await cancelOrderFulfillmentWorkflow(req.scope).run({
        input: { order_id: id, fulfillment_id: fulfillment.id },
      })
    }

    await cancelOrderWorkflow(req.scope).run({ input: { order_id: id } })

    logger.info(
      `[ShippingOrchestrator] Cancelled order #${order.display_id} ` +
        `and ${live.length} fulfilment(s)`
    )

    return res.json({ ok: true, canceled_fulfillments: live.length })
  } catch (e: any) {
    logger.error(
      `[ShippingOrchestrator] Could not cancel order #${order.display_id}: ${e.message}`
    )
    return res.status(500).json({ message: e.message })
  }
}
