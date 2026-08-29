"use client"

import { cn } from "@lib/util/cn"
import { useRef } from "react"

/**
 * The configurator's one control: a stack of full-width rows, one of which is
 * chosen.
 *
 * There is no radio dot and no chip. A chip cannot hold the sentence that
 * explains what the choice does, and once the sentence is what the visitor is
 * actually reading, the whole row has to be the target — so the row is the
 * control and the selected one is marked by its ring.
 *
 * `radiogroup` semantics are kept underneath. The rows are buttons with
 * `role="radio"`, roving tabindex, and arrow-key movement, so the thing that
 * looks like a card behaves like the radio group it is. Screen reader users get
 * "2 of 4" and keyboard users get arrow keys; nobody gets a grey dot.
 */

export type Choice = {
  /** Stable key, and what `onSelect` hands back. */
  value: string
  /** The bold line. A specification, not a benefit — "16GB", "2.5GB LAN". */
  name: string
  /** The sentence under it. Optional: "16GB" explains itself. */
  note?: string
  /** Right-aligned. "Included", "+ ₹5,000". */
  price: string
  /** Shown small under the price — capacity readouts, mostly. */
  meta?: string
  disabled?: boolean
  /** Why it is disabled, said in place of the note. */
  disabledReason?: string
}

type ChoiceGroupProps = {
  /** Announced as the group's name. */
  label: string
  choices: Choice[]
  value: string | null
  onSelect: (value: string) => void
  /** A stage that has been decided for the visitor still shows its reasoning. */
  locked?: boolean
  className?: string
}

export const ChoiceGroup = ({
  label,
  choices,
  value,
  onSelect,
  locked = false,
  className,
}: ChoiceGroupProps) => {
  const rowsRef = useRef<(HTMLButtonElement | null)[]>([])

  const selectable = choices.filter((c) => !c.disabled)

  /*
   * Arrow keys move between rows and select as they go, which is the native
   * radio group behaviour. Disabled rows are stepped over rather than landed
   * on, so a diskless machine's setup row never traps the focus ring.
   *
   * Modified arrows are left alone. Cmd+Up is "scroll to the top of the page"
   * on macOS and Ctrl+Left is a word jump elsewhere; swallowing those would
   * mean a reader trying to get back to the top of a seven-section page
   * silently changes what they are buying instead.
   */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"]
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
      return
    }
    if (locked || !keys.includes(event.key) || selectable.length < 2) {
      return
    }
    event.preventDefault()

    const forward = event.key === "ArrowDown" || event.key === "ArrowRight"
    const current = selectable.findIndex((c) => c.value === value)
    const next =
      (current + (forward ? 1 : -1) + selectable.length) % selectable.length

    const choice = selectable[next]
    onSelect(choice.value)
    rowsRef.current[choices.indexOf(choice)]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("flex flex-col gap-3", className)}
    >
      {choices.map((choice, index) => {
        const selected = choice.value === value
        const disabled = !!choice.disabled

        return (
          <button
            key={choice.value}
            ref={(el) => {
              rowsRef.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled || locked || undefined}
            /* Roving tabindex: one stop for the whole group. */
            tabIndex={selected || (!value && index === 0) ? 0 : -1}
            onClick={() => {
              if (!disabled && !locked) {
                onSelect(choice.value)
              }
            }}
            className={cn(
              "group relative w-full rounded-lg bg-paper px-4 py-3.5 text-left",
              "ring-1 ring-inset transition-[box-shadow,background-color]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              selected
                ? "ring-2 ring-accent"
                : "ring-line hover:ring-line-strong",
              // Rung zero of the responsiveness contract, same as every other
              // control on the site: something happens under the finger.
              !disabled && !locked && "pressable active:bg-surface",
              disabled && "cursor-not-allowed bg-surface opacity-60 ring-line",
              locked && !disabled && "cursor-default"
            )}
          >
            <span className="flex items-start justify-between gap-4">
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[0.9375rem] font-semibold leading-6",
                    disabled ? "text-muted" : "text-ink"
                  )}
                >
                  {choice.name}
                </span>
                {(choice.disabledReason ?? choice.note) && (
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    {choice.disabledReason ?? choice.note}
                  </span>
                )}
              </span>

              <span className="shrink-0 text-right">
                <span
                  className={cn(
                    "block whitespace-nowrap text-sm leading-6 tabular",
                    disabled ? "text-muted" : "text-ink"
                  )}
                >
                  {choice.price}
                </span>
                {choice.meta && (
                  <span className="mt-0.5 block whitespace-nowrap font-mono text-[0.6875rem] uppercase leading-4 tracking-[0.08em] text-muted">
                    {choice.meta}
                  </span>
                )}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
