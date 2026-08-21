import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Page not found",
}

/**
 * The root 404, outside `[countryCode]`.
 *
 * It cannot use `LocalizedClientLink` because there is no country in the URL to
 * localise against — that is the whole reason the request landed here.
 */
export default function NotFound() {
  return (
    <div className="container-page max-w-xl py-16 lg:py-24">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          That page is not here.
        </h1>
        <p className="max-w-prose text-base leading-7 text-muted">
          The link may be old, or missing the country prefix every page on this
          site carries.
        </p>
        <Link
          href="/in"
          className="pressable mt-2 inline-flex h-10 w-fit items-center rounded bg-ink px-4 text-sm font-medium text-paper hover:bg-ink/90"
        >
          Go to the store
        </Link>
      </div>
    </div>
  )
}
