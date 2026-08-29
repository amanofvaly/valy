import { HttpTypes } from "@medusajs/types"

/**
 * Reassembling a configured machine out of the line items it was added as.
 *
 * A Valy Flow build is six or seven line items — the machine, its boot drive,
 * memory, drives, network, transcoding and setup — because that is the only way
 * to sell a machine with seven decisions in it without a variant matrix nobody
 * can maintain. See `valy-flow-catalogue.ts` for that argument.
 *
 * The cost of that decision lands here: a cart showing seven rows for one
 * machine is a cart that looks like a mistake. Every line carries the same
 * `build_id` in its metadata, so this puts them back together into one thing
 * with a specification under it, and every surface that lists a cart — the cart
 * page, the checkout summary — renders groups rather than raw items.
 *
 * The lead line is the machine. It is identified by `build_role: "kit"` rather
 * than by position, because Medusa returns line items in no guaranteed order
 * and the group's title, thumbnail and link all come off it.
 */

export type CartLine = HttpTypes.StoreCartLineItem

const meta = (item: CartLine, key: string): string | undefined => {
  const value = item.metadata?.[key]
  return typeof value === "string" ? value : undefined
}

export const buildIdOf = (item: CartLine) => meta(item, "build_id")

export type CartGroup =
  | {
      kind: "build"
      id: string
      /** The machine line. Carries the title, thumbnail and handle. */
      lead: CartLine
      /** Everything that was configured onto it, lead excluded. */
      parts: CartLine[]
      /** Every line in the build, lead included, in configuration order. */
      lines: CartLine[]
      /** Gross, matching the tax-inclusive figures the summary adds up. */
      total: number
      /** "i5 3 Bay · 16GB memory · 3 × 4TB · set up as RAIDZ1" */
      summary?: string
    }
  | { kind: "item"; id: string; item: CartLine }

/** Configuration order, so the group reads the way the page was filled in. */
const ROLE_ORDER = [
  "kit",
  "boot",
  "memory",
  "storage",
  "setup",
  "network",
  "transcode",
]

const roleRank = (item: CartLine) => {
  const index = ROLE_ORDER.indexOf(meta(item, "build_role") ?? "")
  return index === -1 ? ROLE_ORDER.length : index
}

/**
 * Cart lines as they should be displayed: builds collapsed, everything else
 * left alone.
 *
 * Groups take the position of their newest line, so a machine configured after
 * a drive was added still sorts above it. Ordinary items keep the existing
 * newest-first order.
 */
export const groupCartLines = (items?: CartLine[] | null): CartGroup[] => {
  const sorted = [...(items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  const groups: CartGroup[] = []
  const byBuild = new Map<string, Extract<CartGroup, { kind: "build" }>>()

  for (const item of sorted) {
    const buildId = buildIdOf(item)

    if (!buildId) {
      groups.push({ kind: "item", id: item.id, item })
      continue
    }

    const existing = byBuild.get(buildId)

    if (existing) {
      existing.lines.push(item)
      continue
    }

    const group: Extract<CartGroup, { kind: "build" }> = {
      kind: "build",
      id: buildId,
      lead: item,
      parts: [],
      lines: [item],
      total: 0,
    }
    byBuild.set(buildId, group)
    groups.push(group)
  }

  /*
   * A second pass, because the lead is not necessarily the first line to
   * arrive and the totals cannot be summed until every line is in.
   */
  for (const group of Array.from(byBuild.values())) {
    group.lines.sort((a, b) => roleRank(a) - roleRank(b))
    group.lead =
      group.lines.find((l) => meta(l, "build_role") === "kit") ?? group.lines[0]
    group.parts = group.lines.filter((l) => l.id !== group.lead.id)
    group.total = group.lines.reduce((sum, l) => sum + (l.total ?? 0), 0)
    group.summary = meta(group.lead, "build_summary")
  }

  return groups
}

/** The label the configurator stored, falling back to the variant's own name. */
export const lineLabel = (item: CartLine): string =>
  meta(item, "build_label") ??
  item.variant?.title ??
  item.product_title ??
  "Component"

/**
 * How many things are in the cart, counting a configured machine as one.
 *
 * Two different counts used to be on screen at the same time — the cart heading
 * summed quantities and the summary counted line items — which for a build of
 * seven lines holding nine units reads as "9 items" above "Subtotal (7 items)"
 * for a purchase that is one machine. A build is one thing however many parts
 * it was assembled from, and an ordinary line still counts its quantity.
 */
export const cartItemCount = (items?: CartLine[] | null): number =>
  groupCartLines(items).reduce(
    (n, group) => n + (group.kind === "build" ? 1 : group.item.quantity),
    0
  )
