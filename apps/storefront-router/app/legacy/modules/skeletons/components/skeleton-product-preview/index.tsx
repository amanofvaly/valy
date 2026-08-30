/**
 * One card's worth of loading state, matched to `ProductPreview`'s real
 * measurements: a square image frame, a title line, a subtitle line, a spec
 * line and a price.
 */
export default function SkeletonProductPreview() {
  return (
    <div className="flex animate-pulse flex-col gap-3">
      <div className="aspect-square w-full rounded-lg border border-line bg-surface" />
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-3/4 rounded bg-surface" />
        <div className="h-3 w-full rounded bg-surface" />
        <div className="h-2.5 w-2/3 rounded bg-surface" />
        <div className="mt-1 h-3.5 w-20 rounded bg-surface" />
      </div>
    </div>
  )
}
