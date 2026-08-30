import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

/**
 * The first-load state for a product grid.
 *
 * Drawn to the real card's proportions — same image ratio, same three text
 * lines, same price position — so the arrival of data is a fill rather than a
 * swap. A skeleton that does not match what replaces it is a second layout
 * shift dressed up as a courtesy.
 *
 * This is only ever seen on a cold load. Filtering and paging keep the previous
 * results on screen instead.
 */
export default function SkeletonProductGrid({
  numberOfProducts = 8,
}: {
  numberOfProducts?: number
}) {
  return (
    <div>
      <div className="mb-5 h-4 w-20 animate-pulse rounded bg-surface" />
      <ul
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4"
        data-testid="products-list-loader"
      >
        {Array.from({ length: numberOfProducts }, (_, i) => (
          <li key={i}>
            <SkeletonProductPreview />
          </li>
        ))}
      </ul>
    </div>
  )
}
