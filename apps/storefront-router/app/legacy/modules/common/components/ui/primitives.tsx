import { cn } from "@lib/util/cn"
import { cva, type VariantProps } from "class-variance-authority"
import {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react"

/**
 * The presentational half of the primitive layer.
 *
 * No directive, no browser events, no `forwardRef` — so a server component can
 * both render these and call `cn` out of the same import. React 19 takes `ref`
 * as an ordinary prop, which is what makes that possible.
 */

/* -------------------------------------------------------------------------- */
/*  Text and headings                                                          */
/* -------------------------------------------------------------------------- */

type TextProps = HTMLAttributes<HTMLElement> & {
  as?: "p" | "span" | "div"
  size?: "xs" | "sm" | "base" | "lg"
  tone?: "default" | "muted" | "accent" | "signal" | "danger"
  ref?: React.Ref<HTMLElement>
}

export const Text = ({
  className,
  as: Component = "p",
  size = "base",
  tone = "default",
  children,
  ...props
}: TextProps) => (
  <Component
    className={cn(
      size === "xs" && "text-xs",
      size === "sm" && "text-sm",
      size === "base" && "text-base",
      size === "lg" && "text-lg",
      tone === "muted" && "text-muted",
      tone === "accent" && "text-accent",
      tone === "signal" && "text-signal",
      tone === "danger" && "text-danger",
      className
    )}
    {...(props as HTMLAttributes<HTMLElement>)}
  >
    {children}
  </Component>
)

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: "h1" | "h2" | "h3" | "h4"
  ref?: React.Ref<HTMLHeadingElement>
}

export const Heading = ({
  className,
  level: Component = "h2",
  children,
  ...props
}: HeadingProps) => (
  <Component
    className={cn(
      "text-balance font-semibold text-ink",
      Component === "h1" && "text-3xl sm:text-4xl",
      Component === "h2" && "text-xl sm:text-2xl",
      Component === "h3" && "text-lg",
      Component === "h4" && "text-base",
      className
    )}
    {...props}
  >
    {children}
  </Component>
)

/**
 * The small monospaced label above a section. It stands in for a fourth heading
 * size, so section hierarchy never needs one.
 */
export const Eyebrow = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "font-mono text-2xs uppercase tracking-[0.12em] text-muted",
      className
    )}
    {...props}
  >
    {children}
  </p>
)

/* -------------------------------------------------------------------------- */
/*  Button appearance — shared with the client Button and with link buttons    */
/* -------------------------------------------------------------------------- */

export const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2",
    /*
     * Every button is a pill.
     *
     * The shape used to belong to `action` alone, on the argument that being
     * the only round thing on the page was part of what made it the thing to
     * press. That worked while it was one button on one page. Across a
     * catalogue, a cart and a checkout it made two families instead: a round
     * blue one and a squared-off black one that plainly came from somewhere
     * else. The shape is the system's; what separates the ladder's rungs is
     * colour and weight, which is a difference a reader can rank.
     */
    "whitespace-nowrap rounded-full font-medium",
    // Rung zero of the responsiveness contract: something happens on touch,
    // before any JavaScript or any network involvement.
    "pressable active:translate-y-px",
    "touch-manipulation focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-45",
  ],
  {
    variants: {
      variant: {
        /*
         * The ladder, in the order a reader ranks it. Pick by what the control
         * does, never by where it sits on the screen:
         *
         *   action          the thing the page exists for, and money changes
         *                   hands or a build is committed. One per screen.
         *   action-outline  a real action, second in line, or the same action
         *                   in a place that is not the page's main event.
         *   primary         going somewhere. The strongest navigation there is.
         *   secondary       going somewhere less important, or backing out.
         *   link            an aside, a footnote, an undo.
         *
         * Two blues on one screen is the failure this ordering exists to stop.
         * If a second control is tempting you toward `action-outline` beside an
         * `action`, it is usually navigation and belongs on `primary`.
         */
        primary: "bg-ink text-paper hover:bg-ink/90 active:bg-ink/80",
        secondary:
          "bg-paper text-ink ring-1 ring-inset ring-line-strong hover:bg-surface active:bg-surface-strong",
        /** Alias kept for call sites that already say `outline`. */
        outline:
          "bg-paper text-ink ring-1 ring-inset ring-line-strong hover:bg-surface active:bg-surface-strong",
        accent:
          "bg-accent text-paper hover:bg-accent-strong active:bg-accent-strong",
        /*
         * The reason the page exists: buy, commit, pay, place the order.
         *
         * The ground is `.action-surface` in globals.css, where its two stops
         * and their hover pair are defined together. One to a screen — a second
         * gradient makes neither of them mean anything, and the ladder above
         * has a rung for whatever the second control actually is.
         */
        action:
          "action-surface text-paper shadow-[0_1px_2px_rgb(21_24_28/0.12)] active:brightness-95",
        /*
         * The same sweep as a hairline, with the flat midpoint for the label.
         *
         * For an action that is genuinely an action and genuinely second: add
         * to cart beside a configured build, save beside submit. It reads as
         * the same family as `action` at a glance and as clearly the lesser of
         * the two at a second glance, which is the whole job.
         *
         * `border` rather than `ring`, because the gradient is painted through
         * the border box — see `.action-outline-surface`. It sits on paper; on
         * a tinted ground set `--action-outline-fill` to that ground.
         */
        "action-outline":
          "action-outline-surface border-[1.5px] text-action active:brightness-95",
        ghost:
          "bg-transparent text-ink hover:bg-surface active:bg-surface-strong",
        /** Alias kept for call sites that already say `transparent`. */
        transparent:
          "bg-transparent text-ink hover:bg-surface active:bg-surface-strong",
        danger: "bg-danger text-paper hover:bg-danger/90 active:bg-danger/80",
        /**
         * For the homepage's dark and red chapters. `primary` is an ink pill,
         * which disappears on ink and fights the ground on red, so the filled
         * button flips: paper block, ink label.
         */
        inverse: "bg-paper text-ink hover:bg-paper/90 active:bg-paper/80",
        "inverse-secondary":
          "bg-transparent text-paper ring-1 ring-inset ring-paper/35 hover:bg-paper/10 active:bg-paper/20",
        link: "bg-transparent p-0 text-accent underline underline-offset-4 hover:text-accent-strong active:text-accent-strong",
      },
      size: {
        small: "h-8 px-3 text-sm",
        medium: "h-10 px-4 text-sm",
        large: "h-12 px-6 text-base",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "medium" },
  }
)

/**
 * The variant names, for components that wrap `Button` and pass one through.
 *
 * Derived from `buttonVariants` rather than written out, so a wrapper cannot
 * quietly fall behind the ladder the way `SubmitButton` did.
 */
export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>

export const Spinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("animate-spin", className)}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="8"
      cy="8"
      r="6.5"
      stroke="currentColor"
      strokeOpacity="0.25"
      strokeWidth="2"
    />
    <path
      d="M14.5 8a6.5 6.5 0 0 0-6.5-6.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

/**
 * Shared by the Input in `interactive.tsx` and by the floating-label variant
 * checkout uses, so the two cannot drift apart.
 *
 * The 16px floor on small screens is not cosmetic: iOS Safari zooms the
 * viewport when a focused input's text is smaller than that, and the page never
 * zooms back out.
 */
export const inputClasses = cn(
  "h-11 w-full rounded border border-line bg-paper px-3 text-ink",
  "text-[16px] sm:text-base",
  "placeholder:text-muted",
  "hover:border-line-strong",
  "focus:border-accent focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted"
)

/* -------------------------------------------------------------------------- */
/*  Surfaces and badges                                                        */
/* -------------------------------------------------------------------------- */

export const Container = ({
  className,
  elevation = "flat",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { elevation?: "flat" | "raised" }) => (
  <div
    className={cn(
      "rounded-lg border border-line bg-paper p-5",
      elevation === "raised" && "shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
)

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-2xs font-medium",
  {
    variants: {
      color: {
        grey: "bg-surface text-muted",
        green: "bg-signal-wash text-signal",
        red: "bg-danger-wash text-danger",
        orange: "bg-warn-wash text-warn",
        accent: "bg-accent-wash text-accent",
        purple: "bg-accent-wash text-accent",
        ink: "bg-ink text-paper",
      },
    },
    defaultVariants: { color: "grey" },
  }
)

type BadgeColor =
  | "grey"
  | "green"
  | "red"
  | "orange"
  | "accent"
  | "purple"
  | "ink"

export const Badge = ({
  className,
  color,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { color?: BadgeColor }) => (
  <span className={cn(badgeVariants({ color }), className)} {...props}>
    {children}
  </span>
)

export const IconBadge = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface text-muted",
      className
    )}
    {...props}
  >
    {children}
  </span>
)

export const Divider = ({ className }: { className?: string }) => (
  <hr className={cn("border-0 border-t border-line", className)} />
)

/* -------------------------------------------------------------------------- */
/*  Table                                                                      */
/* -------------------------------------------------------------------------- */

const TableRoot = ({
  className,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) => (
  // A wide table scrolls inside its own box; the page body never scrolls
  // sideways because of one.
  <div className="w-full overflow-x-auto">
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    >
      {children}
    </table>
  </div>
)

const TableHeader = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn("[&_tr]:border-b [&_tr]:border-line", className)}
    {...props}
  >
    {children}
  </thead>
)

const TableBody = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>
    {children}
  </tbody>
)

const TableRow = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-line", className)} {...props}>
    {children}
  </tr>
)

const TableHead = ({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "h-10 px-3 text-left align-middle text-xs font-medium text-muted first:pl-0 last:pr-0",
      className
    )}
    {...props}
  >
    {children}
  </th>
)

const TableCell = ({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn("px-3 py-4 align-middle first:pl-0 last:pr-0", className)}
    {...props}
  >
    {children}
  </td>
)

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  HeaderCell: TableHead,
  Cell: TableCell,
})
