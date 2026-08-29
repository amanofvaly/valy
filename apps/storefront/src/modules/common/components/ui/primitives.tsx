import { cn } from "@lib/util/cn"
import { cva } from "class-variance-authority"
import { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react"

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
    "whitespace-nowrap rounded font-medium",
    // Rung zero of the responsiveness contract: something happens on touch,
    // before any JavaScript or any network involvement.
    "pressable active:translate-y-px",
    "touch-manipulation focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-45",
  ],
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-ink/90 active:bg-ink/80",
        secondary:
          "bg-paper text-ink ring-1 ring-inset ring-line-strong hover:bg-surface active:bg-surface-strong",
        /** Alias kept for call sites that already say `outline`. */
        outline:
          "bg-paper text-ink ring-1 ring-inset ring-line-strong hover:bg-surface active:bg-surface-strong",
        accent: "bg-accent text-paper hover:bg-accent-strong active:bg-accent-strong",
        /*
         * The one button on a page that is the reason the page exists — and at
         * present that is "Buy your Flow" and nothing else.
         *
         * It is the only gradient in the system and the only blue in it, both
         * of which are departures, so its scarcity is the whole point: a second
         * one on the same screen makes neither of them mean anything. Red keeps
         * its existing jobs (focus, selection, error, brand); this is not a
         * replacement for it.
         *
         * The ground is `.action-surface` in globals.css, where its two stops
         * and their hover pair are defined together.
         *
         * A full pill, which is a third departure and belongs to the variant
         * rather than to any call site — the shape is part of what makes this
         * one button recognisable as the thing to press, and a squared-off
         * version of it somewhere else would read as a different control. It
         * overrides the base `rounded` through `cn`, whose twMerge keeps the
         * later of two conflicting radii.
         */
        action:
          "action-surface rounded-full text-paper shadow-[0_1px_2px_rgb(21_24_28/0.12)] active:brightness-95",
        ghost: "bg-transparent text-ink hover:bg-surface active:bg-surface-strong",
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
    <table className={cn("w-full caption-bottom text-sm", className)} {...props}>
      {children}
    </table>
  </div>
)

const TableHeader = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b [&_tr]:border-line", className)} {...props}>
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
