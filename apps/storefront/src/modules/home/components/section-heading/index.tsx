import { clx } from "@modules/common/components/ui"
import React from "react"

type SectionHeadingProps = {
  eyebrow: string
  title: string
  description?: string
  /** Set on dark sections so the type inverts */
  tone?: "light" | "dark"
  align?: "start" | "center"
  className?: string
  children?: React.ReactNode
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  tone = "light",
  align = "start",
  className,
  children,
}) => {
  return (
    <div
      className={clx(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <span
        className={clx(
          "font-mono text-[11px] uppercase tracking-[0.22em]",
          tone === "light" ? "text-zinc-500" : "text-amber-400"
        )}
      >
        {eyebrow}
      </span>
      <div
        className={clx(
          "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
          align === "center" && "md:flex-col md:items-center"
        )}
      >
        <h2
          className={clx(
            "max-w-2xl font-display text-3xl leading-[1.1] tracking-tight [font-stretch:108%] md:text-4xl",
            tone === "light" ? "text-zinc-900" : "text-white"
          )}
        >
          {title}
        </h2>
        {children}
      </div>
      {description && (
        <p
          className={clx(
            "max-w-2xl text-base leading-7",
            tone === "light" ? "text-zinc-600" : "text-zinc-400"
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}

export default SectionHeading
