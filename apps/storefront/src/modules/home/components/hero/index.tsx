import Image from "next/image"

import CtaLink from "@modules/home/components/cta-link"
import Faceplate from "@modules/home/components/faceplate"
import { homeMedia } from "@modules/home/media"

const readout = [
  { label: "Idle draw", value: "34", unit: "W" },
  { label: "Noise at 1 m", value: "24", unit: "dB(A)" },
  { label: "Burn-in", value: "48", unit: "h" },
  { label: "Warranty", value: "3", unit: "yr" },
]

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950">
      <div className="content-container grid grid-cols-1 items-center gap-y-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-16 lg:py-24">
        <div className="flex flex-col gap-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber-400">
            Assembled in Bengaluru · Ships pan-India
          </span>

          <h1 className="max-w-xl font-display text-4xl leading-[1.05] tracking-tight text-white [font-stretch:112%] sm:text-5xl lg:text-6xl">
            A server that lives in your house.
            <span className="block text-zinc-500">
              Not in someone else&apos;s cloud.
            </span>
          </h1>

          <p className="max-w-lg text-base leading-7 text-zinc-400">
            Valy builds homelab machines for Indian homes and studios: NAS boxes
            for the family archive, Plex and Jellyfin servers that transcode 4K
            without stuttering, Proxmox nodes for the work you would rather not
            rent by the hour. Every unit runs 48 hours on the bench before it
            ships.
          </p>

          <div className="flex flex-col gap-3 xsmall:flex-row xsmall:items-center">
            <CtaLink href="/store" tone="dark">
              Shop all builds
            </CtaLink>
            <CtaLink href="#configurations" variant="outline" tone="dark">
              Compare configurations
            </CtaLink>
          </div>

          <dl className="grid grid-cols-2 border-t border-zinc-800 sm:grid-cols-4">
            {readout.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-1 border-b border-r border-zinc-800 py-4 pr-4 last:border-r-0 sm:border-b-0"
              >
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {item.label}
                </dt>
                <dd className="font-display text-2xl text-white">
                  {item.value}
                  <span className="ml-1 font-mono text-xs text-amber-400">
                    {item.unit}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <Faceplate
          code="VLY-C4 · Core 4-bay"
          status="Built to order"
          className="w-full shadow-elevation-card-hover"
        >
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={homeMedia.rack}
              alt="Rack of running servers photographed from the front"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
              <p className="font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-zinc-300">
                Intel i5-12500T · 32 GB
                <br />4 x 3.5&quot; hot-swap · 2.5 GbE
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-amber-400">
                TrueNAS / Proxmox preloaded
              </p>
            </div>
          </div>
        </Faceplate>
      </div>
    </section>
  )
}

export default Hero
