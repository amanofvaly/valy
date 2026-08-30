import { cn } from "@lib/util/cn"

/**
 * The radio dot for a whole-row choice — a delivery option, a payment method —
 * where the click target is the row and this is only the mark.
 *
 * Presentational on purpose: the row that contains it owns the real radio
 * semantics, so this must not also claim `role="radio"`. It used to, with a
 * hardcoded `aria-checked="true"` on every instance, which told a screen reader
 * that all of them were selected.
 */
const Radio = ({
  checked,
  disabled,
  "data-testid": dataTestId,
}: {
  checked: boolean
  disabled?: boolean
  "data-testid"?: string
}) => (
  <span
    aria-hidden="true"
    data-state={checked ? "checked" : "unchecked"}
    data-testid={dataTestId || "radio-button"}
    className={cn(
      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
      checked ? "border-[5px] border-accent" : "border-line-strong bg-paper",
      disabled && "opacity-45"
    )}
  />
)

export default Radio
