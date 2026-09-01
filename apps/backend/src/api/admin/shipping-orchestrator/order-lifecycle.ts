import { MONEY_EPSILON, paymentTotals } from "./order-money"

/**
 * Where an order sits in its life, as one answer rather than four.
 *
 * The order desk has four state axes — order status, payment, fulfilment, and
 * money owed in either direction — and rendering four badges per row makes the
 * screen less legible, not more. So every order is reduced to its single most
 * urgent unresolved obligation: what does this still need from me? That answer
 * is the row's queue, its sentence, and its primary action.
 *
 * Everything about money is computed from captures and refunds. Medusa's
 * `payment_status` is deliberately never consulted: `getLastPaymentStatus`
 * subtracts cancelled payment collections from its denominator, so a single
 * fully-captured collection on a cancelled order reports `partially_captured`
 * for ever. That string describes the arithmetic, not the money.
 */

export type OrderMoney = {
  total: number
  captured: number
  refunded: number
  /** Captured and not yet returned — what we are actually holding. */
  held: number
  /** Owed by the customer to us. */
  customerOwes: number
  /** Owed by us back to the customer. */
  refundOwed: number
  /**
   * The ledger says this much was refunded but no refund row backs it. Money
   * that was recorded as returned and never was. See `phantom-refunds` in the
   * route below.
   */
  phantomRefund: number
}

export type Lifecycle = {
  bucket: string
  /** Short, human, and never an enum. */
  label: string
  /** The number or fact behind the label. */
  detail: string
  tone: "grey" | "red" | "orange" | "blue" | "green"
}

/** Queues that are outcomes rather than work: hidden unless you ask for All. */
export const HIDDEN_BUCKETS = ["no_shipping"]

export const TAB_ORDER = [
  "needs_attention",
  "to_ship",
  "payment_pending",
  "in_transit",
  "refund_due",
  "completed",
]

const AWAITING_PICKUP_STALE_MS = 48 * 60 * 60 * 1000

const money = (value: number) => value.toFixed(2)

/** What the order's payments hold, and who is owed what. */
export const orderMoney = (order: any): OrderMoney => {
  const totals = paymentTotals(order)
  const captured = totals.reduce((sum, p) => sum + p.captured, 0)
  const refunded = totals.reduce((sum, p) => sum + p.refunded, 0)
  const held = captured - refunded
  const total = Number(order.total ?? 0)
  const cancelled = Boolean(order.canceled_at)

  /*
   * A cancelled order owes back everything it still holds. A live one owes back
   * only what it holds beyond its own total — which is how a part-cancellation
   * or a price correction shows up.
   */
  const refundOwed = cancelled ? held : Math.max(0, held - total)
  const customerOwes = cancelled ? 0 : Math.max(0, total - held)

  /*
   * The ledger's claim, against the refunds that exist.
   *
   * `refundPaymentsWorkflow` writes its order transactions from the refunds it
   * *intended*, while its step swallows provider failures into the log. So a
   * refund that the provider rejected still moves `summary.refunded_total`.
   * The gap between that number and the actual refund rows is money the books
   * say was returned and never was.
   */
  const ledgerRefunded = Number(order.summary?.refunded_total ?? 0)
  const phantomRefund = Math.max(0, ledgerRefunded - refunded)

  return {
    total,
    captured,
    refunded,
    held,
    customerOwes,
    refundOwed,
    phantomRefund,
  }
}

const shippableItems = (order: any) =>
  (order.items ?? []).filter((item: any) => item.requires_shipping !== false)

const hasOutstandingLines = (order: any) =>
  shippableItems(order).some(
    (item: any) =>
      (item.detail?.quantity ?? item.quantity ?? 0) -
        (item.detail?.fulfilled_quantity ?? 0) >
      0
  )

const liveFulfillments = (order: any) =>
  (order.fulfillments ?? []).filter((f: any) => !f.canceled_at)

const bookedFulfillments = (order: any) =>
  liveFulfillments(order).filter((f: any) => f.data?.shiprocket_awb_codes)

const shipmentStates = (order: any): string[] =>
  bookedFulfillments(order).map((f: any) =>
    String(f.data?.shipment_state ?? "awaiting_pickup")
  )

const oldestPickupAge = (order: any): number => {
  const times = bookedFulfillments(order)
    .map((f: any) => f.data?.pickup_scheduled_at)
    .filter(Boolean)
    .map((t: string) => new Date(t).getTime())
    .filter((t: number) => Number.isFinite(t))

  return times.length ? Date.now() - Math.min(...times) : 0
}

/**
 * The precedence ladder. Strictly ordered and exhaustive, so every order lands
 * in exactly one queue and the tab counts sum to the total.
 */
export const lifecycleOf = (order: any): Lifecycle => {
  const m = orderMoney(order)
  const cancelled = Boolean(order.canceled_at)
  const states = shipmentStates(order)
  const delivered = states.length > 0 && states.every((s) => s === "delivered")
  const currency = String(order.currency_code ?? "").toUpperCase()

  /*
   * --- 0. A person has said this one is finished. ---------------------------
   *
   * Above everything, including the money checks, because this is the only
   * branch that is a human statement rather than an inference. Someone looked
   * at the order, saw what was outstanding, and said it is settled — usually
   * offline, sometimes because the money can no longer be moved at all.
   *
   * It does not pretend the books balance. Whatever was unaccounted for is
   * carried in the detail line, so the row still says so; it just stops
   * shouting from a queue nobody can ever empty.
   */
  const closedByHand = order.metadata?.desk_completed_at

  if (closedByHand) {
    const left = Number(order.metadata?.desk_completed_outstanding ?? 0)
    const note = order.metadata?.desk_completed_note

    return {
      bucket: "completed",
      label: "Closed by hand",
      detail:
        left > MONEY_EPSILON
          ? `${money(left)} ${currency} never accounted for${note ? ` — ${note}` : ""}`
          : (note ?? "Settled outside the system"),
      tone: "grey",
    }
  }

  // --- 1. Stuck. Anything where the books and the world disagree. -----------

  if (m.phantomRefund > MONEY_EPSILON) {
    return {
      bucket: "needs_attention",
      label: "Refund not issued",
      detail: `Recorded as refunded, but ${money(m.phantomRefund)} ${currency} never left. Retry it.`,
      tone: "red",
    }
  }

  if (cancelled && m.refundOwed > MONEY_EPSILON) {
    return {
      bucket: "needs_attention",
      label: "Refund owed",
      detail: `Cancelled with ${money(m.refundOwed)} ${currency} still captured`,
      tone: "red",
    }
  }

  if (order.status === "requires_action") {
    return {
      bucket: "needs_attention",
      label: "Needs action",
      detail: "The order is waiting on something before it can move",
      tone: "orange",
    }
  }

  if (delivered && m.customerOwes > MONEY_EPSILON) {
    return {
      bucket: "needs_attention",
      label: "Delivered unpaid",
      detail: `${money(m.customerOwes)} ${currency} was never received`,
      tone: "red",
    }
  }

  if (
    !delivered &&
    states.length > 0 &&
    states.every((s) => s === "awaiting_pickup") &&
    oldestPickupAge(order) > AWAITING_PICKUP_STALE_MS
  ) {
    return {
      bucket: "needs_attention",
      label: "Pickup overdue",
      detail: "Booked more than two days ago and the courier has not collected",
      tone: "orange",
    }
  }

  // --- 2. Money owed back, on an order that is otherwise fine. --------------

  if (m.refundOwed > MONEY_EPSILON) {
    return {
      bucket: "refund_due",
      label: "Refund owed",
      detail: `${money(m.refundOwed)} ${currency} to return`,
      tone: "orange",
    }
  }

  // --- 3. Finished. ---------------------------------------------------------

  if (order.status === "completed") {
    return {
      bucket: "completed",
      label: "Completed",
      detail: "Closed by hand",
      tone: "green",
    }
  }

  if (cancelled) {
    return {
      bucket: "completed",
      label: "Cancelled",
      detail:
        m.refunded > MONEY_EPSILON
          ? `Refunded ${money(m.refunded)} ${currency}`
          : "Nothing was captured",
      tone: "grey",
    }
  }

  if (delivered) {
    return {
      bucket: "completed",
      label: "Delivered",
      detail: "Paid and delivered",
      tone: "green",
    }
  }

  // --- 4. Work still to do. -------------------------------------------------

  const outstanding = hasOutstandingLines(order)

  if (!shippableItems(order).length) {
    // A services-only order never belongs in a queue about parcels, but it
    // still belongs in Completed once nothing is owed either way.
    return m.customerOwes > MONEY_EPSILON
      ? {
          bucket: "payment_pending",
          label: "Unpaid",
          detail: `${money(m.customerOwes)} ${currency} not received`,
          tone: "orange",
        }
      : {
          bucket: "no_shipping",
          label: "Nothing to ship",
          detail: "No physical items on this order",
          tone: "grey",
        }
  }

  if (m.customerOwes > MONEY_EPSILON && outstanding) {
    return {
      bucket: "payment_pending",
      label: m.held > MONEY_EPSILON ? "Part paid" : "Unpaid",
      detail:
        m.held > MONEY_EPSILON
          ? `${money(m.held)} of ${money(m.total)} ${currency}`
          : `${money(m.customerOwes)} ${currency} not received`,
      tone: "orange",
    }
  }

  if (outstanding) {
    return {
      bucket: "to_ship",
      label: "Ready to ship",
      detail: "Paid",
      tone: "orange",
    }
  }

  // Fulfilled and on its way.
  if (states.length === 0) {
    return {
      bucket: "in_transit",
      label: "In Shiprocket",
      detail: "No courier booked yet",
      tone: "blue",
    }
  }

  if (states.every((s) => s === "awaiting_pickup")) {
    return {
      bucket: "in_transit",
      label: "Awaiting pickup",
      detail: "Courier booked, not yet collected",
      tone: "blue",
    }
  }

  return {
    bucket: "in_transit",
    label: "In transit",
    detail: "On its way to the customer",
    tone: "blue",
  }
}
