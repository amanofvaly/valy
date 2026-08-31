import { PageShell } from "../../app/components/page-shell"
import SkeletonCartPage from "@modules/skeletons/templates/skeleton-cart-page"
import SkeletonOrderConfirmed from "@modules/skeletons/templates/skeleton-order-confirmed"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

/*
 * Route-level pending UI.
 *
 * Next picked these per route through its `loading.tsx` convention. There is no
 * such convention here, so each route names the one it wants — a cart route
 * showing a grid of product cards is worse than showing nothing.
 */

/** A browse page: heading, then the product grid's own skeleton. */
export function BrowsePending() {
  return (
    <PageShell>
      <div className="container-page py-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-3 lg:mb-10">
          <div className="h-9 w-64 max-w-full animate-pulse rounded bg-line" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded bg-surface" />
        </div>
        <SkeletonProductGrid numberOfProducts={8} />
      </div>
    </PageShell>
  )
}

export function CartPending() {
  return <PageShell><SkeletonCartPage /></PageShell>
}

export function OrderPending() {
  return <PageShell><SkeletonOrderConfirmed /></PageShell>
}

/** A single product: gallery beside its details. */
export function ProductPending() {
  return (
    <PageShell>
      <div className="container-page grid grid-cols-1 gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:py-12">
        <div className="aspect-square w-full animate-pulse rounded-lg bg-surface" />
        <div className="flex flex-col gap-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-line" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-surface" />
          <div className="mt-4 h-7 w-32 animate-pulse rounded bg-line" />
          <div className="mt-6 h-11 w-full animate-pulse rounded bg-surface" />
        </div>
      </div>
    </PageShell>
  )
}

/** Account and other single-column pages: text, not a product grid. */
export function ContentPending() {
  return (
    <PageShell>
      <div className="container-page py-10 lg:py-14">
        <div className="h-9 w-56 max-w-full animate-pulse rounded bg-line" />
        <div className="mt-8 flex max-w-prose flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-surface" style={{ width: `${92 - i * 11}%` }} />
          ))}
        </div>
      </div>
    </PageShell>
  )
}

/** Checkout runs outside the shell, so its pending state does too. */
export function CheckoutPending() {
  return (
    <div className="container-page grid grid-cols-1 gap-10 py-8 lg:grid-cols-[1fr_380px] lg:gap-16 lg:py-12">
      <div className="flex flex-col gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-surface" />
    </div>
  )
}

/** Kept as the default for anything not otherwise named. */
export const RoutePending = ContentPending
