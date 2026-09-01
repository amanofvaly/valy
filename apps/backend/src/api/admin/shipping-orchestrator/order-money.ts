/**
 * What an order's payments actually hold, read from amounts rather than from
 * Medusa's derived `payment_status`.
 *
 * The enum is not usable for this. `getLastPaymentStatus` subtracts cancelled
 * payment collections from its denominator, so a single fully-captured
 * collection on a cancelled order reports `partially_captured` for ever — the
 * arithmetic says `1 === 0` is false, not that half the money was taken. Every
 * money decision in the order desk therefore comes from captures and refunds.
 */

/** A hundredth of a rupee is rounding, not money. */
export const MONEY_EPSILON = 0.01

export type PaymentOwing = {
  id: string
  captured: number
  refunded: number
  owed: number
}

const sumAmounts = (rows: any[] | undefined): number =>
  (rows ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

/** Every payment on the order, with what it captured and what it has returned. */
export const paymentTotals = (order: any): PaymentOwing[] =>
  (order.payment_collections ?? [])
    .flatMap((collection: any) => collection.payments ?? [])
    .map((payment: any) => {
      const captured = sumAmounts(payment.captures)
      const refunded = sumAmounts(payment.refunds)

      return { id: payment.id, captured, refunded, owed: captured - refunded }
    })

/** Only the payments that still owe the customer something. */
export const paymentsOwing = (order: any): PaymentOwing[] =>
  paymentTotals(order).filter((payment) => payment.owed > MONEY_EPSILON)

/**
 * The fields `paymentTotals` needs. Kept beside it so a caller cannot request
 * half of them and silently compute zero.
 */
export const PAYMENT_MONEY_FIELDS = [
  "payment_collections.payments.id",
  "payment_collections.payments.captures.amount",
  "payment_collections.payments.refunds.amount",
]
