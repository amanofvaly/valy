import EmptyCartMessage from "@modules/cart/components/empty-cart-message"
import SignInPrompt from "@modules/cart/components/sign-in-prompt"
import { HttpTypes } from "@medusajs/types"
import ItemsTemplate from "./items"
import Summary from "./summary"

/**
 * The cart page.
 *
 * Summary sticky on a wide screen, and on a phone it sits below the items where
 * the total is the last thing read before the button.
 */
const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  if (!cart?.items?.length) {
    return (
      <div className="container-page" data-testid="cart-container">
        <EmptyCartMessage />
      </div>
    )
  }

  const itemCount = cart.items.reduce((n, item) => n + item.quantity, 0)

  return (
    <div className="container-page py-8 lg:py-12" data-testid="cart-container">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Cart</h1>
        <p className="font-mono text-2xs tabular text-muted">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
        <div className="flex flex-col gap-6">
          {!customer && <SignInPrompt />}
          <ItemsTemplate cart={cart} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {cart.region && <Summary cart={cart} />}
        </div>
      </div>
    </div>
  )
}

export default CartTemplate
