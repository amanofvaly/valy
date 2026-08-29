import { HttpTypes } from "@medusajs/types"

/**
 * The Valy Flow configurator: what the stages are, what they are called, and
 * what a given set of drives can actually be laid out as.
 *
 * Everything here is pure. Prices, variant ids and imagery come from Medusa and
 * are passed in; this module contributes the words and the arithmetic, so the
 * copy that explains a choice sits next to the rule that constrains it rather
 * than three components away from it.
 *
 * **Sections are named after what they do, not what they are.** A visitor
 * deciding between onboard graphics and a card is not shopping for a GPU, they
 * are deciding what happens when a television asks for a format the file is not
 * in. So the heading says "Media transcoding" and the specification says
 * "Dedicated 2GB". Every stage is written that way round.
 */

/* -------------------------------------------------------------------------- */
/*  Stages                                                                     */
/* -------------------------------------------------------------------------- */

export type FlowStageId =
  | "kit"
  | "boot"
  | "memory"
  | "storage"
  | "setup"
  | "network"
  | "transcode"

export type FlowStage = {
  id: FlowStageId
  /** The Medusa product whose variants this stage chooses between. */
  handle: string
  /**
   * The heading, in two halves. The first is the section's name and is set in
   * ink; the second continues the same sentence in muted grey. It is one
   * sentence, not a label above a title — the house style has no eyebrows.
   */
  name: string
  lede: string
  /** The line beside the picture while this stage is the one being read. */
  caption: string
  /**
   * How the picture sits in its frame. The machine's photograph is a cutout on
   * white and has to be shown whole; everything else is a photograph that
   * should fill the frame. Getting this wrong crops the top off the cabinet.
   */
  fit?: "cover" | "contain"
  /**
   * Per-variant copy, keyed by variant title. A stage whose variants need no
   * explanation — memory, where "16GB" says everything "16GB" can say —
   * leaves this empty and the rows render as a name and a price.
   */
  notes?: Record<string, string>
  /** A single-variant stage that is chosen for the visitor. */
  locked?: boolean
}

export const FLOW_STAGES: FlowStage[] = [
  {
    id: "kit",
    handle: "valy-flow",
    name: "The machine.",
    lede: "How much it can do at the same time, and how many drives it holds.",
    caption:
      "A home server built out of ordinary desktop parts, in an ordinary desktop cabinet.",
    fit: "contain",
    notes: {
      "i3 2 Bay":
        "Files, backups and a photo library, with room for two drives. The right machine if this is the first one you have owned.",
      "i5 3 Bay":
        "More cores for running several services at once, and a third bay, which is what lets a pool survive a drive failure without giving up half its capacity.",
    },
  },
  {
    id: "boot",
    handle: "flow-boot-media",
    name: "Where the system lives.",
    lede: "TrueNAS gets its own drive, so reinstalling it never touches yours.",
    caption:
      "TrueNAS SCALE, installed and updated before the machine leaves us.",
    locked: true,
    notes: {
      "TrueNAS 128GB SSD":
        "Included with every Flow. Keeping the operating system off the data drives is what lets a pool be exported from a dead machine and imported into a new one with its permissions and snapshots intact.",
    },
  },
  {
    id: "memory",
    handle: "flow-memory",
    name: "How much runs at once.",
    lede: "Every application holds memory while it runs. ZFS caches files with whatever is left.",
    caption:
      "Enough memory and the services stop taking turns with each other.",
    notes: {
      "8GB": "Comfortable for a photo library, file shares and backups.",
      "16GB":
        "The point at which a media server, an ad blocker, a VPN and a download client all stay running without competing.",
    },
  },
  {
    id: "storage",
    handle: "flow-storage-drive",
    name: "Where your files live.",
    lede: "Pick one capacity. Every drive in a Flow is the same size, because a pool is only ever as large as its smallest member.",
    caption: "The drives, and how much of them you actually get to use.",
  },
  {
    id: "setup",
    handle: "flow-setup",
    name: "Arrives ready to use.",
    lede: "Whether we build the storage pool and install the applications, or hand you a machine with TrueNAS on it and let you.",
    caption: "The applications, installed, signed in and reachable.",
    notes: {
      "Storage pool and basic apps":
        "The pool laid out the way you choose below, plus shares, snapshots and eight applications configured and checked before the machine ships.",
    },
  },
  {
    id: "network",
    handle: "flow-network",
    name: "How fast it moves.",
    lede: "The number that decides how long a large copy takes. All three are wired.",
    caption: "A file server is only as quick as the cable going into it.",
    notes: {
      "100MB":
        "About 12MB a second. Fine for streaming, slow for backing up a laptop.",
      "1GB LAN":
        "About 110MB a second, which is roughly what a single mechanical drive can supply.",
      "2.5GB LAN":
        "Worth buying if you edit files directly off the machine, or if several people pull from it at once.",
    },
  },
  {
    id: "transcode",
    handle: "flow-graphics",
    name: "Media transcoding.",
    lede: "What happens when a television asks for a format the file is not in.",
    caption:
      "Most of the time a film is sent to the screen untouched. This is for the rest of the time.",
    notes: {
      Onboard:
        "The processor's built-in Quick Sync re-encodes a stream or two while they play. Enough for one television.",
      "Dedicated 2GB":
        "A separate card that takes the work off the processor. Add it if several people watch different things at once, or if the library is largely 4K.",
    },
  },
]

export const stageById = (id: FlowStageId): FlowStage =>
  FLOW_STAGES.find((s) => s.id === id)!

/* -------------------------------------------------------------------------- */
/*  Bays                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * How many drives a base kit takes.
 *
 * Read from the variant's own metadata rather than parsed out of its title, so
 * renaming "i5 3 Bay" in admin cannot silently change the storage section's
 * arithmetic. The fallback of 2 is the smaller of the two, which fails towards
 * offering too few drives rather than selling a drive with nowhere to go.
 */
export const bayCount = (variant?: HttpTypes.StoreProductVariant): number => {
  const raw = variant?.metadata?.["data_bays"]
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 2
}

/* -------------------------------------------------------------------------- */
/*  Pool layouts                                                               */
/* -------------------------------------------------------------------------- */

export type PoolLayout = {
  id: string
  /** What TrueNAS calls it. */
  name: string
  /** Usable capacity as a multiple of one drive. */
  usable: number
  /** Drives that can fail before the pool is lost. */
  tolerates: number
  note: string
  recommended?: boolean
}

/**
 * Every layout TrueNAS will build from a set of identical drives, and what each
 * one costs in capacity.
 *
 * Deliberately not exhaustive in one respect: a two-drive mirror plus a hot
 * spare is a real three-drive layout and is left out. Against RAIDZ1 it gives
 * up half the usable space to tolerate exactly the same single failure, so on a
 * three-bay machine it is strictly the worse buy and its only effect on this
 * page would be a fourth row nobody should pick.
 */
export const poolLayouts = (drives: number): PoolLayout[] => {
  if (drives === 1) {
    return [
      {
        id: "single",
        name: "Single drive",
        usable: 1,
        tolerates: 0,
        note: "Nothing is duplicated. A drive failure is a restore from backup, so keep one.",
      },
    ]
  }

  if (drives === 2) {
    return [
      {
        id: "mirror",
        name: "Mirror",
        usable: 1,
        tolerates: 1,
        recommended: true,
        note: "Both drives hold the same data. One can fail and the machine keeps serving while you replace it.",
      },
      {
        id: "stripe",
        name: "Stripe",
        usable: 2,
        tolerates: 0,
        note: "All the space, no protection. Either drive failing loses the whole pool, not half of it.",
      },
    ]
  }

  if (drives >= 3) {
    return [
      {
        id: "raidz1",
        name: "RAIDZ1",
        usable: 2,
        tolerates: 1,
        recommended: true,
        note: "One drive's worth of capacity goes to parity. Any single drive can fail without losing anything.",
      },
      {
        id: "mirror3",
        name: "Three-way mirror",
        usable: 1,
        tolerates: 2,
        note: "All three hold the same data. Two can fail. Expensive in capacity, and the safest thing three drives can do.",
      },
      {
        id: "stripe",
        name: "Stripe",
        usable: 3,
        tolerates: 0,
        note: "All the space, no protection. Any drive failing loses the whole pool.",
      },
    ]
  }

  return []
}

/** Terabytes off a capacity label. "4TB" is 4. */
export const capacityTb = (label?: string | null): number => {
  const n = Number.parseFloat(String(label ?? "").replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

export const usableTb = (layout: PoolLayout, capacity: string | null): number =>
  layout.usable * capacityTb(capacity)

export const totalTb = (drives: number, capacity: string | null): number =>
  drives * capacityTb(capacity)

/**
 * The two caveats between a drive's label and what a file manager reports, said
 * once rather than rounded away silently.
 *
 * Drives are sold in decimal terabytes and reported by every operating system
 * in binary ones, which is where 8TB becomes 7.28TiB. And ZFS is a
 * copy-on-write filesystem that slows down markedly once a pool is close to
 * full, so the usable figures below are the pool's size, not a target to fill.
 */
export const CAPACITY_FOOTNOTE =
  "Figures are the pool's size in decimal terabytes, the way drives are sold. TrueNAS reports about 7 percent less, so an 8TB drive shows as 7.28TiB, and ZFS wants headroom, so plan on filling to around 80 percent."

/* -------------------------------------------------------------------------- */
/*  Selection                                                                  */
/* -------------------------------------------------------------------------- */

export type FlowSelection = {
  /** Variant title on `valy-flow`. */
  kit: string
  /** Variant title on `flow-memory`. */
  memory: string
  /** Variant title on `flow-storage-drive`, or null for a diskless machine. */
  driveCapacity: string | null
  /** 0 when diskless, otherwise 1 up to the kit's bay count. */
  driveCount: number
  setup: boolean
  /** A `PoolLayout` id. Only meaningful when `setup` is true. */
  pool: string | null
  /** Variant title on `flow-network`. */
  network: string
  /** Variant title on `flow-graphics`. */
  transcode: string
}

export const INITIAL_SELECTION: FlowSelection = {
  kit: "i3 2 Bay",
  memory: "8GB",
  driveCapacity: null,
  driveCount: 0,
  setup: false,
  pool: null,
  network: "100MB",
  transcode: "Onboard",
}

/**
 * The setup service builds a storage pool, so there has to be something to
 * build it out of. Offering it on a diskless machine would be selling an hour
 * of work that cannot be done.
 */
export const setupAvailable = (selection: FlowSelection): boolean =>
  selection.driveCount > 0

/**
 * Whether the configuration is finished.
 *
 * Only two things can actually be outstanding: a drive count without a
 * capacity, which the storage stage prevents, and a bought setup with no pool
 * layout chosen. Everything else has a preselected default, which is the point
 * of the pattern — the price at the top is real from the first frame.
 */
export const isComplete = (selection: FlowSelection): boolean => {
  if (selection.driveCount > 0 && !selection.driveCapacity) {
    return false
  }
  if (selection.setup && !selection.pool) {
    return false
  }
  return true
}

/* -------------------------------------------------------------------------- */
/*  Turning a selection into cart lines                                        */
/* -------------------------------------------------------------------------- */

export type FlowProducts = Record<string, HttpTypes.StoreProduct>

const variantOf = (
  products: FlowProducts,
  handle: string,
  title: string
): HttpTypes.StoreProductVariant | undefined =>
  products[handle]?.variants?.find((v) => v.title === title)

export const priceOf = (variant?: HttpTypes.StoreProductVariant): number =>
  (variant?.calculated_price?.calculated_amount as number) ?? 0

export type BuildLine = {
  variantId: string
  quantity: number
  /** What this line is for, carried into the cart so it can be grouped. */
  role: FlowStageId
  /** The label the cart shows instead of a bare variant title. */
  label: string
  unitPrice: number
}

/**
 * The build, as the line items it will become.
 *
 * A stage that resolves to an absence contributes nothing: no drives means no
 * drive line, and declining the setup means no service line. A stage that
 * resolves to a part which is physically in the machine contributes a line even
 * when it is free, so the cart reads as a complete specification rather than as
 * a list of things that happened to cost money.
 */
export const buildLines = (
  selection: FlowSelection,
  products: FlowProducts
): BuildLine[] => {
  const lines: BuildLine[] = []

  const push = (
    handle: string,
    title: string,
    role: FlowStageId,
    label: string,
    quantity = 1
  ) => {
    const variant = variantOf(products, handle, title)
    if (!variant?.id) {
      return
    }
    lines.push({
      variantId: variant.id,
      quantity,
      role,
      label,
      unitPrice: priceOf(variant),
    })
  }

  push("valy-flow", selection.kit, "kit", `Valy Flow, ${selection.kit}`)

  const boot = products["flow-boot-media"]?.variants?.[0]
  if (boot?.title) {
    push("flow-boot-media", boot.title, "boot", boot.title)
  }

  push("flow-memory", selection.memory, "memory", `${selection.memory} memory`)

  if (selection.driveCapacity && selection.driveCount > 0) {
    push(
      "flow-storage-drive",
      selection.driveCapacity,
      "storage",
      `${selection.driveCapacity} drive`,
      selection.driveCount
    )
  }

  if (selection.setup) {
    const layout = poolLayouts(selection.driveCount).find(
      (l) => l.id === selection.pool
    )
    push(
      "flow-setup",
      "Storage pool and basic apps",
      "setup",
      layout
        ? `Storage pool and basic apps, ${layout.name}`
        : "Storage pool and basic apps"
    )
  }

  push("flow-network", selection.network, "network", selection.network)
  push(
    "flow-graphics",
    selection.transcode,
    "transcode",
    selection.transcode === "Onboard"
      ? "Onboard transcoding"
      : `${selection.transcode} transcoding card`
  )

  return lines
}

export const buildTotal = (lines: BuildLine[]): number =>
  lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)

/**
 * A one-line description of the build, stored on the machine's line item so
 * the cart, the checkout summary and the order confirmation can all say what
 * was configured without re-deriving it from six sibling lines.
 */
export const buildSummary = (
  selection: FlowSelection,
  drivesLabel: string
): string => {
  const parts = [selection.kit, `${selection.memory} memory`, drivesLabel]

  if (selection.network !== "100MB") {
    parts.push(selection.network)
  }
  if (selection.transcode !== "Onboard") {
    parts.push("dedicated transcoding")
  }
  if (selection.setup) {
    const layout = poolLayouts(selection.driveCount).find(
      (l) => l.id === selection.pool
    )
    parts.push(layout ? `set up as ${layout.name}` : "set up")
  }

  return parts.filter(Boolean).join(" · ")
}

/** "2 × 4TB", or "No drives". */
export const drivesLabel = (selection: FlowSelection): string =>
  selection.driveCount > 0 && selection.driveCapacity
    ? `${selection.driveCount} × ${selection.driveCapacity}`
    : "No drives"
