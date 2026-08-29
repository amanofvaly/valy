import { listFlowProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import FlowConfigurator from "@modules/products/components/flow-configurator"
import FlowStory from "@modules/products/components/flow-story"

/**
 * The Valy Flow page: configure, then read.
 *
 * The other three product templates put a gallery beside a buy box and the
 * specification underneath, which is the right shape for a drive or an
 * installation service. It is the wrong shape for a machine with seven
 * decisions in it, because the buy box becomes a stack of pickers with no room
 * to say what any of them do.
 *
 * So the page is in two halves. The top half is the configurator and nothing
 * else: a picture, a column of decisions, and a running total that never leaves
 * the screen. The bottom half is the argument for the machine — what a NAS is,
 * why the cabinet is an ordinary one, what TrueNAS is, what it runs — for the
 * reader who arrived without having decided yet, and who is going to scroll
 * past the configurator to find out whether they want one at all.
 *
 * Which order that should be in is a real question. It is configurator first
 * because the traffic this page is built for arrives from the range page having
 * already chosen Flow, and making them scroll past an explanation to reach the
 * price is the thing Apple's buy pages get right.
 *
 * The header is the title and the subtitle and nothing else. It used to open
 * with a breadcrumb and close with a link reading "Not sure what a NAS is?
 * Start at the bottom of this page" — a trail back out of the page and an
 * invitation to skip it, both above the first decision. The page already ends
 * in that explanation for anyone who scrolls, and the nav already says where
 * they are.
 */

const FlowTemplate = async ({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) => {
  const products = await listFlowProducts(countryCode)

  const currencyCode =
    product.variants?.[0]?.calculated_price?.currency_code ?? "inr"

  /*
   * The machine has to be present for any of this to mean anything — the
   * configurator's base price, bay count and image all come off it. If the
   * sibling fetch failed, fall back to the product the route already resolved
   * rather than rendering a page with no prices on it.
   */
  const resolved = products["valy-flow"]
    ? products
    : { ...products, "valy-flow": product }

  return (
    <>
      <header className="container-page pb-10 pt-10 sm:pt-14">
        <h1 className="max-w-[16ch] text-balance text-4xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          {product.title}
        </h1>
        {product.subtitle && (
          <p className="mt-5 max-w-prose text-lg leading-8 text-muted">
            {product.subtitle}
          </p>
        )}
      </header>

      <FlowConfigurator products={resolved} currencyCode={currencyCode} />

      <FlowStory products={resolved} />

      {/*
       * Clearance for the phone's fixed price bar. Without it the last line of
       * the specification sits underneath it and cannot be scrolled clear.
       */}
      <div aria-hidden className="h-20 lg:hidden" />
    </>
  )
}

export default FlowTemplate
