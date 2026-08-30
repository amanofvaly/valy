"use client"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import { cn } from "@lib/util/cn"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useTransition,
} from "react"

/**
 * The client half of every browse page.
 *
 * It exists to keep one promise: **the old grid stays visible and readable
 * while the new one loads.** Two things make that true.
 *
 * The chip reads from `useOptimistic`, so it activates on the press rather than
 * when the server answers. And the navigation happens inside `startTransition`,
 * which is what makes React hold the current results on screen instead of
 * unmounting them to a skeleton — the products the shopper is looking at do not
 * vanish because they touched "32GB".
 *
 * The grid itself is `children`: a server component rendered by the page and
 * passed through, so none of the catalogue reading moves to the browser.
 */

type BrowseState = {
  sortBy: string
  selectedValueIds: string[]
  isPending: boolean
  setSort: (value: string) => void
  toggleOptionValue: (valueId: string) => void
  clearFilters: () => void
}

const BrowseContext = createContext<BrowseState | null>(null)

export const useBrowse = () => {
  const ctx = useContext(BrowseContext)

  if (!ctx) {
    throw new Error("useBrowse must be used inside <BrowseFrame>")
  }

  return ctx
}

type BrowseFrameProps = {
  sortBy: string
  /** The filter rail and toolbar. */
  controls: React.ReactNode
  /** The mobile filter sheet trigger and panel. */
  mobileControls?: React.ReactNode
  children: React.ReactNode
}

const BrowseFrame = ({
  sortBy,
  controls,
  mobileControls,
  children,
}: BrowseFrameProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const committedValueIds = useMemo(
    () => parseOptionValueIds(searchParams),
    [searchParams]
  )

  // What the chips show. Reverts on its own when the transition settles, so a
  // failed or superseded navigation cannot leave a chip lit that is not real.
  const [optimisticState, applyOptimistic] = useOptimistic(
    { sortBy, selectedValueIds: committedValueIds },
    (
      _current,
      next: { sortBy: string; selectedValueIds: string[] }
    ) => next
  )

  const navigate = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      // Any change to what is being filtered invalidates which page you are on.
      params.delete("page")

      const query = params.toString()
      const next = query ? `${pathname}?${query}` : pathname
      const current = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      if (next === current) {
        return
      }

      startTransition(() => {
        router.push(next, { scroll: false })
      })
    },
    [pathname, router, searchParams]
  )

  const setSort = useCallback(
    (value: string) => {
      startTransition(() => {
        applyOptimistic({
          sortBy: value,
          selectedValueIds: committedValueIds,
        })
      })
      navigate((params) => params.set("sortBy", value))
    },
    [applyOptimistic, committedValueIds, navigate]
  )

  const toggleOptionValue = useCallback(
    (valueId: string) => {
      const isOn = committedValueIds.includes(valueId)
      const nextIds = isOn
        ? committedValueIds.filter((id) => id !== valueId)
        : [...committedValueIds, valueId]

      startTransition(() => {
        applyOptimistic({ sortBy, selectedValueIds: nextIds })
      })

      navigate((params) => {
        params.delete(OPTION_VALUE_QUERY_KEY)
        nextIds.forEach((id) => params.append(OPTION_VALUE_QUERY_KEY, id))
      })
    },
    [applyOptimistic, committedValueIds, navigate, sortBy]
  )

  const clearFilters = useCallback(() => {
    startTransition(() => {
      applyOptimistic({ sortBy, selectedValueIds: [] })
    })
    navigate((params) => params.delete(OPTION_VALUE_QUERY_KEY))
  }, [applyOptimistic, navigate, sortBy])

  const value: BrowseState = {
    sortBy: optimisticState.sortBy,
    selectedValueIds: optimisticState.selectedValueIds,
    isPending,
    setSort,
    toggleOptionValue,
    clearFilters,
  }

  return (
    <BrowseContext.Provider value={value}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="contents lg:sticky lg:top-24 lg:block lg:w-56 lg:shrink-0">
          <div className="hidden lg:block">{controls}</div>
          {mobileControls}
        </div>

        <div className="min-w-0 flex-1">
          {/*
           * The results themselves. Dimmed, never removed — a shopper can still
           * read the machine they were comparing while the filtered set loads.
           */}
          <div
            aria-busy={isPending}
            className={cn(
              "transition-opacity duration-150",
              // Clears the fixed sort-and-filter bar on a phone, so the last
              // row of products is never hidden behind it.
              "pb-20 lg:pb-0",
              isPending && "opacity-55"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </BrowseContext.Provider>
  )
}

export default BrowseFrame
