import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { specRows } from "@lib/util/specs"
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
 * The comparison is the spec block — the same component the product page, the
 * cart and the order confirmation use — because a specification table is what a
 * homelab buyer actually reads.
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
    <Section ground="surface" id="range">
      <SectionHeading
        eyebrow="The range"
        title="Three sizes, named after how far you have got."
        lede="Every one is built to order, burned in for 48 hours and configured before it ships. The bays and the processor are what separate them; the warranty and the work do not change."
        action={
          <Button asChild variant="secondary">
            <LocalizedClientLink href="/categories/machines">
              All five machines
            </LocalizedClientLink>
          </Button>
        }
      />

      <ul className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {tiers.map(({ product, tier, for: forWhom }) => {
          const { cheapestPrice } = getProductPrice({ product: product! })
          const rows = specRows(product!.metadata).filter((r) =>
            COMPARISON_KEYS.has(r.key)
          )

          return (
            <li key={tier} className="flex">
              <LocalizedClientLink
                href={`/products/${product!.handle}`}
                className="group flex h-full w-full flex-col gap-5 rounded-lg border border-line bg-paper p-6 transition-colors hover:border-line-strong active:bg-surface"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-xl font-semibold tracking-tight text-ink group-hover:text-accent">
                      {tier}
                    </h3>
                    <p className="font-mono text-sm tabular text-muted">
                      from{" "}
                      <span className="font-medium text-ink">
                        {cheapestPrice?.calculated_price}
                      </span>
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted">{forWhom}</p>
                </div>

                <SpecBlock rows={rows} density="compact" className="mt-auto" />
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
