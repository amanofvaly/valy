import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { OptimisticCartProvider } from "@modules/cart/context/optimistic-cart"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { Suspense } from "react"

/**
 * The shell every page sits inside.
 *
 * This layout used to `await` the customer, then the cart, then the cart's
 * shipping options, one after the next, before rendering an un-suspended nav
 * that made three more calls and a footer that made two. Nine round trips in a
 * staircase, roughly 900ms on production latency, during which the page was
 * blank.
 *
 * Now the shell is structure the server can send at once, and the two regions
 * that genuinely need the API — the header's own reads and the cart-dependent
 * banners — stream in behind their own boundaries. Nothing here blocks the
 * page below it.
 */
export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    /*
     * The provider spans the header and the page because the two ends of an
     * optimistic add live in different subtrees: the button is on the product
     * page, the badge it moves is in the nav.
     */
    <OptimisticCartProvider>
      <div className="flex min-h-screen flex-col">
        <Nav />

        {/*
         * Two cart-dependent strips. They are advisory, so they must never be
         * the reason the page below is not on screen yet.
         */}
        <Suspense fallback={null}>
          <CartNotices />
        </Suspense>

        <div id="content" className="flex-1">
          {props.children}
        </div>

        <Suspense
          fallback={<div className="mt-20 h-64 border-t border-line bg-surface" />}
        >
          <Footer />
        </Suspense>
      </div>
    </OptimisticCartProvider>
  )
}

async function CartNotices() {
  // Both reads depend on the same cart cookie but not on each other's result,
  // so they leave together.
  const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])

  if (!cart) {
    return null
  }

  const { shipping_options: shippingOptions } = await listCartOptions()

  return (
    <>
      {customer && <CartMismatchBanner customer={customer} cart={cart} />}
      <FreeShippingPriceNudge
        variant="popup"
        cart={cart}
        shippingOptions={shippingOptions}
      />
    </>
  )
}
