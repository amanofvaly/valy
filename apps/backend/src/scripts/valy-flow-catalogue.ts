/**
 * The Valy Flow configurator catalogue.
 *
 * Flow is sold the way a Mac is sold: a base kit at a price a visitor can hold
 * in their head, and every upgrade priced as a delta beside it. That shape is
 * incompatible with a Medusa variant matrix — base kit x memory x drives x
 * network x graphics x setup runs to several hundred combinations, none of
 * which can be stocked or repriced by hand — so the build is assembled out of
 * line items instead.
 *
 * One machine product carries the two base kits. Every other decision is its
 * own product with its own variants, added to the cart alongside the machine
 * and tied to it by line item metadata. A price change is then one field in
 * admin rather than twelve, and the drives, memory and cards are stocked as
 * the separate things they physically are.
 *
 * Two rules keep the cart honest:
 *
 * Components carry `configurator: "flow"` in metadata. They are real, buyable
 * products, but they are not catalogue browsing material — a drive with no
 * brand and no specification is a line in a build, not a thing to shop for —
 * so they are given no category, which is what excludes them from every
 * browse surface.
 *
 * A component's declared `weight` is its real one, and the base kit carries
 * only the empty machine. The parts ship installed inside it, so the shipping
 * weight of a build is the sum of its lines, which is correct. Box count is
 * the shipping orchestrator's business and it sees one shippable machine.
 *
 * Read by `create-valy-flow.ts`, which applies it to whichever backend it is
 * pointed at. This file is the source of truth for what a Flow costs; nothing
 * else in the repository restates a price.
 */

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

/**
 * Imagery.
 *
 * `machine` is a real photograph of the cabinet, uploaded to Medusa's own file
 * store. Everything else is an Unsplash placeholder and is chosen for the
 * *function* its configurator section describes rather than for the part — the
 * transcoding section shows a cinema, not a graphics card — because the
 * function is the argument the section is making.
 *
 * Two rules were applied while picking them, and both cost a more obvious
 * image. Nothing may show a named consumer product the machine does not
 * contain: an RTX 2080 beside a "Dedicated 2GB" row is a photograph that
 * promises the wrong card. And nothing may show an RGB gaming build, which is
 * what every free stock photograph of a case interior turns out to be, and
 * which is the opposite of what a quiet NAS in a plain cabinet is.
 *
 * `interior` is consequently the weakest asset here — a board close-up
 * standing in for a photograph of a real Flow build, which does not exist yet.
 * It is the first one to replace.
 */
export const FLOW_PHOTO = {
  /** The cabinet itself. A real photograph, in Medusa's file store. */
  machine:
    "https://api.valy.in/static/1787976461172-1787133980280-powerx-x100-ultra-basic-atx-cabinet.png",
  /** Stands in for an interior shot until a real build is photographed. */
  interior: img("photo-1518770660439-4636190af475"),
  /** Boot media. */
  boot: img("photo-1531492746076-161ca9bcad58"),
  /** Memory: several things happening at once. */
  memory: img("photo-1551288049-bebda4e38f71"),
  /** Storage: the platter your files actually sit on. */
  storage: img("photo-1601737487795-dab272f52420"),
  /** Setup: the work, being done. */
  setup: img("photo-1517430816045-df4b7de11d1d"),
  /** Network: the house, wired. */
  network: img("photo-1544197150-b99a580bb7a8"),
  /** Transcoding: a film playing. */
  transcode: img("photo-1489599849927-2ee91cede3ba"),
}

export type FlowVariant = {
  title: string
  sku: string
  /** Rupees, GST inclusive — the India region prices tax-inclusive. */
  price: number
  /** Grams. The real weight of the part, not of the box it ships in. */
  weight?: number
  metadata?: Record<string, unknown>
}

export type FlowProduct = {
  handle: string
  title: string
  subtitle: string
  description: string
  type: "machine" | "part" | "service"
  categories: string[]
  images: string[]
  /** The one option every configurator product carries. */
  optionTitle: string
  variants: FlowVariant[]
  metadata: Record<string, unknown>
  weight?: number
}

/* -------------------------------------------------------------------------- */
/*  The machine                                                                */
/* -------------------------------------------------------------------------- */

export const FLOW_MACHINE: FlowProduct = {
  handle: "valy-flow",
  title: "Valy Flow",
  subtitle: "Your files, your machine, in a cabinet that fits under a desk.",
  description:
    "Valy Flow is a home server built out of ordinary desktop parts and sold at what those parts cost. It runs TrueNAS SCALE, it holds two or three drives, and it does the work that a subscription currently does for you: the photo library, the film collection, the backups, the ad blocking, the private connection back home.\n\nThe cabinet is a consumer ATX case rather than a machined enclosure, and that is a deliberate choice about where the money goes. A purpose-built NAS chassis adds a five-figure sum to the bill and stores exactly the same bytes. Flow spends it on drives instead.\n\nConfigure it below. Everything except the boot drive is optional, and the price beside each option is what that option adds.",
  type: "machine",
  categories: ["machines"],
  images: [FLOW_PHOTO.machine, FLOW_PHOTO.interior],
  optionTitle: "Base kit",
  variants: [
    {
      title: "i3 2 Bay",
      sku: "VFLOW-I3-2B",
      price: 10999,
      weight: 6200,
      metadata: {
        data_bays: "2",
        cpu: "Intel Core i3, 4 cores with Quick Sync",
      },
    },
    {
      title: "i5 3 Bay",
      sku: "VFLOW-I5-3B",
      price: 15999,
      weight: 6600,
      metadata: {
        data_bays: "3",
        cpu: "Intel Core i5, 6 cores with Quick Sync",
      },
    },
  ],
  weight: 6200,
  metadata: {
    configurator: "flow",
    bays: "2 on the i3, 3 on the i5",
    drive_form_factor: "3.5 inch SATA, 2.5 inch with a tray adapter",
    os_preloaded: "TrueNAS SCALE",
    raid_default: "Mirror on two drives, RAIDZ1 on three",
    warranty_years: "3",
  },
}

/* -------------------------------------------------------------------------- */
/*  The components                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Components sit in no product category at all, and that is what keeps them out
 * of the browsable catalogue.
 *
 * They have to stay published — an unpublished variant cannot be added to a
 * cart — but "Flow storage drive" has no brand, no specification and no price
 * that means anything outside a build, so it has no business in the Storage
 * category beside a named IronWolf. Every browse surface on the storefront
 * scopes its query to categories, so an uncategorised product is excluded with
 * a correct count and correct pagination, rather than being filtered out of a
 * page after the fact and leaving a hole in it.
 */
const COMPONENT_META = { configurator: "flow" } as const

export const FLOW_COMPONENTS: FlowProduct[] = [
  {
    handle: "flow-boot-media",
    title: "Flow boot drive",
    subtitle: "Where TrueNAS lives, so a reinstall never touches your files.",
    description:
      "A 128GB SSD carrying TrueNAS SCALE, installed and updated before the machine ships. It is deliberately separate from the drives your data sits on: the operating system can be wiped and put back without the storage pool noticing, and a pool exported from a dead machine imports into a new one with its permissions and snapshots intact.\n\nThis is not optional, which is why it has no alternatives. A NAS booting from its own data array is a NAS that cannot be rebuilt.",
    type: "part",
    categories: [],
    images: [FLOW_PHOTO.boot],
    optionTitle: "Boot media",
    variants: [
      {
        title: "TrueNAS 128GB SSD",
        sku: "VFLOW-BOOT-128",
        price: 3000,
        weight: 60,
      },
    ],
    metadata: { ...COMPONENT_META, interface: "SATA III", fits: "valy-flow" },
  },
  {
    handle: "flow-memory",
    title: "Flow memory",
    subtitle: "How many services run at once without queueing.",
    description:
      "Every application on a TrueNAS machine holds memory for as long as it is running, and ZFS spends whatever is left over on caching the files you opened most recently. Eight gigabytes runs a photo library, file shares and backups comfortably. Sixteen is the point at which a media server, an ad blocker, a VPN and a download client stop taking turns.",
    type: "part",
    categories: [],
    images: [FLOW_PHOTO.memory],
    optionTitle: "Memory",
    variants: [
      { title: "8GB", sku: "VFLOW-RAM-8", price: 0, weight: 40 },
      { title: "16GB", sku: "VFLOW-RAM-16", price: 5000, weight: 60 },
    ],
    metadata: { ...COMPONENT_META, form_factor: "DDR4 SODIMM", fits: "valy-flow" },
  },
  {
    handle: "flow-storage-drive",
    title: "Flow storage drive",
    subtitle: "The drives your files actually sit on.",
    description:
      "NAS-rated mechanical drives, supplied in matched sets so the pool can be laid out sensibly. Every drive in a Flow build is the same capacity: ZFS sizes a mirror or a RAIDZ1 group by its smallest member, so a larger drive paired with a smaller one silently donates the difference.\n\nBuy one and you have a single drive with no protection. Buy two or three and you can choose what the pool trades capacity for.",
    type: "part",
    categories: [],
    images: [FLOW_PHOTO.storage],
    optionTitle: "Capacity",
    variants: [
      { title: "2TB", sku: "VFLOW-HDD-2TB", price: 15000, weight: 450 },
      { title: "4TB", sku: "VFLOW-HDD-4TB", price: 20000, weight: 600 },
      { title: "8TB", sku: "VFLOW-HDD-8TB", price: 46000, weight: 700 },
    ],
    metadata: {
      ...COMPONENT_META,
      drive_form_factor: "3.5 inch SATA",
      fits: "valy-flow",
    },
  },
  {
    handle: "flow-network",
    title: "Flow network",
    subtitle: "How fast a file moves between the machine and everything else.",
    description:
      "The number that decides how long a large copy takes. A hundred megabit link moves about 12MB a second, which is fine for streaming and slow for backups. Gigabit moves about 110MB a second and saturates a single mechanical drive. Two and a half gigabit is the one to buy if you edit off the machine, or if several people pull from it at once.\n\nAll three are wired. Wi-Fi is not offered, because a file server behind Wi-Fi is a file server with an intermittent fault.",
    type: "part",
    categories: [],
    images: [FLOW_PHOTO.network],
    optionTitle: "Link speed",
    variants: [
      { title: "100MB", sku: "VFLOW-NIC-100M", price: 0, weight: 0 },
      { title: "1GB LAN", sku: "VFLOW-NIC-1G", price: 1500, weight: 60 },
      { title: "2.5GB LAN", sku: "VFLOW-NIC-25G", price: 4000, weight: 80 },
    ],
    metadata: { ...COMPONENT_META, interface: "PCIe, RJ45", fits: "valy-flow" },
  },
  {
    handle: "flow-graphics",
    title: "Flow media transcoding",
    subtitle: "What happens when a television asks for a different format.",
    description:
      "Most of the time a film is sent to the screen untouched and nothing has to work hard. Transcoding is what happens when it cannot be — an older television, a phone on mobile data, a format the client will not decode — and the machine has to re-encode the video while it plays.\n\nThe processor's built-in Quick Sync handles this for a stream or two. A dedicated card is what you add when several people watch different things at once, or when the library is largely 4K.",
    type: "part",
    categories: [],
    images: [FLOW_PHOTO.transcode],
    optionTitle: "Transcoding",
    variants: [
      { title: "Onboard", sku: "VFLOW-GPU-IGP", price: 0, weight: 0 },
      { title: "Dedicated 2GB", sku: "VFLOW-GPU-2G", price: 12000, weight: 500 },
    ],
    metadata: { ...COMPONENT_META, vram: "2GB on the dedicated card", fits: "valy-flow" },
  },
  {
    handle: "flow-setup",
    title: "Flow storage pool and app setup",
    subtitle: "The machine arrives doing the thing you bought it for.",
    description:
      "We create the storage pool in the layout you choose, set up shares and snapshots, and install and configure the applications listed on the product page: Plex, Immich, Pi-hole, Tailscale, Sonarr, Radarr, Bazarr and qBittorrent. Each one is signed in where it needs an account, pointed at the right dataset, and checked to be reachable from your phone before the machine ships.\n\nWithout this the machine still arrives with TrueNAS installed and running. The pool and the applications are then yours to create, which is a genuinely reasonable evening if you have done it before and a genuinely long weekend if you have not.",
    type: "service",
    categories: [],
    images: [FLOW_PHOTO.setup],
    optionTitle: "Setup",
    variants: [
      {
        title: "Storage pool and basic apps",
        sku: "VFLOW-SETUP",
        price: 5000,
        weight: 0,
      },
    ],
    metadata: {
      ...COMPONENT_META,
      duration: "Configured before the machine ships",
      delivery: "Preconfigured, with a handover call",
      includes:
        "Storage pool, shares, snapshots, Plex, Immich, Pi-hole, Tailscale, Sonarr, Radarr, Bazarr, qBittorrent",
      prerequisites: "At least one drive",
      fits: "valy-flow",
    },
  },
]

export const FLOW_CATALOGUE: FlowProduct[] = [FLOW_MACHINE, ...FLOW_COMPONENTS]

/**
 * The bundled Flow SKUs this configurator replaces.
 *
 * Flow 2 and Flow 4 sell the same machine at a bundled price with the drives
 * already in it, starting at 42,000. Leaving them published beside a barebones
 * Flow at 10,999 puts two contradictory Flow price ladders in one catalogue,
 * so they go to draft rather than being deleted — orders that reference them
 * keep their own price snapshot and are unaffected.
 */
export const SUPERSEDED_HANDLES = ["flow-2", "flow-4"]
