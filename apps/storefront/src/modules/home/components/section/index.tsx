import { cn } from "@lib/util/cn"

/**
 * One homepage chapter, and its heading.
 *
 * Two things changed when the page stopped being a stack of identical bands.
 *
 * The eyebrow is gone. Every section used to open with a monospace label
 * naming what the section was, directly above a heading that said the same
 * thing better — "The range" over "Three sizes, named after how far you have
 * got." A heading that needs a label above it is a heading that is too small,
 * so the labels went and the headings grew.
 *
 * The ground is no longer paper-or-surface. A page whose argument is that a
 * subscription is rent should not make that argument in the same grey as its
 * shipping policy, so `ink` and `accent` are real chapters now: full-bleed
 * colour, inverted type, and a `rule` that opens the loud ones in Swiss red
 * instead of a hairline.
 */

type Ground = "paper" | "surface" | "ink" | "accent"

const GROUND: Record<Ground, string> = {
  paper: "bg-paper text-ink",
  surface: "bg-surface text-ink",
  ink: "bg-ink text-paper",
  accent: "bg-accent text-paper",
}

/** True where the ground is dark enough that type has to invert. */
export const isInverted = (ground: Ground) => ground === "ink" || ground === "accent"

type SectionProps = {
  id?: string
  ground?: Ground
  /**
   * The rule across the top edge. `accent` marks a chapter that carries part
   * of the argument; `hairline` separates two chapters that do not need
   * marking; `none` is for a chapter whose own ground already divides it.
   */
  rule?: "accent" | "hairline" | "none"
  /**
   * Skip the page container. The section then owns its own gutters, which is
   * how the grids that run off the edge of the screen are built.
   */
  bleed?: boolean
  /** Vertical rhythm. `tight` is for the strips between chapters. */
  pad?: "default" | "tight" | "none"
  className?: string
  children: React.ReactNode
}

export const Section = ({
  id,
  ground = "paper",
  rule = "hairline",
  bleed = false,
  pad = "default",
  className,
  children,
}: SectionProps) => (
  <section
    id={id}
    className={cn(
      GROUND[ground],
      rule === "accent" && "border-t-[3px] border-accent",
      rule === "hairline" &&
        (isInverted(ground) ? "border-t border-ink" : "border-t border-line"),
      pad === "default" && "py-16 sm:py-24 lg:py-32",
      pad === "tight" && "py-8 sm:py-10",
      id && "scroll-mt-20",
      className
    )}
  >
    {bleed ? children : <div className="container-page">{children}</div>}
  </section>
)

type SectionHeadingProps = {
  title: React.ReactNode
  /** One paragraph. If it needs two, it belongs in the section body. */
  lede?: string
  /** A link or button sitting opposite the title on wide screens. */
  action?: React.ReactNode
  /** Set on `ink` and `accent` grounds. */
  invert?: boolean
  className?: string
}

export const SectionHeading = ({
  title,
  lede,
  action,
  invert = false,
  className,
}: SectionHeadingProps) => (
  <div className={cn("flex flex-col gap-6", className)}>
    {/*
     * `contents` dissolves this wrapper on a phone, so the heading, the lede
     * and the action become siblings in one column and `order` can put the
     * action last — a button wedged between a heading and the sentence
     * explaining it reads as an interruption. From `md` the wrapper is a real
     * flex row again and the action returns to the heading's baseline.
     */}
    <div className="contents md:flex md:flex-row md:items-end md:justify-between md:gap-12">
      <h2
        className={cn(
          "order-1 max-w-[20ch] text-balance text-3xl font-semibold leading-[1.06] tracking-tight sm:text-4xl lg:text-5xl md:order-none",
          invert ? "text-paper" : "text-ink"
        )}
      >
        {title}
      </h2>
      {action && <div className="order-3 md:order-none md:shrink-0">{action}</div>}
    </div>
    {lede && (
      <p
        className={cn(
          "order-2 max-w-prose text-lg leading-8 md:order-none",
          invert ? "text-paper/70" : "text-muted"
        )}
      >
        {lede}
      </p>
    )}
  </div>
)

/**
 * The aside that qualifies a chapter.
 *
 * Three sections on the homepage end by admitting something — that a drive will
 * fail, that the smallest machine will not run everything at once, that the
 * competitor being criticised walked most of it back. All three used to be
 * muted grey text behind a two-pixel grey bar, which is the typographic form of
 * saying it quietly and hoping nobody reads it. They are the most trustworthy
 * paragraphs on the page, so they are set in full-strength text under the same
 * red rule that opens a chapter.
 */
export const Aside = ({
  children,
  invert = false,
  className,
}: {
  children: React.ReactNode
  invert?: boolean
  className?: string
}) => (
  <p
    className={cn(
      "max-w-prose border-t-2 pt-5 text-base leading-7",
      invert ? "border-paper/50 text-paper/85" : "border-accent text-ink",
      className
    )}
  >
    {children}
  </p>
)
