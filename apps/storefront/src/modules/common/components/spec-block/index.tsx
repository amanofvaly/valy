import { cn } from "@modules/common/components/ui"
import { SpecRow } from "@lib/util/specs"

/**
 * The site's signature element: one hairline-ruled key/value block, rendered
 * identically wherever specifications appear — the lineup comparison, a machine
 * page, a part page, a cart line item, an order confirmation.
 *
 * It replaces the old homepage's decorative "readout" motif with the same
 * device doing real work. Values are monospaced and tabular so a column of
 * capacities or wattages lines up and can be compared by eye, which is the
 * whole reason the block exists.
 *
 * Renders nothing at all when there are no rows — a product whose metadata was
 * never filled in shows no empty frame.
 */

type SpecBlockProps = {
  rows: SpecRow[]
  className?: string
  /** Tighter rows and smaller type, for a card or a cart line. */
  density?: "default" | "compact"
  /** An accessible name, when the block is not already under a heading. */
  "aria-label"?: string
}

const SpecBlock = ({
  rows,
  className,
  density = "default",
  ...props
}: SpecBlockProps) => {
  if (!rows.length) {
    return null
  }

  const compact = density === "compact"

  return (
    <dl
      className={cn("w-full border-t border-line", className)}
      data-testid="spec-block"
      {...props}
    >
      {rows.map((row) => (
        <div
          key={row.key}
          className={cn(
            "flex items-baseline justify-between gap-6 border-b border-line",
            compact ? "py-1.5" : "py-2.5"
          )}
        >
          <dt
            className={cn(
              "shrink-0 text-muted",
              compact ? "text-2xs" : "text-xs"
            )}
          >
            {row.label}
          </dt>
          <dd
            className={cn(
              "min-w-0 text-right text-ink",
              // Figures are monospaced so they align down the column; prose
              // like "Intel Core i5-12500T, 12 cores" is not, because a
              // sentence set in mono is harder to read, not easier.
              row.prose
                ? cn(compact ? "text-2xs" : "text-sm")
                : cn("font-mono tabular", compact ? "text-2xs" : "text-sm")
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The same data on one line, for a cart row or a grid card where a table would
 * be too much furniture. Falls back to nothing rather than to an empty bullet
 * list.
 */
export const SpecInline = ({
  rows,
  className,
}: {
  rows: SpecRow[]
  className?: string
}) => {
  if (!rows.length) {
    return null
  }

  return (
    <p
      className={cn(
        "font-mono text-2xs tabular text-muted",
        className
      )}
      data-testid="spec-inline"
    >
      {rows.map((row, i) => (
        <span key={row.key}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <span className="sr-only">{row.label}: </span>
          {row.value}
        </span>
      ))}
    </p>
  )
}

export default SpecBlock
