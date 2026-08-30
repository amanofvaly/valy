import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  listWarehouses,
  primaryWarehouse,
  SHIPPING_ORCHESTRATOR_MODULE,
} from "../../../../../../modules/shipping-orchestrator"

/**
 * POST /admin/shipping-orchestrator/fulfillments/:id/ship
 *
 * Books the courier and asks for a pickup, for a fulfilment whose Shiprocket
 * order already exists.
 *
 * Kept as its own action rather than folded into fulfilment because this is
 * where money moves: creating the order in Shiprocket is free, assigning the
 * AWB debits the freight from the wallet. Someone should be pressing a button
 * that says so.
 *
 * The two calls cannot be made atomic — Shiprocket has no transaction — so the
 * order matters. The AWB is assigned first because it is the step that can be
 * undone: if the pickup request then fails, cancelling the shipment credits the
 * freight back, and the operator is told the truth rather than left with a
 * booked courier nobody asked to come.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT) as any
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any

  const fulfillment = await fulfillmentService
    .retrieveFulfillment(id)
    .catch(() => null)

  if (!fulfillment) {
    return res.status(404).json({ message: `No fulfillment ${id}` })
  }

  const data = (fulfillment.data ?? {}) as Record<string, string>
  const shipmentIds = (data.shiprocket_shipment_ids || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value) && value > 0)

  if (shipmentIds.length === 0) {
    return res.status(400).json({
      message:
        "This fulfillment has no Shiprocket shipment. It was created before " +
        "the Shiprocket integration, or the order push failed.",
    })
  }

  if (data.shiprocket_awb_codes) {
    return res.status(409).json({
      message: `Already shipped on AWB ${data.shiprocket_awb_codes}.`,
      awb_codes: data.shiprocket_awb_codes,
    })
  }

  const settings = await svc.getActiveSettings()
  const warehouse = primaryWarehouse(await listWarehouses(req.scope))
  const deliveryPincode = (fulfillment.delivery_address?.postal_code ??
    "") as string

  const assigned: Array<{
    shipment_id: number
    awb: string
    courier: string
    match: string
    rate: number
  }> = []

  try {
    for (const shipmentId of shipmentIds) {
      /*
       * Ask what is available for this parcel right now, rather than trusting
       * the checkout quote: it was priced days ago against rates and
       * serviceability that move.
       */
      const serviceability = await svc.shiprocketApi.checkServiceability(
        {
          pickup_postcode: warehouse?.pincode ?? "",
          delivery_postcode: deliveryPincode,
          weight: Number(data.chargeable_weight_kg) || 0.5,
          cod: 0,
        },
        settings
      )

      const available = await svc.filterCouriers(
        serviceability?.data?.available_courier_companies ?? [],
        (settings.carrier_blacklist as string[]) || []
      )

      const chosen = await svc.resolveCourier(available, data.courier_name)

      if (!chosen) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `No courier is serviceable for ${deliveryPincode} on shipment ${shipmentId}.`
        )
      }

      const result = await svc.shiprocketApi.generateAWB(
        shipmentId,
        chosen.courier.courier_company_id,
        settings
      )

      const awb =
        result?.response?.data?.awb_code || result?.awb_code || ""

      assigned.push({
        shipment_id: shipmentId,
        awb,
        courier: chosen.courier.courier_name,
        match: chosen.match,
        rate: chosen.courier.rate,
      })

      if (chosen.match !== "exact") {
        logger.warn(
          `[ShippingOrchestrator] Shipment ${shipmentId} was quoted ` +
            `"${data.courier_name}" but booked "${chosen.courier.courier_name}" ` +
            `(${chosen.match} match) at ${chosen.courier.rate}.`
        )
      }
    }

    // Every parcel in this fulfilment is collected on one visit.
    const pickup = await svc.shiprocketApi.generatePickup(shipmentIds, settings)

    await fulfillmentService.updateFulfillment(id, {
      data: {
        ...data,
        shiprocket_awb_codes: assigned.map((a) => a.awb).join(","),
        booked_courier_names: assigned.map((a) => a.courier).join(","),
        courier_match: assigned.map((a) => a.match).join(","),
        booked_rate: assigned.reduce((sum, a) => sum + (a.rate || 0), 0),
        pickup_scheduled_at: new Date().toISOString(),
        pickup_token: String(
          pickup?.response?.pickup_token_number ?? pickup?.pickup_token_number ?? ""
        ),
      },
    })

    logger.info(
      `[ShippingOrchestrator] Shipped fulfillment ${id}: ` +
        assigned.map((a) => `${a.courier} ${a.awb}`).join(", ")
    )

    return res.json({ ok: true, assigned, pickup })
  } catch (e: any) {
    /*
     * Undo anything already booked. Cancelling credits the freight back, so
     * the failure costs nothing; leaving it would bill for couriers that were
     * never going to collect, against a fulfilment that still reads unshipped.
     */
    if (assigned.length > 0) {
      const orderIds = (data.shiprocket_order_ids || "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => !Number.isNaN(value) && value > 0)

      try {
        await svc.shiprocketApi.cancelOrder(orderIds, settings)
        logger.warn(
          `[ShippingOrchestrator] Rolled back ${assigned.length} booked ` +
            `shipment(s) for fulfillment ${id} after: ${e.message}`
        )
      } catch (rollbackError: any) {
        // Worth shouting about: the wallet has been charged for shipments
        // that are not going to move, and only a human can put that right.
        logger.error(
          `[ShippingOrchestrator] ROLLBACK FAILED for fulfillment ${id}. ` +
            `AWBs ${assigned.map((a) => a.awb).join(",")} are booked and paid ` +
            `for but not scheduled. Cancel them in Shiprocket. ` +
            `Original error: ${e.message}. Rollback error: ${rollbackError.message}`
        )
      }
    }

    return res.status(500).json({ message: e.message })
  }
}
