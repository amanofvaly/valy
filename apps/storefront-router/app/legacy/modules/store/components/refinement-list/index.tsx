"use client"

import { cn } from "@lib/util/cn"
import { Funnel } from "@medusajs/icons"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from "@modules/common/components/sheet"
import { Button } from "@modules/common/components/ui"
import { useState } from "react"
import { useBrowse } from "../browse-frame"
import SortProducts from "./sort-products"

/**
 * Sort and facets.
 *
 * The desktop rail and the phone controls render the same two components, so
 * the mobile version cannot fall behind the desktop one.
 */

type RefinementListProps = {
  hideOptionsPicker?: boolean
  "data-testid"?: string
  /** The facets, rendered on the server and streamed in. */
  children?: React.ReactNode
}

const RefinementList = ({
  hideOptionsPicker = false,
  "data-testid": dataTestId,
  children,
}: RefinementListProps) => (
  <div className="flex flex-col gap-8" data-testid={dataTestId}>
    <SortProducts />
    {!hideOptionsPicker && children}
  </div>
)

/**
 * The phone controls: a bar fixed to the bottom of the viewport, split in two.
 *
 * This replaces a full-width outlined button reading "Sort and filter", which
 * is not a control anybody has seen on a shop before. A bottom bar divided into
 * Sort and Filter is the pattern every large Indian retailer uses, so it needs
 * no learning — and it sits under the thumb rather than at the top of a scroll
 * the shopper has already left behind.
 *
 * It hides itself on `lg`, where the rail is permanently on screen.
 */
export const RefinementSheet = ({
  hideOptionsPicker = false,
  children,
}: RefinementListProps) => {
  const [open, setOpen] = useState<"sort" | "filter" | null>(null)
  const { selectedValueIds, clearFilters, sortBy } = useBrowse()
  const activeCount = selectedValueIds.length

  const sortLabel =
    sortBy === "price_asc"
      ? "Price, low"
      : sortBy === "price_desc"
        ? "Price, high"
        : "Newest"

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 lg:hidden",
          "border-t border-line bg-paper/95 backdrop-blur",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="grid grid-cols-2 divide-x divide-line">
          <button
            type="button"
            onClick={() => setOpen("sort")}
            className="pressable-tint flex h-14 items-center justify-center gap-2 text-sm text-ink"
          >
            <SortGlyph />
            Sort
            <span className="text-muted">· {sortLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setOpen("filter")}
            disabled={hideOptionsPicker}
            className="pressable-tint flex h-14 items-center justify-center gap-2 text-sm text-ink disabled:opacity-40"
          >
            <Funnel />
            Filter
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 font-mono text-2xs text-paper">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <Sheet open={open === "sort"} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="bottom" title="Sort by">
          <div className="px-5 pb-6 pt-2">
            <SortProducts onPick={() => setOpen(null)} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={open === "filter"} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="bottom" title="Filter">
          <div className="px-5 py-2 [&_[data-facets-label]]:hidden">
            {children}
          </div>

          <SheetFooter className="flex gap-3">
            <Button
              variant="secondary"
              block
              onClick={clearFilters}
              disabled={!activeCount}
            >
              Clear
            </Button>
            <SheetClose asChild>
              <Button block>Show results</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Two rules with arrowheads — the ordering glyph, not a generic slider icon. */
const SortGlyph = () => (
  <svg
    viewBox="0 0 16 16"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 2.5v11M4 13.5 2 11.5M4 13.5l2-2" />
    <path d="M12 13.5v-11M12 2.5l-2 2M12 2.5l2 2" />
  </svg>
)

/** The trigger is not needed where the rail is always visible. */
export { SheetTrigger }

export default RefinementList
