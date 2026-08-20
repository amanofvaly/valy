import SkeletonProductActions from "@modules/skeletons/components/skeleton-product-actions"

/**
 * Shown the instant a product link is clicked.
 *
 * Next's <Link> intercepts the click, so the browser never navigates and never
 * shows its own spinner. Without this file nothing happens on screen until the
 * server responds — the page looks frozen, then swaps. This holds the real
 * layout so the content lands in place instead of shifting it.
 */
export default function Loading() {
  return (
    <div className="content-container flex flex-col small:flex-row small:items-start py-6 relative animate-pulse">
      <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
        <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto w-full">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-9 w-3/4 bg-gray-100 rounded" />
          <div className="flex flex-col gap-y-2">
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      <div className="block w-full relative">
        <div className="aspect-[29/34] w-full bg-gray-100 rounded-rounded" />
      </div>

      <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
        <SkeletonProductActions />
      </div>
    </div>
  )
}
