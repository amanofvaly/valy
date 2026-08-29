"use client"

import { removeBuildFromCart } from "@lib/data/cart-actions"
import { CartGroup, lineLabel } from "@lib/util/cart-builds"
import { cn } from "@lib/util/cn"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState, useTransition } from "react"

/**
 * A configured machine, as one line of the cart.
 *
 * The seven products underneath it are shown as a specification rather than as
 * seven purchases, because that is what they are: the buyer chose one machine
 * and answered six questions about it. Prices are still itemised — a build that
 * showed only a total would be hiding what the upgrades cost, on a page whose
 * whole job is letting someone check the number before they pay it.
 *
 * There is no quantity control. Every line has to move together for the build
 * to stay a build, and a stepper on the machine that silently left the drives
 * behind would be worse than not having one.
 */

type BuildItemProps = {
  group: Extract<CartGroup, { kind: "build" }>
  currencyCode: string
  type?: "full" | "preview"
}

const BuildItem = ({ group, currencyCode, type = "full" }: BuildItemProps) => {
  const full = type === "full"
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const money = (amount: number) =>
    convertToLocale({ amount, currency_code: currencyCode })

  const onRemove = () =>
    startTransition(async () => {
      setError(null)
      try {
        await removeBuildFromCart(group.id)
      } catch {
        setError("Could not remove that build. Try again.")
      }
    })

  return (
    <li
      className={cn("py-5", pending && "opacity-60")}
      data-testid="cart-build-row"
    >
      {/*
       * Two columns in the checkout summary, three in the cart. The summary
       * panel is around 320px wide, and a third column for the price there
       * squeezes the specification line into four words a line.
       */}
      <div
        className={cn(
          "grid gap-4",
          full
            ? "grid-cols-[72px_1fr] sm:grid-cols-[96px_1fr_auto] sm:gap-6"
            : "grid-cols-[56px_1fr]"
        )}
      >
        <LocalizedClientLink
          href={`/products/${group.lead.product_handle}`}
          className="pressable block"
        >
          <Thumbnail
            thumbnail={group.lead.thumbnail}
            images={group.lead.variant?.product?.images}
            title={group.lead.product_title ?? undefined}
            metadata={group.lead.variant?.product?.metadata}
            size="full"
            compactPlate
          />
        </LocalizedClientLink>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-3">
            <LocalizedClientLink
              href={`/products/${group.lead.product_handle}`}
              className="text-base font-medium text-ink hover:text-accent"
              data-testid="product-title"
            >
              {group.lead.product_title}
            </LocalizedClientLink>
            {!full && (
              <span
                className="shrink-0 font-mono text-sm tabular text-ink"
                data-testid="product-price"
              >
                {money(group.total)}
              </span>
            )}
          </span>

          {group.summary && (
            <p className="text-sm leading-6 text-muted">{group.summary}</p>
          )}

          {full && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onRemove}
                disabled={pending}
                className="pressable rounded text-sm text-muted underline underline-offset-4 hover:text-danger disabled:opacity-50"
                data-testid="cart-build-remove"
              >
                {pending ? "Removing…" : "Remove this build"}
              </button>
            </div>
          )}
        </div>

        {full ? (
          <div className="col-start-2 flex items-baseline justify-between gap-2 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start">
            <span
              className="font-mono text-base tabular text-ink"
              data-testid="product-price"
            >
              {money(group.total)}
            </span>
          </div>
        ) : null}
      </div>

      {/*
       * The specification. Indented under the machine on wide screens so the
       * grouping is legible without a border box around it, which on a list of
       * hairline-separated rows would read as a second card.
       */}
      <dl className={cn("mt-4 border-t border-line pt-3", full && "sm:ml-[120px]")}>
        {group.lines.map((line) => (
          <div
            key={line.id}
            className="flex items-baseline justify-between gap-4 py-1"
          >
            <dt className="min-w-0 text-sm leading-6 text-muted">
              {lineLabel(line)}
              {line.quantity > 1 && <span> × {line.quantity}</span>}
            </dt>
            <dd className="shrink-0 font-mono text-xs tabular text-muted">
              {(line.total ?? 0) === 0 ? "Included" : money(line.total ?? 0)}
            </dd>
          </div>
        ))}
      </dl>

      {error && (
        <p role="alert" className={cn("mt-3 text-sm text-danger", full && "sm:ml-[120px]")}>
          {error}
        </p>
      )}
    </li>
  )
}

export default BuildItem
