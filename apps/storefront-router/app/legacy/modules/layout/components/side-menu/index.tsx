"use client"

import { BarsThree } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@modules/common/components/sheet"
import { Divider, IconButton } from "@modules/common/components/ui"
import { useState } from "react"

/**
 * The navigation on a phone.
 *
 * The old version was a translucent dark panel with a hover-driven country
 * picker, which on a touchscreen meant the picker could not be opened at all.
 * This is a plain left sheet with the same links the desktop nav has, plus the
 * account and cart entries that do not fit in the header at this width.
 */

type SideMenuProps = {
  links: { href: string; label: string }[]
  /**
   * The region and language controls, rendered on the server and streamed in.
   * They are passed rather than fetched so opening this panel never has to
   * wait for anything, and so the header above it never does either.
   */
  children?: React.ReactNode
}

const SideMenu = ({ links, children }: SideMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <IconButton aria-label="Open menu" data-testid="nav-menu-button" className="-ml-2">
          <BarsThree />
        </IconButton>
      </SheetTrigger>

      <SheetContent
        side="left"
        title="Valy"
        data-testid="nav-menu-popup"
        className="gap-0"
      >
        <ul className="flex flex-col px-2 py-4">
          {links.map((link) => (
            <li key={link.href}>
              <SheetClose asChild>
                <LocalizedClientLink
                  href={link.href}
                  className="pressable-tint block rounded px-3 py-3 text-lg font-medium text-ink"
                  data-testid={`${link.label.toLowerCase().replace(/\s+/g, "-")}-link`}
                >
                  {link.label}
                </LocalizedClientLink>
              </SheetClose>
            </li>
          ))}
        </ul>

        <Divider className="mx-5" />

        <ul className="flex flex-col px-2 py-4">
          {[
            { href: "/store", label: "Everything we sell" },
            { href: "/account", label: "Account" },
            { href: "/cart", label: "Cart" },
          ].map((link) => (
            <li key={link.href}>
              <SheetClose asChild>
                <LocalizedClientLink
                  href={link.href}
                  className="pressable-tint block rounded px-3 py-2.5 text-base text-muted"
                  data-testid={`${link.label.toLowerCase().split(" ")[0]}-link`}
                >
                  {link.label}
                </LocalizedClientLink>
              </SheetClose>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-4 border-t border-line px-5 py-5">
          {children}
          <p className="text-2xs text-muted">
            © {new Date().getFullYear()} Valy, India.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default SideMenu
