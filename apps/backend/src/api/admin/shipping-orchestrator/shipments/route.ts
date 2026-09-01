import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PAYMENT_MONEY_FIELDS } from "../order-money"
import {
  HIDDEN_BUCKETS,
  lifecycleOf,
  orderMoney,
} from "../order-lifecycle"

/**
 * GET /admin/shipping-orchestrator/shipments
 *
 * Orders, seen as work.
 *
 * The unit is an order, not a fulfilment, because an order is what a person
 * thinks in and what they need to act on. An earlier version listed fulfilments
 * — technically truer, since one order can be several parcels — and it meant
 * nothing appeared here until somebody had already fulfilled it by hand
 * elsewhere. That is the work this screen exists to remove.
 *
 * This used to be a shipping queue only, and it asked for `payment_status`
 * without ever getting one: that field does not exist on the `order` graph
 * entity — it lives on `OrderDetail`, which has no query entry point, and is
 * synthesised inside `getOrdersListWorkflow`. The request silently returned
 * null, nothing rendered it, and nobody noticed. Money now comes from captures
 * and refunds instead, via `order-lifecycle`.
 *
 * Query: ?state=needs_attention|to_ship|payment_pending|in_transit
 *              |refund_due|completed|all
 *        &limit=&offset=&q=
 */

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
      "status",
      "summary",
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
      ...PAYMENT_MONEY_FIELDS,
    ],
  })

  const rows = (orders ?? [])
    .map((order: any) => {
      const live = (order.fulfillments ?? []).filter((f: any) => !f.canceled_at)
      const data = live.find((f: any) => f.data?.shiprocket_awb_codes)?.data
        ?? live[0]?.data
        ?? {}

      const life = lifecycleOf(order)
      const m = orderMoney(order)

      return {
        order_id: order.id,
        display_id: order.display_id,
        email: order.email,
        created_at: order.created_at,
        status: order.status,
        canceled_at: order.canceled_at,
        total: order.total,
        currency_code: order.currency_code,
        // The one sentence the row leads with.
        label: life.label,
        detail: life.detail,
        tone: life.tone,
        /*
         * The courier's own view, so the UI can say what cancelling would
         * actually do without re-deriving it from the bucket — which no longer
         * distinguishes "booked" from "delivered".
         */
        shipment_states: (order.fulfillments ?? [])
          .filter((f: any) => !f.canceled_at && f.data?.shiprocket_awb_codes)
          .map((f: any) => String(f.data?.shipment_state ?? "awaiting_pickup")),
        // The money, so the UI never has to recompute it and disagree.
        captured: m.captured,
        refunded: m.refunded,
        customer_owes: m.customerOwes,
        refund_owed: m.refundOwed,
        phantom_refund: m.phantomRefund,
        customer: [
          order.shipping_address?.first_name,
          order.shipping_address?.last_name,
        ]
          .filter(Boolean)
          .join(" "),
        city: order.shipping_address?.city ?? null,
        postal_code: order.shipping_address?.postal_code ?? null,
        bucket: life.bucket,
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
      const bucket = lifecycleOf(order).bucket
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
