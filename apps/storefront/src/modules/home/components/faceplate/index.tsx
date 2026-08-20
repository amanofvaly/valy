import { clx } from "@modules/common/components/ui"
import React from "react"

type FaceplateProps = {
  /** The unit code stamped on the label plate, e.g. "VLY-C4" */
  code: string
  /** Short status read out on the right of the plate, e.g. "In stock" */
  status?: string
  className?: string
  children?: React.ReactNode
}

/**
 * The recurring "front panel" of a Valy machine: a label plate and a status
 * LED above the panel content. Used for the hero unit, the configuration cards
 * and the closing band so the page reads like a rack of the same equipment.
 */
const Faceplate: React.FC<FaceplateProps> = ({
  code,
  status,
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
    </div>
  )
}

export default Faceplate
