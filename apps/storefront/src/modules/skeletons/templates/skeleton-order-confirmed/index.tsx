/**
 * The order confirmation's loading state, matched to the real page: heading,
 * the four-column detail strip, the line items, then the totals.
 */
const SkeletonOrderConfirmed = () => (
  <div className="container-page max-w-3xl animate-pulse py-10 lg:py-16">
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-24 rounded bg-surface" />
        <div className="h-10 w-3/4 rounded bg-surface" />
        <div className="h-4 w-2/3 rounded bg-surface" />
      </div>

      <div className="grid grid-cols-2 gap-6 border-y border-line py-5 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-3 w-20 rounded bg-surface" />
            <div className="h-4 w-16 rounded bg-surface" />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-3 h-5 w-40 rounded bg-surface" />
        <ul className="divide-y divide-line border-y border-line">
          {[0, 1].map((i) => (
            <li key={i} className="grid grid-cols-[64px_1fr_auto] gap-4 py-4">
              <div className="aspect-square w-full rounded-lg border border-line bg-surface" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-40 rounded bg-surface" />
                <div className="h-3 w-24 rounded bg-surface" />
              </div>
              <div className="h-4 w-20 rounded bg-surface" />
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between">
          <div className="h-5 w-16 rounded bg-surface" />
          <div className="h-6 w-28 rounded bg-surface" />
        </div>
      </div>
    </div>
  </div>
)

export default SkeletonOrderConfirmed
