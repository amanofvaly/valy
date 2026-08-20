import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

type CtaLinkProps = {
  href: string
  variant?: "solid" | "outline" | "ghost"
  /** Set on dark sections so the outline variant stays legible */
  tone?: "light" | "dark"
  className?: string
  children: React.ReactNode
}

const base =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"

/** A link that carries the same affordance as the storefront's Button. */
const CtaLink: React.FC<CtaLinkProps> = ({
  href,
  variant = "solid",
  tone = "light",
  className,
  children,
}) => {
  const classes = clx(
    base,
    tone === "dark" ? "focus-visible:ring-offset-zinc-950" : "focus-visible:ring-offset-white",
    variant === "solid" && "bg-amber-400 text-zinc-950 hover:bg-amber-300",
    variant === "outline" &&
      (tone === "dark"
        ? "border border-zinc-700 text-white hover:border-zinc-500 hover:bg-zinc-900"
        : "border border-zinc-300 text-zinc-900 hover:border-zinc-900"),
    variant === "ghost" &&
      (tone === "dark"
        ? "px-0 text-zinc-300 hover:text-white"
        : "px-0 text-zinc-600 hover:text-zinc-900"),
    className
  )

  if (href.startsWith("mailto:") || href.startsWith("http") || href.startsWith("#")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <LocalizedClientLink href={href} className={classes}>
      {children}
    </LocalizedClientLink>
  )
}

export default CtaLink
