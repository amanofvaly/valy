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
    title: "The photographs",
    body: "Every camera roll in the house, synced automatically, searchable by face and place, and not counted against a plan.",
  },
  {
    title: "The films and the music",
    body: "One library, playing on the televisions and phones already in the house, without a catalogue that changes every month.",
  },
  {
    title: "The backups",
    body: "Laptops backing themselves up over the network, with snapshots that let a file come back the way it was last Tuesday.",
  },
  {
    title: "The house network",
    body: "Advertising and tracking filtered for every device at once, and a private connection back home from anywhere.",
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
          title="A computer whose only job is to keep your files."
          lede="That is the whole idea. It sits in a corner, it is always on, it draws about as much power as a lamp, and everything you would otherwise be renting space for lives on drives you own."
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
          A Flow does not make your files safe on its own. Drives fail, and a
          machine in your house is still one place. Mirror the pool, and keep a
          copy of what you cannot lose somewhere else as well.
        </Aside>
      </Section>

      {/* ---- the cabinet ------------------------------------------------ */}
      <Section ground="surface" id="cabinet">
        <SectionHeading
          title="An ordinary cabinet, on purpose."
          lede="A purpose-built NAS enclosure is a nice object and an expensive one. It holds the same drives, runs the same software and stores the same bytes as a plain steel ATX case with good airflow. We buy the plain one and put the difference into drives."
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
                The cabinet, roughly. We buy whatever plain ATX case is
                available and quiet at the time, so the exact model changes from
                one batch to the next. Every one of them takes the same parts
                and holds the same drives.
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
                Inside: a motherboard and processor, one memory module, the
                boot SSD, your drives in the bays, and a power supply. Nothing
                proprietary, nothing soldered down, and no part that has to be
                bought from us to be replaced.
              </figcaption>
            </figure>
          )}
        </div>

        <Aside className="mt-12">
          The trade is real and worth saying plainly: you get a machine that
          looks like a computer rather than an appliance, and drive bays that
          are not hot-swappable. Changing a drive means taking the side panel
          off and using a screwdriver.
        </Aside>
      </Section>

      {/* ---- TrueNAS ---------------------------------------------------- */}
      <Section ground="ink" id="truenas">
        <SectionHeading
          invert
          title="It arrives running TrueNAS."
          lede="Not our own software with our own account system, and not a manufacturer's operating system that stops getting updates when the model is discontinued. TrueNAS SCALE is open source, has been maintained for well over a decade, and is what a large number of the machines in this category actually run underneath."
        />

        <dl className="mt-14 grid grid-cols-1 gap-x-10 gap-y-8 border-t border-paper/20 pt-10 md:grid-cols-3">
          <div>
            <dt className="text-lg font-semibold leading-7 text-paper">
              ZFS underneath
            </dt>
            <dd className="mt-2 text-base leading-7 text-paper/70">
              The filesystem checks every block it reads against a checksum and
              repairs it from the mirror when it does not match. This is what
              stops a file quietly rotting on a disk over ten years.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-semibold leading-7 text-paper">
              Snapshots, not copies
            </dt>
            <dd className="mt-2 text-base leading-7 text-paper/70">
              A snapshot costs nothing until something changes, so the machine
              can keep every hour of the last day and every day of the last
              month, and a deleted file comes back in seconds.
            </dd>
          </div>
          <div>
            <dt className="text-lg font-semibold leading-7 text-paper">
              No account with us
            </dt>
            <dd className="mt-2 text-base leading-7 text-paper/70">
              The machine works if we stop answering the phone. There is no
              cloud login between you and your files, and the pool imports into
              any other machine running ZFS.
            </dd>
          </div>
        </dl>

        <Aside invert className="mt-12">
          TrueNAS is a real operating system with a real learning curve. If you
          have not run one before, the setup service exists precisely so the
          first evening is not the hard part.
        </Aside>
      </Section>

      {/* ---- the applications ------------------------------------------- */}
      <Section ground="paper" id="apps">
        <SectionHeading
          title="Eight applications, installed and signed in."
          lede="These are what the setup service configures before the machine ships. Each one replaces something that currently bills monthly, and each one keeps its data on your pool."
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
          Nothing stops you installing more. TrueNAS runs containers, and the
          machine is yours — the eight above are the ones we will set up and
          support, not the ones you are limited to.
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
