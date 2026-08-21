import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * The argument, stated once.
 *
 * The subject is custody: whether the photographs and the films and the work
 * live on hardware someone owns or on hardware someone rents. Said plainly to a
 * person who has never run a server, without talking down to the person who
 * has.
 *
 * No photograph. There are none of a Valy machine yet, and a stock image of a
 * datacentre would be arguing for exactly the thing this page argues against.
 * The figures do the work a picture would.
 */

/** Every number here is a commitment repeated elsewhere on the site. */
const FACTS = [
  { value: "19", unit: "dB(A)", label: "The quietest one, at a metre" },
  { value: "48", unit: "hours", label: "On the bench before it ships" },
  { value: "3", unit: "years", label: "Warranty, serviced in India" },
  { value: "7", unit: "days", label: "To send it back" },
]

const Hero = () => (
  <section className="bg-paper">
    <div className="container-page grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-28">
      <div className="flex flex-col gap-7">
        <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
          Built in Bengaluru, shipped across India
        </p>

        <h1 className="max-w-[15ch] text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Keep your own files.
        </h1>

        <div className="flex max-w-prose flex-col gap-4 text-base leading-7 text-muted">
          <p>
            Every photograph you have taken since 2011 is sitting on a hard
            drive in a building you will never visit, rented by the month,
            priced by someone else. It works well, right up until the billing
            fails or the terms change or you want it all back at once.
          </p>
          <p>
            A Valy machine is the other option: a small, quiet server that sits
            in a cupboard in your house and holds the same files. It arrives
            with the operating system installed, the storage built and the apps
            running, so the first evening is spent copying photographs across
            rather than reading forum posts.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="large">
            <LocalizedClientLink href="/categories/machines">
              See the five machines
            </LocalizedClientLink>
          </Button>
          <Button asChild variant="secondary" size="large">
            <LocalizedClientLink href="/getting-started">
              Start from nothing
            </LocalizedClientLink>
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-lg border border-line bg-line">
        {FACTS.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-1 bg-paper p-5">
            <dd className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-medium tabular text-ink">
                {fact.value}
              </span>
              <span className="font-mono text-xs text-muted">{fact.unit}</span>
            </dd>
            <dt className="text-xs leading-5 text-muted">{fact.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  </section>
)

export default Hero
