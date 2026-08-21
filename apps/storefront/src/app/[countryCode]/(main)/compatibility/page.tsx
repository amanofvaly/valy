import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PageHeader, Prose } from "@modules/content/components/prose"
import { Button } from "@modules/common/components/ui"
import { Metadata } from "next"

/**
 * The compatibility page.
 *
 * Synology uses this slot in its own navigation to express a restriction — a
 * list of drives its machines will accept. This is the same slot expressing the
 * opposite, which is only worth a top-level position because the claim is
 * falsifiable: every part is sold separately, so a reader can check.
 *
 * Fully static. It describes interfaces rather than a stock list, so nothing
 * here depends on what is in the catalogue today — and a rule about interfaces
 * does not go out of date the way a list of approved model numbers does.
 */

export const metadata: Metadata = {
  title: "What fits what",
  description:
    "Any drive that fits the bay works. No approved-drive list, no locked features, no vendor-keyed parts. What actually constrains compatibility, and what does not.",
}

/** No API call, no cookies. This page can be built once and served from the edge. */
export const dynamic = "force-static"

const INTERFACES = [
  {
    slot: "3.5 inch drive bays",
    accepts: "Any SATA drive, any manufacturer, any capacity",
    machines: "Flow 2, Flow 4, Hike 4, Hike 6, Summit 8",
    note: "CMR drives rebuild an array in reasonable time; SMR ones do not. That is the only recommendation we make, and it is about the recording method, not the brand.",
  },
  {
    slot: "M.2 NVMe slots",
    accepts: "Any M.2 2280 NVMe SSD",
    machines: "Flow 4, Hike 4, Hike 6, Summit 8",
    note: "Used for app storage, photo thumbnails and cache. A cheap one is fine for a boot drive; the array is where the speed matters.",
  },
  {
    slot: "Memory",
    accepts: "SODIMM on Flow and Hike 4, full-height DIMM on Hike 6 and Summit",
    machines: "All, to the ceiling on the board",
    note: "ECC works where the board supports it. Nothing is vendor-keyed, so a module bought anywhere runs at full speed.",
  },
  {
    slot: "PCIe slots",
    accepts: "Any card that physically fits the slot and the case",
    machines: "Hike 4 (x1), Hike 6, Summit 8",
    note: "Transcode cards, 10GbE, HBAs. Half-height and single-slot on the Hike 6; full-height on the Summit.",
  },
  {
    slot: "Power supply",
    accepts: "Standard SFX or SFX-L",
    machines: "Summit 8",
    note: "Not a proprietary brick. If it fails in year six you can buy a replacement in any computer shop.",
  },
]

const NOT_LOCKED = [
  "Storage pool creation with any drive",
  "SMART health statistics and failure prediction",
  "Installing the operating system on any disk",
  "Deduplication, compression and snapshots",
  "Cache and tiering with any NVMe",
  "Firmware updates, whoever made the drive",
]

export default function CompatibilityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Compatibility"
        title="Any drive that fits the bay works."
        lede="There is no approved list. There is no feature that switches itself off because of what is written on the disk. This page exists because that is not a given any more."
      />

      <div className="container-page py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Prose>
            <p>
              A network storage machine is a box with drive bays, a processor
              and an operating system. Nothing about that requires the
              manufacturer to have an opinion on whose drives go in it. For most
              of the history of the category, none of them did.
            </p>
            <p>
              That changed. In 2025 Synology restricted third-party drives on
              its Plus-series machines: without a disk from its own list you
              could not create a storage pool, could not read health statistics,
              and in some configurations could not install the operating system
              at all. After sustained criticism it reversed most of that in DSM
              7.3 in October 2025 — though M.2 SSDs remain limited to its own
              list.
            </p>
            <p>
              We are not claiming to be better people. We are pointing out that
              the restriction was possible at all, and that a machine you cannot
              put your own drives into is not really yours. So: this is the
              commitment, and every part is sold separately so you can check it.
            </p>
          </Prose>

          <div className="rounded-lg border border-line p-6">
            <h2 className="text-base font-medium text-ink">
              Never conditional on the brand
            </h2>
            <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
              {NOT_LOCKED.map((item) => (
                <li
                  key={item}
                  className="flex items-baseline gap-2.5 py-2.5 text-sm text-muted"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-16" aria-labelledby="what-constrains">
          <h2
            id="what-constrains"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            What does constrain it
          </h2>
          <p className="mt-2 max-w-prose text-base leading-7 text-muted">
            Physics and interfaces, which is the honest list. A part fits if it
            fits.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="py-3 pr-4 text-xs font-medium text-muted">
                    Slot
                  </th>
                  <th className="py-3 pr-4 text-xs font-medium text-muted">
                    Takes
                  </th>
                  <th className="py-3 pr-4 text-xs font-medium text-muted">
                    On
                  </th>
                  <th className="py-3 text-xs font-medium text-muted">
                    Worth knowing
                  </th>
                </tr>
              </thead>
              <tbody>
                {INTERFACES.map((row) => (
                  <tr key={row.slot} className="border-b border-line align-top">
                    <td className="py-4 pr-4 font-medium text-ink">
                      {row.slot}
                    </td>
                    <td className="py-4 pr-4 text-muted">{row.accepts}</td>
                    <td className="py-4 pr-4 font-mono text-2xs tabular text-muted">
                      {row.machines}
                    </td>
                    <td className="py-4 text-muted">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 flex flex-col gap-6 rounded-lg border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Which is why we sell the parts
            </h2>
            <p className="max-w-prose text-base leading-7 text-muted">
              Every drive, module and card that goes into a Valy machine has its
              own page, its own price and its own list of what it is tested in.
              Buy them from us or buy them anywhere — the machine cannot tell
              the difference, which is the entire point.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <LocalizedClientLink href="/categories/parts">
                The parts catalogue
              </LocalizedClientLink>
            </Button>
            <Button asChild variant="secondary">
              <LocalizedClientLink href="/categories/machines">
                The machines
              </LocalizedClientLink>
            </Button>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="opening-it">
          <h2
            id="opening-it"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Opening it does not void anything
          </h2>
          <Prose className="mt-3">
            <p>
              Adding drives, memory or cards is expected, not tolerated. The
              parts list ships taped inside the lid with every bay mapped to a
              drive serial, so you know what is in there before you take the
              side off.
            </p>
            <p>
              The three-year warranty covers parts and labour on what we
              supplied. If something you fitted yourself is what failed, that is
              between you and whoever sold it — but it does not affect the rest
              of the machine&apos;s cover, and we will still help you work out
              which it was.
            </p>
          </Prose>
        </section>
      </div>
    </>
  )
}
