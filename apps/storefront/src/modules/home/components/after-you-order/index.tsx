import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * What happens between the order and the courier.
 *
 * The 48-hour burn-in and the 2 PM IST cutoff are commitments made elsewhere on
 * the site and in the FAQ, so they are stated here in the same terms.
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
  <Section ground="surface">
    <SectionHeading
      eyebrow="After you order"
      title="Nothing leaves the bench untested."
      lede="A grey-market box arrives with mystery drives, no invoice and no way to complain. This is what happens instead."
    />

    <ol className="mt-10 border-t border-line">
      {STEPS.map((step, index) => (
        <li
          key={step.title}
          className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-line py-6 sm:grid-cols-[3rem_1fr_8rem] sm:gap-x-8"
        >
          <span className="font-mono text-sm tabular text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-medium text-ink">{step.title}</h3>
            <p className="max-w-prose text-sm leading-6 text-muted">
              {step.detail}
            </p>
          </div>
          <span className="col-start-2 font-mono text-2xs uppercase tracking-[0.12em] text-muted sm:col-start-3 sm:text-right">
            {step.duration}
          </span>
        </li>
      ))}
    </ol>
  </Section>
)

export default AfterYouOrder
