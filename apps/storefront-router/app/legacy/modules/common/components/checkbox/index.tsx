"use client"

import { Checkbox } from "@modules/common/components/ui"

/**
 * A labelled checkbox for checkout's two form fields.
 *
 * This used to be a second implementation of the same thing the primitive
 * already does — its own label wiring, its own id derivation — passing
 * `readOnly` and `onClick` to a Radix control that understands neither, which
 * is why the box never reported its state to assistive technology. It is now a
 * thin adapter that keeps the `onChange`/`checked` shape its one caller uses.
 *
 * `name` matters: checkout reads `same_as_billing` and `save_address` off the
 * submitted FormData, and Radix only emits the hidden input that carries them
 * when the control is named.
 */

type CheckboxWithLabelProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  id?: string
  "data-testid"?: string
}

const CheckboxWithLabel = ({
  checked = true,
  onChange,
  label,
  name,
  id,
  "data-testid": dataTestId,
}: CheckboxWithLabelProps) => (
  <Checkbox
    // The id must be unique per checkbox: `htmlFor` binds a label to the first
    // matching id in the document, so two boxes sharing one id would make the
    // second label toggle the first. Derived from `name` so it stays stable
    // between the server and client renders.
    id={id ?? (name ? `checkbox-${name}` : "checkbox")}
    name={name}
    value="on"
    label={label}
    checked={checked}
    onCheckedChange={() => onChange?.()}
    data-testid={dataTestId}
  />
)

export default CheckboxWithLabel
