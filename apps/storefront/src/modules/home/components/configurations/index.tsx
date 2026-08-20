import CtaLink from "@modules/home/components/cta-link"
import Faceplate from "@modules/home/components/faceplate"
import SectionHeading from "@modules/home/components/section-heading"

/**
 * Draft configuration ladder. Prices are indicative starting points — the
 * product pages carry the live, GST-inclusive price.
 */
const configurations = [
  {
    code: "VLY-N2",
    name: "Nano",
    from: "32,000",
    for: "Photos, documents, and a single 4K stream",
    specs: [
      ["CPU", "Intel N100, 4 cores"],
      ["Memory", "16 GB DDR5"],
      ["Bays", "2 x 3.5 in, 1 x NVMe"],
      ["Network", "2 x 2.5 GbE"],
      ["Idle draw", "12 W"],
      ["Noise", "19 dB(A)"],
    ],
  },
  {
    code: "VLY-C4",
    name: "Core",
    from: "68,000",
    for: "The family archive plus a Proxmox lab",
    featured: true,
    specs: [
      ["CPU", "Intel i5-12500T, 12 threads"],
      ["Memory", "32 GB, ECC ready"],
      ["Bays", "4 x 3.5 in hot-swap, 2 x NVMe"],
      ["Network", "2 x 2.5 GbE, IPMI"],
      ["Idle draw", "34 W"],
      ["Noise", "24 dB(A)"],
    ],
  },
  {
    code: "VLY-V8",
    name: "Vault",
    from: "1,42,000",
    for: "Studio masters, backups, and heavy VMs",
    specs: [
      ["CPU", "Xeon E-2436, 12 threads"],
      ["Memory", "64 GB ECC"],
      ["Bays", "8 x 3.5 in hot-swap, 2 x NVMe"],
      ["Network", "2 x 10 GbE SFP+"],
      ["Idle draw", "61 W"],
      ["Noise", "31 dB(A)"],
    ],
  },
]

const Configurations = () => {
  return (
    <section id="configurations" className="scroll-mt-20 bg-zinc-950 py-16 lg:py-24">
      <div className="content-container flex flex-col gap-12">
        <SectionHeading
          eyebrow="Three chassis"
          title="Every build starts from one of these."
          description="Drives, memory, and the operating system are chosen with you before assembly. The chassis decides how far the machine can grow."
          tone="dark"
        />

        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {configurations.map((config) => (
            <li key={config.code}>
              <Faceplate
                code={`${config.code} · ${config.name}`}
                status={config.featured ? "Most ordered" : undefined}
                className="h-full"
              >
                <div className="flex h-full flex-col gap-6 p-5">
                  <div className="flex flex-col gap-2">
                    <p className="text-sm leading-6 text-zinc-400">
                      {config.for}
                    </p>
                    <p className="font-display text-3xl text-white">
                      <span className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                        from{" "}
                      </span>
                      ₹{config.from}
                    </p>
                  </div>

                  <dl className="flex flex-col">
                    {config.specs.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between gap-4 border-t border-zinc-800 py-2.5"
                      >
                        <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          {label}
                        </dt>
                        <dd className="text-right text-sm text-zinc-200">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-auto">
                    <CtaLink
                      href="/store"
                      tone="dark"
                      variant={config.featured ? "solid" : "outline"}
                      className="w-full"
                    >
                      Configure the {config.name}
                    </CtaLink>
                  </div>
                </div>
              </Faceplate>
            </li>
          ))}
        </ul>

        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          Prices are indicative and include GST. Drives priced separately at the
          day&apos;s rate.
        </p>
      </div>
    </section>
  )
}

export default Configurations
