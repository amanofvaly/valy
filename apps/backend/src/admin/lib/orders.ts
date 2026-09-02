/**
 * The order desk's vocabulary, kept apart from its rendering.
 *
 * Pure and React-free on purpose: these are the definitions the screen and the
 * order-page widget both read, and two components that disagree about what an
 * order's state is are worse than one that is merely ugly. Being pure also
 * means they can be tested without a database or a DOM.
 */

export type Shipment = {
  order_id: string
  display_id: string | number
  email: string
  city: string | null
  postal_code: string | null
  created_at: string
  customer: string
  total: number
  currency_code: string
  status: string
  canceled_at: string | null
  bucket: string
  /*
   * The row's one sentence, decided by the server so that this screen and the
   * order-page widget can never disagree about what an order's state is.
   */
  label: string
  detail: string
  tone: "grey" | "red" | "orange" | "blue" | "green"
  captured: number
  refunded: number
  customer_owes: number
  refund_owed: number
  phantom_refund: number
  /** Someone closed this out by hand; see the complete route. */
  closed_by_hand: boolean
  items: Array<{ title: string; quantity: number }>
  awb: string | null
  quoted_courier: string | null
  booked_courier: string | null
  courier_match: string | null
  chargeable_weight_kg: number | null
  shipment_status_label: string | null
  shipment_states: string[]
}

/*
 * Queues, in the order a day is worked: what is stuck, what goes out, what is
 * owed, what is done.
 *
 * There is no Delivered tab. Delivered is an outcome, not work, and as a tab it
 * hid its own failures — a delivered order still owing a refund sat there
 * looking finished and green. Delivered-and-settled is in Completed;
 * delivered-and-unpaid is in Needs attention.
 *
 * There is no Cancelled tab either, for the same reason and a sharper one:
 * cancelling is not the work, returning the money is. Cancelled orders are
 * routed by what they still owe, which is how a cancelled order that never
 * refunded stops being able to hide.
 */
export const TABS = [
  { value: "needs_attention", label: "Needs attention" },
  { value: "to_ship", label: "To ship" },
  { value: "payment_pending", label: "Payment pending" },
  { value: "in_transit", label: "In transit" },
  { value: "refund_due", label: "Refund due" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
]

export const PAGE_SIZES = ["25", "50", "100", "200"]

export const formatMoney = (value: number, currency?: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency?.toUpperCase() || "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0)

/**
 * What cancelling this order would actually do, and whether it can be done.
 *
 * Spelled out per row because "cancel" means different things depending on how
 * far the parcel has got: nothing has been sent to Shiprocket for an order that
 * was never pushed, while one already booked has freight to refund. And past
 * pickup it cannot be undone at all — Shiprocket only cancels before collection,
 * so cancelling here would leave a cancelled order and a parcel still travelling
 * to the customer.
 */
export const cancelEffect = (
  row: Shipment
): { allowed: boolean; where: string; reason?: string } => {
  if (row.canceled_at) {
    return { allowed: false, where: "—", reason: "Already cancelled" }
  }

  if (row.status === "completed") {
    return { allowed: false, where: "—", reason: "Already completed" }
  }

  const states = row.shipment_states ?? []

  if (states.length > 0 && states.every((s) => s === "delivered")) {
    return { allowed: false, where: "—", reason: "Already delivered" }
  }

  const moving = states.find((s) => s !== "awaiting_pickup")

  if (moving) {
    return {
      allowed: false,
      where: "—",
      reason: `Picked up${row.shipment_status_label ? ` (${row.shipment_status_label})` : ""} — needs an RTO in Shiprocket`,
    }
  }

  if (row.awb) {
    return {
      allowed: true,
      where: "Shiprocket + Medusa",
      reason: "Courier booked — freight is refunded",
    }
  }

  if (row.quoted_courier) {
    return {
      allowed: true,
      where: "Shiprocket + Medusa",
      reason: "Order exists in Shiprocket, no courier booked",
    }
  }

  return {
    allowed: true,
    where: "Medusa only",
    reason: "Never pushed to Shiprocket",
  }
}


/** Whole days since a timestamp. */
export const ageInDays = (at: string): number =>
  Math.floor((Date.now() - new Date(at).getTime()) / 86_400_000)

/**
 * How long this has been waiting, in the words someone would use.
 *
 * The list is sorted oldest-first because the thing that has waited longest is
 * the thing to do next, and a column of dates does not make that visible.
 */
export const describeAge = (at: string): string => {
  const days = ageInDays(at)

  if (days <= 0) {
    return "today"
  }

  if (days === 1) {
    return "yesterday"
  }

  return `${days} days`
}
