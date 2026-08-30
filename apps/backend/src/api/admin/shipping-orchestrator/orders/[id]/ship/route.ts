import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  bookShipment,
  listWarehouses,
  primaryWarehouse,
} from "../../../../../../modules/shipping-orchestrator"
import type { BookedShipment } from "../../../../../../modules/shipping-orchestrator"

/**
 * POST /admin/shipping-orchestrator/orders/:id/ship
 *
 * Takes one order from paid to waiting-for-the-van, in a single call: fulfil
 * everything outstanding, which pushes the order to Shiprocket, then book the
 * courier and request the pickup.
 *
 * This is the whole point of the shipping screen. Doing it as two actions —
 * fulfil here, book there — meant opening every order twice, which is the job
 * this is supposed to remove rather than reorganise.
 *
 * Anything already fulfilled is booked without being fulfilled again, so
 * pressing it twice on the same order is safe.
 *
 * `{ book: false }` stops after the push. The order lands in Shiprocket and
 * nothing is charged — the courier is then chosen in their panel, and the
 * tracking webhook feeds the result back here. That is the free half of this
 * route, and the reason it is a flag rather than a second endpoint is that
 * everything before the booking step is identical.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const book = (req.body as any)?.book !== false
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "items.id",
      "items.quantity",
      "items.detail.quantity",
      "items.detail.fulfilled_quantity",
      "items.requires_shipping",
      "fulfillments.id",
      "fulfillments.canceled_at",
      "fulfillments.data",
    ],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  try {
    /*
     * Only what is left, and only what actually travels. A service line has
     * nothing to put in a box, and asking a courier to collect it would book
     * freight against thin air.
     */
    const outstanding = (order.items ?? [])
      .filter((item: any) => item.requires_shipping !== false)
      .map((item: any) => ({
        id: item.id,
        quantity:
          (item.detail?.quantity ?? item.quantity ?? 0) -
          (item.detail?.fulfilled_quantity ?? 0),
      }))
      .filter((item: any) => item.quantity > 0)

    let fulfillmentIds = (order.fulfillments ?? [])
      .filter((f: any) => !f.canceled_at && !f.data?.shiprocket_awb_codes)
      .map((f: any) => f.id)

    if (outstanding.length > 0) {
      const warehouse = primaryWarehouse(await listWarehouses(req.scope))

      /*
       * Imported here rather than at the top of the file. A static import of
       * core-flows runs its registrations while routes are being registered,
       * and Medusa then refuses to boot with "Workflow with id
       * create-payment-sessions already exists". Loading it when the handler
       * actually runs keeps that out of the boot path.
       */
      const { createOrderFulfillmentWorkflow } = await import(
        "@medusajs/medusa/core-flows"
      )

      const { result } = await createOrderFulfillmentWorkflow(req.scope).run({
        input: {
          order_id: id,
          location_id: warehouse?.id,
          items: outstanding,
          no_notification: false,
        },
      })

      fulfillmentIds = [...fulfillmentIds, (result as any).id]
    }

    if (fulfillmentIds.length === 0) {
      return res.status(400).json({
        message: book
          ? "Nothing to ship: everything is either already booked or does not require shipping."
          : "Nothing to push: this order is already in Shiprocket.",
      })
    }

    if (!book) {
      return res.json({ ok: true, fulfillments: fulfillmentIds, assigned: [] })
    }

    const booked: Array<{ assigned: BookedShipment[]; pickup: any }> = []
    for (const fulfillmentId of fulfillmentIds) {
      booked.push(await bookShipment(req.scope, fulfillmentId))
    }

    return res.json({
      ok: true,
      fulfillments: fulfillmentIds,
      assigned: booked.flatMap((b) => b.assigned),
    })
  } catch (e: any) {
    logger.error(
      `[ShippingOrchestrator] Could not ship order #${order.display_id}: ${e.message}`
    )
    return res.status(500).json({ message: e.message })
  }
}
