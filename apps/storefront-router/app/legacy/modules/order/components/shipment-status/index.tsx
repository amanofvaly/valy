import { HttpTypes } from "@medusajs/types"

/**
 * Where the parcel actually is.
 *
 * Only rendered once a courier has been booked. Before that there is nothing
 * true to say — the order exists in Shiprocket but nobody has been asked to
 * collect it, and "Processing" dressed up as a tracking status is worse than
 * the honest silence of not showing this at all.
 *
 * The state is written by the Shiprocket tracking webhook, so this is a read of
 * something that already happened rather than a guess from timestamps.
 */
const STATE_COPY: Record<string, string> = {
  awaiting_pickup: "Booked. Waiting for the courier to collect it.",
  picked_up: "Picked up by the courier.",
  shipped: "On its way.",
  in_transit: "On its way.",
  out_for_delivery: "Out for delivery today.",
  delivered: "Delivered.",
  returning: "Coming back to us.",
  returned: "Returned to us.",
  canceled: "This shipment was cancelled.",
}

type ShipmentData = {
  shiprocket_awb_codes?: string
  booked_courier_names?: string
  courier_name?: string
  shipment_state?: string
  shipment_status_label?: string
  tracking_courier?: string
}

/**
 * The shape this component needs off the order.
 *
 * `StoreOrder` types a fulfilment's `data` as an open record, so the named
 * fields below are asserted once here rather than at every read.
 */
type OrderFulfillment = {
  canceled_at?: string | Date | null
  data?: Record<string, unknown> | null
}

const ShipmentStatus = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const fulfillments = ((order as unknown as {
    fulfillments?: OrderFulfillment[]
  }).fulfillments ?? []) as OrderFulfillment[]

  const shipments: ShipmentData[] = fulfillments
    .filter((fulfillment) => !fulfillment.canceled_at)
    .map((fulfillment) => (fulfillment.data ?? {}) as ShipmentData)
    .filter((data) => !!data.shiprocket_awb_codes)

  if (shipments.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="shipment-status">
      <h2
        id="shipment-status"
        className="mb-3 text-base font-semibold text-ink"
      >
        Tracking
      </h2>

      <div className="flex flex-col gap-3">
        {shipments.map((data, index) => {
          const courier =
            data.tracking_courier ||
            data.booked_courier_names ||
            data.courier_name
          const state = data.shipment_state ?? "awaiting_pickup"

          return (
            <p
              key={data.shiprocket_awb_codes ?? index}
              className="text-sm leading-6 text-muted"
              data-testid="shipment-status"
            >
              <span className="text-ink">
                {STATE_COPY[state] ?? data.shipment_status_label ?? "On its way."}
              </span>
              <br />
              {courier} · {/* The number the customer quotes to the courier. */}
              <span className="font-mono tabular">
                {data.shiprocket_awb_codes}
              </span>
            </p>
          )
        })}
      </div>
    </section>
  )
}

export default ShipmentStatus
