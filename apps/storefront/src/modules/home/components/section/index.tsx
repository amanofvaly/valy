import { cn } from "@lib/util/cn"

/**
 * One homepage section, and its heading.
 *
 * The old homepage had a `SectionHeading` with a `tone` prop for its dark
 * variants and an Archivo display face with a width axis. Neither survives: the
 * page is one ground with one type scale, and hierarchy comes from size and a
 * monospace eyebrow rather than from inverting the colours every other band.
 */

type SectionProps = {
  id?: string
  /** `surface` tints the band so adjacent sections separate without a rule. */
  ground?: "paper" | "surface"
  className?: string
  children: React.ReactNode
}

export const Section = ({
  id,
  ground = "paper",
  className,
  children,
}: SectionProps) => (
  <section
    id={id}
    className={cn(
      "border-t border-line py-14 sm:py-20 lg:py-24",
      ground === "surface" ? "bg-surface" : "bg-paper",
      id && "scroll-mt-20",
      className
    )}
  >
    <div className="container-page">{children}</div>
  </section>
)

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  /** One paragraph. If it needs two, it belongs in the section body. */
  lede?: string
  /** A link or button sitting opposite the title on wide screens. */
  action?: React.ReactNode
  className?: string
}

export const SectionHeading = ({
  eyebrow,
  title,
  lede,
  action,
  className,
}: SectionHeadingProps) => (
  <div className={cn("flex flex-col gap-4", className)}>
    {eyebrow && (
      <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
        {eyebrow}
      </p>
    )}
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
      <h2 className="max-w-2xl text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {action}
    </div>
    {lede && (
      <p className="max-w-prose text-base leading-7 text-muted">{lede}</p>
    )}
  </div>
)
