"use client"

import { cn } from "@lib/util/cn"
import { HttpTypes } from "@medusajs/types"

/**
 * One row of the configurator.
 *
 * Values that cannot be combined with the current selection are still shown,
 * marked, and still selectable. Hiding them would leave a shopper unable to
 * tell whether "16TB" does not exist or merely does not go with what they
 * picked two rows up — and selecting one re-resolves the rest rather than
 * dead-ending, which is what makes the marking honest rather than obstructive.
 */

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (optionId: string, value: string) => void
  title: string
  disabled?: boolean
  /**
   * The values this product actually has. Shared options — RAM, Capacity — are
   * catalogue-wide facets, so `option.values` carries every value any product
   * uses. Rendering those unfiltered puts "2GB" and "4GB" on a machine that has
   * never been offered with either.
   */
  values: string[]
  /** Of those, the ones that combine with everything else currently selected. */
  availableValues?: Set<string>
  /** Values that exist but are out of stock in every valid combination. */
  soldOutValues?: Set<string>
  "data-testid"?: string
}

const OptionSelect = ({
  values,
  current,
  updateOption,
  option,
  title,
  disabled,
  availableValues,
  soldOutValues,
  "data-testid": dataTestId,
}: OptionSelectProps) => {
  // A picker with one choice is not a choice.
  if (values.length < 2) {
    return null
  }

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 flex w-full items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{title}</span>
        {current && (
          <span className="font-mono text-2xs tabular text-muted">{current}</span>
        )}
      </legend>

      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {values.map((value) => {
          const selected = value === current
          const combinable = !availableValues || availableValues.has(value)
          const soldOut = !!soldOutValues?.has(value)

          return (
            <button
              key={value}
              type="button"
              onClick={() => updateOption(option.id, value)}
              disabled={disabled}
              aria-pressed={selected}
              data-testid="option-button"
              className={cn(
                "pressable relative rounded border px-3 py-2 font-mono text-xs tabular",
                "focus-visible:outline-none disabled:opacity-45",
                selected
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-paper text-ink hover:border-line-strong active:bg-surface",
                // Not disabled, only marked: it stays pressable so choosing it
                // rebuilds the rest of the configuration around it.
                !selected && !combinable && "text-muted line-through decoration-line-strong",
                !selected && combinable && soldOut && "text-muted"
              )}
            >
              {value}
              {soldOut && combinable && (
                <span className="ml-1.5 text-2xs text-muted">· none left</span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
