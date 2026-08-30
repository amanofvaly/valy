"use client"

import { cn } from "@lib/util/cn"
import { CheckCircleSolid } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * One checkout step.
 *
 * All four steps were repeating the same header markup with slightly different
 * heading sizes, different disabled treatments and different edit affordances —
 * one of them rendered its heading at `text-4xl` and greyed itself to 50%
 * opacity with `pointer-events-none`, which is invisible to a screen reader.
 *
 * This gives them one shape: a numbered step, a state, and an edit link that
 * only exists once there is something to go back and edit.
 */

type StepProps = {
  /** Position in the sequence, shown when the step is not yet done. */
  index: number
  title: string
  /** Search-param value that opens this step. */
  step: string
  /** Whether the customer has completed it. */
  complete?: boolean
  /** Whether it can be opened yet. */
  enabled?: boolean
  editTestId?: string
  children: React.ReactNode
}

const Step = ({
  index,
  title,
  step,
  complete,
  enabled = true,
  editTestId,
  children,
}: StepProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === step

  return (
    <section
      className={cn(
        "pb-8",
        step !== "payment" && "border-b border-line",
        !isOpen && !complete && "opacity-60"
      )}
      aria-current={isOpen ? "step" : undefined}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-ink">
          <span
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full font-mono text-2xs tabular",
              complete
                ? "bg-signal-wash text-signal"
                : isOpen
                  ? "bg-ink text-paper"
                  : "bg-surface text-muted"
            )}
          >
            {complete ? (
              <CheckCircleSolid aria-label="Completed" />
            ) : (
              index
            )}
          </span>
          {title}
        </h2>

        {!isOpen && complete && enabled && (
          <button
            type="button"
            onClick={() => router.push(`${pathname}?step=${step}`, { scroll: false })}
            className="pressable rounded text-sm text-accent hover:text-accent-strong"
            data-testid={editTestId}
          >
            Edit
          </button>
        )}
      </div>

      {children}
    </section>
  )
}

export default Step
