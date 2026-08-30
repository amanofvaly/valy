"use client"

import { convertToLocale } from "@lib/util/money"
import { cn } from "@lib/util/cn"
import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import CartTotals from "@modules/common/components/cart-totals"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

/**
 * The order summary beside checkout.
 *
 * On a wide screen it is a sticky column and shows everything. On a phone it
 * is one row, and this is the part that was wrong.
 *
 * It used to open expanded — a `<details open>` carrying every line item and
 * the whole totals table above the first field of the form. On a 6" phone that
 * is most of the first screen spent on a list the reader has already seen
 * twice, on the one page where what matters is the next thing to type. Worse,
 * it grew with the order: the more someone bought, the further the checkout
 * moved off the bottom of the screen. And it said "Order summary" twice, once
 * in the disclosure and again as a heading inside it, which is what a
 * collapsed and an expanded design look like when both are left in.
 *
 * So on a phone the row states the two facts a summary owes at a glance — how
 * many things, and how much — and the items and the tax breakdown are behind
 * the toggle for anyone who wants to check. The form starts under a single
 * row, not under a table.
 *
 * A client component, for the toggle. The alternative was `<details>`, whose
 * open state cannot be made to differ by breakpoint: the wide layout needs the
 * body shown with no disclosure at all, and a closed `<details>` hides its
 * body at every width.
 */
const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const [open, setOpen] = useState(false)

  const items = cart.items ?? []
  const count = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)

  /*
   * A name, not a number.
   *
   * "6 items" is a count of things the reader cannot see, which is no more of
   * a summary than the word "summary" was. The first line's title and the
   * remainder — "Valy Flow +5" — is enough to recognise the order without
   * opening anything, and it is what the reader came to this row to check.
   */
  const lead = items[0]?.title ?? items[0]?.product_title ?? ""
  const rest = count - (items[0]?.quantity ?? 0)

  const total = convertToLocale({
    amount: cart.total ?? 0,
    currency_code: cart.currency_code,
  })

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-lg border border-line">
        {/*
         * The row itself. Count on the left, total on the right, the way a
         * receipt is read — and the total is the figure the reader is checking
         * for, so it carries the weight rather than the word "summary".
         */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="checkout-summary-detail"
          className="pressable-tint flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left lg:hidden"
          data-testid="checkout-summary-toggle"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-ink">
              {lead}
              {rest > 0 && <span className="text-muted"> +{rest}</span>}
            </span>
            <span className="text-xs text-muted underline underline-offset-4">
              {open ? "Hide details" : "Show details"}
            </span>
          </span>
          <span className="shrink-0 text-base font-semibold tabular tracking-tight text-ink">
            {total}
          </span>
        </button>

        <div
          id="checkout-summary-detail"
          className={cn(
            "flex-col gap-5 p-5 pt-0 lg:flex lg:pt-5",
            open ? "flex border-t border-line pt-5" : "hidden"
          )}
        >
          {/*
           * The heading is `lg` only. On a phone the row above already says
           * what this is, and repeating it inside the thing it opened is the
           * duplicate this component used to ship.
           */}
          <h2 className="hidden text-base font-medium text-ink lg:block">
            Order summary
          </h2>

          <ItemsPreviewTemplate cart={cart} />

          <CartTotals
            totals={cart}
            shippingLabel={cart.shipping_methods?.at(-1)?.name}
          />
        </div>
      </div>
    </aside>
  )
}

export default CheckoutSummary
