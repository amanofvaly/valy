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
 *
 * It closes the page on ink. Everything above it is an argument for buying; the
 * four cells on the right are the four ways out, and a chapter about what
 * happens when things go wrong should not look like the chapter listing the
 * features. The type inverts, the answers sit in a ruled block, and the page
 * goes dark before the questions.
 */

const OUTS = [
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
]

const WhoBuildsIt = () => (
  <Section ground="ink" rule="none">
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="flex flex-col gap-6 lg:col-span-6">
        <h2 className="max-w-[15ch] text-balance text-4xl font-semibold leading-[1.03] tracking-tight text-paper sm:text-5xl">
          A small workshop in Bengaluru, and a three-year promise.
        </h2>
        <div className="flex max-w-prose flex-col gap-5 text-base leading-7 text-paper/70">
          <p>
            Asking someone to move a decade of photographs onto hardware from a
            company they have not heard of is a real thing to ask. The answer is
            not a logo wall. It is that the machines are ordinary parts anyone
            can source, that the warranty is serviced here rather than through
            an overseas queue, and that if we disappeared tomorrow the machine
            would keep working, because nothing in it depends on us.
          </p>
          <p>
            We do not have customer reviews to show you yet. When there are real
            ones, they will appear here with names on them.
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="inverse" size="large">
            <LocalizedClientLink href="/categories/machines">
              See the machines
            </LocalizedClientLink>
          </Button>
          <Button asChild variant="inverse-secondary" size="large">
            <LocalizedClientLink href="/categories/services">
              What we set up for you
            </LocalizedClientLink>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-px self-start bg-paper/15 lg:col-span-6 lg:col-start-7 sm:grid-cols-2">
        {OUTS.map((item) => (
          <div key={item.term} className="flex flex-col gap-2 bg-ink p-6">
            <dt className="text-base font-semibold tracking-tight text-paper">
              {item.term}
            </dt>
            <dd className="text-sm leading-6 text-paper/60">{item.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  </Section>
)

export default WhoBuildsIt
