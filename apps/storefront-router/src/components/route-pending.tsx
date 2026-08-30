export function RoutePending() {
  return (
    <main id="content" className="container-page min-h-[60vh] py-10 lg:py-14" aria-busy="true" aria-label="Loading page">
      <div className="h-4 w-24 animate-pulse rounded bg-line" />
      <div className="mt-5 h-10 w-64 max-w-full animate-pulse rounded bg-line" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="aspect-[4/5] animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
    </main>
  )
}
