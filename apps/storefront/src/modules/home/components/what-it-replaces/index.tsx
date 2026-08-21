import { Section, SectionHeading } from "@modules/home/components/section"

/**
 * What actually runs on it, named against the thing it stands in for.
 *
 * A homelab is abstract until someone says "Immich, instead of Google Photos".
 * The right-hand column is the useful one, so it is set in the same monospace
 * the spec block uses — these are the names a buyer will search for afterwards.
 */

const SWAPS = [
  {
    now: "Google Photos, iCloud Photos",
    then: "Immich",
    note: "Face grouping, search by place, an app on every phone in the house. It scrolls faster than the cloud one because the library is on your own network.",
  },
  {
    now: "A shelf of drives, a streaming catalogue that keeps changing",
    then: "Jellyfin or Plex",
    note: "Your films and your recordings, on the television and on a phone on mobile data. Nothing leaves because a licence expired.",
  },
  {
    now: "Dropbox, Google Drive",
    then: "Nextcloud",
    note: "A folder that syncs across machines, shared links, and a calendar and contacts if you want them.",
  },
  {
    now: "A rented VPS for side projects",
    then: "Proxmox",
    note: "Virtual machines and containers on hardware you already paid for, at the speed of a local disk.",
  },
  {
    now: "Camera subscriptions",
    then: "Frigate",
    note: "Recording and object detection on your own machine, so the footage of your front door is not somebody else's dataset.",
  },
  {
    now: "Nothing, yet",
    then: "Home Assistant, Pi-hole, Tailscale",
    note: "Automation, an ad blocker for the whole house, and a private way back in from anywhere without opening a port.",
  },
]

const WhatItReplaces = () => (
  <Section>
    <SectionHeading
      eyebrow="What it runs"
      title="Software that does the same job, on your hardware."
      lede="All of it is free and open source, all of it is installed before the machine ships, and none of it is ours — we are selling the box and the work, not a subscription with a different name."
    />

    <ul className="mt-10 divide-y divide-line border-y border-line">
      {SWAPS.map((swap) => (
        <li
          key={swap.then}
          className="grid grid-cols-1 gap-2 py-5 md:grid-cols-[1fr_1fr_1.4fr] md:items-baseline md:gap-8"
        >
          <p className="text-sm text-muted">
            <span className="md:hidden">Instead of </span>
            {swap.now}
          </p>
          <p className="font-mono text-base font-medium text-ink">
            {swap.then}
          </p>
          <p className="text-sm leading-6 text-muted">{swap.note}</p>
        </li>
      ))}
    </ul>
  </Section>
)

export default WhatItReplaces
