import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { listWarehouses, primaryWarehouse } from "./warehouses"
import { SHIPPING_ORCHESTRATOR_MODULE } from "./constants"

export type BookedShipment = {
  shipment_id: number
  awb: string
  courier: string
  match: string
  rate: number
}

/**
 * Book the courier for a fulfilment that already exists in Shiprocket, and ask
 * for a pickup.
 *
 * Lives here rather than in a route because two callers need it: shipping one
 * order, and shipping fifty from the queue. The rollback in particular should
 * not be something each caller reimplements.
 *
 * Not atomic, because Shiprocket has no transaction. The AWB is assigned first
 * as it is the step that can be undone — if the pickup then fails, cancelling
 * credits the freight back rather than leaving a courier booked and paid for
 * that nobody asked to come.
 */
export const bookShipment = async (
  container: any,
  fulfillmentId: string
): Promise<{ assigned: BookedShipment[]; pickup: any }> => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
  const svc = container.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any

  const fulfillment = await fulfillmentService.retrieveFulfillment(
    fulfillmentId
  )

  const data = (fulfillment.data ?? {}) as Record<string, any>

  if (data.shiprocket_awb_codes) {
    throw new Error(`Already booked on AWB ${data.shiprocket_awb_codes}`)
  }

  const shipmentIds = String(data.shiprocket_shipment_ids || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value) && value > 0)

  if (shipmentIds.length === 0) {
    throw new Error("No Shiprocket shipment on this fulfillment")
  }

  const settings = await svc.getActiveSettings()
  const warehouse = primaryWarehouse(await listWarehouses(container))
  const deliveryPincode = fulfillment.delivery_address?.postal_code ?? ""

  const assigned: BookedShipment[] = []

  try {
    for (const shipmentId of shipmentIds) {
      // Asked fresh rather than trusting the checkout quote, which was priced
      // against rates and serviceability that move.
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
        throw new Error(`No courier serviceable for ${deliveryPincode}`)
      }

      const result = await svc.shiprocketApi.generateAWB(
        shipmentId,
        chosen.courier.courier_company_id,
        settings
      )

      assigned.push({
        shipment_id: shipmentId,
        awb: result?.response?.data?.awb_code || result?.awb_code || "",
        courier: chosen.courier.courier_name,
        match: chosen.match,
        rate: chosen.courier.rate,
      })

      if (chosen.match !== "exact") {
        logger.warn(
          `[ShippingOrchestrator] Shipment ${shipmentId} quoted ` +
            `"${data.courier_name}" but booked "${chosen.courier.courier_name}" ` +
            `(${chosen.match}) at ${chosen.courier.rate}`
        )
      }
    }

    // Every parcel in this fulfilment is collected on one visit.
    const pickup = await svc.shiprocketApi.generatePickup(shipmentIds, settings)

    await fulfillmentService.updateFulfillment(fulfillmentId, {
      data: {
        ...data,
        shiprocket_awb_codes: assigned.map((a) => a.awb).join(","),
        booked_courier_names: assigned.map((a) => a.courier).join(","),
        courier_match: assigned.map((a) => a.match).join(","),
        booked_rate: assigned.reduce((sum, a) => sum + (a.rate || 0), 0),
        shipment_state: "awaiting_pickup",
        pickup_scheduled_at: new Date().toISOString(),
        pickup_token: String(
          pickup?.response?.pickup_token_number ??
            pickup?.pickup_token_number ??
            ""
        ),
      },
    })

    logger.info(
      `[ShippingOrchestrator] Booked ${fulfillmentId}: ` +
        assigned.map((a) => `${a.courier} ${a.awb}`).join(", ")
    )

    return { assigned, pickup }
  } catch (e: any) {
    if (assigned.length > 0) {
      const orderIds = String(data.shiprocket_order_ids || "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => !Number.isNaN(value) && value > 0)

      try {
        await svc.shiprocketApi.cancelOrder(orderIds, settings)
        logger.warn(
          `[ShippingOrchestrator] Rolled back ${assigned.length} booking(s) ` +
            `on ${fulfillmentId} after: ${e.message}`
        )
      } catch (rollbackError: any) {
        // Money has moved for parcels that will not travel, and only a person
        // can put that right.
        logger.error(
          `[ShippingOrchestrator] ROLLBACK FAILED on ${fulfillmentId}. ` +
            `AWBs ${assigned.map((a) => a.awb).join(",")} are paid for and ` +
            `unscheduled — cancel them in Shiprocket. ` +
            `Cause: ${e.message}. Rollback: ${rollbackError.message}`
        )
      }
    }

    throw e
  }
}
