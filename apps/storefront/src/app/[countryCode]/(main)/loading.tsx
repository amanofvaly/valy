import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

/**
 * The site-wide loading state, inherited by every route under (main) — including
 * pages that do not exist yet.
 *
 * Next's <Link> intercepts navigation, so the browser never shows its own
 * spinner. Without a loading file the previous page just sits there until the
 * server responds, which reads as a frozen site. Placing this at the group
 * level means a new page gets correct behaviour without anyone remembering to
 * add anything; routes with a distinctive layout override it with their own
 * loading.tsx alongside their page.
 */
export default function Loading() {
  return (
    <div className="content-container py-12">
      <div className="animate-pulse flex flex-col gap-y-8">
        <div className="h-10 w-1/3 bg-gray-100 rounded" />

        <div className="flex flex-col gap-y-3">
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
          <div className="h-4 w-2/3 bg-gray-100 rounded" />
        </div>

        <SkeletonProductGrid numberOfProducts={4} />
      </div>
    </div>
  )
}
