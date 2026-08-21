import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Section } from "@modules/home/components/section"

/**
 * Who is on the other end of the three-year warranty.
 *
 * This section replaces three invented customer quotes that the old homepage
 * carried with a comment on them saying not to ship invented reviews. There are
 * no reviews yet, so there are none here. What can honestly be said is who
 * builds the machines and what happens when one breaks.
 */
const WhoBuildsIt = () => (
  <Section>
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
      <div className="flex flex-col gap-5">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          Who builds it
        </p>
        <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          A small workshop in Bengaluru, and a three-year promise.
        </h2>
        <div className="flex max-w-prose flex-col gap-4 text-base leading-7 text-muted">
          <p>
            Asking someone to move a decade of photographs onto hardware from a
            company they have not heard of is a real thing to ask. The answer is
            not a logo wall. It is that the machines are ordinary parts anyone
            can source, that the warranty is serviced here rather than through
            an overseas queue, and that if we disappeared tomorrow the machine
            would keep working, because nothing in it depends on us.
          </p>
          <p>
            We do not have customer reviews to show you yet. When there are
            real ones, they will appear here with names on them.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <LocalizedClientLink href="/categories/machines">
              See the machines
            </LocalizedClientLink>
          </Button>
          <Button asChild variant="secondary">
            <LocalizedClientLink href="/categories/services">
              What we set up for you
            </LocalizedClientLink>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-px self-start overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {[
          {
            term: "If a drive fails",
            detail:
              "The machine emails you before it dies, the array keeps working, and we send a replacement. In the metros we collect and return the unit.",
          },
          {
            term: "If you outgrow it",
            detail:
              "The drives move into a larger machine and the pool imports. We buy the old chassis back against the new one.",
          },
          {
            term: "If you change your mind",
            detail:
              "Seven days to send it back, no questions asked. We pay the return courier.",
          },
          {
            term: "If you want to leave",
            detail:
              "It is standard hardware running open source. Wipe it, install anything, sell it. Nothing is locked.",
          },
        ].map((item) => (
          <div key={item.term} className="flex flex-col gap-1.5 bg-paper p-5">
            <dt className="text-sm font-medium text-ink">{item.term}</dt>
            <dd className="text-sm leading-6 text-muted">{item.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  </Section>
)

export default WhoBuildsIt
