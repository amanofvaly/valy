import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Section, SectionHeading } from "@modules/home/components/section"
import Image from "next/image"

const PART_IMAGES = [
  {
    src: "/home/part-drive-placeholder.png",
    label: "Storage drives",
    alt: "An unbranded hard drive",
  },
  {
    src: "/home/part-memory-placeholder.png",
    label: "Memory",
    alt: "Two unbranded memory modules",
  },
  {
    src: "/home/part-network-placeholder.png",
    label: "Networking",
    alt: "An unbranded dual-port network card",
  },
  {
    src: "/home/part-ssd-placeholder.png",
    label: "SSDs",
    alt: "An unbranded NVMe solid-state drive",
  },
  {
    src: "/home/part-chassis-placeholder.png",
    label: "Chassis",
    alt: "An unbranded four-bay desktop server chassis",
  },
]

/**
 * These images are intentionally fixed rather than selected from the catalogue.
 * Replace them with Valy's own parts photography before launch.
 */
const PartsProof = () => (
  <Section ground="paper" rule="hairline">
    <SectionHeading
      title={
        <>
          Standard parts. <span className="text-accent">Easy</span> to replace.
        </>
      }
      lede="Valy machines use standard drives, memory and networking hardware. Choose them with your machine, upgrade later, or replace them when needed."
      action={
        <Button asChild variant="secondary" size="large">
          <LocalizedClientLink href="/categories/parts">
            Browse parts
          </LocalizedClientLink>
        </Button>
      }
    />

    <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 lg:gap-4">
      {PART_IMAGES.map((part, index) => (
        <li
          key={part.label}
          className={index === 0 ? "col-span-2 row-span-2" : undefined}
        >
          <figure className="group relative h-full min-h-44 overflow-hidden rounded-lg bg-surface md:min-h-56">
            <Image
              src={part.src}
              alt={part.alt}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
              sizes={
                index === 0
                  ? "(max-width: 768px) 100vw, 50vw"
                  : "(max-width: 768px) 50vw, 25vw"
              }
              fill
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-12 text-sm font-medium text-paper">
              {part.label}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  </Section>
)

export default PartsProof
