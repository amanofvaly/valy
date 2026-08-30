/**
 * The dashboard slot's own loading state. Same shape as the account shell's,
 * because it is the same page arriving.
 */
export default function Loading() {
  return (
    <div className="container-page animate-pulse py-8 lg:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">
        <div className="flex gap-2 lg:flex-col">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded bg-surface lg:w-full" />
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <div className="h-8 w-48 rounded bg-surface" />
          <div className="flex flex-col divide-y divide-line border-y border-line">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-24 rounded bg-surface" />
                  <div className="h-3 w-32 rounded bg-surface" />
                </div>
                <div className="h-4 w-20 rounded bg-surface" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
