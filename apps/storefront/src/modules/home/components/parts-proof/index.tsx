import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Aside, Section, SectionHeading } from "@modules/home/components/section"

/**
 * Why the parts catalogue exists.
 *
 * Selling every part separately is the proof that the machine is ordinary
 * hardware rather than an appliance — which is the one claim a buyer cannot
 * verify from a specification sheet.
 *
 * Three equal boxes in a row said these were three equal features. They are
 * three consequences of one decision, so they descend: each opens under its own
 * red rule and starts lower than the one before it. It is the only place on the
 * page where the baseline deliberately breaks, and it is here because the
 * section is about a thing being open rather than closed.
 */

const CLAIMS = [
  {
    title: "No approved list",
    detail:
      "Any drive that fits the bay works, at full speed, with health reporting and pool creation, whoever made it and wherever you bought it.",
    offset: "",
  },
  {
    title: "Opening it voids nothing",
    detail:
      "Adding drives, memory or cards is expected. The parts list ships taped inside the lid, with every bay mapped to a drive serial.",
    offset: "md:mt-14",
  },
  {
    title: "The drives outlive the box",
    detail:
      "Outgrow a Flow and the disks come out and go straight into a Hike. The pool imports; nothing is copied twice.",
    offset: "md:mt-28",
  },
]

const PartsProof = () => (
  <Section rule="none">
    <SectionHeading
      title="Everything inside it is sold on its own."
      lede="Not as a courtesy. It is the only way to demonstrate that a machine is open: if we would sell you the drive, the memory, the card and the chassis separately, there is nothing in the box holding you in."
      action={
        <Button asChild variant="secondary" size="large">
          <LocalizedClientLink href="/compatibility">
            What fits what
          </LocalizedClientLink>
        </Button>
      }
    />

    <ul className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-x-10">
      {CLAIMS.map((claim) => (
        <li
          key={claim.title}
          className={`flex flex-col gap-3 border-t-2 border-accent pt-6 ${claim.offset}`}
        >
          <h3 className="text-balance text-2xl font-semibold tracking-tight text-ink">
            {claim.title}
          </h3>
          <p className="text-base leading-7 text-muted">{claim.detail}</p>
        </li>
      ))}
    </ul>

    {/*
     * The comparison, stated carefully: what happened, and that it was partly
     * walked back. Overstating it would be the same trick being complained
     * about.
     */}
    <Aside className="mt-16">
      This is worth spelling out because the alternative exists. Synology
      restricted third-party drives on its 2025 Plus-series machines — no storage
      pools, no health statistics, no operating system install without an
      approved disk — took a great deal of criticism for it, and reversed most of
      it in DSM 7.3 in October 2025. M.2 SSDs are still limited to their own
      list.
    </Aside>
  </Section>
)

export default PartsProof
