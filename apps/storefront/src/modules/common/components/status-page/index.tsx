import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * The shape every dead end shares: 404s, error boundaries, an empty cart with
 * nowhere to go.
 *
 * There were four near-identical 404 pages, each centred in the viewport with
 * a 12px explanation under a 30px heading. This is one component, left-aligned
 * at the same measure as everything else on the site, and it always offers
 * somewhere to go next — a dead end with no exit is the actual failure.
 */
const StatusPage = ({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string
  title: string
  children?: React.ReactNode
  actions?: React.ReactNode
}) => (
  <div className="container-page max-w-xl py-16 lg:py-24">
    <div className="flex flex-col gap-4">
      {eyebrow && (
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          {eyebrow}
        </p>
      )}
      <h1 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      {children && (
        <div className="flex max-w-prose flex-col gap-3 text-base leading-7 text-muted">
          {children}
        </div>
      )}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        {actions ?? (
          <>
            <Button asChild>
              <LocalizedClientLink href="/">Home</LocalizedClientLink>
            </Button>
            <Button asChild variant="secondary">
              <LocalizedClientLink href="/store">
                Everything we sell
              </LocalizedClientLink>
            </Button>
          </>
        )}
      </div>
    </div>
  </div>
)

export default StatusPage
