"use client"

import { deleteLineItem, updateLineItem } from "@lib/data/cart-actions"
import { cn } from "@lib/util/cn"
import { Minus, Plus, Trash } from "@medusajs/icons"
import { useOptimistic, useState, useTransition } from "react"

/**
 * The quantity control.
 *
 * The number redraws on the press, not on the response — `useOptimistic` shows
 * the new value for the length of the transition and React restores the real
 * one when it settles, by which point the server action's `revalidatePath` has
 * already produced it.
 *
 * It replaces a `<select>` of the numbers one to ten, which had no relationship
 * to actual stock and needed two taps on a phone to change anything.
 *
 * A failure is shown, not swallowed. If the server refuses — the last one sold
 * while the page was open — the optimistic number reverts on its own, and
 * without a message that revert is indistinguishable from a missed tap.
 */

type QuantityStepperProps = {
  lineId: string
  quantity: number
  /** Stock ceiling where the variant manages inventory. */
  max?: number
  "data-testid"?: string
}

const QuantityStepper = ({
  lineId,
  quantity,
  max,
  "data-testid": dataTestId,
}: QuantityStepperProps) => {
  const [optimisticQuantity, setOptimisticQuantity] = useOptimistic(
    quantity,
    (_current, next: number) => next
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const change = (next: number) => {
    setError(null)

    startTransition(async () => {
      setOptimisticQuantity(next)

      try {
        if (next < 1) {
          await deleteLineItem(lineId)
          return
        }

        await updateLineItem({ lineId, quantity: next })
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "We could not change that quantity. Please try again."
        )
      }
    })
  }

  const atCeiling = typeof max === "number" && optimisticQuantity >= max

  return (
    <div className="flex w-fit flex-col items-start gap-1.5">
      <div
        className={cn(
          "inline-flex items-center rounded border border-line bg-paper",
          isPending && "opacity-70"
        )}
        data-testid={dataTestId}
      >
        <button
          type="button"
          onClick={() => change(optimisticQuantity - 1)}
          aria-label={
            optimisticQuantity === 1 ? "Remove from cart" : "Reduce quantity"
          }
          data-testid={
            optimisticQuantity === 1 ? "product-delete-button" : undefined
          }
          className="pressable grid h-9 w-9 place-items-center rounded-l text-muted hover:bg-surface hover:text-ink active:bg-surface-strong"
        >
          {optimisticQuantity === 1 ? <Trash /> : <Minus />}
        </button>

        <span
          className="min-w-8 text-center font-mono text-sm tabular text-ink"
          aria-live="polite"
          data-testid="quantity-value"
        >
          {optimisticQuantity}
        </span>

        <button
          type="button"
          onClick={() => change(optimisticQuantity + 1)}
          disabled={atCeiling}
          aria-label="Increase quantity"
          className="pressable grid h-9 w-9 place-items-center rounded-r text-muted hover:bg-surface hover:text-ink active:bg-surface-strong disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus />
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="text-xs leading-5 text-danger"
          data-testid="product-error-message"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default QuantityStepper
