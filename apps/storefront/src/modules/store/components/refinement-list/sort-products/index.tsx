"use client"

import { cn } from "@lib/util/cn"
import { useBrowse } from "../../browse-frame"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

const SORT_OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Newest" },
  { value: "price_asc", label: "Price, low first" },
  { value: "price_desc", label: "Price, high first" },
]

/**
 * Sort, as radio chips.
 *
 * The old version rendered a list where the selected item was marked by a bullet
 * that sat outside the row, and nothing at all happened on a press. These are
 * real radios — arrow keys work, the label is the target — and the selected one
 * changes on touch, before the server has answered.
 */
const SortProducts = ({
  "data-testid": dataTestId,
  onPick,
}: {
  "data-testid"?: string
  /** Closes the sheet on a phone, where picking a sort is the whole errand. */
  onPick?: () => void
}) => {
  const { sortBy, setSort } = useBrowse()

  return (
    <fieldset data-testid={dataTestId}>
      <legend className="mb-3 text-xs font-medium text-ink">Sort by</legend>
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => {
          const active = sortBy === option.value

          return (
            <label
              key={option.value}
              data-testid="radio-label"
              data-active={active}
              className={cn(
                "pressable cursor-pointer rounded border px-3 py-1.5 text-xs",
                "has-[:focus-visible]:shadow-focus",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-paper text-muted hover:border-line-strong hover:text-ink active:bg-surface"
              )}
            >
              <input
                type="radio"
                name="sortBy"
                value={option.value}
                checked={active}
                onChange={() => {
                  setSort(option.value)
                  onPick?.()
                }}
                className="sr-only"
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default SortProducts
