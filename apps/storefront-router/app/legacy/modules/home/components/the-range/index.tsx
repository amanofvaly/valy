import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Section, SectionHeading } from "@modules/home/components/section"
import Image from "next/image"

const MACHINES = [
  {
    name: "Flow",
    use: "Backups, files and photo libraries",
  },
  {
    name: "Hike",
    use: "Media streaming and more services",
  },
  {
    name: "Summit",
    use: "More storage and heavier workloads",
  },
]

/**
 * This is a fixed explanation of the three Valy machine families, not a query
 * for three products. Replace the placeholder with real lineup photography.
 */
const TheRange = () => (
  <Section ground="surface" rule="accent" id="range">
    <SectionHeading
      title="Three machine families."
      lede="Flow, Hike and Summit cover different storage and workload needs. Compare every model before choosing."
      action={
        <Button asChild variant="secondary" size="large">
          <LocalizedClientLink href="/categories/machines">
            Compare all machines
          </LocalizedClientLink>
        </Button>
      }
    />

    <div className="relative mt-14 aspect-[4/3] overflow-hidden rounded-lg bg-paper sm:aspect-[3/2] lg:aspect-[2/1]">
      <Image
        src="/home/machines-placeholder.webp"
        alt="Three desktop server enclosures increasing in size from left to right"
        className="object-cover"
        sizes="(max-width: 640px) 100vw, 1280px"
        priority
        fill
      />
    </div>

    <dl className="grid grid-cols-1 border-b border-line md:grid-cols-3">
      {MACHINES.map((machine) => (
        <div
          key={machine.name}
          className="border-t border-line py-5 md:border-l md:px-6 md:first:border-l-0 md:first:pl-0 md:last:pr-0"
        >
          <dt className="text-lg font-semibold text-ink">{machine.name}</dt>
          <dd className="mt-1 text-sm leading-6 text-muted">{machine.use}</dd>
        </div>
      ))}
    </dl>
  </Section>
)

export default TheRange
