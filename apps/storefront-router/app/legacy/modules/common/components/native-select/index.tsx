"use client"

import { ChevronUpDown } from "@medusajs/icons"
import { cn } from "@modules/common/components/ui"
import {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

/**
 * A real `<select>`.
 *
 * Deliberately not a Radix Select: on a phone the native control opens the
 * platform's own wheel or list, which is faster to operate, works with the
 * software keyboard, and is the thing every other app on the device uses. The
 * styling here is only the box around it and the chevron.
 */

export type NativeSelectProps = {
  placeholder?: string
  label?: string
  error?: string | null
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & SelectHTMLAttributes<HTMLSelectElement>

const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  (
    {
      placeholder = "Select...",
      label,
      error,
      defaultValue,
      className,
      children,
      id,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)
    const selectId = id ?? props.name

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      setIsPlaceholder(innerRef.current?.value === "")
    }, [innerRef.current?.value])

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center rounded border border-line bg-paper",
            "hover:border-line-strong focus-within:border-accent",
            error && "border-danger",
            className
          )}
        >
          <select
            ref={innerRef}
            id={selectId}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            {...props}
            className={cn(
              "h-11 flex-1 appearance-none border-none bg-transparent pl-3 pr-10 outline-none",
              // 16px on small screens, or iOS zooms the page on focus.
              "text-[16px] sm:text-base",
              isPlaceholder ? "text-muted" : "text-ink"
            )}
          >
            <option disabled value="">
              {placeholder}
            </option>
            {children}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
            <ChevronUpDown />
          </span>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

NativeSelect.displayName = "NativeSelect"

export default NativeSelect
