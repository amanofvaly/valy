import Image from "next/image"

import SectionHeading from "@modules/home/components/section-heading"
import { homeMedia } from "@modules/home/media"

/** A real sequence, so the steps are numbered. */
const steps = [
  {
    title: "You tell us the workload",
    copy: "Twelve years of photos in Immich, 4K Plex for the family, a Proxmox lab for work. We spec the chassis, drives, and memory around it.",
    duration: "Same day",
  },
  {
    title: "We assemble and label",
    copy: "Cables routed and tied, every bay mapped to a drive serial, and a printed sheet of what is in the machine taped inside the lid.",
    duration: "1 to 2 days",
  },
  {
    title: "48 hours on the bench",
    copy: "Memtest, a full SMART long test on every disk, and a sustained write soak. Thermals and noise are measured at 1 m and recorded.",
    duration: "48 hours",
  },
  {
    title: "Boxed, insured, tracked",
    copy: "Drives ship in-place with foam blocks in the bays. Insured courier across India, and a three-year warranty serviced here.",
    duration: "3 to 6 days",
  },
]

const BuildProcess = () => {
  return (
    <section className="border-t border-zinc-200 bg-white py-16 lg:py-24">
      <div className="content-container flex flex-col gap-12">
        <SectionHeading
          eyebrow="How a Valy is built"
          title="Nothing leaves the bench untested."
          description="Grey-market boxes arrive with mystery drives and no invoice. This is what happens between your order and the courier instead."
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-large bg-zinc-100">
            <Image
              src={homeMedia.benchTest}
              alt="An engineer checking a rack of servers during testing"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover object-center"
            />
          </div>

          <ol className="flex flex-col">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[auto_1fr] gap-x-6 border-t border-zinc-200 py-6 last:border-b"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber-600">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <h3 className="font-display text-xl tracking-tight text-zinc-900">
                      {step.title}
                    </h3>
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      {step.duration}
                    </span>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-zinc-600">
                    {step.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default BuildProcess
