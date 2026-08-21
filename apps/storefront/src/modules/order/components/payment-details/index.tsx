import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

const PaymentDetails = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const payment = order.payment_collections?.[0]?.payments?.[0]

  if (!payment) {
    return null
  }

  const info = paymentInfoMap[payment.provider_id]

  return (
    <section aria-labelledby="payment-details">
      <h2 id="payment-details" className="mb-3 text-lg font-semibold text-ink">
        Payment
      </h2>

      <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium text-ink">Method</dt>
          <dd className="text-muted" data-testid="payment-method">
            {info?.title ?? payment.provider_id}
          </dd>
        </div>

        <div className="flex flex-col gap-0.5 sm:col-span-2">
          <dt className="text-xs font-medium text-ink">Details</dt>
          <dd className="flex items-center gap-2 text-muted">
            {info?.icon && (
              <span className="grid h-7 w-9 place-items-center rounded border border-line bg-surface">
                {info.icon}
              </span>
            )}
            <span data-testid="payment-amount">
              {isStripeLike(payment.provider_id) && payment.data?.card_last4
                ? `Card ending ${payment.data.card_last4}`
                : `${convertToLocale({
                    amount: payment.amount,
                    currency_code: order.currency_code,
                  })} paid on ${new Date(
                    payment.created_at ?? ""
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  )
}

export default PaymentDetails
