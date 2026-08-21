"use client"

import { ModalProvider, useModal } from "@lib/context/modal-context"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn, IconButton } from "@modules/common/components/ui"
import X from "@modules/common/icons/x"
import React from "react"

/**
 * The modal, rebuilt on the same Radix Dialog the sheet uses.
 *
 * The Headless UI version had a backdrop with `bg-opacity-75` and no colour, so
 * it dimmed nothing — the page behind stayed at full contrast under a blur. It
 * also kept its own transitions, its own panel sizing and its own close button,
 * none of which matched the sheet doing the same job three files away.
 *
 * The compound API (`Modal.Title`, `.Body`, `.Footer`) is unchanged so its call
 * sites do not move.
 */

type ModalProps = {
  isOpen: boolean
  close: () => void
  size?: "small" | "medium" | "large"
  search?: boolean
  children: React.ReactNode
  "data-testid"?: string
}

const Modal = ({
  isOpen,
  close,
  size = "medium",
  search = false,
  children,
  "data-testid": dataTestId,
}: ModalProps) => (
  <DialogPrimitive.Root open={isOpen} onOpenChange={(o) => !o && close()}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[75] bg-ink/35 backdrop-blur-[2px] data-[state=open]:animate-overlay-in" />

      <DialogPrimitive.Content
        data-testid={dataTestId}
        className={cn(
          "fixed left-1/2 z-[75] flex max-h-[85vh] w-[calc(100%-2rem)] -translate-x-1/2 flex-col",
          "overflow-y-auto focus:outline-none data-[state=open]:animate-pop-in",
          search ? "top-24" : "top-1/2 -translate-y-1/2",
          size === "small" && "max-w-md",
          size === "medium" && "max-w-xl",
          size === "large" && "max-w-3xl",
          search
            ? "bg-transparent"
            : "rounded-lg border border-line bg-paper p-5 shadow-overlay"
        )}
      >
        <ModalProvider close={close}>{children}</ModalProvider>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
)

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { close } = useModal()

  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <DialogPrimitive.Title className="text-lg font-semibold text-ink">
        {children}
      </DialogPrimitive.Title>
      <IconButton
        aria-label="Close"
        onClick={close}
        data-testid="close-modal-button"
        className="-mr-2 -mt-1"
      >
        <X size={20} />
      </IconButton>
    </div>
  )
}

const Description: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <DialogPrimitive.Description className="mb-4 text-sm leading-6 text-muted">
    {children}
  </DialogPrimitive.Description>
)

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex-1">{children}</div>
)

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-6 flex items-center justify-end gap-3">{children}</div>
)

Modal.Title = Title
Modal.Description = Description
Modal.Body = Body
Modal.Footer = Footer

export default Modal
