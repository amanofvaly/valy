import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The setup work, offered inside the configurator.
 *
 * Services sell here or nowhere: nobody browses to a services page to buy an
 * operating system install, but plenty of people will add one while deciding
 * what the machine should arrive doing.
 *
 * These link to their own product pages rather than adding themselves to the
 * cart from here. A service is bought once and its page carries what is
 * actually included; a one-tap add would be quicker and would sell something
 * the buyer had not read.
 */
export default function ServiceAddons({
  services: all = [],
}: {
  services?: HttpTypes.StoreProduct[]
}) {
  const services = all.slice(0, 3)

  if (!services.length) {
    return null
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h3 className="text-sm font-medium text-ink">Arrive set up</h3>
      <p className="mt-1 text-xs leading-5 text-muted">
        Operating system installation is included with every machine. These are
        the jobs worth paying someone else to do once.
      </p>

      <ul className="mt-3 flex flex-col divide-y divide-line border-t border-line">
        {services.map((service) => {
          const { cheapestPrice } = getProductPrice({ product: service })

          return (
            <li key={service.id}>
              <LocalizedClientLink
                href={`/products/${service.handle}`}
                className="pressable-tint flex items-baseline justify-between gap-4 rounded py-2.5"
              >
                <span className="text-sm text-ink">{service.title}</span>
                <span className="shrink-0 font-mono text-xs tabular text-muted">
                  {cheapestPrice?.calculated_price}
                </span>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
