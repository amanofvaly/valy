import { listFlowProducts, priceOfCheapestKit } from "@lib/data/products"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Suspense } from "react"

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
 * wrong signal for the one thing on the page a visitor is meant to want.
 */
const BuyFlow = ({ countryCode }: { countryCode: string }) => (
  <div className="flex flex-col items-start gap-3 lg:gap-4">
    <Button asChild variant="action" size="large">
      <LocalizedClientLink href="/products/valy-flow">
        Flow Server <StartingPrice countryCode={countryCode} />
      </LocalizedClientLink>
    </Button>

   
    
    <p className="hidden min-h-6 text-sm font-medium leading-6 text-ink sm:block lg:text-base lg:leading-7">
      <Suspense fallback={null}>
        A permanent space for all your media, files and apps
      </Suspense>
    </p>
  </div>
)

export default BuyFlow
