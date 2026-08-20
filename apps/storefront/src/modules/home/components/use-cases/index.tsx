import Image from "next/image"

import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SectionHeading from "@modules/home/components/section-heading"
import CtaLink from "@modules/home/components/cta-link"
import { homeMedia } from "@modules/home/media"

/**
 * Curated entry points. Each one links to a real product category when a
 * matching handle exists in the catalog, and falls back to the store otherwise,
 * so the section keeps working while the catalog is still being filled in.
 */
const useCases = [
  {
    title: "Network storage",
    copy: "One address for every drive in the house. ZFS mirrors, snapshots, and a share that Windows, macOS, and your phone all see.",
    spec: "2 to 8 bays · up to 176 TB",
    image: homeMedia.drive,
    handles: ["nas", "storage", "network-storage"],
  },
  {
    title: "Media servers",
    copy: "Plex and Jellyfin with hardware transcoding that holds three 4K streams while the family watches different things.",
    spec: "QuickSync · 3 x 4K transcode",
    image: homeMedia.livingRoom,
    handles: ["media", "media-servers", "plex"],
  },
  {
    title: "Virtualization nodes",
    copy: "Proxmox on ECC-ready memory. Run the lab, the staging box, and the CI runner you have been paying for by the hour.",
    spec: "6 to 12 cores · 32 to 128 GB",
    image: homeMedia.board,
    handles: ["virtualization", "compute", "servers"],
  },
  {
    title: "Networking and edge",
    copy: "Small, silent boxes for OPNsense, Pi-hole, and Home Assistant. They sit behind the TV and nobody notices them.",
    spec: "10 W idle · fanless",
    image: homeMedia.patchPanel,
    handles: ["networking", "network", "edge"],
  },
]

export default async function UseCases() {
  const categories = await listCategories({ limit: 100 }).catch(() => [])

  const hrefFor = (handles: string[]) => {
    const match = categories?.find(
      (category) =>
        handles.includes(category.handle) ||
        handles.includes(category.name?.toLowerCase().replace(/\s+/g, "-"))
    )

    return match ? `/categories/${match.handle}` : "/store"
  }

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="content-container flex flex-col gap-12">
        <SectionHeading
          eyebrow="Start with the job"
          title="Pick the machine by what you want it to run."
          description="Every build ships configured for its job, not as a bare box with a login prompt. Tell us the workload and it arrives doing it."
        >
          <CtaLink href="/store" variant="ghost">
            All builds
          </CtaLink>
        </SectionHeading>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase) => (
            <li key={useCase.title}>
              <LocalizedClientLink
                href={hrefFor(useCase.handles)}
                className="group flex h-full flex-col overflow-hidden rounded-large border border-zinc-200 bg-white transition-colors hover:border-zinc-900"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={useCase.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="font-display text-lg tracking-tight text-zinc-900">
                    {useCase.title}
                  </h3>
                  <p className="flex-1 text-sm leading-6 text-zinc-600">
                    {useCase.copy}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    {useCase.spec}
                  </p>
                </div>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              In the catalog
            </span>
            {categories
              .filter((category) => !category.parent_category)
              .slice(0, 8)
              .map((category) => (
                <LocalizedClientLink
                  key={category.id}
                  href={`/categories/${category.handle}`}
                  className="rounded-circle border border-zinc-200 px-3 py-1 text-xs text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
                >
                  {category.name}
                </LocalizedClientLink>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}
