import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/shipping-orchestrator/shipments
 *
 * Orders, seen as shipping work.
 *
 * The unit is an order, not a fulfilment, because an order is what a person
 * thinks in and what they need to act on. An earlier version listed fulfilments
 * — technically truer, since one order can be several parcels — and it meant
 * nothing appeared here until somebody had already fulfilled it by hand
 * elsewhere. That is the work this screen exists to remove.
 *
 * Query: ?state=to_ship|awaiting_pickup|in_transit|delivered|all
 *        &limit=&offset=&q=
 */

/*
 * Buckets that are not shipping work, and so are hidden from every tab except
 * "all" and left out of the counts.
 */
const HIDDEN_BUCKETS = ["no_shipping", "canceled"]

const bucketOf = (order: any): string => {
  // A cancelled order is not work. Without this it keeps every unfulfilled
  // line it had, so `outstanding` stays true and it sits in "to ship" for
  // good — cancelled, uncancellable again, and still counted.
  if (order.canceled_at) {
    return "canceled"
  }

  const live = (order.fulfillments ?? []).filter((f: any) => !f.canceled_at)

  // Nothing shippable at all: a services-only order never belongs in a queue
  // about parcels.
  const shippable = (order.items ?? []).filter(
    (item: any) => item.requires_shipping !== false
  )
  if (shippable.length === 0) {
    return "no_shipping"
  }

  const outstanding = shippable.some(
    (item: any) =>
      (item.detail?.quantity ?? item.quantity ?? 0) -
        (item.detail?.fulfilled_quantity ?? 0) >
      0
  )
  const booked = live.filter((f: any) => f.data?.shiprocket_awb_codes)

  if (outstanding || booked.length === 0) {
    return "to_ship"
  }

  const states = booked.map((f: any) =>
    String(f.data?.shipment_state ?? "awaiting_pickup")
  )

  if (states.every((s: string) => s === "delivered")) return "delivered"
  if (states.every((s: string) => s === "awaiting_pickup")) {
    return "awaiting_pickup"
  }
  return "in_transit"
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const state = String(req.query.state ?? "to_ship")
  const search = String(req.query.q ?? "").trim().toLowerCase()
  const limit = Math.min(Number(req.query.limit ?? 50), 200)
  const offset = Number(req.query.offset ?? 0)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "created_at",
      "canceled_at",
      "payment_status",
      "total",
      "currency_code",
      "items.id",
      "items.title",
      "items.quantity",
      "items.requires_shipping",
      "items.detail.quantity",
      "items.detail.fulfilled_quantity",
      "fulfillments.id",
      "fulfillments.data",
      "fulfillments.canceled_at",
      "shipping_methods.name",
      "shipping_methods.data",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.city",
      "shipping_address.postal_code",
    ],
  })

  const rows = (orders ?? [])
    .map((order: any) => {
      const live = (order.fulfillments ?? []).filter((f: any) => !f.canceled_at)
      const data = live.find((f: any) => f.data?.shiprocket_awb_codes)?.data
        ?? live[0]?.data
        ?? {}

      return {
        order_id: order.id,
        display_id: order.display_id,
        email: order.email,
        created_at: order.created_at,
        payment_status: order.payment_status,
        total: order.total,
        currency_code: order.currency_code,
        customer: [
          order.shipping_address?.first_name,
          order.shipping_address?.last_name,
        ]
          .filter(Boolean)
          .join(" "),
        city: order.shipping_address?.city ?? null,
        postal_code: order.shipping_address?.postal_code ?? null,
        bucket: bucketOf(order),
        items: (order.items ?? [])
          .filter((item: any) => item.requires_shipping !== false)
          .map((item: any) => ({
            title: item.title,
            // The ordered quantity lives on the line's `detail` in v2; the top
            // level one is not always populated on this projection.
            quantity: item.detail?.quantity ?? item.quantity ?? 1,
          })),
        awb: data.shiprocket_awb_codes || null,
        /*
         * From the shipping method, not the fulfilment. The customer was
         * quoted a carrier at checkout and it is recorded there from that
         * moment — reading it off the fulfilment meant every unfulfilled order
         * looked as though it had been quoted nothing.
         */
        quoted_courier:
          (order.shipping_methods ?? []).at(-1)?.data?.courier_name ??
          data.courier_name ??
          null,
        booked_courier: data.booked_courier_names ?? null,
        courier_match: data.courier_match ?? null,
        chargeable_weight_kg: data.chargeable_weight_kg ?? null,
        shipment_status_label: data.shipment_status_label ?? null,
      }
    })
    .filter((row: any) => {
      if (HIDDEN_BUCKETS.includes(row.bucket) && state !== "all") return false
      if (state !== "all" && row.bucket !== state) return false

      if (!search) return true
      return (
        String(row.display_id).includes(search) ||
        (row.email ?? "").toLowerCase().includes(search) ||
        (row.customer ?? "").toLowerCase().includes(search) ||
        (row.postal_code ?? "").includes(search)
      )
    })
    // Oldest first: what has waited longest goes out next.
    .sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  const counts = (orders ?? []).reduce(
    (acc: Record<string, number>, order: any) => {
      const bucket = bucketOf(order)
      if (HIDDEN_BUCKETS.includes(bucket)) return acc
      acc[bucket] = (acc[bucket] ?? 0) + 1
      acc.all = (acc.all ?? 0) + 1
      return acc
    },
    {}
  )

  res.json({
    shipments: rows.slice(offset, offset + limit),
    count: rows.length,
    counts,
    limit,
    offset,
  })
}
