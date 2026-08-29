import { listFlowProducts, priceOfCheapestKit } from "@lib/data/products"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Suspense } from "react"

/**
 * The price and the button, under the headline.
 *
 * The hero used to end in "Find your server" and "What is a homelab?" — a
 * search and a definition, neither of which is a product. A first-time visitor
 * now gets a price and a way to buy inside the first viewport on any screen.
 *
 * Deliberately no frame, no thumbnail and no card. A bordered box with a
 * picture, a title and a price is the catalogue grid's vocabulary, and dropping
 * one into a hero makes the hero look like a search result. The wall of
 * application marks below is already this page's picture; this is the only
 * other thing in the first screen and it is two lines and a button standing in
 * the space the headline does not use.
 *
 * Only the price waits on anything. It streams inside a Suspense boundary with
 * its line height reserved, so the button paints with the rest of the hero and
 * does not move under a thumb when the figure lands. It is read from the
 * catalogue rather than written here — the cheapest base kit plus the boot
 * drive, because the boot drive has no "none" option and a "from" price no
 * order can total is the oldest lie in retail.
 */

const StartingPrice = async ({ countryCode }: { countryCode: string }) => {
  const products = await listFlowProducts(countryCode)
  const { amount, currencyCode } = priceOfCheapestKit(products)

  if (!amount) {
    return <>Two or three bays, running TrueNAS</>
  }

  return (
    <>
      Starting at{" "}
      <span className="font-semibold tabular">
        {convertToLocale({ amount, currency_code: currencyCode })}
      </span>{" "}
    </>
  )
}

/*
 * Left-aligned, on the headline's own margin. The button and the price line up
 * their left edges with the first letter of the sentence above them, so the
 * three read as one block of type rather than as a centred badge dropped under
 * a left-set headline. The button sizes to its label on every screen — a
 * full-width pill on a phone reads as a form's submit control, which is the
 * wrong signal for the one thing on the page a visitor is meant to want.
 */
const BuyFlow = ({ countryCode }: { countryCode: string }) => (
  <div className="flex flex-col items-start gap-3 lg:gap-4">
    <Button asChild variant="action" size="large">
      <LocalizedClientLink href="/products/valy-flow">
        Buy your Flow
      </LocalizedClientLink>
    </Button>

    {/*
     * `min-h` rather than a fixed height. The price sits under the button now,
     * so a late figure can no longer move the button itself — but the space is
     * still reserved, because everything below the hero would otherwise shift
     * when it lands.
     */}
    {/*
     * Ink, not muted. This line sits directly on a photograph with no scrim
     * under it, and grey secondary text over a bookshelf is a caption nobody
     * can read. Weight does the job a tint would otherwise have done.
     */}
    <p className="min-h-6 text-sm font-medium leading-6 text-ink lg:text-base lg:leading-7">
      <Suspense fallback={null}>
        <StartingPrice countryCode={countryCode} />
      </Suspense>
    </p>
  </div>
)

export default BuyFlow
