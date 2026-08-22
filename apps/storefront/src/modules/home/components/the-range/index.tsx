import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { specRows } from "@lib/util/specs"
import { cn } from "@lib/util/cn"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SpecBlock from "@modules/common/components/spec-block"
import { Button } from "@modules/common/components/ui"
import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * The lineup, read live from the catalogue.
 *
 * Flow, Hike, Summit — an ascent rather than a code. Synology's own naming is
 * the foil here: DS923+, RS6426xs+, series called FS and HD and XS+, navigable
 * only through a selector tool. Three words that mean starting out, growing and
 * serious need no decoder ring, and the order they come in is the order a
 * customer's own use grows.
 *
 * The three used to be rounded cards with a 20px heading each, which is how a
 * catalogue lists accessories rather than how a range is presented. They are
 * columns of a single comparison sheet now: one rule across the top, vertical
 * rules between, the tier name at display scale and the price in red. Nothing
 * boxes them, so the eye reads across a row of specifications rather than into
 * three separate containers — which is the only reason a homepage puts three
 * machines next to each other at all.
 *
 * The outer two columns drop their outside padding so the first tier starts on
 * the page's left margin and the last ends on its right, and the block sits
 * square inside the container instead of floating 28px in from both edges.
 *
 * The prices are Inter with tabular numerals; the specification values below
 * them stay monospaced. Both align down their column, but "₹264,000.00" in a
 * face that gives the comma and the point a full advance each comes apart into
 * pieces, and these three figures are the ones being compared hardest.
 */

/** Which rows earn a place in a three-across comparison. */
const COMPARISON_KEYS = new Set([
  "cpu",
  "ram_base",
  "bays",
  "nic",
  "raid_default",
  "idle_watts",
  "noise_db",
])

/** The order the range is presented in, whatever order the API returns. */
const RANGE_ORDER = ["flow-2", "flow-4", "hike-4", "hike-6", "summit-8"]

/** One representative per tier, so the comparison is three columns, not five. */
const TIER = [
  {
    handle: "flow-2",
    tier: "Flow",
    for: "A phone camera roll, and the documents nobody has backed up.",
  },
  {
    handle: "hike-4",
    tier: "Hike",
    for: "A film library the whole house watches, and the containers that come after.",
  },
  {
    handle: "summit-8",
    tier: "Summit",
    for: "Work that stops if the machine does. Editing off the array, a decade of masters.",
  },
]

export default async function TheRange({
  countryCode,
}: {
  countryCode: string
}) {
  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit: 20, handle: RANGE_ORDER } as never,
  })

  const byHandle = new Map(products.map((p) => [p.handle, p]))
  const tiers = TIER.map((t) => ({ ...t, product: byHandle.get(t.handle) })).filter(
    (t) => t.product
  )

  if (!tiers.length) {
    return null
  }

  return (
    <Section ground="surface" rule="accent" id="range">
      <SectionHeading
        title="Three sizes, named after how far you have got."
        lede="Every one is built to order, burned in for 48 hours and configured before it ships. The bays and the processor are what separate them; the warranty and the work do not change."
        action={
          <Button asChild variant="secondary" size="large">
            <LocalizedClientLink href="/categories/machines">
              All five machines
            </LocalizedClientLink>
          </Button>
        }
      />

      <ul className="mt-14 grid grid-cols-1 border-t-2 border-ink lg:grid-cols-3">
        {tiers.map(({ product, tier, for: forWhom }, index) => {
          const { cheapestPrice } = getProductPrice({ product: product! })
          const rows = specRows(product!.metadata).filter((r) =>
            COMPARISON_KEYS.has(r.key)
          )

          return (
            <li
              key={tier}
              className="flex border-b border-line lg:border-b-0 lg:border-l lg:first:border-l-0"
            >
              <LocalizedClientLink
                href={`/products/${product!.handle}`}
                className={cn(
                  "group flex h-full w-full flex-col gap-5 py-8 transition-colors hover:bg-paper active:bg-surface-strong lg:px-7",
                  /*
                   * The outside edges come off by index rather than by a
                   * `first:`/`last:` variant. Written as `lg:first:[&_a]:pl-0`
                   * on the list item, Tailwind attaches `:first-child` to the
                   * `a` the arbitrary selector reaches, not to the `li` the
                   * class sits on — and since the link is its item's only
                   * child, that matched in every column and silently zeroed
                   * the padding across the whole row.
                   */
                  index === 0 && "lg:pl-0",
                  index === tiers.length - 1 && "lg:pr-0"
                )}
              >
                <div className="flex flex-col gap-3">
                  <h3 className="text-4xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent lg:text-5xl">
                    {tier}
                  </h3>
                  <p className="flex items-baseline gap-2">
                    <span className="text-sm text-muted">from</span>
                    <span className="text-2xl font-semibold tabular tracking-tight text-accent">
                      {cheapestPrice?.calculated_price}
                    </span>
                  </p>
                  <p className="max-w-[34ch] text-base leading-7 text-muted">
                    {forWhom}
                  </p>
                </div>

                <SpecBlock rows={rows} className="mt-auto pt-2" />
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
