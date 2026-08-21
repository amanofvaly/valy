"use client"

import { cn } from "@lib/util/cn"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

/**
 * Pagination.
 *
 * Navigates inside a transition, so the page you are looking at stays on screen
 * while the next one loads rather than being replaced by a skeleton — the same
 * rule the filters follow.
 */
export function Pagination({
  page,
  totalPages,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const goTo = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(nextPage))

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  if (totalPages <= 1) {
    return null
  }

  const pages = pageWindow(page, totalPages)

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-1"
      aria-label="Pagination"
      data-testid={dataTestid}
    >
      <PageButton
        disabled={page <= 1 || isPending}
        onClick={() => goTo(page - 1)}
        label="Previous page"
      >
        Previous
      </PageButton>

      <ol className="flex items-center gap-1">
        {pages.map((entry, i) =>
          entry === "gap" ? (
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-1 text-sm text-muted"
            >
              &hellip;
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                onClick={() => goTo(entry)}
                aria-current={entry === page ? "page" : undefined}
                disabled={entry === page}
                className={cn(
                  "pressable h-9 min-w-9 rounded px-2 font-mono text-sm tabular",
                  entry === page
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-surface hover:text-ink active:bg-surface-strong"
                )}
              >
                {entry}
              </button>
            </li>
          )
        )}
      </ol>

      <PageButton
        disabled={page >= totalPages || isPending}
        onClick={() => goTo(page + 1)}
        label="Next page"
      >
        Next
      </PageButton>
    </nav>
  )
}

const PageButton = ({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="pressable h-9 rounded px-3 text-sm text-muted hover:bg-surface hover:text-ink active:bg-surface-strong disabled:pointer-events-none disabled:opacity-40"
  >
    {children}
  </button>
)

/** 1 … 4 5 6 … 20 — never more than seven controls, whatever the total. */
const pageWindow = (page: number, total: number): (number | "gap")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, "gap", total]
  }

  if (page >= total - 3) {
    return [1, "gap", total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, "gap", page - 1, page, page + 1, "gap", total]
}
