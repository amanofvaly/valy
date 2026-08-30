import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

export type FlowPrice = { amount: number; currencyCode: string }

/*
 * Price arrives as a prop. It used to be read by an `async` component rendered
 * inside this client tree, which made the browser talk to Medusa directly and
 * silently fall through to the generic copy whenever that call failed.
 */
const StartingPrice = ({ price }: { price?: FlowPrice }) => {
  if (!price?.amount) {
    return <>Two or three bays, running TrueNAS</>
  }

  return (
    <>
      Starting at{" "}
      <span className="font-semibold tabular">
        {convertToLocale({ amount: price.amount, currency_code: price.currencyCode })}
      </span>{" "}
    </>
  )
}

/*
 * Left-aligned, on the headline's own margin. The button and the price line up
 * their left edges with the first letter of the sentence above them, so the
 * wrong signal for the one thing on the page a visitor is meant to want.
 */
const BuyFlow = ({ price }: { price?: FlowPrice }) => (
  <div className="flex flex-col items-start gap-3 lg:gap-4">
    <Button asChild variant="action" size="large">
      <LocalizedClientLink href="/products/valy-flow">
        Flow Server <StartingPrice price={price} />
      </LocalizedClientLink>
    </Button>

    <p className="hidden min-h-6 text-sm font-medium leading-6 text-ink sm:block lg:text-base lg:leading-7">
      A permanent space for all your media, files and apps
    </p>
  </div>
)

export default BuyFlow
