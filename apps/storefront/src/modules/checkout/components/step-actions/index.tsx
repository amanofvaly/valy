import { cn } from "@lib/util/cn"
import React from "react"

/**
 * The button that ends a checkout step, kept where a thumb can reach it.
 *
 * Every step here is taller than a phone — the address form is eleven fields,
 * the delivery step is a list of options with prices, the payment step is a
 * card form — so the control that finishes each one sat below the fold at the
 * moment the reader had finished deciding and wanted out. The result is the
 * commonest checkout failure there is: a filled-in form and no visible way
 * forward, on the screen where abandoning costs the most.
 *
 * `sticky bottom-0` rather than `fixed`. The bar belongs to the step, so it
 * appears when that step is open, scrolls away with it when it is done, and
 * cannot end up floating over a collapsed step or a review panel. It also
 * leaves the button inside its own `<form>`, which a fixed bar at the page
 * root would not.
 *
 * Full-bleed on a phone: the negative margins cancel the page gutter so the
 * bar's rule and ground run edge to edge, matching the gutter's two sizes. On
 * a wide screen there is no bar — the button goes back to sitting under the
 * step, where it has always been visible.
 */
const StepActions = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={cn(
      "sticky bottom-0 z-20 -mx-5 mt-6 flex flex-col gap-2 border-t border-line bg-paper/95 px-5 py-3 backdrop-blur",
      "supports-[backdrop-filter]:bg-paper/85",
      "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
      "sm:-mx-8 sm:px-8",
      "lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none lg:supports-[backdrop-filter]:bg-transparent",
      className
    )}
  >
    {children}
  </div>
)

export default StepActions
