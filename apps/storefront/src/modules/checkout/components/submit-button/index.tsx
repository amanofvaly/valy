"use client"

import { Button, type ButtonVariant } from "@modules/common/components/ui"
import React from "react"
import { useFormStatus } from "react-dom"

/**
 * A submit button that knows when its form is in flight.
 *
 * `variant` is the button's own union rather than a hand-written subset. The
 * subset was three names deep and predated the action ladder, so every form
 * whose submit is the thing the page exists for — sign in, register, the
 * checkout's address step — was locked out of saying so and fell back to a
 * black button that looked like navigation.
 */
export function SubmitButton({
  children,
  variant = "primary",
  size = "medium",
  className,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: ButtonVariant | null
  size?: "small" | "medium" | "large"
  className?: string
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      size={size}
      className={className}
      type="submit"
      isLoading={pending}
      variant={variant || "primary"}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}
