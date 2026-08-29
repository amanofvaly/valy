import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PageHeader, Prose } from "@modules/content/components/prose"
import RaidCalculator from "@modules/content/components/raid-calculator"
import { Button } from "@modules/common/components/ui"
import { Metadata } from "next"

/**
 * The on-ramp, for someone who has never run a server.
 *
 * Static: no Medusa dependency, so it prerenders and is on screen before any
 * network request happens. The calculator is the only interactive part and it
 * computes everything in the browser.
 */

export const metadata: Metadata = {
  title: "Getting started",
  description:
    "How much space you actually need, what redundancy costs, and the cheapest sensible way to move a photo library off the cloud. With a RAID calculator.",
}

export const dynamic = "force-static"

const STEPS = [
  {
    title: "Work out what you are moving",
    detail:
      "Open your phone's storage settings and your Google account's storage page. The number you are looking for is the size of the photo library, because for most people that is nine tenths of it. Documents and everything else round to nothing next to it.",
  },
  {
    title: "Double it, then pick drives",
    detail:
      "Buy for the library you will have in five years, not the one you have now. Doubling is the usual rule and it is usually right. Then use the calculator below to see what redundancy costs you.",
  },
  {
    title: "Start with two bays if money is tight",
    detail:
      "A Flow with two drives mirrored is the cheapest thing that is not reckless. When it fills, the drives come out and go into a larger machine and the pool imports — nothing is copied twice, nothing is thrown away.",
  },
  {
    title: "Move the photos first, then stop",
    detail:
      "Get one thing working and use it for a month before adding a second. The people who end up with an expensive shelf ornament are the ones who tried to set up nine services in one weekend.",
  },
]

const MISTAKES = [
  {
    wrong: "One big drive, no redundancy",
    right:
      "Two drives mirrored beats one drive of twice the size, every time. A single drive is not a backup of anything, including itself.",
  },
  {
    wrong: "Treating the machine as the only copy",
    right:
      "RAID survives a drive dying. It does not survive a flood, a theft, or you deleting the wrong folder. Keep a copy somewhere else — another drive at a relative's house is fine.",
  },
  {
    wrong: "Buying SMR drives because they are cheaper",
    right:
      "They are, and they rebuild an array so slowly that the rebuild becomes the risk. Check for CMR. It is the one specification worth being fussy about.",
  },
  {
    wrong: "Filling the array to the last gigabyte",
    right:
      "Leave about 20% free. ZFS slows down markedly when it runs out of room to work in, and a full array is unpleasant to expand.",
  },
]

export default function GettingStartedPage() {
  return (
    <>
      <PageHeader
        eyebrow="Getting started"
        title="You do not need to know anything yet."
        lede="This page assumes you have never run a server, have a phone full of photographs, and would like them to stop being someone else's problem. It takes about ten minutes to read."
      />

      <div className="container-page py-12 lg:py-16">
        <section aria-labelledby="the-order">
          <h2
            id="the-order"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            The order to do it in
          </h2>

          <ol className="mt-6 border-t border-line">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[2rem_1fr] gap-x-4 border-b border-line py-6 sm:grid-cols-[3rem_1fr] sm:gap-x-8"
              >
                <span className="font-mono text-sm tabular text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-medium text-ink">
                    {step.title}
                  </h3>
                  <p className="max-w-prose text-sm leading-6 text-muted">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="raid" className="mt-16 scroll-mt-24" aria-labelledby="raid-heading">
          <h2
            id="raid-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            What redundancy costs
          </h2>
          <p className="mt-2 max-w-prose text-base leading-7 text-muted">
            Every arrangement trades capacity for the number of drives that can
            fail without losing anything. There is no right answer, only the one
            you decide on knowingly.
          </p>

          <div id="capacity" className="mt-6 scroll-mt-24">
            <RaidCalculator />
          </div>
        </section>

        <section className="mt-16" aria-labelledby="mistakes">
          <h2
            id="mistakes"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            The four mistakes everybody makes
          </h2>

          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MISTAKES.map((item) => (
              <li
                key={item.wrong}
                className="flex flex-col gap-2 rounded-lg border border-line p-5"
              >
                <h3 className="text-sm font-medium text-ink">{item.wrong}</h3>
                <p className="text-sm leading-6 text-muted">{item.right}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="what-it-costs">
          <h2
            id="what-it-costs"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            What the cheapest honest start costs
          </h2>
          <Prose className="mt-3">
            <p>
              A Valy Flow on the i3 base kit, with 8GB of memory and two 4TB
              drives mirrored, is <strong>₹53,999</strong>, GST included. That
              is 4TB of usable space with one drive of redundancy — roughly
              eight hundred thousand phone photographs, which is more than most
              people will take in a lifetime.
            </p>
            <p>
              TrueNAS arrives installed on its own boot drive. Having us build
              the storage pool and set up the applications is ₹5,000 on top. If
              you would rather not do the Google Takeout export and the
              timestamp repair yourself,{" "}
              <LocalizedClientLink href="/products/photo-library-migration">
                we will do it
              </LocalizedClientLink>{" "}
              for ₹1,800 per 100GB.
            </p>
            <p>
              If that is still too much, buy the machine with one drive now and
              add the second in three months. A mirror added later is a ten
              minute job and the pool converts in place.
            </p>
          </Prose>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="large">
              <LocalizedClientLink href="/products/valy-flow">
                Configure a Flow
              </LocalizedClientLink>
            </Button>
            <Button asChild variant="secondary" size="large">
              <LocalizedClientLink href="/collections/starting-out">
                Everything for a first build
              </LocalizedClientLink>
            </Button>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="first-week">
          <h2
            id="first-week"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            The first week
          </h2>
          <Prose className="mt-3">
            <ol>
              <li>
                Plug it into the router, not the wall socket behind the sofa.
                Find it in a browser at the address on the card in the box.
              </li>
              <li>
                Change the password. Turn on the alert emails — this is the
                thing that tells you a drive is dying before it dies.
              </li>
              <li>
                Install the Immich app on every phone in the house and let it
                upload overnight. It will take a few nights.
              </li>
              <li>
                Once the count matches, and only then, turn off Google
                Photos&apos; backup. Do not delete anything from Google for a
                month.
              </li>
              <li>
                Set up remote access so it works away from home. Tailscale takes
                about ten minutes and needs no ports opened.
              </li>
            </ol>
            <p>
              That is the whole thing. Everything after it — media, containers,
              home automation — is optional and can wait until you want it.
            </p>
          </Prose>
        </section>
      </div>
    </>
  )
}
