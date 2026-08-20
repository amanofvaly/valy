import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

/** Holds the category layout while the page is fetched. See products/[handle]/loading.tsx. */
export default function Loading() {
  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <div className="w-full small:w-1/6 small:pr-6 animate-pulse">
        <div className="h-5 w-24 bg-gray-100 rounded mb-4" />
        <div className="flex flex-col gap-y-2">
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-4 w-28 bg-gray-100 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
      </div>

      <div className="w-full">
        <div className="h-8 w-48 bg-gray-100 rounded mb-8 animate-pulse" />
        <SkeletonProductGrid />
      </div>
    </div>
  )
}
