import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * POST /webhooks/shiprocket
 *
 * Shiprocket's tracking callback. Configured in their panel under
 * Settings → API → Webhooks, with the security token sent as `x-api-key`.
 *
 * This is what turns a booked shipment into a moving one without anybody
 * refreshing a page: the courier scans the parcel, Shiprocket posts here, and
 * the fulfilment learns it has actually been collected. Polling their tracking
 * endpoint would work too, and would mean asking every few minutes about
 * parcels that mostly have not moved.
 *
 * Their docs require a 200 on every call. A webhook that errors gets retried
 * and eventually disabled, so a body we cannot make sense of is still
 * acknowledged — and logged, which is the part a person can act on.
 */

/** Their `sr-status-label` values, mapped onto what we tell a customer. */
const STATUS_TO_STATE: Record<string, string> = {
  "MANIFEST GENERATED": "awaiting_pickup",
  "PICKUP SCHEDULED": "awaiting_pickup",
  "PICKUP GENERATED": "awaiting_pickup",
  "PICKED UP": "picked_up",
  SHIPPED: "shipped",
  "IN TRANSIT": "in_transit",
  "OUT FOR DELIVERY": "out_for_delivery",
  DELIVERED: "delivered",
  RTO: "returning",
  "RTO DELIVERED": "returned",
  CANCELED: "canceled",
  CANCELLED: "canceled",
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT) as any

  const body = (req.body ?? {}) as Record<string, any>
  const awb = String(body.awb ?? "").trim()
  const srOrderId = String(body.sr_order_id ?? "").trim()

  /*
   * A shared secret rather than a signature, because that is all Shiprocket
   * offers. Only enforced when one is configured, so setting the token in
   * their panel and here can happen in either order without dropping events
   * in between.
   */
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN

  if (expected && req.headers["x-api-key"] !== expected) {
    logger.warn("[ShippingOrchestrator] Rejected a Shiprocket webhook: bad token")
    return res.status(401).json({ received: false })
  }

  if (!awb && !srOrderId) {
    logger.warn(
      `[ShippingOrchestrator] Shiprocket webhook with nothing to match on: ${JSON.stringify(
        body
      ).slice(0, 400)}`
    )
    return res.status(200).json({ received: true })
  }

  try {
    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: ["id", "data", "shipped_at", "delivered_at"],
    })

    /*
     * Both identifiers are tried, and the order id is the one that matters.
     *
     * The AWB only exists on our side if we assigned it. Book the courier in
     * Shiprocket's own panel instead — which is the whole point of pushing
     * orders without paying for them here — and we have no AWB to match, so
     * every tracking event for that parcel would be discarded as unknown.
     *
     * The Shiprocket order id is written when the order is created, which
     * happens either way, so it is the identifier that survives both routes.
     * Values are stored comma-joined because one fulfilment can be several
     * parcels, hence containment rather than equality.
     */
    const holds = (fulfillment: any, field: string, value: string) =>
      !!value &&
      String(fulfillment.data?.[field] ?? "")
        .split(",")
        .map((entry: string) => entry.trim())
        .includes(value)

    const match = (fulfillments ?? []).find(
      (f: any) =>
        holds(f, "shiprocket_awb_codes", awb) ||
        holds(f, "shiprocket_order_ids", srOrderId)
    )

    if (!match) {
      logger.warn(
        `[ShippingOrchestrator] Shiprocket webhook for unknown shipment ` +
          `(awb ${awb || "—"}, order ${srOrderId || "—"})`
      )
      return res.status(200).json({ received: true })
    }

    const label = String(body.current_status ?? "").toUpperCase()
    const state = STATUS_TO_STATE[label] ?? "in_transit"

    await fulfillmentService.updateFulfillment(match.id, {
      data: {
        ...(match.data ?? {}),
        shipment_state: state,
        shipment_status_label: body.current_status ?? null,
        shipment_status_at: body.current_timestamp ?? new Date().toISOString(),
        tracking_courier: body.courier_name ?? match.data?.booked_courier_names,
        /*
         * Learned, not assumed. When the courier was booked in Shiprocket's
         * panel this is the first time we see the AWB, and recording it is what
         * lets the customer's order page show a tracking number and what lets
         * later events match on the AWB directly.
         */
        ...(awb && !match.data?.shiprocket_awb_codes
          ? {
              shiprocket_awb_codes: awb,
              booked_courier_names:
                body.courier_name ?? match.data?.courier_name ?? null,
              courier_match: "external",
            }
          : {}),
      },
      /*
       * Medusa's own timestamps, so the order's fulfilment status moves with
       * the parcel instead of only our metadata knowing. Set once — a later
       * scan should not keep rewriting when it first shipped.
       */
      ...(state === "picked_up" || state === "shipped"
        ? match.shipped_at
          ? {}
          : { shipped_at: new Date() }
        : {}),
      ...(state === "delivered"
        ? match.delivered_at
          ? {}
          : { delivered_at: new Date() }
        : {}),
    })

    logger.info(
      `[ShippingOrchestrator] AWB ${awb} → ${body.current_status} (${state})`
    )
  } catch (e: any) {
    // Still a 200: retries will not fix a bug on our side, and a disabled
    // webhook is worse than a missed event.
    logger.error(
      `[ShippingOrchestrator] Shiprocket webhook failed for AWB ${awb}: ${e.message}`
    )
  }

  return res.status(200).json({ received: true })
}
