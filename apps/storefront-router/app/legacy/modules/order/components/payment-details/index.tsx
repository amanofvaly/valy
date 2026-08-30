import { isCashfree, isStripeLike } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import SyncCashfreePayment from "./sync-cashfree"

/**
 * What was paid, and with what.
 *
 * One statement rather than a "Method" field and a "Details" field. Splitting
 * it produced a row that read "Method: Cashfree" beside "Details: ₹2,772.70
 * paid on 29 Aug" — two labels and a heading to carry one sentence, on a page
 * that already had a "Method" of its own under delivery.
 */
const PaymentDetails = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]

  if (!payment) {
    return null
  }

  const paidOn = new Date(payment.created_at ?? "").toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  )

  let instrument: string | null = null
  let hasCashfreeDetails = false
  const isCashfreePayment = isCashfree(payment.provider_id)

  if (isStripeLike(payment.provider_id) && payment.data?.card_last4) {
    instrument = `Card ending ${payment.data.card_last4}`
  } else if (isCashfreePayment) {
    if (Array.isArray(payment.data?.payments) && payment.data.payments.length > 0) {
      hasCashfreeDetails = true
      const pm = (
        payment.data.payments[0] as
          | { payment_method?: Record<string, Record<string, string>> }
          | undefined
      )?.payment_method
      if (pm) {
        if (pm.card) instrument = `Card ending ${pm.card.card_number?.slice(-4) || '****'}`
        else if (pm.upi) instrument = `UPI (${pm.upi.upi_id})`
        else if (pm.netbanking) instrument = `${pm.netbanking.netbanking_bank_name} Netbanking`
        else if (pm.wallet) instrument = `Wallet`
        else if (pm.app) instrument = `App`
        else {
          const key = Object.keys(pm)[0]
          instrument = key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Cashfree'
        }
      }
    }
  }

  return (
    <section aria-labelledby="payment-details">
      {isCashfreePayment && (
        <SyncCashfreePayment 
          orderId={order.id} 
          hasPaymentDetails={hasCashfreeDetails} 
        />
      )}
      <h2 id="payment-details" className="mb-3 text-base font-semibold text-ink">
        Payment
      </h2>

      <p className="text-sm leading-6 text-muted" data-testid="payment-amount">
        <span className="font-mono tabular text-ink">
          {convertToLocale({
            amount: payment.amount,
            currency_code: order.currency_code,
          })}
        </span>{" "}
        paid on {paidOn}
        {instrument && (
          <>
            <br />
            <span data-testid="payment-method">{instrument}</span>
          </>
        )}
      </p>
    </section>
  )
}

export default PaymentDetails
