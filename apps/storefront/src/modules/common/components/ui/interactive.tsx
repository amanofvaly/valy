"use client"

import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import * as LabelPrimitive from "@radix-ui/react-label"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@lib/util/cn"
import { type VariantProps } from "class-variance-authority"
import { ButtonHTMLAttributes, InputHTMLAttributes } from "react"
import { buttonVariants, inputClasses, Spinner } from "./primitives"

/**
 * The interactive half of the primitive layer.
 *
 * Everything here either wraps a Radix primitive or needs a browser event, so
 * it is a client boundary. The presentational half — text, headings, badges,
 * tables, the class helper — stays server-renderable in `primitives.tsx`, and
 * `index.tsx` re-exports both so no call site has to know the difference.
 *
 * Behaviour that Radix owns is not reimplemented: focus trapping, roving
 * tabindex, `aria-*` wiring, label association. What is added here is the
 * visual system and, on every control, an `:active` state — the only response
 * a phone gets, since `hover:` does nothing there.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean
    /** Render the child element instead of a `<button>` — for links. */
    asChild?: boolean
    ref?: React.Ref<HTMLButtonElement>
  }

export const Button = ({
  className,
  variant,
  size,
  block,
  isLoading,
  asChild,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const classes = cn(buttonVariants({ variant, size, block }), className)

  /*
   * `asChild` hands the styling to whatever element the caller passed — a link,
   * usually. Slot merges props onto exactly one element child, so the loading
   * wrapper below must not be introduced here: a link has no pending state of
   * its own anyway (LocalizedClientLink carries one, driven by useLinkStatus).
   */
  if (asChild) {
    return (
      <Slot className={classes} {...props}>
        {children}
      </Slot>
    )
  }

  return (
    <button
      disabled={disabled || isLoading}
      data-loading={isLoading || undefined}
      aria-busy={isLoading || undefined}
      className={classes}
      {...props}
    >
      {/*
       * The label keeps its place while loading rather than being replaced by
       * the word "Loading" — a button that changes width mid-press moves the
       * thing that is under the finger.
       */}
      <span className={cn("contents", isLoading && "invisible")}>{children}</span>
      {isLoading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner className="h-4 w-4" />
        </span>
      )}
    </button>
  )
}
Button.displayName = "Button"

export const IconButton = ({
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>
}) => (
  <button
    type={type}
    className={cn(
      "pressable inline-flex h-9 w-9 items-center justify-center rounded text-muted",
      "hover:bg-surface hover:text-ink active:bg-surface-strong",
      "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45",
      className
    )}
    {...props}
  >
    {children}
  </button>
)
IconButton.displayName = "IconButton"

export const Label = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) => (
  <LabelPrimitive.Root
    className={cn("text-sm font-medium text-ink", className)}
    {...props}
  />
)
Label.displayName = "Label"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string | null
  ref?: React.Ref<HTMLInputElement>
}

export const Input = ({
  className,
  label,
  hint,
  error,
  id,
  ...props
}: InputProps) => {
  const inputId = id ?? props.name

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${inputId}-help` : undefined}
        className={cn(inputClasses, error && "border-danger", className)}
        {...props}
      />
      {(error || hint) && (
        <p
          id={`${inputId}-help`}
          className={cn("text-xs", error ? "text-danger" : "text-muted")}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
}
Input.displayName = "Input"

const RadioGroupRoot = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>) => (
  <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} />
)
RadioGroupRoot.displayName = "RadioGroup"

const RadioGroupItem = ({
  className,
  label,
  children,
  id,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
  label?: React.ReactNode
}) => (
  <div className="flex items-center gap-2.5">
    <RadioGroupPrimitive.Item
      id={id}
      className={cn(
        "pressable flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
        "border border-line-strong bg-paper",
        "data-[state=checked]:border-[5px] data-[state=checked]:border-accent",
        "focus-visible:outline-none disabled:opacity-45",
        className
      )}
      {...props}
    />
    {(label || children) && (
      <Label htmlFor={id} className="cursor-pointer">
        {label ?? children}
      </Label>
    )}
  </div>
)
RadioGroupItem.displayName = "RadioGroupItem"

export const RadioGroup = Object.assign(RadioGroupRoot, { Item: RadioGroupItem })

/**
 * The dot on its own, for composing inside a whole clickable row — a delivery
 * option or a saved address, where the target is the card and not the circle.
 * Expects a Radix `Item` ancestor carrying `group` and `data-state`.
 */
export const RadioDot = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
      "border-line-strong bg-paper",
      "group-data-[state=checked]:border-[5px] group-data-[state=checked]:border-accent",
      className
    )}
  />
)

export const Checkbox = ({
  className,
  label,
  id,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  label?: React.ReactNode
}) => (
  <div className="flex items-center gap-2.5">
    <CheckboxPrimitive.Root
      id={id}
      className={cn(
        "pressable flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border",
        "border-line-strong bg-paper text-paper",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent",
        "focus-visible:outline-none disabled:opacity-45",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
    {label && (
      <Label htmlFor={id} className="cursor-pointer font-normal">
        {label}
      </Label>
    )}
  </div>
)
Checkbox.displayName = "Checkbox"
