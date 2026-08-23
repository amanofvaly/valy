"use client"

import { cn } from "@lib/util/cn"
import { Section } from "@modules/home/components/section"
import {
  si1password,
  siApplemusic,
  siAudible,
  siBackblaze,
  siDropbox,
  siGoogle,
  siHomeassistant,
  siIcloud,
  siNetflix,
  siNextdns,
  siSpotify,
  siYoutube,
  type SimpleIcon,
} from "simple-icons"


type Subscription = {
  id: string
  name: string
  substitute: string
  monthly: number
  category: "Files and home" | "Film and TV" | "Music and books"
  icon?: SimpleIcon
  mark?: string
  color?: string
}

const SUBSCRIPTIONS: Subscription[] = [
  {
    id: "google-one",
    name: "Google One 2TB",
    substitute: "Cloud and photo storage",
    monthly: 749,
    category: "Files and home",
    icon: siGoogle,
  },
  {
    id: "icloud",
    name: "iCloud+ 2TB",
    substitute: "Cloud storage and photo backup",
    monthly: 749,
    category: "Files and home",
    icon: siIcloud,
  },
  {
    id: "dropbox",
    name: "Dropbox Plus",
    substitute: "File sync and cloud storage",
    monthly: 969,
    category: "Files and home",
    icon: siDropbox,
  },
  {
    id: "backblaze",
    name: "Backblaze",
    substitute: "Computer backup",
    monthly: 861,
    category: "Files and home",
    icon: siBackblaze,
  },
  {
    id: "1password",
    name: "1Password Families",
    substitute: "Family password manager",
    monthly: 573,
    category: "Files and home",
    icon: si1password,
  },
  {
    id: "home-assistant",
    name: "Home Assistant Cloud",
    substitute: "Smart-home remote access",
    monthly: 622,
    category: "Files and home",
    icon: siHomeassistant,
  },
  {
    id: "nextdns",
    name: "NextDNS Pro",
    substitute: "DNS filtering",
    monthly: 299,
    category: "Files and home",
    icon: siNextdns,
  },
  {
    id: "netflix",
    name: "Netflix Premium",
    substitute: "Your own video library",
    monthly: 649,
    category: "Film and TV",
    icon: siNetflix,
  },
  {
    id: "jiohotstar",
    name: "JioHotstar Premium",
    substitute: "Your own video library",
    monthly: 299,
    category: "Film and TV",
    mark: "JH",
    color: "#0B57D0",
  },
  {
    id: "sonyliv",
    name: "SonyLIV Premium",
    substitute: "Your own video library",
    monthly: 399,
    category: "Film and TV",
    mark: "S",
    color: "#531D8F",
  },
  {
    id: "zee5",
    name: "ZEE5 4K",
    substitute: "Your own video library",
    monthly: 299,
    category: "Film and TV",
    mark: "Z",
    color: "#6D28D9",
  },
  {
    id: "prime",
    name: "Amazon Prime",
    substitute: "Your own video library",
    monthly: 299,
    category: "Film and TV",
    mark: "a",
    color: "#00A8E1",
  },
  {
    id: "spotify",
    name: "Spotify Premium",
    substitute: "Your own music library",
    monthly: 139,
    category: "Music and books",
    icon: siSpotify,
  },
  {
    id: "apple-music",
    name: "Apple Music Family",
    substitute: "Your own music library",
    monthly: 229,
    category: "Music and books",
    icon: siApplemusic,
  },
  {
    id: "youtube",
    name: "YouTube Premium",
    substitute: "Personal music and video alternative",
    monthly: 149,
    category: "Music and books",
    icon: siYoutube,
  },
  {
    id: "audible",
    name: "Audible",
    substitute: "Your own audiobook library",
    monthly: 199,
    category: "Music and books",
    icon: siAudible,
  },
]

const CATEGORIES = ["Files and home", "Film and TV", "Music and books"] as const
const MAXIMUM_MONTHLY = SUBSCRIPTIONS.reduce(
  (total, item) => total + item.monthly,
  0
)
const formatRupees = (value: number) => `₹${value.toLocaleString("en-IN")}`

const ServiceMark = ({ service }: { service: Subscription }) => {
  const color = service.icon ? `#${service.icon.hex}` : service.color

  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-paper"
      style={{ color }}
    >
      {service.icon ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d={service.icon.path} />
        </svg>
      ) : (
        <span className="text-sm font-semibold tracking-tight">
          {service.mark}
        </span>
      )}
    </span>
  )
}

const Arithmetic = () => {
  const monthly = MAXIMUM_MONTHLY

  return (
    <Section ground="accent" rule="none" bleed pad="none">
      <div className="container-page py-16 sm:py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="max-w-[15ch] text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-paper sm:text-5xl lg:text-6xl">
              Stop your monthly bills
            </h2>
            <p className="mt-6 max-w-[62ch] text-lg leading-8 text-paper/80">
              Photos, files, backups, passwords, smart-home access and the media
              you already own can all live at home.
            </p>

            <div className="mt-10 flex flex-wrap gap-2" aria-hidden="true">
              {SUBSCRIPTIONS.map((service) => (
                <div key={service.id}>
                  <ServiceMark service={service} />
                </div>
              ))}
            </div>
          </div>

          <div className="py-8 lg:col-span-5 lg:self-end lg:pb-0">
            <p className="text-base text-paper/75">
              Possible savings
            </p>
            <p
              aria-live="polite"
              className="mt-2 flex flex-wrap items-baseline gap-x-3"
            >
              <span className="text-6xl font-semibold tabular tracking-tight text-paper sm:text-7xl">
                {formatRupees(monthly)}
              </span>
              <span className="text-lg text-paper/75">a month</span>
            </p>
            <div className="mt-7 grid grid-cols-2 gap-6 border-t border-paper/25 pt-6">
              <div>
                <p className="text-sm text-paper/65">In one year</p>
                <p className="mt-1 text-xl font-semibold tabular text-paper">
                  {formatRupees(monthly * 12)}
                </p>
              </div>
              <div>
                <p className="text-sm text-paper/65">Over five years</p>
                <p className="mt-1 text-xl font-semibold tabular text-paper">
                  {formatRupees(monthly * 60)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-paper/25 sm:mt-20">
          <div className="grid lg:grid-cols-3">
            {CATEGORIES.map((category) => (
              <div
                key={category}
                className="border-b border-paper/25 py-7 lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
              >
                <h3 className="text-xl font-semibold tracking-tight text-paper">
                  {category}
                </h3>
                <div className="mt-5">
                  {SUBSCRIPTIONS.filter(
                    (item) => item.category === category
                  ).map((service) => (
                    <div
                      key={service.id}
                      className="group flex min-h-[4.75rem] w-full items-center gap-3 border-t border-paper/20 py-3 text-left first:border-t-0"
                    >
                      <span className="transition duration-200 group-hover:scale-105">
                        <ServiceMark service={service} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-paper">
                          {service.name}
                        </span>
                        <span className="mt-0.5 block text-sm leading-5 text-paper/65">
                          {service.substitute}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular text-paper">
                        {formatRupees(service.monthly)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 max-w-[78ch] text-sm leading-6 text-paper/65">
          The total is {formatRupees(MAXIMUM_MONTHLY)} a month. This is an illustrative total, not a promise that one
          setup replaces every service or its catalogue. Streaming alternatives
          use media you own, and actual value depends on what your household
          uses.
        </p>
      </div>
    </Section>
  )
}

export default Arithmetic
