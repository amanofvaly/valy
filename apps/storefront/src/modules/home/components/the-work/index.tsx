import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * The bridge between "all of it is free" and "here is what it costs".
 *
 * Twenty-eight free applications raise an obvious question: if the software
 * costs nothing, what is the money for. This section answers it with the
 * services catalogue rather than with adjectives — the same four products a
 * customer can put in a basket, at the price the catalogue is charging today.
 *
 * The figures are Inter with tabular numerals rather than the data face. They
 * align down the column either way, and a monospaced "₹2,500.00" at 30px puts
 * a full character of air on both sides of the comma and the point.
 *
 * It is a price list now rather than a grid of cards. Four bordered boxes made
 * four separate offers; four ruled rows with the figure hanging in the right-
 * hand column make one itemised bill, which is what the heading promises and
 * what a buyer works down. It also lets the section sit quiet between the red
 * chapter above it and the lineup below, which the cards could not do.
 *
 * Read live for the same reason the lineup is: a price edited in admin should
 * be right on the next reload. The narrative and the link render whether or not
 * the catalogue answers, so a backend hiccup costs the section its prices and
 * not its argument.
 */

/** The order they happen in, which is not the order the API returns. */
const WORK_ORDER = [
  "os-installation",
  "photo-library-migration",
  "media-stack-setup",
  "handover-session",
]

/**
 * When each one applies. The catalogue describes what the work is; this is the
 * part a buyer needs on a homepage — whether they are already paying for it.
 */
const WHEN: Record<string, string> = {
  "os-installation": "Free with every machine",
  "photo-library-migration": "Optional, priced per 100GB",
  "media-stack-setup": "Optional, or added at checkout",
  "handover-session": "Optional, and recorded",
}

/**
 * The OS install is free on a machine we build and a priced job on hardware
 * you already own, so its figure needs the qualifier or the row contradicts
 * its own label. The others are simply what they cost.
 */
const PRICE_PREFIX: Record<string, string> = {
  "os-installation": "on its own",
}

const str = (value: unknown) => (typeof value === "string" ? value : undefined)

export default async function TheWork({
  countryCode,
}: {
  countryCode: string
}) {
  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit: 10, handle: WORK_ORDER } as never,
  })

  const byHandle = new Map(products.map((p) => [p.handle, p]))
  const services = WORK_ORDER.map((handle) => byHandle.get(handle)).filter(
    (product): product is NonNullable<typeof product> => Boolean(product)
  )

  return (
    <Section rule="none">
      <SectionHeading
        title="The software is free. The evening it takes is not."
        lede="Every one of those applications is a container, a reverse proxy entry, a folder permission and an hour of reading. Doing it once, on a bench, for a machine we already know the shape of, is the whole product. This is that work, itemised — the first one is included with every machine and the rest are ordinary catalogue items you can buy for hardware you already own."
        action={
          <Button asChild variant="secondary" size="large">
            <LocalizedClientLink href="/categories/services">
              All services
            </LocalizedClientLink>
          </Button>
        }
      />

      {services.length > 0 && (
        <ul className="mt-14 border-t-2 border-ink">
          {services.map((product) => {
            const { cheapestPrice } = getProductPrice({ product })
            const duration = str(product.metadata?.duration)
            const includes = str(product.metadata?.includes)

            return (
              <li key={product.id} className="border-b border-line">
                <LocalizedClientLink
                  href={`/products/${product.handle}`}
                  className="group grid grid-cols-1 gap-x-10 gap-y-4 py-7 transition-colors hover:bg-surface active:bg-surface-strong lg:grid-cols-12 lg:py-9"
                >
                  <div className="flex flex-col gap-2 lg:col-span-5">
                    <h3 className="text-balance text-2xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent lg:text-3xl">
                      {product.title}
                    </h3>
                    {product.subtitle && (
                      <p className="max-w-prose text-base leading-7 text-muted">
                        {product.subtitle}
                      </p>
                    )}
                  </div>

                  {(includes || duration) && (
                    <dl className="flex flex-col gap-3 text-sm lg:col-span-4">
                      {includes && (
                        <div className="flex flex-col gap-0.5">
                          <dt className="text-sm font-medium text-ink">
                            Includes
                          </dt>
                          <dd className="leading-6 text-muted">{includes}</dd>
                        </div>
                      )}
                      {duration && (
                        <div className="flex flex-col gap-0.5">
                          <dt className="text-sm font-medium text-ink">Takes</dt>
                          <dd className="leading-6 text-muted">{duration}</dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {/*
                   * Status first, then the figure. The other order — "on its
                   * own", the price, then "Free with every machine" — reads as
                   * a contradiction until the eye has been over it twice, and
                   * the qualifier belongs on the figure's own baseline rather
                   * than stacked above it.
                   */}
                  <div className="flex flex-col gap-1 lg:col-span-3 lg:items-end lg:text-right">
                    <p className="max-w-[24ch] text-sm leading-6 text-muted">
                      {WHEN[product.handle!] ?? "Optional"}
                    </p>
                    {cheapestPrice && (
                      <p className="flex items-baseline gap-2">
                        {PRICE_PREFIX[product.handle!] && (
                          <span className="text-sm text-muted">
                            {PRICE_PREFIX[product.handle!]}
                          </span>
                        )}
                        <span className="text-2xl font-semibold tabular tracking-tight text-accent lg:text-3xl">
                          {cheapestPrice.calculated_price}
                        </span>
                      </p>
                    )}
                  </div>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}
