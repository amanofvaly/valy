import { clx } from "@modules/common/components/ui"
import React from "react"

type FaceplateProps = {
  /** The unit code stamped on the label plate, e.g. "VLY-C4" */
  code: string
  /** Short status read out on the right of the plate, e.g. "In stock" */
  status?: string
  /** Number of drive bays drawn along the bottom of the panel */
  bays?: number
  className?: string
  children?: React.ReactNode
}

/**
 * The recurring "front panel" of a Valy machine: a label plate, a status LED
 * and a row of drive bays. Used for the hero unit, the configuration cards and
 * the closing band so the page reads like a rack of the same equipment.
 */
const Faceplate: React.FC<FaceplateProps> = ({
  code,
  status,
  bays = 4,
  className,
  children,
}) => {
  return (
    <div
      className={clx(
        "flex flex-col overflow-hidden rounded-large border border-zinc-800 bg-zinc-900",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
          {code}
        </span>
        {status && (
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-400">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-circle bg-emerald-400 motion-safe:animate-pulse"
            />
            {status}
          </span>
        )}
      </div>

      {children && <div className="relative flex-1">{children}</div>}

      <div
        aria-hidden
        className="flex items-center gap-1.5 border-t border-zinc-800 bg-zinc-950 px-4 py-3"
      >
        {Array.from({ length: bays }).map((_, index) => (
          <div
            key={index}
            className="flex h-7 flex-1 items-center justify-between rounded-soft bg-zinc-900 px-2 ring-1 ring-inset ring-zinc-800"
          >
            <span className="h-3 w-px bg-zinc-700" />
            <span className="h-1 w-1 rounded-circle bg-amber-400/80" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Faceplate
