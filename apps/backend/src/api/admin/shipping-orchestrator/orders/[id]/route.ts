import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PAYMENT_MONEY_FIELDS } from "../../order-money"
import { lifecycleOf, orderMoney } from "../../order-lifecycle"

/**
 * GET /admin/shipping-orchestrator/orders/:id
 *
 * One order, deep enough that the order desk does not have to send anyone to
 * the stock Orders page for ordinary work.
 *
 * The list answers "what needs doing"; this answers "what happened". It is
 * mostly a timeline, because every complaint about the old screen came down to
 * not being able to see the sequence — when the money arrived, when the parcel
 * went, whether a refund was even attempted.
 *
 * Failures are first-class entries. A refund that the provider rejected is a
 * thing that happened to this order and belongs in its history, not only in a
 * log file nobody reads.
 */

type Event = {
  at: string
  kind: string
  title: string
  detail?: string
  tone?: "grey" | "red" | "orange" | "blue" | "green"
}

const push = (events: Event[], at: unknown, event: Omit<Event, "at">) => {
  if (!at) {
    return
  }

  events.push({ at: new Date(at as string).toISOString(), ...event })
}

const money = (value: number, currency?: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency?.toUpperCase() || "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0)

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "email",
      "status",
      "created_at",
      "canceled_at",
      "total",
      "currency_code",
      "summary",
      "metadata",
      "items.id",
      "items.title",
      "items.quantity",
      "items.requires_shipping",
      "items.detail.quantity",
      "items.detail.fulfilled_quantity",
      "fulfillments.id",
      "fulfillments.data",
      "fulfillments.created_at",
      "fulfillments.packed_at",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "shipping_methods.name",
      "shipping_methods.data",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.phone",
      "transactions.id",
      "transactions.amount",
      "transactions.reference",
      "transactions.created_at",
      "payment_collections.payments.id",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.captured_at",
      "payment_collections.payments.created_at",
      "payment_collections.payments.data",
      "payment_collections.payments.captures.created_at",
      "payment_collections.payments.refunds.created_at",
      ...PAYMENT_MONEY_FIELDS,
    ],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  const life = lifecycleOf(order)
  const m = orderMoney(order)
  const currency = order.currency_code
  const events: Event[] = []

  push(events, order.created_at, {
    kind: "placed",
    title: "Order placed",
    detail: money(m.total, currency),
    tone: "grey",
  })

  for (const collection of order.payment_collections ?? []) {
    for (const payment of collection.payments ?? []) {
      const provider = String(payment.provider_id ?? "")
        .replace(/^pp_/, "")
        .replace(/_/g, " ")

      for (const capture of payment.captures ?? []) {
        push(events, capture.created_at ?? payment.captured_at, {
          kind: "captured",
          title: `Paid ${money(Number(capture.amount ?? 0), currency)}`,
          detail: provider,
          tone: "green",
        })
      }

      for (const refund of payment.refunds ?? []) {
        push(events, refund.created_at, {
          kind: "refunded",
          title: `Refunded ${money(Number(refund.amount ?? 0), currency)}`,
          detail: provider,
          tone: "blue",
        })
      }
    }
  }

  for (const fulfillment of order.fulfillments ?? []) {
    const awb = fulfillment.data?.shiprocket_awb_codes

    push(events, fulfillment.created_at, {
      kind: "fulfilled",
      title: "Parcel created",
      detail: fulfillment.data?.shiprocket_shipment_ids
        ? "Pushed to Shiprocket"
        : "Not in Shiprocket",
      tone: "grey",
    })

    if (awb) {
      push(events, fulfillment.data?.pickup_scheduled_at ?? fulfillment.created_at, {
        kind: "booked",
        title: `Courier booked — ${fulfillment.data?.booked_courier_names ?? "carrier"}`,
        detail: `AWB ${awb}`,
        tone: "blue",
      })
    }

    push(events, fulfillment.shipped_at, {
      kind: "shipped",
      title: "Picked up by the courier",
      tone: "blue",
    })
    push(events, fulfillment.delivered_at, {
      kind: "delivered",
      title: "Delivered",
      tone: "green",
    })
    push(events, fulfillment.canceled_at, {
      kind: "fulfillment_canceled",
      title: "Parcel cancelled",
      tone: "orange",
    })
  }

  push(events, order.canceled_at, {
    kind: "canceled",
    title: "Order cancelled",
    tone: "orange",
  })

  /*
   * The phantom, shown where it happened rather than only as a badge on the
   * list. `summary.refunded_total` counts refunds the ledger recorded; the
   * refund rows above are the ones that exist. Money in the gap was never
   * returned.
   */
  if (m.phantomRefund > 0.01) {
    const ledgerEntry = (order.transactions ?? [])
      .filter((t: any) => t.reference === "refund")
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

    push(events, ledgerEntry?.created_at ?? order.canceled_at, {
      kind: "phantom_refund",
      title: `Refund recorded but never issued — ${money(m.phantomRefund, currency)}`,
      detail:
        "The books were credited and the payment provider has no matching refund. " +
        "Reconcile, then refund again.",
      tone: "red",
    })
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  return res.json({
    order: {
      order_id: order.id,
      display_id: order.display_id,
      email: order.email,
      status: order.status,
      canceled_at: order.canceled_at,
      created_at: order.created_at,
      currency_code: currency,
      bucket: life.bucket,
      label: life.label,
      detail: life.detail,
      tone: life.tone,
      money: {
        total: m.total,
        captured: m.captured,
        refunded: m.refunded,
        held: m.held,
        customer_owes: m.customerOwes,
        refund_owed: m.refundOwed,
        phantom_refund: m.phantomRefund,
      },
      items: (order.items ?? []).map((item: any) => ({
        title: item.title,
        quantity: item.detail?.quantity ?? item.quantity ?? 1,
        fulfilled: item.detail?.fulfilled_quantity ?? 0,
        requires_shipping: item.requires_shipping !== false,
      })),
      shipping_address: order.shipping_address ?? null,
      quoted_courier:
        (order.shipping_methods ?? []).at(-1)?.data?.courier_name ?? null,
    },
    events,
  })
}
