import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createProductTypesWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Sample catalogue for the storefront overhaul.
 *
 * The backend holds one unnamed fixture product, which is not enough to build a
 * lineup page, a parts catalogue or a configurator against. This seeds the
 * Flow / Hike / Summit range, the parts that fit them and the install services,
 * with the `product.metadata` spec schema the spec block reads.
 *
 * Safe to re-run: everything is keyed by handle and skipped if already present.
 *
 * Photography is Unsplash placeholder imagery, the same open item as
 * `modules/home/media.ts` on the storefront. Real photos replace these before
 * launch.
 */

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

const PHOTO = {
  rack: img("photo-1558494949-ef010cbdcc31"),
  board: img("photo-1518770660439-4636190af475"),
  drive: img("photo-1597852074816-d933c7d2b988"),
  ssd: img("photo-1531492746076-161ca9bcad58"),
  ram: img("photo-1562976540-1502c2145186"),
  network: img("photo-1544197150-b99a580bb7a8"),
  gpu: img("photo-1591405351990-4726e331f141"),
  case: img("photo-1587202372775-e229f172b9d7"),
  psu: img("photo-1587202372616-b43abea06c2a"),
  fan: img("photo-1587202372634-32705e3bf49c"),
  bench: img("photo-1573164713988-8665fc963095"),
  desk: img("photo-1614624532983-4ce03382d63d"),
  service: img("photo-1517430816045-df4b7de11d1d"),
}

type SeedVariant = {
  title: string
  sku: string
  options: Record<string, string>
  price: number
  metadata?: Record<string, unknown>
}

type SeedProduct = {
  handle: string
  title: string
  subtitle: string
  description: string
  type: "machine" | "part" | "service"
  categories: string[]
  collections?: string[]
  images: string[]
  /** Option titles, resolved to shared or product-scoped options below. */
  options: { title: string; values: string[]; exclusive: boolean }[]
  variants: SeedVariant[]
  metadata: Record<string, unknown>
  weight?: number
}

/* -------------------------------------------------------------------------- */
/*  Taxonomy                                                                   */
/* -------------------------------------------------------------------------- */

const CATEGORIES: { handle: string; name: string; parent?: string; description: string }[] = [
  {
    handle: "machines",
    name: "Machines",
    description:
      "Built, loaded and burned in for 48 hours before they ship. Flow to start, Hike to grow, Summit when the machine is doing real work.",
  },
  {
    handle: "parts",
    name: "Parts",
    description:
      "Every drive, stick of memory and card we fit is sold on its own. Nothing here is locked to an approved list.",
  },
  {
    handle: "storage",
    name: "Storage",
    parent: "parts",
    description: "Drives for the bays. NAS-rated spinning disks and NVMe for cache and apps.",
  },
  {
    handle: "memory",
    name: "Memory",
    parent: "parts",
    description: "SODIMM and DIMM modules tested in the machines they are sold for.",
  },
  {
    handle: "networking",
    name: "Networking",
    parent: "parts",
    description: "Cards and adapters for when gigabit stops being enough.",
  },
  {
    handle: "graphics",
    name: "Graphics",
    parent: "parts",
    description: "Cards for hardware transcoding and for models that need to run locally.",
  },
  {
    handle: "cases-and-power",
    name: "Cases and power",
    parent: "parts",
    description: "Chassis, power supplies and fans, for a build of your own or a spare for ours.",
  },
  {
    handle: "services",
    name: "Services",
    description:
      "Work we do so the machine arrives finished. Bought with a machine or on its own for hardware you already have.",
  },
]

/**
 * Collections are the curated sets that cut across the category tree. There is
 * deliberately no lineup collection: a Medusa product belongs to exactly one
 * collection, so "The range" and "Starting out" could not both hold a Flow 2 —
 * and the Machines category is already the lineup. `seed-valy-curation.ts`
 * removes a "the-range" collection if an earlier run of this script left one.
 */
const COLLECTIONS: { handle: string; title: string }[] = [
  { handle: "starting-out", title: "Starting out" },
  { handle: "plex-builds", title: "Plex builds" },
]

/* -------------------------------------------------------------------------- */
/*  Shared options — the store's global facets                                 */
/*                                                                             */
/*  `is_exclusive: false` puts an option in the storefront's parts facets.      */
/*  Per-machine storage bundles are exclusive so they stay in the configurator  */
/*  and out of the catalogue sidebar.                                           */
/* -------------------------------------------------------------------------- */

const SHARED_OPTIONS: { title: string; values: string[] }[] = [
  { title: "RAM", values: ["8GB", "16GB", "32GB", "64GB"] },
  { title: "Capacity", values: ["500GB", "1TB", "2TB", "4TB", "6TB", "8TB", "12TB", "16TB"] },
  { title: "Drive type", values: ["NAS HDD", "SATA SSD", "NVMe SSD"] },
]

/* -------------------------------------------------------------------------- */
/*  The range                                                                  */
/* -------------------------------------------------------------------------- */

const MACHINES: SeedProduct[] = [
  {
    handle: "flow-2",
    title: "Flow 2",
    subtitle: "Two bays. The first machine that is yours.",
    description:
      "Flow 2 is the smallest machine worth owning. Two bays mirrored, so one drive can die without taking the archive with it. It draws about as much power as a phone charger left plugged in, sits on a shelf without announcing itself, and runs TrueNAS with Immich already installed.\n\nThis is the machine for moving a phone camera roll off Google Photos and stopping there. When two bays stop being enough, the drives come out and go straight into a Flow 4 or a Hike.",
    type: "machine",
    categories: ["machines"],
    collections: ["starting-out"],
    images: [PHOTO.desk, PHOTO.board, PHOTO.bench],
    options: [
      { title: "Storage", values: ["2 x 4TB", "2 x 8TB", "2 x 12TB"], exclusive: true },
      { title: "RAM", values: ["8GB", "16GB"], exclusive: false },
    ],
    variants: [
      { title: "2 x 4TB / 8GB", sku: "FLOW2-4TB-8", options: { Storage: "2 x 4TB", RAM: "8GB" }, price: 42000 },
      { title: "2 x 4TB / 16GB", sku: "FLOW2-4TB-16", options: { Storage: "2 x 4TB", RAM: "16GB" }, price: 46500 },
      { title: "2 x 8TB / 8GB", sku: "FLOW2-8TB-8", options: { Storage: "2 x 8TB", RAM: "8GB" }, price: 54000 },
      { title: "2 x 8TB / 16GB", sku: "FLOW2-8TB-16", options: { Storage: "2 x 8TB", RAM: "16GB" }, price: 58500 },
      { title: "2 x 12TB / 8GB", sku: "FLOW2-12TB-8", options: { Storage: "2 x 12TB", RAM: "8GB" }, price: 68000 },
      { title: "2 x 12TB / 16GB", sku: "FLOW2-12TB-16", options: { Storage: "2 x 12TB", RAM: "16GB" }, price: 72500 },
    ],
    weight: 3200,
    metadata: {
      cpu: "Intel N100, 4 cores",
      ram_base: "8GB DDR4, one SODIMM slot free",
      bays: "2 x 3.5 inch hot-swap",
      drive_form_factor: "3.5 inch SATA, 2.5 inch with tray adapter",
      nic: "1 x 2.5GbE",
      psu_watts: "120",
      idle_watts: "14",
      noise_db: "19",
      os_preloaded: "TrueNAS SCALE with Immich",
      raid_default: "Mirror",
      warranty_years: "3",
      dimensions_mm: "170 x 145 x 226",
    },
  },
  {
    handle: "flow-4",
    title: "Flow 4",
    subtitle: "Four bays, same footprint, room to be wrong once.",
    description:
      "Four bays in a chassis barely larger than the Flow 2. Run them as two mirrors or as one RAID-Z1 array that survives a single drive failure and still gives you three drives of usable space.\n\nThe usual reason to start here rather than at Flow 2: photos and video grow, and adding a fourth drive later is cheaper than replacing the whole machine. Ships with TrueNAS, Immich and Jellyfin installed and a share already mapped.",
    type: "machine",
    categories: ["machines"],
    collections: ["starting-out"],
    images: [PHOTO.rack, PHOTO.board, PHOTO.bench],
    options: [
      { title: "Storage", values: ["4 x 4TB", "4 x 8TB", "4 x 12TB"], exclusive: true },
      { title: "RAM", values: ["8GB", "16GB", "32GB"], exclusive: false },
    ],
    variants: [
      { title: "4 x 4TB / 8GB", sku: "FLOW4-4TB-8", options: { Storage: "4 x 4TB", RAM: "8GB" }, price: 58000 },
      { title: "4 x 4TB / 16GB", sku: "FLOW4-4TB-16", options: { Storage: "4 x 4TB", RAM: "16GB" }, price: 62500 },
      { title: "4 x 4TB / 32GB", sku: "FLOW4-4TB-32", options: { Storage: "4 x 4TB", RAM: "32GB" }, price: 70000 },
      { title: "4 x 8TB / 8GB", sku: "FLOW4-8TB-8", options: { Storage: "4 x 8TB", RAM: "8GB" }, price: 79000 },
      { title: "4 x 8TB / 16GB", sku: "FLOW4-8TB-16", options: { Storage: "4 x 8TB", RAM: "16GB" }, price: 83500 },
      { title: "4 x 8TB / 32GB", sku: "FLOW4-8TB-32", options: { Storage: "4 x 8TB", RAM: "32GB" }, price: 91000 },
      { title: "4 x 12TB / 16GB", sku: "FLOW4-12TB-16", options: { Storage: "4 x 12TB", RAM: "16GB" }, price: 108000 },
      { title: "4 x 12TB / 32GB", sku: "FLOW4-12TB-32", options: { Storage: "4 x 12TB", RAM: "32GB" }, price: 115500 },
    ],
    weight: 4600,
    metadata: {
      cpu: "Intel N100, 4 cores",
      ram_base: "8GB DDR4, one SODIMM slot free",
      bays: "4 x 3.5 inch hot-swap",
      drive_form_factor: "3.5 inch SATA, 2 x M.2 NVMe for cache",
      nic: "2 x 2.5GbE",
      psu_watts: "150",
      idle_watts: "19",
      noise_db: "19",
      os_preloaded: "TrueNAS SCALE with Immich and Jellyfin",
      raid_default: "RAID-Z1",
      warranty_years: "3",
      dimensions_mm: "196 x 170 x 235",
    },
  },
  {
    handle: "hike-4",
    title: "Hike 4",
    subtitle: "Transcodes 4K without thinking about it.",
    description:
      "The Hike range is where the machine stops being only a filing cabinet. An i3-N305 with Quick Sync handles three or four simultaneous 4K transcodes, so Plex or Jellyfin can serve the TV, a laptop and a phone on mobile data at the same time without a stutter.\n\nFour bays, two NVMe slots for app storage, and enough headroom to run Home Assistant, a Minecraft server and an ad blocker alongside the media stack.",
    type: "machine",
    categories: ["machines"],
    collections: ["plex-builds"],
    images: [PHOTO.rack, PHOTO.bench, PHOTO.board],
    options: [
      { title: "Storage", values: ["4 x 8TB", "4 x 12TB", "4 x 16TB"], exclusive: true },
      { title: "RAM", values: ["16GB", "32GB", "64GB"], exclusive: false },
    ],
    variants: [
      { title: "4 x 8TB / 16GB", sku: "HIKE4-8TB-16", options: { Storage: "4 x 8TB", RAM: "16GB" }, price: 96000 },
      { title: "4 x 8TB / 32GB", sku: "HIKE4-8TB-32", options: { Storage: "4 x 8TB", RAM: "32GB" }, price: 103500 },
      { title: "4 x 8TB / 64GB", sku: "HIKE4-8TB-64", options: { Storage: "4 x 8TB", RAM: "64GB" }, price: 118000 },
      { title: "4 x 12TB / 32GB", sku: "HIKE4-12TB-32", options: { Storage: "4 x 12TB", RAM: "32GB" }, price: 128000 },
      { title: "4 x 12TB / 64GB", sku: "HIKE4-12TB-64", options: { Storage: "4 x 12TB", RAM: "64GB" }, price: 142500 },
      { title: "4 x 16TB / 32GB", sku: "HIKE4-16TB-32", options: { Storage: "4 x 16TB", RAM: "32GB" }, price: 152000 },
      { title: "4 x 16TB / 64GB", sku: "HIKE4-16TB-64", options: { Storage: "4 x 16TB", RAM: "64GB" }, price: 166500 },
    ],
    weight: 5400,
    metadata: {
      cpu: "Intel Core i3-N305, 8 cores, Quick Sync",
      ram_base: "16GB DDR5, two SODIMM slots",
      bays: "4 x 3.5 inch hot-swap",
      drive_form_factor: "3.5 inch SATA, 2 x M.2 NVMe",
      nic: "2 x 2.5GbE",
      psu_watts: "250",
      idle_watts: "24",
      noise_db: "24",
      os_preloaded: "TrueNAS SCALE with Jellyfin and Immich",
      raid_default: "RAID-Z1",
      warranty_years: "3",
      dimensions_mm: "224 x 196 x 260",
    },
  },
  {
    handle: "hike-6",
    title: "Hike 6",
    subtitle: "Six bays and a processor with something left over.",
    description:
      "An i5-12500T with six bays. The two extra bays change the arithmetic: RAID-Z2 becomes sensible, which means two drives can fail rather than one, and a rebuild stops being the most frightening night of the year.\n\nEnough processor to run the media stack, a handful of virtual machines and a Docker host at once. This is the machine that usually replaces a small business's file server and its subscriptions in the same week.",
    type: "machine",
    categories: ["machines"],
    collections: ["plex-builds"],
    images: [PHOTO.rack, PHOTO.board, PHOTO.bench],
    options: [
      { title: "Storage", values: ["6 x 8TB", "6 x 12TB", "6 x 16TB"], exclusive: true },
      { title: "RAM", values: ["32GB", "64GB"], exclusive: false },
    ],
    variants: [
      { title: "6 x 8TB / 32GB", sku: "HIKE6-8TB-32", options: { Storage: "6 x 8TB", RAM: "32GB" }, price: 148000 },
      { title: "6 x 8TB / 64GB", sku: "HIKE6-8TB-64", options: { Storage: "6 x 8TB", RAM: "64GB" }, price: 162500 },
      { title: "6 x 12TB / 32GB", sku: "HIKE6-12TB-32", options: { Storage: "6 x 12TB", RAM: "32GB" }, price: 186000 },
      { title: "6 x 12TB / 64GB", sku: "HIKE6-12TB-64", options: { Storage: "6 x 12TB", RAM: "64GB" }, price: 200500 },
      { title: "6 x 16TB / 64GB", sku: "HIKE6-16TB-64", options: { Storage: "6 x 16TB", RAM: "64GB" }, price: 242000 },
    ],
    weight: 8200,
    metadata: {
      cpu: "Intel Core i5-12500T, 12 cores, Quick Sync",
      ram_base: "32GB DDR4 ECC, four DIMM slots",
      bays: "6 x 3.5 inch hot-swap",
      drive_form_factor: "3.5 inch SATA, 2 x M.2 NVMe",
      nic: "2 x 2.5GbE, 1 x 10GbE SFP+",
      psu_watts: "450",
      idle_watts: "38",
      noise_db: "24",
      os_preloaded: "TrueNAS SCALE or Proxmox VE",
      raid_default: "RAID-Z2",
      warranty_years: "3",
      dimensions_mm: "270 x 230 x 320",
    },
  },
  {
    handle: "summit-8",
    title: "Summit 8",
    subtitle: "Eight bays, ECC memory, 10 gigabit.",
    description:
      "Summit is for when the machine is load-bearing. Eight bays under RAID-Z2 gives six drives of usable space with two-drive redundancy, ECC memory catches the bit flips that silently corrupt an archive over a decade, and 10GbE means a video editor can work off the array rather than copying from it.\n\nA Ryzen 7 5700G with 65W of sustained load handles a dozen virtual machines. It is louder than a Flow and it is meant to live in a cupboard or a rack, not on a desk.",
    type: "machine",
    categories: ["machines"],
    collections: ["plex-builds"],
    images: [PHOTO.rack, PHOTO.bench, PHOTO.board],
    options: [
      { title: "Storage", values: ["8 x 12TB", "8 x 16TB"], exclusive: true },
      { title: "RAM", values: ["32GB", "64GB"], exclusive: false },
    ],
    variants: [
      { title: "8 x 12TB / 32GB", sku: "SUM8-12TB-32", options: { Storage: "8 x 12TB", RAM: "32GB" }, price: 264000 },
      { title: "8 x 12TB / 64GB", sku: "SUM8-12TB-64", options: { Storage: "8 x 12TB", RAM: "64GB" }, price: 281500 },
      { title: "8 x 16TB / 32GB", sku: "SUM8-16TB-32", options: { Storage: "8 x 16TB", RAM: "32GB" }, price: 328000 },
      { title: "8 x 16TB / 64GB", sku: "SUM8-16TB-64", options: { Storage: "8 x 16TB", RAM: "64GB" }, price: 345500 },
    ],
    weight: 12500,
    metadata: {
      cpu: "AMD Ryzen 7 5700G, 8 cores, 16 threads",
      ram_base: "32GB DDR4 ECC, four DIMM slots",
      bays: "8 x 3.5 inch hot-swap",
      drive_form_factor: "3.5 inch SATA and SAS, 2 x M.2 NVMe",
      nic: "2 x 10GbE SFP+, 1 x 1GbE management",
      psu_watts: "650",
      idle_watts: "52",
      noise_db: "31",
      os_preloaded: "TrueNAS SCALE or Proxmox VE",
      raid_default: "RAID-Z2",
      warranty_years: "3",
      dimensions_mm: "330 x 260 x 400",
    },
  },
]

/* -------------------------------------------------------------------------- */
/*  Parts. `fits` is the list of machine handles a part is tested in.           */
/* -------------------------------------------------------------------------- */

const ALL_MACHINES = ["flow-2", "flow-4", "hike-4", "hike-6", "summit-8"]

const PARTS: SeedProduct[] = [
  {
    handle: "ironwolf-pro-nas-drive",
    title: "Seagate IronWolf Pro",
    subtitle: "The drive we fit by default.",
    description:
      "A 7200rpm NAS drive rated for continuous operation and for sitting next to seven others without the vibration turning into errors. Five-year warranty from Seagate, honoured in India.\n\nThis is what goes into a Valy machine unless you ask for something else. Buying it here rather than in a build means you can add a bay later at the same spec.",
    type: "part",
    categories: ["parts", "storage"],
    collections: ["plex-builds"],
    images: [PHOTO.drive],
    options: [{ title: "Capacity", values: ["4TB", "8TB", "12TB", "16TB"], exclusive: false }],
    variants: [
      { title: "4TB", sku: "IWP-4TB", options: { Capacity: "4TB" }, price: 12500 },
      { title: "8TB", sku: "IWP-8TB", options: { Capacity: "8TB" }, price: 21000 },
      { title: "12TB", sku: "IWP-12TB", options: { Capacity: "12TB" }, price: 31500 },
      { title: "16TB", sku: "IWP-16TB", options: { Capacity: "16TB" }, price: 42000 },
    ],
    weight: 690,
    metadata: {
      fits: ALL_MACHINES.join(","),
      drive_form_factor: "3.5 inch SATA",
      rpm: "7200",
      cache_mb: "256",
      workload_tb_year: "300",
      noise_db: "28",
      idle_watts: "4.4",
      warranty_years: "5",
    },
  },
  {
    handle: "wd-red-plus-nas-drive",
    title: "WD Red Plus",
    subtitle: "Quieter, cooler, slower. Good in a bedroom.",
    description:
      "A 5400rpm class NAS drive. It gives up sequential speed to a 7200rpm drive and gets back several decibels and a few watts, which matters when the machine lives in the same room you sleep in.\n\nCMR, not SMR, so it rebuilds an array in reasonable time. Three-year warranty.",
    type: "part",
    categories: ["parts", "storage"],
    collections: ["starting-out"],
    images: [PHOTO.drive],
    options: [{ title: "Capacity", values: ["4TB", "6TB", "8TB"], exclusive: false }],
    variants: [
      { title: "4TB", sku: "WDRP-4TB", options: { Capacity: "4TB" }, price: 10800 },
      { title: "6TB", sku: "WDRP-6TB", options: { Capacity: "6TB" }, price: 15200 },
      { title: "8TB", sku: "WDRP-8TB", options: { Capacity: "8TB" }, price: 19500 },
    ],
    weight: 640,
    metadata: {
      fits: ALL_MACHINES.join(","),
      drive_form_factor: "3.5 inch SATA",
      rpm: "5400 class",
      cache_mb: "256",
      workload_tb_year: "180",
      noise_db: "19",
      idle_watts: "2.8",
      warranty_years: "3",
    },
  },
  {
    handle: "nvme-app-cache",
    title: "Samsung 990 EVO Plus NVMe",
    subtitle: "Where the apps and the thumbnails live.",
    description:
      "Apps, databases and photo thumbnails on spinning disks feel slow no matter how fast the array is. An NVMe in the M.2 slot moves all of it off the drives, so Immich scrolls instantly and the array stays asleep more of the day.\n\nFits every machine with an M.2 slot, which is everything except the Flow 2.",
    type: "part",
    categories: ["parts", "storage"],
    images: [PHOTO.ssd],
    options: [{ title: "Capacity", values: ["1TB", "2TB"], exclusive: false }],
    variants: [
      { title: "1TB", sku: "NVME-1TB", options: { Capacity: "1TB" }, price: 8400 },
      { title: "2TB", sku: "NVME-2TB", options: { Capacity: "2TB" }, price: 14900 },
    ],
    weight: 9,
    metadata: {
      fits: "flow-4,hike-4,hike-6,summit-8",
      drive_form_factor: "M.2 2280 NVMe",
      interface: "PCIe 4.0 x4",
      read_mb_s: "7250",
      write_mb_s: "6300",
      warranty_years: "5",
    },
  },
  {
    handle: "nvme-boot-drive",
    title: "Crucial P3 Plus NVMe",
    subtitle: "A boot drive, and nothing more.",
    description:
      "The operating system does not need a fast drive, it needs a drive that is not one of the eight you want to pull out and replace. This is the cheapest sensible way to keep the OS off the array.\n\nShipped already imaged if bought with a machine.",
    type: "part",
    categories: ["parts", "storage"],
    images: [PHOTO.ssd],
    options: [{ title: "Capacity", values: ["500GB", "1TB"], exclusive: false }],
    variants: [
      { title: "500GB", sku: "P3P-500", options: { Capacity: "500GB" }, price: 3900 },
      { title: "1TB", sku: "P3P-1TB", options: { Capacity: "1TB" }, price: 6200 },
    ],
    weight: 9,
    metadata: {
      fits: "flow-4,hike-4,hike-6,summit-8",
      drive_form_factor: "M.2 2280 NVMe",
      interface: "PCIe 4.0 x4",
      read_mb_s: "5000",
      write_mb_s: "4200",
      warranty_years: "5",
    },
  },
  {
    handle: "ddr4-sodimm",
    title: "Crucial DDR4 SODIMM",
    subtitle: "More memory is what makes a NAS feel fast.",
    description:
      "ZFS uses free memory as read cache, so on a file server memory does more for day-to-day speed than the processor does. Going from 8GB to 32GB on a Flow 4 is the cheapest upgrade with a noticeable result.\n\nFits the Flow range and the Hike 4.",
    type: "part",
    categories: ["parts", "memory"],
    images: [PHOTO.ram],
    options: [{ title: "RAM", values: ["8GB", "16GB", "32GB"], exclusive: false }],
    variants: [
      { title: "8GB", sku: "DDR4SO-8", options: { RAM: "8GB" }, price: 2400 },
      { title: "16GB", sku: "DDR4SO-16", options: { RAM: "16GB" }, price: 4300 },
      { title: "32GB", sku: "DDR4SO-32", options: { RAM: "32GB" }, price: 8100 },
    ],
    weight: 12,
    metadata: {
      fits: "flow-2,flow-4",
      form_factor: "260-pin SODIMM",
      speed: "DDR4-3200",
      voltage: "1.2V",
      ecc: "No",
      warranty_years: "Lifetime",
    },
  },
  {
    handle: "ddr5-sodimm",
    title: "Kingston Fury Impact DDR5",
    subtitle: "For the Hike 4.",
    description:
      "DDR5 SODIMM for the twelfth-generation Intel boards. Two slots, so 64GB is the ceiling on a Hike 4 and it is more than the machine will ever need for media and containers.",
    type: "part",
    categories: ["parts", "memory"],
    images: [PHOTO.ram],
    options: [{ title: "RAM", values: ["16GB", "32GB"], exclusive: false }],
    variants: [
      { title: "16GB", sku: "DDR5SO-16", options: { RAM: "16GB" }, price: 5600 },
      { title: "32GB", sku: "DDR5SO-32", options: { RAM: "32GB" }, price: 10400 },
    ],
    weight: 12,
    metadata: {
      fits: "hike-4",
      form_factor: "262-pin SODIMM",
      speed: "DDR5-5600",
      voltage: "1.1V",
      ecc: "No",
      warranty_years: "Lifetime",
    },
  },
  {
    handle: "ddr4-ecc-dimm",
    title: "Kingston Server Premier ECC DDR4",
    subtitle: "The memory that notices when it is wrong.",
    description:
      "ECC memory corrects single-bit errors instead of writing them to disk. Over ten years of an archive sitting on a machine that is always on, this is the difference between a photo that opens and a photo that does not.\n\nFor the Hike 6 and the Summit 8, which have the boards that support it.",
    type: "part",
    categories: ["parts", "memory"],
    images: [PHOTO.ram],
    options: [{ title: "RAM", values: ["16GB", "32GB"], exclusive: false }],
    variants: [
      { title: "16GB", sku: "ECC-16", options: { RAM: "16GB" }, price: 6800 },
      { title: "32GB", sku: "ECC-32", options: { RAM: "32GB" }, price: 12900 },
    ],
    weight: 22,
    metadata: {
      fits: "hike-6,summit-8",
      form_factor: "288-pin DIMM",
      speed: "DDR4-3200",
      voltage: "1.2V",
      ecc: "Yes, unbuffered",
      warranty_years: "Lifetime",
    },
  },
  {
    handle: "sfp-plus-10gbe-card",
    title: "Intel X520-DA2 10GbE",
    subtitle: "Two ports, ten gigabit each.",
    description:
      "A dual-port SFP+ card. The reason to fit one is editing video off the array rather than copying it to a laptop first: gigabit gives about 110 MB/s, this gives about 1100.\n\nNeeds a switch with SFP+ ports and a DAC cable, both of which we sell as a bundle if you ask.",
    type: "part",
    categories: ["parts", "networking"],
    images: [PHOTO.network],
    options: [],
    variants: [{ title: "Dual SFP+", sku: "X520-DA2", options: {}, price: 9800 }],
    weight: 180,
    metadata: {
      fits: "hike-6,summit-8",
      interface: "PCIe 2.0 x8",
      ports: "2 x SFP+",
      speed: "10 Gbps per port",
      idle_watts: "4.8",
      warranty_years: "1",
    },
  },
  {
    handle: "multi-gig-network-card",
    title: "Realtek 2.5GbE PCIe card",
    subtitle: "Two and a half times gigabit, on the switch you already own.",
    description:
      "2.5GbE runs over the Cat 5e already in the wall and most switches sold in the last three years support it. It is the upgrade to make before 10GbE, because it costs a tenth as much and removes the same bottleneck for anything short of video editing.",
    type: "part",
    categories: ["parts", "networking"],
    images: [PHOTO.network],
    options: [],
    variants: [{ title: "Single port", sku: "RTL-2G5", options: {}, price: 1900 }],
    weight: 90,
    metadata: {
      fits: "hike-4,hike-6,summit-8",
      interface: "PCIe 3.0 x1",
      ports: "1 x RJ45",
      speed: "2.5 Gbps",
      idle_watts: "1.9",
      warranty_years: "1",
    },
  },
  {
    handle: "arc-a310-transcode-card",
    title: "Intel Arc A310",
    subtitle: "Eight simultaneous 4K transcodes in a half-height card.",
    description:
      "If Plex or Jellyfin is the main reason the machine exists, this is the part that pays for itself. The A310's media engine handles AV1, HEVC and H.264 in hardware, which means eight streams at once on a machine whose processor stays near idle.\n\nHalf-height and single-slot, so it fits the Hike 6 and Summit 8 without a riser.",
    type: "part",
    categories: ["parts", "graphics"],
    collections: ["plex-builds"],
    images: [PHOTO.gpu],
    options: [],
    variants: [{ title: "4GB", sku: "ARC-A310", options: {}, price: 11500 }],
    weight: 320,
    metadata: {
      fits: "hike-6,summit-8",
      interface: "PCIe 4.0 x8",
      vram: "4GB GDDR6",
      psu_watts: "75 from slot, no connector",
      idle_watts: "8",
      transcode_streams_4k: "8",
      warranty_years: "3",
    },
  },
  {
    handle: "rtx-a2000-compute-card",
    title: "NVIDIA RTX A2000 12GB",
    subtitle: "For models that run on your hardware.",
    description:
      "Twelve gigabytes of memory in a 70W single-slot card, which is enough to run a mid-sized language model or a photo-tagging model locally instead of sending the library to somebody else's inference API.\n\nAlso a competent transcoder, though the Arc A310 does that job for a third of the price.",
    type: "part",
    categories: ["parts", "graphics"],
    images: [PHOTO.gpu],
    options: [],
    variants: [{ title: "12GB", sku: "RTX-A2000-12", options: {}, price: 62000 }],
    weight: 480,
    metadata: {
      fits: "hike-6,summit-8",
      interface: "PCIe 4.0 x16",
      vram: "12GB GDDR6 ECC",
      psu_watts: "70 from slot, no connector",
      idle_watts: "12",
      warranty_years: "3",
    },
  },
  {
    handle: "eight-bay-chassis",
    title: "Jonsbo N3 eight-bay chassis",
    subtitle: "The case a Summit is built in.",
    description:
      "Eight hot-swap 3.5 inch bays behind a hinged door, in a cube small enough for a shelf. Backplane included, so the drives connect with one cable rather than eight.\n\nSold on its own for people building their own machine. We stock it because the Summit is built in it and we would rather you could repair yours than replace it.",
    type: "part",
    categories: ["parts", "cases-and-power"],
    images: [PHOTO.case],
    options: [],
    variants: [{ title: "Black", sku: "JN3-BLK", options: {}, price: 16800 }],
    weight: 5400,
    metadata: {
      fits: "summit-8",
      bays: "8 x 3.5 inch hot-swap, 2 x 2.5 inch",
      drive_form_factor: "3.5 inch SATA",
      motherboard: "Mini-ITX",
      psu_watts: "SFX or SFX-L",
      dimensions_mm: "330 x 260 x 400",
      warranty_years: "2",
    },
  },
  {
    handle: "sfx-power-supply",
    title: "Corsair SF600 SFX",
    subtitle: "Small, quiet, and not the part that fails.",
    description:
      "A 600W 80 Plus Platinum supply with a fan that does not spin below about 40% load, which on a NAS is most of the day. Fully modular, so the eight-drive harness is the only thing plugged in.\n\nWe fit these in the Summit and sell them separately because a power supply is the part most worth over-specifying.",
    type: "part",
    categories: ["parts", "cases-and-power"],
    images: [PHOTO.psu],
    options: [],
    variants: [{ title: "600W", sku: "SF600", options: {}, price: 12400 }],
    weight: 1100,
    metadata: {
      fits: "summit-8",
      psu_watts: "600",
      efficiency: "80 Plus Platinum",
      form_factor: "SFX",
      noise_db: "0 below 40 percent load",
      warranty_years: "7",
    },
  },
  {
    handle: "quiet-case-fan",
    title: "Noctua NF-A12x25 fan",
    subtitle: "The reason a Valy machine is quiet.",
    description:
      "A 120mm fan with tolerances tight enough that it moves the air a cheap fan moves at half the noise. Two of these are what separate a machine you can keep in a living room from one you cannot.\n\nSix-year warranty, and they outlast the machines.",
    type: "part",
    categories: ["parts", "cases-and-power"],
    images: [PHOTO.fan],
    options: [],
    variants: [{ title: "120mm", sku: "NFA12X25", options: {}, price: 2600 }],
    weight: 180,
    metadata: {
      fits: ALL_MACHINES.join(","),
      size_mm: "120 x 120 x 25",
      airflow_cfm: "60.1",
      noise_db: "22.6",
      connector: "4-pin PWM",
      warranty_years: "6",
    },
  },
]

/* -------------------------------------------------------------------------- */
/*  Services. Also offered as add-on steps inside the configurator.             */
/* -------------------------------------------------------------------------- */

const SERVICES: SeedProduct[] = [
  {
    handle: "os-installation",
    title: "Operating system installation",
    subtitle: "TrueNAS, Proxmox or Unraid, installed and configured.",
    description:
      "We install the operating system you pick, create the storage pool at the redundancy level you asked for, set up the shares, enable snapshots, and hand the machine over with a password you change on first login.\n\nIncluded free with every machine. Buy it on its own for hardware you already have, and we do the same work over a remote session.",
    type: "service",
    categories: ["services"],
    collections: ["starting-out"],
    images: [PHOTO.service],
    options: [],
    variants: [{ title: "One machine", sku: "SVC-OS", options: {}, price: 2500 }],
    metadata: {
      duration: "About 90 minutes",
      delivery: "Preinstalled, or remote session",
      includes: "OS install, pool creation, shares, snapshot schedule, first backup",
      prerequisites: "None",
      warranty_years: "Support for 30 days after handover",
    },
  },
  {
    handle: "media-stack-setup",
    title: "Media stack setup",
    subtitle: "Plex or Jellyfin, running properly, on the first evening.",
    description:
      "Hardware transcoding turned on and verified, libraries pointed at the right folders, metadata agents configured, remote access working through your router without opening the machine to the internet, and apps signed in on the televisions and phones you name.\n\nThe difference between a media server and a folder of files is a day of configuration. This is that day.",
    type: "service",
    categories: ["services"],
    collections: ["plex-builds"],
    images: [PHOTO.service],
    options: [],
    variants: [{ title: "One library", sku: "SVC-MEDIA", options: {}, price: 3500 }],
    metadata: {
      duration: "About 2 hours",
      delivery: "Preconfigured, or remote session",
      includes: "Transcoding, libraries, metadata, remote access, client setup",
      prerequisites: "A machine with Quick Sync or a transcode card",
      warranty_years: "Support for 30 days after handover",
    },
  },
  {
    handle: "photo-library-migration",
    title: "Photo library migration",
    subtitle: "Everything out of Google Photos, with the dates intact.",
    description:
      "We export your Google Photos or iCloud library, repair the timestamps and locations that Google Takeout separates from the files, import the result into Immich, and check that the album structure and the face grouping survived.\n\nPriced per 100GB because that is what the work scales with. Most phone camera rolls are under 200GB.",
    type: "service",
    categories: ["services"],
    collections: ["starting-out"],
    images: [PHOTO.service],
    options: [],
    variants: [{ title: "Per 100GB", sku: "SVC-MIGRATE", options: {}, price: 1800 }],
    metadata: {
      duration: "2 to 5 days, mostly unattended",
      delivery: "Remote, or on the machine before it ships",
      includes: "Takeout export, EXIF repair, Immich import, album and face check",
      prerequisites: "Account access you revoke afterwards, or a drive posted to us",
      warranty_years: "Re-run free if anything is missing within 30 days",
    },
  },
  {
    handle: "handover-session",
    title: "Handover session",
    subtitle: "An hour with the person who built it.",
    description:
      "A video call covering what to do when a drive fails, how to read the alert emails, how snapshots get a deleted file back, how to add a bay, and what to check once a year.\n\nRecorded, so you can watch it again in eighteen months when the first drive actually does fail.",
    type: "service",
    categories: ["services"],
    images: [PHOTO.service],
    options: [],
    variants: [{ title: "One hour", sku: "SVC-HANDOVER", options: {}, price: 1500 }],
    metadata: {
      duration: "1 hour",
      delivery: "Video call, recorded",
      includes: "Drive replacement, alerts, snapshots, expansion, annual checks",
      prerequisites: "None",
      warranty_years: "Recording kept for 3 years",
    },
  },
]

const ALL_PRODUCTS = [...MACHINES, ...PARTS, ...SERVICES]

/* -------------------------------------------------------------------------- */

export default async function seedValyCatalogue({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  /* ---- prerequisites already in the database -------------------------- */

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  if (!salesChannels.length) {
    throw new Error("No sales channel found. Run the initial seed first.")
  }
  const salesChannelId = salesChannels[0].id

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  if (!stockLocations.length) {
    throw new Error("No stock location found. Run the initial seed first.")
  }
  const stockLocationId = stockLocations[0].id

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name", "type"],
  })
  if (!shippingProfiles.length) {
    throw new Error("No shipping profile found. Run the initial seed first.")
  }
  const shippingProfileId =
    shippingProfiles.find((p) => p.type === "default")?.id ??
    shippingProfiles[0].id

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })
  const region = regions.find((r) => r.currency_code === "inr") ?? regions[0]
  if (!region) {
    throw new Error("No region found. Create the India region first.")
  }
  logger.info(
    `Seeding into region ${region.name} (${region.currency_code}), sales channel ${salesChannelId}.`
  )

  /* ---- product types --------------------------------------------------- */

  const { data: existingTypes } = await query.graph({
    entity: "product_type",
    fields: ["id", "value"],
  })
  const typeByValue = new Map<string, string>(
    existingTypes.map((t) => [t.value, t.id])
  )

  const missingTypes = ["machine", "part", "service"].filter(
    (v) => !typeByValue.has(v)
  )
  if (missingTypes.length) {
    const { result } = await createProductTypesWorkflow(container).run({
      input: { product_types: missingTypes.map((value) => ({ value })) },
    })
    result.forEach((t) => typeByValue.set(t.value, t.id))
    logger.info(`Created product types: ${missingTypes.join(", ")}.`)
  }

  /* ---- categories ------------------------------------------------------ */

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
  })
  const categoryByHandle = new Map<string, string>(
    existingCategories.map((c) => [c.handle, c.id])
  )

  // Parents first, so children can reference them.
  for (const pass of [0, 1]) {
    const batch = CATEGORIES.filter(
      (c) => (pass === 0 ? !c.parent : !!c.parent) && !categoryByHandle.has(c.handle)
    )
    if (!batch.length) {
      continue
    }
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: batch.map((c) => ({
          name: c.name,
          handle: c.handle,
          description: c.description,
          is_active: true,
          parent_category_id: c.parent
            ? categoryByHandle.get(c.parent)
            : undefined,
        })),
      },
    })
    result.forEach((c) => categoryByHandle.set(c.handle, c.id))
    logger.info(`Created categories: ${batch.map((c) => c.handle).join(", ")}.`)
  }

  /* ---- collections ----------------------------------------------------- */

  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "handle"],
  })
  const collectionByHandle = new Map<string, string>(
    existingCollections.map((c) => [c.handle, c.id])
  )

  const missingCollections = COLLECTIONS.filter(
    (c) => !collectionByHandle.has(c.handle)
  )
  if (missingCollections.length) {
    const { result } = await createCollectionsWorkflow(container).run({
      input: {
        collections: missingCollections.map((c) => ({
          title: c.title,
          handle: c.handle,
        })),
      },
    })
    result.forEach((c) => collectionByHandle.set(c.handle, c.id))
    logger.info(
      `Created collections: ${missingCollections.map((c) => c.handle).join(", ")}.`
    )
  }

  /* ---- shared options -------------------------------------------------- */
  /*                                                                        */
  /*  Shared, non-exclusive options are what the store sidebar offers as     */
  /*  facets. Creating them once and referencing them by id is what keeps    */
  /*  "RAM: 32GB" one facet across five machines and two memory parts,       */
  /*  rather than seven unrelated options with the same name.                */

  const { data: existingOptions } = await query.graph({
    entity: "product_option",
    fields: ["id", "title", "is_exclusive", "product_id", "values.id", "values.value"],
  })

  const sharedOptionByTitle = new Map<
    string,
    { id: string; values: Map<string, string> }
  >()
  for (const opt of existingOptions) {
    if (opt.is_exclusive || opt.product_id) {
      continue
    }
    sharedOptionByTitle.set(opt.title, {
      id: opt.id,
      values: new Map((opt.values ?? []).map((v: any) => [v.value, v.id])),
    })
  }

  // Every value any product references on a shared option, so an option that
  // predates this seed (the fixture's "RAM", which only knows 2GB to 16GB)
  // gains the values the lineup needs instead of failing the variant create.
  const requiredSharedValues = new Map<string, Set<string>>()
  for (const shared of SHARED_OPTIONS) {
    requiredSharedValues.set(shared.title, new Set(shared.values))
  }
  for (const product of [...MACHINES, ...PARTS, ...SERVICES]) {
    for (const opt of product.options) {
      if (opt.exclusive) {
        continue
      }
      const set = requiredSharedValues.get(opt.title) ?? new Set<string>()
      opt.values.forEach((v) => set.add(v))
      requiredSharedValues.set(opt.title, set)
    }
  }

  for (const [title, required] of requiredSharedValues) {
    const existing = sharedOptionByTitle.get(title)

    if (!existing) {
      const { result } = await createProductOptionsWorkflow(container).run({
        input: {
          product_options: [{ title, values: [...required] }],
        },
      })
      sharedOptionByTitle.set(title, {
        id: result[0].id,
        values: new Map(
          ((result[0] as any).values ?? []).map((v: any) => [v.value, v.id])
        ),
      })
      logger.info(`Created shared option "${title}".`)
      continue
    }

    const missing = [...required].filter((v) => !existing.values.has(v))
    if (!missing.length) {
      continue
    }

    // Values must be sent as the full set — omitting one deletes it.
    const merged = [...new Set([...existing.values.keys(), ...missing])]
    await updateProductOptionsWorkflow(container).run({
      input: {
        selector: { id: existing.id },
        update: { values: merged },
      },
    })
    missing.forEach((v) => existing.values.set(v, ""))
    logger.info(`Added ${missing.join(", ")} to shared option "${title}".`)
  }

  /* ---- products -------------------------------------------------------- */

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const existingHandles = new Set(existingProducts.map((p) => p.handle))

  const toCreate = ALL_PRODUCTS.filter((p) => !existingHandles.has(p.handle))

  if (!toCreate.length) {
    logger.info("Every catalogue product already exists. Nothing to create.")
  } else {
    for (const product of toCreate) {
      // Medusa requires at least one option per product. A part with a single
      // configuration gets a product-scoped one carrying the variant's own
      // name; the storefront hides single-value pickers rather than showing a
      // control with one choice.
      if (!product.options.length) {
        product.options = [
          {
            title: "Configuration",
            values: product.variants.map((v) => v.title),
            exclusive: true,
          },
        ]
        product.variants = product.variants.map((v) => ({
          ...v,
          options: { Configuration: v.title },
        }))
      }

      const options = product.options.map((o) => {
        if (!o.exclusive) {
          const shared = sharedOptionByTitle.get(o.title)
          if (shared) {
            return { id: shared.id }
          }
        }
        // Exclusive options stay on the product, out of the global facets.
        return { title: o.title, values: o.values, is_exclusive: true }
      })

      await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: product.title,
              subtitle: product.subtitle,
              handle: product.handle,
              description: product.description,
              status: ProductStatus.PUBLISHED,
              type_id: typeByValue.get(product.type),
              collection_id: product.collections?.length
                ? collectionByHandle.get(product.collections[0])
                : undefined,
              category_ids: product.categories
                .map((h) => categoryByHandle.get(h))
                .filter(Boolean) as string[],
              shipping_profile_id: shippingProfileId,
              weight: product.weight,
              thumbnail: product.images[0],
              images: product.images.map((url) => ({ url })),
              metadata: product.metadata,
              options: options as any,
              variants: product.variants.map((v) => ({
                title: v.title,
                sku: v.sku,
                manage_inventory: true,
                allow_backorder: false,
                options: v.options,
                metadata: v.metadata,
                prices: [{ amount: v.price, currency_code: "inr" }],
              })) as any,
              sales_channels: [{ id: salesChannelId }],
            },
          ],
        },
      })
      logger.info(`Created ${product.type} "${product.title}".`)
    }
  }

  /* ---- reconcile metadata on products that already existed ------------- */
  /*                                                                        */
  /*  Specification figures are quoted in customer-facing copy — the         */
  /*  homepage FAQ states the dB(A) of each tier — so the two must not drift */
  /*  apart. Re-running this brings an existing product's metadata back in    */
  /*  line with what is declared above.                                      */

  const declaredByHandle = new Map(
    ALL_PRODUCTS.map((p) => [p.handle, p.metadata])
  )

  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata"],
  })

  for (const product of seededProducts) {
    const declared = declaredByHandle.get(product.handle)

    if (!declared) {
      continue
    }

    const current = (product.metadata ?? {}) as Record<string, unknown>
    const drifted = Object.entries(declared).some(
      ([k, v]) => String(current[k] ?? "") !== String(v)
    )

    if (!drifted) {
      continue
    }

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: product.id },
        update: { metadata: { ...current, ...declared } },
      },
    })
    logger.info(`Reconciled metadata on ${product.handle}.`)
  }

  /* ---- inventory ------------------------------------------------------- */
  /*                                                                        */
  /*  Machines are made to order and parts are stocked, so the numbers       */
  /*  differ — a storefront that shows "3 left" for a Summit would be         */
  /*  saying something false.                                                */

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.id"],
  })

  const stockBySkuPrefix = (sku?: string | null): number => {
    if (!sku) {
      return 25
    }
    if (/^(FLOW|HIKE|SUM)/.test(sku)) {
      return 12
    }
    if (/^SVC-/.test(sku)) {
      return 999
    }
    return 40
  }

  const needLevels = inventoryItems.filter(
    (i) => !(i.location_levels ?? []).length
  )

  if (needLevels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: needLevels.map((item) => ({
          location_id: stockLocationId,
          inventory_item_id: item.id,
          stocked_quantity: stockBySkuPrefix(item.sku),
        })),
      },
    })
    logger.info(`Set stock levels on ${needLevels.length} inventory items.`)
  }

  logger.info("Valy catalogue seed finished.")
}
