import { FlowProducts } from "@lib/data/flow-config"
import { SETUP_APPS } from "@lib/data/flow-setup-apps"
import { specRows } from "@lib/util/specs"
import { AppIcon } from "@modules/common/components/app-icon"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Aside, Section, SectionHeading } from "@modules/home/components/section"
import Image from "next/image"

/**
 * The half of the Flow page that is not a control.
 *
 * The configurator above answers "which one", and it can only do that for
 * someone who has already decided they want a NAS at all. This is the part that
 * argues for the machine: what the thing is, why it lives in a cabinet that
 * costs nothing, what the software is, and what it runs.
 *
 * Grounds alternate paper and surface, with one ink chapter. The homepage is
 * the surface that *composes* its grounds — a deliberate sequence including a
 * red one — and this deliberately does not imitate that. The single dark band
 * is for TrueNAS, because it is the only chapter about software rather than
 * about hardware, and it needs to read as a different kind of claim from the
 * two specification chapters either side of it.
 */

const NAS_JOBS = [
  {
    title: "Photo Synchronization",
    body: "Automatic, unmetered camera roll syncing and AI-based facial/location search.",
  },
  {
    title: "Media Streaming",
    body: "Centralized media library for local network playback across all household devices.",
  },
  {
    title: "Automated Backups",
    body: "Network-attached target for workstation backups, featuring ZFS snapshots for point-in-time recovery.",
  },
  {
    title: "Network Services",
    body: "Self-hosted DNS sinkholing (ad-blocking) and secure VPN access to your local network.",
  },
]

const FlowStory = ({ products }: { products: FlowProducts }) => {
  const machine = products["valy-flow"]
  const rows = specRows(machine?.metadata)
  const [exterior, interior] = machine?.images ?? []

  return (
    <>
      {/* ---- what it is ------------------------------------------------- */}
      <Section ground="paper" rule="accent" id="about">
        <SectionHeading
          title="Dedicated local storage server."
          lede="A low-power, always-on server designed to host your data locally, eliminating cloud storage dependencies."
        />

        <dl className="mt-14 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-line pt-10 sm:grid-cols-2">
          {NAS_JOBS.map((job) => (
            <div key={job.title}>
              <dt className="text-lg font-semibold leading-7 text-ink">
                {job.title}
              </dt>
              <dd className="mt-2 max-w-prose text-base leading-7 text-muted">
                {job.body}
              </dd>
            </div>
          ))}
        </dl>

        <Aside className="mt-12">
          Hardware redundancy is not a backup. Maintain off-site or cloud backups for critical data to protect against catastrophic local failure.
        </Aside>
      </Section>

      {/* ---- the cabinet ------------------------------------------------ */}
      <Section ground="surface" id="cabinet">
        <SectionHeading
          title="Standard ATX form factor."
          lede="Built in a standard steel ATX chassis to maximize airflow and minimize cost, prioritizing internal hardware over proprietary external enclosures."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {exterior?.url && (
            <figure className="overflow-hidden rounded-lg bg-paper">
              <div className="relative aspect-[4/3]">
                <Image
                  src={exterior.url}
                  alt="The Valy Flow cabinet: a plain black steel tower with a ventilated front panel"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-6"
                />
              </div>
              <figcaption className="border-t border-line px-5 py-4 text-sm leading-6 text-muted">
                Standard ATX tower case with front-panel ventilation. Exact chassis models may vary based on availability, but all share standard ATX mounting, clearances, and acoustic profiles.
              </figcaption>
            </figure>
          )}

          {interior?.url && (
            <figure className="overflow-hidden rounded-lg bg-paper">
              <div className="relative aspect-[4/3]">
                <Image
                  src={interior.url}
                  alt="A close view of computer circuitry"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="border-t border-line px-5 py-4 text-sm leading-6 text-muted">
                Non-proprietary internal components: ATX motherboard, standard processor and memory, boot SSD, internal drive bays, and standard PSU. Components are fully user-replaceable.
              </figcaption>
            </figure>
          )}
        </div>

        <Aside className="mt-12">
          Note: Drive bays are internal and not hot-swappable. Drive replacement requires powering down the system and removing the side panel.
        </Aside>
      </Section>

      {/* ---- TrueNAS ---------------------------------------------------- */}
      <Section ground="ink" id="truenas">
        <SectionHeading
          invert
          title="Powered by TrueNAS SCALE."
          lede="An open-source, Debian-based NAS appliance OS. Features long-term support, standard ZFS implementation, and no vendor lock-in."
        />

        <dl className="mt-14 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-paper/20 pt-10 md:grid-cols-3">
          <div>
            <dt className="text-lg font-semibold leading-7 text-paper">
              ZFS Data Integrity
            </dt>
            <dd className="mt-2 text-base leading-7 text-paper/70">
              Filesystem-level block checksumming automatically detects and repairs silent data corruption (bit rot) using parity or mirror data.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-semibold leading-7 text-paper">
              Copy-on-Write Snapshots
            </dt>
            <dd className="mt-2 text-base leading-7 text-paper/70">
              Instantaneous, zero-cost snapshots allow rapid rollback of files or entire datasets to previous states, protecting against accidental deletion or ransomware.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-semibold leading-7 text-paper">
              Fully Local Authentication
            </dt>
            <dd className="mt-2 text-base leading-7 text-paper/70">
              No mandatory cloud accounts or external dependencies. The storage pool can be exported and imported into any standard ZFS environment.
            </dd>
          </div>
        </dl>

        <Aside invert className="mt-12">
          TrueNAS provides enterprise-grade storage management but requires basic systems administration knowledge. The optional setup service is recommended for users unfamiliar with ZFS.
        </Aside>
      </Section>

      {/* ---- the applications ------------------------------------------- */}
      <Section ground="paper" id="apps">
        <SectionHeading
          title="Pre-configured core applications."
          lede="Our optional setup service pre-installs and configures these eight core applications to run natively on your storage pool."
          action={
            <Button asChild variant="secondary" size="large">
              <LocalizedClientLink href="/#apps">
                See the full library
              </LocalizedClientLink>
            </Button>
          }
        />

        <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-line sm:grid-cols-2 lg:grid-cols-4">
          {SETUP_APPS.map((app) => (
            <li
              key={app.slug}
              className="flex flex-col gap-3 bg-paper p-5"
              style={
                {
                  "--app-brand": app.brand,
                  "--app-wash": app.wash,
                } as React.CSSProperties
              }
            >
              <span className="app-cell grid h-10 w-10 place-items-center rounded">
                <AppIcon app={app} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-semibold leading-6 text-ink">
                  {app.name}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted">
                  {app.line}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <Aside className="mt-12">
          TrueNAS SCALE supports standard Docker/Kubernetes deployments. You have full root access to install additional containers beyond the pre-configured core apps.
        </Aside>
      </Section>

      {/* ---- specification ---------------------------------------------- */}
      {rows.length > 0 && (
        <Section ground="surface" id="specification">
          <SectionHeading
            title="The specification."
            lede="What is true of every Flow, whichever way you configure it above."
          />

          <dl className="mt-12 border-t border-line-strong">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-1 gap-1 border-b border-line py-4 sm:grid-cols-[14rem_1fr] sm:gap-6"
              >
                <dt className="font-mono text-[0.6875rem] uppercase leading-6 tracking-[0.12em] text-muted">
                  {row.label}
                </dt>
                <dd
                  className={
                    row.prose
                      ? "text-base leading-7 text-ink"
                      : "text-base leading-7 tabular text-ink"
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 max-w-prose text-base leading-7 text-muted">
            Built to order and burned in before it ships. Three-year warranty on
            the machine, and the drive manufacturer&rsquo;s own warranty on the
            drives. GST invoice with every order.
          </p>
        </Section>
      )}
    </>
  )
}

export default FlowStory
