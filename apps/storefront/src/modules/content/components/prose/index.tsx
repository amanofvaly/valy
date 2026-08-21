import { cn } from "@lib/util/cn"

/**
 * The editorial layer: pages that are read rather than shopped.
 *
 * These carry no Medusa dependency and prerender fully, so they are on screen
 * before the network is involved at all. The measure is capped near 68
 * characters because that is where a line stops being comfortable, whatever the
 * window is doing.
 */

export const PageHeader = ({
  eyebrow,
  title,
  lede,
  updated,
}: {
  eyebrow?: string
  title: string
  lede?: string
  /** For the legal pages, where the date is part of the document. */
  updated?: string
}) => (
  <header className="border-b border-line bg-surface">
    <div className="container-page flex flex-col gap-4 py-12 lg:py-16">
      {eyebrow && (
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          {eyebrow}
        </p>
      )}
      <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      {lede && (
        <p className="max-w-prose text-lg leading-8 text-muted">{lede}</p>
      )}
      {updated && (
        <p className="font-mono text-2xs tabular text-muted">
          Last updated {updated}
        </p>
      )}
    </div>
  </header>
)

/** A block of body copy at a fixed measure. */
export const Prose = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => (
  <div
    className={cn(
      "flex max-w-prose flex-col gap-4 text-base leading-7 text-muted",
      "[&_a]:text-accent hover:[&_a]:text-accent-strong",
      "[&_strong]:font-medium [&_strong]:text-ink",
      "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
      "[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-5",
      className
    )}
  >
    {children}
  </div>
)

/**
 * A numbered section of a long document, with an anchor. The number is what
 * makes a clause referenceable in an email about a return.
 */
export const Clause = ({
  id,
  number,
  title,
  children,
}: {
  id: string
  number: string
  title: string
  children: React.ReactNode
}) => (
  <section id={id} className="scroll-mt-24 border-t border-line py-8">
    <h2 className="mb-3 flex items-baseline gap-3 text-lg font-semibold text-ink">
      <span className="font-mono text-sm tabular text-muted">{number}</span>
      {title}
    </h2>
    <Prose>{children}</Prose>
  </section>
)
