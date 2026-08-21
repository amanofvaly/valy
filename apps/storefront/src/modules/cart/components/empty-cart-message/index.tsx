import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * An empty cart, with somewhere to go from it. Three routes rather than one,
 * because "browse our products" is not a useful instruction to someone who does
 * not yet know whether they want a machine, a drive or an afternoon of help.
 */
const EmptyCartMessage = () => (
  <div
    className="flex flex-col items-start gap-6 py-20"
    data-testid="empty-cart-message"
  >
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Nothing in your cart
      </h1>
      <p className="max-w-prose text-base leading-7 text-muted">
        If you are not sure where to start: the machines are the thing that
        holds your files, the parts go inside them, and the services are the
        setup work you can hand to us.
      </p>
    </div>

    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild>
        <LocalizedClientLink href="/categories/machines">
          See the machines
        </LocalizedClientLink>
      </Button>
      <Button asChild variant="secondary">
        <LocalizedClientLink href="/categories/parts">Parts</LocalizedClientLink>
      </Button>
      <Button asChild variant="secondary">
        <LocalizedClientLink href="/getting-started">
          Start from nothing
        </LocalizedClientLink>
      </Button>
    </div>
  </div>
)

export default EmptyCartMessage
