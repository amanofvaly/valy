/**
 * Stands in for the price and add-to-cart block while it is read live.
 *
 * Mirrors the real layout — option rows, price line, button — so the page does
 * not jump when the data lands. `animate-pulse` is what tells the customer the
 * number is still arriving, rather than showing a blank gap that reads as a
 * broken page.
 */
const SkeletonProductActions = () => {
  return (
    <div className="flex flex-col gap-y-4 animate-pulse" data-testid="product-actions-skeleton">
      <div className="flex flex-col gap-y-3">
        <div className="h-4 w-20 bg-gray-100 rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-20 bg-gray-100 rounded-rounded" />
          <div className="h-10 w-20 bg-gray-100 rounded-rounded" />
          <div className="h-10 w-20 bg-gray-100 rounded-rounded" />
        </div>
      </div>

      <div className="h-7 w-32 bg-gray-100 rounded" />

      <div className="w-full h-10 bg-gray-100 rounded-rounded" />
    </div>
  )
}

export default SkeletonProductActions
