"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XMark } from "@medusajs/icons"
import { cn, IconButton } from "@modules/common/components/ui"
import { forwardRef } from "react"

/**
 * A panel that slides in from an edge, and the modal dialog it shares its
 * mechanics with.
 *
 * Radix Dialog does the parts that are easy to get wrong and impossible to
 * notice in a screenshot: focus moves into the panel and is trapped there,
 * Escape closes, the page behind stops scrolling and stops being reachable by
 * screen readers, and focus returns to whatever opened it. The site had three
 * separate hand-built versions of this before — the side menu, the address
 * modal, and the mobile product actions — each with a different subset working.
 */

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

const SheetOverlay = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px]",
      "data-[state=open]:animate-overlay-in",
      className
    )}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

type Side = "left" | "right" | "bottom" | "center"

const sideClasses: Record<Side, string> = {
  left: "inset-y-0 left-0 h-full w-[min(22rem,88vw)] border-r data-[state=open]:animate-sheet-in-left",
  right:
    "inset-y-0 right-0 h-full w-[min(26rem,92vw)] border-l data-[state=open]:animate-sheet-in-right",
  // A bottom sheet on a phone puts the controls within reach of a thumb.
  bottom:
    "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-xl border-t data-[state=open]:animate-sheet-in-bottom",
  center:
    "left-1/2 top-1/2 w-[min(32rem,92vw)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-lg border data-[state=open]:animate-pop-in",
}

type SheetContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  side?: Side
  title: string
  description?: string
  /** Hide the title visually while keeping it for assistive technology. */
  hideTitle?: boolean
  showClose?: boolean
}

export const SheetContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      className,
      children,
      side = "right",
      title,
      description,
      hideTitle,
      showClose = true,
      ...props
    },
    ref
  ) => (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex flex-col overflow-y-auto border-line bg-paper shadow-overlay",
          "focus:outline-none",
          sideClasses[side],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex items-start justify-between gap-4 px-5 pt-5",
            hideTitle && "sr-only"
          )}
        >
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-lg font-semibold text-ink">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1 text-sm text-muted">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          {showClose && !hideTitle && (
            <DialogPrimitive.Close asChild>
              <IconButton aria-label="Close" className="-mr-2 -mt-1">
                <XMark />
              </IconButton>
            </DialogPrimitive.Close>
          )}
        </div>

        {/*
         * When the header is visually hidden the close button has to be
         * rendered separately, or the panel has no visible way out on a device
         * with no Escape key.
         */}
        {showClose && hideTitle && (
          <DialogPrimitive.Close asChild>
            <IconButton
              aria-label="Close"
              className="absolute right-3 top-3 z-10 bg-paper/80"
            >
              <XMark />
            </IconButton>
          </DialogPrimitive.Close>
        )}

        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
)
SheetContent.displayName = "SheetContent"

/** Sticky footer for a sheet's actions, so they stay reachable while scrolling. */
export const SheetFooter = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => (
  <div
    className={cn(
      "sticky bottom-0 mt-auto border-t border-line bg-paper px-5 py-4",
      className
    )}
  >
    {children}
  </div>
)
