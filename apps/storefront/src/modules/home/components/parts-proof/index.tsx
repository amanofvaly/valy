import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * Why the parts catalogue exists.
 *
 * Selling every part separately is the proof that the machine is ordinary
 * hardware rather than an appliance — which is the one claim a buyer cannot
 * verify from a specification sheet. The detail is stated rather than implied,
 * because the comparison is real and recent and the reader may well have been
 * caught by it.
 */
const PartsProof = () => (
  <Section>
    <SectionHeading
      eyebrow="Parts"
      title="Everything inside it is sold on its own."
      lede="Not as a courtesy. It is the only way to demonstrate that a machine is open: if we would sell you the drive, the memory, the card and the chassis separately, there is nothing in the box holding you in."
      action={
        <Button asChild variant="secondary">
          <LocalizedClientLink href="/compatibility">
            What fits what
          </LocalizedClientLink>
        </Button>
      }
    />

    <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-2 rounded-lg border border-line p-6">
        <h3 className="text-base font-medium text-ink">No approved list</h3>
        <p className="text-sm leading-6 text-muted">
          Any drive that fits the bay works, at full speed, with health
          reporting and pool creation, whoever made it and wherever you bought
          it.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-line p-6">
        <h3 className="text-base font-medium text-ink">
          Opening it voids nothing
        </h3>
        <p className="text-sm leading-6 text-muted">
          Adding drives, memory or cards is expected. The parts list ships taped
          inside the lid, with every bay mapped to a drive serial.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-line p-6">
        <h3 className="text-base font-medium text-ink">
          The drives outlive the box
        </h3>
        <p className="text-sm leading-6 text-muted">
          Outgrow a Flow and the disks come out and go straight into a Hike. The
          pool imports; nothing is copied twice.
        </p>
      </div>
    </div>

    {/*
     * The comparison, stated carefully: what happened, and that it was partly
     * walked back. Overstating it would be the same trick being complained
     * about.
     */}
    <p className="mt-8 max-w-prose border-l-2 border-line-strong pl-4 text-sm leading-6 text-muted">
      This is worth spelling out because the alternative exists. Synology
      restricted third-party drives on its 2025 Plus-series machines — no
      storage pools, no health statistics, no operating system install without
      an approved disk — took a great deal of criticism for it, and reversed
      most of it in DSM 7.3 in October 2025. M.2 SSDs are still limited to their
      own list.
    </p>
  </Section>
)

export default PartsProof
