import { Section, SectionHeading } from "@modules/home/components/section"
import Image from "next/image"

/**
 * These are not category cards and do not link anywhere. There is one machine
 * and one configurator, so a tile promising a catalogue behind it is a promise
 * the store cannot keep. Each one names something the owner can change later —
 * the reason the parts are standard in the first place.
 *
 * The captions track the Flow's real options: two or three bays depending on
 * the processor, 8GB or 16GB of memory, and networking up to 2.5GbE. Do not
 * write a capability here that the configurator does not offer.
 *
 * The images are intentionally fixed rather than selected from the catalogue.
 * Replace them with Valy's own parts photography before launch.
 */
const UPGRADES = [
  {
    src: "/home/part-drive-placeholder.webp",
    caption: "Add a drive, or swap in a larger one",
    alt: "An unbranded hard drive",
  },
  {
    src: "/home/part-memory-placeholder.webp",
    caption: "Go from 8GB to 16GB of memory",
    alt: "Two unbranded memory modules",
  },
  {
    src: "/home/part-network-placeholder.webp",
    caption: "Step the network up to 2.5GbE",
    alt: "An unbranded dual-port network card",
  },
  {
    src: "/home/part-ssd-placeholder.webp",
    caption: "A boot drive kept apart from your data",
    alt: "An unbranded NVMe solid-state drive",
  },
  {
    src: "/home/part-chassis-placeholder.webp",
    caption: "Nothing proprietary to source from us",
    alt: "An unbranded four-bay desktop server chassis",
  },
]

const PartsProof = () => (
  <Section ground="paper" rule="hairline">
    <SectionHeading
      title={
        <>
          Standard parts. <span className="text-accent">Easy</span> to replace.
        </>
      }
      lede="Valy machines use standard drives, memory and networking hardware. Configure them with your machine, upgrade later, or replace them yourself when a part wears out."
    />

    <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 lg:gap-4">
      {UPGRADES.map((upgrade, index) => (
        <li
          key={upgrade.caption}
          className={index === 0 ? "col-span-2 row-span-2" : undefined}
        >
          <figure className="relative h-full min-h-44 overflow-hidden rounded-lg bg-surface md:min-h-56">
            <Image
              src={upgrade.src}
              alt={upgrade.alt}
              className="object-cover"
              sizes={
                index === 0
                  ? "(max-width: 768px) 100vw, 50vw"
                  : "(max-width: 768px) 50vw, 25vw"
              }
              fill
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-12 text-sm font-medium text-paper">
              {upgrade.caption}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  </Section>
)

export default PartsProof
