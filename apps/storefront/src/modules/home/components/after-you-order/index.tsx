import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * What happens between the order and the courier.
 *
 * The 48-hour burn-in and the 2 PM IST cutoff are commitments made elsewhere on
 * the site and in the FAQ, so they are stated here in the same terms.
 *
 * The step numbers stay because this is genuinely a sequence and the reader
 * needs the order, but they stop being 11px grey annotations and become the
 * left-hand column of the section: red, monospaced, at heading scale, with the
 * elapsed time counting down the right-hand edge. The row is then readable in
 * one sweep — where you are, what happens, how long it takes.
 *
 * The numbers keep the data face because a padded two-digit counter is exactly
 * what it is for. The durations do not: "1 to 2 days" is a phrase, and a
 * monospaced space is a full character wide, so every word in it drifts apart.
 */

const STEPS = [
  {
    title: "You tell us what it is for",
    detail:
      "Twelve years of photographs, a film library four people watch at once, a lab that currently costs you a monthly bill. We size the chassis, the drives and the memory around that, and send back a configuration and a price.",
    duration: "Same day",
  },
  {
    title: "It gets built and labelled",
    detail:
      "Cables routed and tied, every bay mapped to a drive serial, and a printed sheet of what is in the machine taped inside the lid.",
    duration: "1 to 2 days",
  },
  {
    title: "48 hours on the bench",
    detail:
      "Memtest, a full SMART long test on every disk, and a sustained write soak. Thermals and noise measured at one metre and recorded on the sheet that ships with it.",
    duration: "48 hours",
  },
  {
    title: "Boxed, insured, tracked",
    detail:
      "Drives ship in place with foam blocks in the bays. Insured courier anywhere in India. Order before 2 PM IST on a working day and it leaves the bench the same evening.",
    duration: "3 to 6 days",
  },
]

const AfterYouOrder = () => (
  <Section ground="surface" rule="none">
    <SectionHeading
      title="Nothing leaves the bench untested."
      lede="A grey-market box arrives with mystery drives, no invoice and no way to complain. This is what happens instead."
    />

    <ol className="mt-14 border-t-2 border-ink">
      {STEPS.map((step, index) => (
        <li
          key={step.title}
          className="grid grid-cols-[2.75rem_1fr] gap-x-5 border-b border-line py-8 sm:grid-cols-[5rem_1fr_9rem] sm:gap-x-10 lg:py-10"
        >
          <span
            aria-hidden="true"
            className="font-mono text-3xl font-medium leading-none tabular tracking-tight text-accent sm:text-5xl"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-2">
            <h3 className="text-balance text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {step.title}
            </h3>
            <p className="max-w-prose text-base leading-7 text-muted">
              {step.detail}
            </p>
          </div>
          <span className="col-start-2 mt-1 text-sm font-medium tabular text-ink sm:col-start-3 sm:mt-2 sm:text-right">
            {step.duration}
          </span>
        </li>
      ))}
    </ol>
  </Section>
)

export default AfterYouOrder
