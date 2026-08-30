"use client"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"
import { inputClasses, Label, cn } from "@modules/common/components/ui"
import React, { useState } from "react"

/**
 * The form input used across checkout and the account.
 *
 * It was a floating-label field whose label only moved because of a global
 * `input:focus ~ label` rule in `globals.css`, which every call site then had to
 * fight with `!transform-none`. That rule is gone, so the label is simply above
 * the field: it is readable while typing, it does not overlap autofilled text,
 * and it needs no coordination with a stylesheet three directories away.
 *
 * `topLabel` predates `label` and did the same job. Both are accepted so the
 * eleven call sites do not need editing; `label` is the one to use.
 */

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "placeholder"
> & {
  label: string
  name: string
  topLabel?: string
  hint?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  ref?: React.Ref<HTMLInputElement>
}

const Input = ({
  type,
  name,
  label,
  topLabel,
  hint,
  required,
  className,
  id,
  errors: _errors,
  touched: _touched,
  ref,
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id ?? name
  const isPassword = type === "password"

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Label htmlFor={inputId}>
        {topLabel ?? label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={isPassword && showPassword ? "text" : type}
          required={required}
          aria-describedby={hint ? `${inputId}-hint` : undefined}
          className={cn(inputClasses, isPassword && "pr-11", className)}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="pressable absolute right-1 top-1 grid h-9 w-9 place-items-center rounded text-muted hover:text-ink"
          >
            {showPassword ? <Eye /> : <EyeOff />}
          </button>
        )}
      </div>

      {hint && (
        <p id={`${inputId}-hint`} className="text-xs leading-5 text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

Input.displayName = "Input"

export default Input
