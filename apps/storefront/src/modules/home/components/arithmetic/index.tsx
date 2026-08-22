import { Aside, Section } from "@modules/home/components/section"

/**
 * The money, with the downside stated.
 *
 * This is the chapter the page is loudest in, and it is the only one on a red
 * ground. The reason is not decoration: it is the one section making an
 * argument against something the reader is currently paying for, and it had
 * been making it in two identical grey cards with the figures set smaller than
 * the paragraph beneath them.
 *
 * So the figures are the section. Each takes a full-width band, the rented one
 * on Swiss red and the owned one on the darker red beneath it, and the
 * comparison is made by scale and ground rather than by two boxes side by side.
 *
 * They are set in the sans, not the data face, which is the one place the mono
 * rule bends. IBM Plex Mono centres the comma in a full advance: at 96px
 * "₹12,000" comes apart into "₹12 , 000" with a hole either side of the
 * separator. Mono earns its place where figures are compared down a column —
 * the specification blocks, the service prices, the step numbers — and none of
 * that applies to a number that is being read once, as a sentence.
 *
 * The assumption behind the rented figure is labelled, because quoting a
 * competitor's price as though it were a fixed law is how this kind of section
 * stops being trustworthy.
 */

const ROWS = [
  {
    heading: "Renting 2TB",
    figure: "₹12,000",
    period: "over five years",
    detail:
      "At about ₹200 a month, roughly what the large providers charge in India for a 2TB plan. At the end of it you own nothing and the price has probably gone up twice.",
    ground: "bg-accent",
  },
  {
    heading: "Owning 4TB",
    figure: "₹42,000",
    period: "once",
    detail:
      "A Flow 2 with two 4TB drives mirrored, so one drive can fail without taking the archive with it. Still yours in year six, and the drives can move into a larger machine.",
    ground: "bg-accent-strong",
  },
]

const Arithmetic = () => (
  <Section ground="accent" rule="none" bleed pad="none">
    <div className="container-page pb-12 pt-16 sm:pt-24 lg:pb-16 lg:pt-32">
      <h2 className="max-w-[16ch] text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-paper sm:text-5xl lg:text-6xl">
        Cloud storage is rent. A machine is a purchase.
      </h2>
      <p className="mt-6 max-w-prose text-lg leading-8 text-paper/75">
        One is smaller every month and never ends. The other is larger once and
        then stops. Which is cheaper depends entirely on how long you intend to
        keep the files, and most people intend to keep them forever.
      </p>
    </div>

    {ROWS.map((row) => (
      <div key={row.heading} className={`${row.ground} border-t border-paper/25`}>
        <div className="container-page grid grid-cols-1 gap-x-12 gap-y-5 py-10 lg:grid-cols-12 lg:py-14">
          <div className="lg:col-span-7">
            <h3 className="text-xl font-semibold tracking-tight text-paper">
              {row.heading}
            </h3>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-6xl font-semibold tabular tracking-tight text-paper sm:text-7xl lg:text-8xl">
                {row.figure}
              </span>
              <span className="text-lg text-paper/75">{row.period}</span>
            </p>
          </div>
          <p className="max-w-prose text-base leading-7 text-paper/80 lg:col-span-5 lg:self-end">
            {row.detail}
          </p>
        </div>
      </div>
    ))}

    {/*
     * Said out loud, because a page that only lists advantages is not making an
     * argument, it is making a claim.
     */}
    <div className="border-t border-paper/25 bg-accent-strong">
      <div className="container-page py-10 lg:py-14">
        <Aside invert>
          The honest caveat: a drive will fail, and you will have to replace it.
          That is why every machine mirrors or parities by default, why it emails
          you when a disk starts reporting errors, and why the handover session
          covers what to do on the day it happens.
        </Aside>
      </div>
    </div>
  </Section>
)

export default Arithmetic
