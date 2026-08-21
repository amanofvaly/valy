import { HttpTypes } from "@medusajs/types"

/**
 * The spec schema, and the one place that decides how each key is worded.
 *
 * A homelab buyer scans specifications before they read anything else, so this
 * is the site's signature element rather than an afterthought at the bottom of
 * a product page. The same rows render on the lineup comparison, the machine
 * page, part pages, cart line items and the order confirmation, which is only
 * possible because the wording lives here and not in each of those templates.
 *
 * Entry in Medusa admin is the merchant's; every key is optional and a missing
 * one produces no row rather than an empty one. Order is fixed and meaningful:
 * the things a buyer decides on come first.
 */

type SpecDef = {
  /** What the row is called on screen. */
  label: string
  /** Appended to the value — units belong to the schema, not to the data. */
  unit?: string
  /** A row worth reading as prose rather than as a figure. */
  prose?: boolean
}

const SPECS: Record<string, SpecDef> = {
  /* machines */
  cpu: { label: "Processor", prose: true },
  ram_base: { label: "Memory", prose: true },
  bays: { label: "Bays", prose: true },
  drive_form_factor: { label: "Drives", prose: true },
  nic: { label: "Network", prose: true },
  os_preloaded: { label: "Preloaded", prose: true },
  raid_default: { label: "Default array", prose: true },
  psu_watts: { label: "Power supply", unit: "W" },
  idle_watts: { label: "Idle draw", unit: "W" },
  noise_db: { label: "Noise", unit: "dB(A)" },
  dimensions_mm: { label: "Dimensions", unit: "mm" },
  warranty_years: { label: "Warranty", unit: "years" },

  /* drives and storage */
  rpm: { label: "Spindle speed", unit: "rpm" },
  cache_mb: { label: "Cache", unit: "MB" },
  workload_tb_year: { label: "Rated workload", unit: "TB/year" },
  read_mb_s: { label: "Sequential read", unit: "MB/s" },
  write_mb_s: { label: "Sequential write", unit: "MB/s" },
  interface: { label: "Interface", prose: true },

  /* memory */
  form_factor: { label: "Form factor", prose: true },
  speed: { label: "Speed", prose: true },
  voltage: { label: "Voltage", prose: true },
  ecc: { label: "ECC", prose: true },

  /* cards, cases, fans */
  ports: { label: "Ports", prose: true },
  vram: { label: "Memory", prose: true },
  transcode_streams_4k: { label: "4K transcodes", prose: true },
  motherboard: { label: "Board support", prose: true },
  efficiency: { label: "Efficiency", prose: true },
  size_mm: { label: "Size", unit: "mm" },
  airflow_cfm: { label: "Airflow", unit: "CFM" },
  connector: { label: "Connector", prose: true },

  /* services */
  duration: { label: "Takes", prose: true },
  delivery: { label: "Delivered", prose: true },
  includes: { label: "Includes", prose: true },
  prerequisites: { label: "You need", prose: true },
}

/** The order rows appear in, whatever order admin happens to store them. */
const ORDER = Object.keys(SPECS)

export type SpecRow = {
  key: string
  label: string
  value: string
  prose: boolean
}

export type ProductMetadata = Record<string, unknown> | null | undefined

/**
 * `warranty_years: "3"` reads as "3 years", but `warranty_years: "Lifetime"`
 * must not read as "Lifetime years". A unit is only appended to something that
 * actually starts with a number.
 */
const withUnit = (value: string, unit?: string): string => {
  if (!unit) {
    return value
  }
  return /^[\d.]/.test(value) ? `${value} ${unit}` : value
}

export const specRows = (metadata: ProductMetadata): SpecRow[] => {
  if (!metadata) {
    return []
  }

  return ORDER.reduce<SpecRow[]>((rows, key) => {
    const raw = metadata[key]

    if (raw === null || raw === undefined || raw === "") {
      return rows
    }

    const def = SPECS[key]
    rows.push({
      key,
      label: def.label,
      value: withUnit(String(raw), def.unit),
      prose: !!def.prose,
    })
    return rows
  }, [])
}

/**
 * The handles of the machines a part is tested in. Stored as a comma-separated
 * string because Medusa's metadata is a flat JSON map and admin edits it as
 * text; parsed in one place so no template has to know that.
 */
export const fitsHandles = (metadata: ProductMetadata): string[] => {
  const raw = metadata?.["fits"]

  if (typeof raw !== "string" || !raw.trim()) {
    return []
  }

  return raw
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
}

/**
 * The three or four figures worth putting on a card in a grid, where there is
 * no room for the full block. Machines lead with capacity and quiet; parts lead
 * with whatever distinguishes one from the next in the same category.
 */
const HEADLINE_KEYS = [
  "bays",
  "cpu",
  "noise_db",
  "idle_watts",
  "rpm",
  "read_mb_s",
  "speed",
  "vram",
  "ports",
  "duration",
]

export const headlineSpecs = (
  metadata: ProductMetadata,
  limit = 3
): SpecRow[] => {
  const rows = specRows(metadata)
  const byKey = new Map(rows.map((r) => [r.key, r]))

  const picked = HEADLINE_KEYS.map((k) => byKey.get(k)).filter(
    Boolean
  ) as SpecRow[]

  return picked.slice(0, limit)
}

/**
 * Medusa's product type drives which template a product gets. An unset type —
 * the fixture product predating the lineup — falls through to the simplest
 * template rather than to an error.
 */
export type ProductKind = "machine" | "part" | "service"

export const productKind = (
  product: Pick<HttpTypes.StoreProduct, "type">
): ProductKind => {
  const value = product.type?.value

  return value === "machine" || value === "service" ? value : "part"
}
