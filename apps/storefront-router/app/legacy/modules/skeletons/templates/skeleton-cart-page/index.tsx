/**
 * The cart page's loading state, drawn to the real page's measurements: the
 * same two-column split, the same line-item grid, the same summary box.
 *
 * A skeleton that does not match what replaces it is a second layout shift
 * dressed up as a courtesy. This one is a fill, not a swap.
 */
const SkeletonCartPage = () => (
  <div className="container-page animate-pulse py-8 lg:py-12">
    <div className="mb-8 flex flex-col gap-2">
      <div className="h-9 w-24 rounded bg-surface" />
      <div className="h-3 w-16 rounded bg-surface" />
    </div>

    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
      <ul className="divide-y divide-line border-y border-line">
        {[0, 1].map((i) => (
          <li
            key={i}
            className="grid grid-cols-[72px_1fr] gap-4 py-5 sm:grid-cols-[96px_1fr_auto] sm:gap-6"
          >
            <div className="aspect-square w-full rounded-lg border border-line bg-surface" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-40 rounded bg-surface" />
              <div className="h-3 w-24 rounded bg-surface" />
              <div className="mt-2 h-9 w-28 rounded bg-surface" />
            </div>
            <div className="col-start-2 h-4 w-24 rounded bg-surface sm:col-start-3" />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4 rounded-lg border border-line p-5">
        <div className="h-4 w-40 rounded bg-surface" />
        <div className="h-px w-full bg-line" />
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-surface" />
          <div className="h-4 w-20 rounded bg-surface" />
        </div>
        <div className="h-12 w-full rounded bg-surface" />
      </div>
    </div>
  </div>
)

export default SkeletonCartPage
