import { siIcicibank, siMedusa, siTruenas } from "simple-icons"

/*
 * The infrastructure strip at the foot of every page.
 *
 * These are other people's trademarks, so every mark is that company's own
 * artwork in that company's own colours: Shiprocket's and Cashfree's SVGs as
 * they publish them, Mastercard's as it already ships in this repo for the
 * checkout, and simple-icons' paths — drawn from each brand's published mark —
 * for the three that are a single shape. Nothing here is redrawn or recoloured.
 *
 * The consequence is that they do not share a silhouette: Shiprocket is a
 * horizontal lockup with a wordmark set into it and the rest are glyphs. They
 * are matched on height rather than width for that reason, which is the only
 * axis a set of logos this mixed can agree on — and Shiprocket goes last, so
 * the one mark carrying a word ends the line instead of interrupting it.
 */

type Mark =
  /** A published SVG in `public/images`, used as the brand ships it. */
  | { title: string; src: string }
  /** A single-shape mark from simple-icons, filled with that brand's own hex. */
  | { title: string; icon: { path: string; hex: string } }

const MARKS: Mark[] = [
  { title: "Medusa", icon: siMedusa },
  { title: "Cashfree", src: "/images/cashfree-mark.svg" },
  { title: "Mastercard", src: "/images/mastercard.svg" },
  { title: "ICICI Bank", icon: siIcicibank },
  { title: "TrueNAS", icon: siTruenas },
  { title: "Shiprocket", src: "/images/shiprocket.svg" },
]

export function PoweredBy() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <span className="text-2xs text-muted">Powered by</span>
      {MARKS.map((mark) => (
        /*
         * A logo at sixteen pixels is a shape, not a name, so hovering one says
         * which company it is.
         *
         * Unlike the configurator's app tooltips this one is `aria-hidden` and
         * takes no `tabIndex`: the bubble only repeats the `alt` or `aria-label`
         * the mark already carries, so a screen reader has the name with or
         * without it, and six focus stops that reveal nothing new would be a
         * tax on keyboard users rather than a courtesy.
         */
        <span key={mark.title} className="group relative inline-flex shrink-0">
          {"src" in mark ? (
            <img src={mark.src} alt={mark.title} className="h-4 w-auto" />
          ) : (
            <svg
              viewBox="0 0 24 24"
              role="img"
              aria-label={mark.title}
              className="h-4 w-auto"
              fill={`#${mark.icon.hex}`}
            >
              <path d={mark.icon.path} />
            </svg>
          )}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs leading-5 text-paper shadow-[0_2px_8px_rgb(21_24_28/0.25)] group-hover:block"
          >
            {mark.title}
          </span>
        </span>
      ))}
    </div>
  )
}
