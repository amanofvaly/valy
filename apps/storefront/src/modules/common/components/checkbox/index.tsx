import { Checkbox, Label } from "@modules/common/components/ui"
import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  id?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  id,
  'data-testid': dataTestId
}) => {
  // The id has to be unique per checkbox: `htmlFor` binds a label to the *first*
  // matching id in the document, so two checkboxes sharing one id would make the
  // second label toggle the first box. Derived from `name` so it stays stable
  // between server and client render.
  const inputId = id ?? (name ? `checkbox-${name}` : "checkbox")

  return (
    <div className="flex items-center space-x-2 ">
      <Checkbox
        className="text-base-regular flex items-center gap-x-2"
        id={inputId}
        role="checkbox"
        checked={checked}
        readOnly
        aria-checked={checked}
        onClick={onChange}
        name={name}
        data-testid={dataTestId}
      />
      <Label
        htmlFor={inputId}
        className="!transform-none !txt-medium"
      >
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
