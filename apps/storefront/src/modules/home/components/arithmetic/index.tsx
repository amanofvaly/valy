import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * The money, with the downside stated.
 *
 * The comparison is the whole argument, so it is made with figures rather than
 * adjectives — and the assumption behind the rented column is labelled, because
 * quoting a competitor's price as though it were a fixed law is how this kind
 * of section stops being trustworthy.
 */

const COLUMNS = [
  {
    heading: "Renting 2TB",
    figure: "₹12,000",
    period: "over five years",
    detail:
      "At about ₹200 a month, roughly what the large providers charge in India for a 2TB plan. At the end of it you own nothing and the price has probably gone up twice.",
    tone: "muted" as const,
  },
  {
    heading: "Owning 4TB",
    figure: "₹42,000",
    period: "once",
    detail:
      "A Flow 2 with two 4TB drives mirrored, so one drive can fail without taking the archive with it. Still yours in year six, and the drives can move into a larger machine.",
    tone: "ink" as const,
  },
]

const Arithmetic = () => (
  <Section ground="surface">
    <SectionHeading
      eyebrow="The arithmetic"
      title="Cloud storage is rent. A machine is a purchase."
      lede="One is smaller every month and never ends. The other is larger once and then stops. Which is cheaper depends entirely on how long you intend to keep the files, and most people intend to keep them forever."
    />

    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {COLUMNS.map((column) => (
        <div
          key={column.heading}
          className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-6"
        >
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
            {column.heading}
          </p>
          <p className="flex items-baseline gap-2">
            <span
              className={
                column.tone === "ink"
                  ? "font-mono text-4xl font-medium tabular text-ink"
                  : "font-mono text-4xl font-medium tabular text-muted"
              }
            >
              {column.figure}
            </span>
            <span className="text-sm text-muted">{column.period}</span>
          </p>
          <p className="text-sm leading-6 text-muted">{column.detail}</p>
        </div>
      ))}
    </div>

    {/*
     * Said out loud, because a page that only lists advantages is not making an
     * argument, it is making a claim.
     */}
    <p className="mt-6 max-w-prose border-l-2 border-line-strong pl-4 text-sm leading-6 text-muted">
      The honest caveat: a drive will fail, and you will have to replace it.
      That is why every machine mirrors or parities by default, why it emails
      you when a disk starts reporting errors, and why the handover session
      covers what to do on the day it happens.
    </p>
  </Section>
)

export default Arithmetic
