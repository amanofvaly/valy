/**
 * Creates the Valy Flow catalogue on a running Medusa backend.
 *
 * This is not a seed. Seeds make sample data you can throw away and regenerate;
 * these are the real SKUs the store sells, with the prices customers pay, and
 * this script is simply how they get into Medusa without seven products being
 * typed into admin by hand twice — once locally and once in production.
 *
 * It goes through the admin API rather than the database for two reasons. The
 * production database is not reachable from a developer machine: it sits behind
 * the TrueNAS host with credentials managed inside Portainer, while the admin
 * API is reachable through the Cloudflare tunnel at api.valy.in. And every
 * write is then validated by the deployed backend against its own schema, so a
 * repository that has moved ahead of the running image cannot half-apply a
 * migration's worth of assumptions.
 *
 * The same script does local development by pointing at localhost:9000, which
 * is why there is one of these rather than one per environment.
 *
 * Usage, from apps/backend. It goes through the repository's own ts-node rather
 * than node's type stripping, because node resolves a `.ts` file as ESM and
 * would need an extension on the import that `tsc` then rejects:
 *
 *   ./node_modules/.bin/ts-node --swc src/scripts/create-valy-flow.ts \
 *     --url https://api.valy.in --key sk_...
 *
 *   ./node_modules/.bin/ts-node --swc src/scripts/create-valy-flow.ts \
 *     --url http://localhost:9000 --key sk_...
 *
 * Add --dry-run to print the plan without writing anything.
 *
 * The key is a Medusa secret admin API key, sent as HTTP basic auth with an
 * empty password, which is what the admin API expects. It is read from
 * MEDUSA_ADMIN_KEY or --key and is never written anywhere by this script.
 *
 * Safe to re-run, and re-running is the point: a missing product is created, an
 * existing one has its copy, prices, images, metadata and categories brought
 * back in line with `valy-flow-catalogue.ts`. Nothing is duplicated.
 */

import {
  FLOW_CATALOGUE,
  FlowProduct,
  SUPERSEDED_HANDLES,
} from "./valy-flow-catalogue"

/* -------------------------------------------------------------------------- */
/*  Arguments                                                                  */
/* -------------------------------------------------------------------------- */

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? undefined : process.argv[i + 1]
}

const BASE = (
  arg("url") ??
  process.env.MEDUSA_ADMIN_URL ??
  "http://localhost:9000"
).replace(/\/$/, "")

const KEY = arg("key") ?? process.env.MEDUSA_ADMIN_KEY

const DRY = process.argv.includes("--dry-run")

if (!KEY) {
  console.error(
    "No admin key. Pass --key sk_... or set MEDUSA_ADMIN_KEY.\n" +
      "This must be a secret admin API key, not a publishable one."
  )
  process.exit(1)
}

/* -------------------------------------------------------------------------- */
/*  Transport                                                                  */
/* -------------------------------------------------------------------------- */

const AUTH = `Basic ${Buffer.from(`${KEY}:`).toString("base64")}`

async function api<T = any>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: AUTH,
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  })

  const text = await res.text()

  if (!res.ok) {
    // The admin API returns its reason in the body; a bare status code here
    // costs a round of guessing about which field the schema rejected.
    throw new Error(
      `${init.method ?? "GET"} ${path} -> ${res.status}\n${text.slice(0, 800)}`
    )
  }

  return text ? JSON.parse(text) : ({} as T)
}

/** Collects every page of a list endpoint. */
async function listAll<T = any>(path: string, key: string): Promise<T[]> {
  const out: T[] = []
  const sep = path.includes("?") ? "&" : "?"
  let offset = 0

  for (;;) {
    const page = await api(`${path}${sep}limit=100&offset=${offset}`)
    const rows = page[key] ?? []
    out.push(...rows)
    offset += rows.length
    if (!rows.length || out.length >= (page.count ?? out.length)) {
      return out
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Payload                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * One product-scoped, exclusive option per product, always exclusive. A shared
 * option would put "Boot media" and "Link speed" into the store's facet
 * sidebar, which is a filter nobody browsing a catalogue wants — these are
 * steps in one machine's configuration, not dimensions of the catalogue.
 */
const productBody = (
  product: FlowProduct,
  ids: {
    typeId?: string
    categoryIds: string[]
    salesChannelId: string
    shippingProfileId: string
  }
) => ({
  title: product.title,
  subtitle: product.subtitle,
  handle: product.handle,
  description: product.description,
  status: "published",
  type_id: ids.typeId,
  // The admin API takes categories as objects; only the workflow input the
  // local seed uses accepts a bare `category_ids` array.
  categories: ids.categoryIds.map((id) => ({ id })),
  shipping_profile_id: ids.shippingProfileId,
  weight: product.weight,
  thumbnail: product.images[0],
  images: product.images.map((url) => ({ url })),
  metadata: product.metadata,
  options: [
    {
      title: product.optionTitle,
      values: product.variants.map((v) => v.title),
      is_exclusive: true,
    },
  ],
  variants: product.variants.map((v) => ({
    title: v.title,
    sku: v.sku,
    manage_inventory: true,
    allow_backorder: false,
    weight: v.weight,
    options: { [product.optionTitle]: v.title },
    metadata: v.metadata,
    prices: [{ amount: v.price, currency_code: "inr" }],
  })),
  sales_channels: [{ id: ids.salesChannelId }],
})

/* -------------------------------------------------------------------------- */
/*  Run                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log(`Target: ${BASE}${DRY ? "  (dry run)" : ""}`)

  /* ---- prerequisites, all read ----------------------------------------- */

  const [channels, locations, profiles, regions, categories, types] =
    await Promise.all([
      listAll("/admin/sales-channels", "sales_channels"),
      listAll("/admin/stock-locations", "stock_locations"),
      listAll("/admin/shipping-profiles", "shipping_profiles"),
      listAll("/admin/regions", "regions"),
      listAll("/admin/product-categories", "product_categories"),
      listAll("/admin/product-types", "product_types"),
    ])

  if (!channels.length) throw new Error("No sales channel on the target.")
  if (!locations.length) throw new Error("No stock location on the target.")
  if (!profiles.length) throw new Error("No shipping profile on the target.")
  if (!regions.some((r: any) => r.currency_code === "inr")) {
    throw new Error("No INR region on the target. Create India first.")
  }

  const salesChannelId = channels[0].id
  const stockLocationId = locations[0].id
  const shippingProfileId =
    profiles.find((p: any) => p.type === "default")?.id ?? profiles[0].id

  const categoryByHandle = new Map<string, string>(
    categories.map((c: any) => [c.handle, c.id])
  )
  const typeByValue = new Map<string, string>(
    types.map((t: any) => [t.value, t.id])
  )

  for (const value of ["machine", "part", "service"]) {
    if (typeByValue.has(value)) {
      continue
    }
    if (DRY) {
      console.log(`  would create product type "${value}"`)
      continue
    }
    const { product_type } = await api("/admin/product-types", {
      method: "POST",
      body: { value },
    })
    typeByValue.set(value, product_type.id)
    console.log(`  created product type "${value}"`)
  }

  /* ---- products -------------------------------------------------------- */

  const existing = await listAll(
    "/admin/products?fields=id,handle,status",
    "products"
  )
  const existingByHandle = new Map<string, any>(
    existing.map((p: any) => [p.handle, p])
  )

  for (const product of FLOW_CATALOGUE) {
    const ids = {
      typeId: typeByValue.get(product.type),
      categoryIds: product.categories
        .map((h) => categoryByHandle.get(h))
        .filter(Boolean) as string[],
      salesChannelId,
      shippingProfileId,
    }

    const found = existingByHandle.get(product.handle)

    if (!found) {
      if (DRY) {
        console.log(`  would create ${product.type} "${product.title}"`)
        continue
      }
      await api("/admin/products", {
        method: "POST",
        body: productBody(product, ids),
      })
      console.log(`  created ${product.type} "${product.title}"`)
      continue
    }

    /*
     * An existing product keeps its variants — rewriting them would orphan the
     * inventory items and the price rows behind them — but the fields the
     * storefront reads are brought back in line. `configurator: "flow"` in
     * particular is what keeps a component out of the store listing, and a
     * product that quietly lost it would reappear in the catalogue as an
     * unbranded drive with no specification.
     */
    if (DRY) {
      console.log(`  would reconcile "${product.title}"`)
      continue
    }
    await api(`/admin/products/${found.id}`, {
      method: "POST",
      body: {
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        status: "published",
        metadata: product.metadata,
        thumbnail: product.images[0],
        images: product.images.map((url) => ({ url })),
        // Sent on every run, including as an empty list. Category membership
        // is what decides whether a product shows up in the catalogue, so a
        // component that was created in one before the rule existed has to be
        // taken back out rather than merely not added again.
        categories: ids.categoryIds.map((id) => ({ id })),
      },
    })
    console.log(`  reconciled "${product.title}"`)
  }

  /* ---- retire the bundled Flow SKUs ------------------------------------ */

  for (const handle of SUPERSEDED_HANDLES) {
    const found = existingByHandle.get(handle)
    // Already drafted is the steady state, and this runs on every push, so
    // skipping it keeps a re-run from emitting a `product.updated` per SKU.
    if (!found || found.status === "draft") {
      continue
    }
    if (DRY) {
      console.log(`  would move ${handle} to draft`)
      continue
    }
    await api(`/admin/products/${found.id}`, {
      method: "POST",
      body: { status: "draft" },
    })
    console.log(`  moved ${handle} to draft — superseded by valy-flow`)
  }

  /* ---- inventory ------------------------------------------------------- */

  if (!DRY) {
    const items = await listAll<any>(
      "/admin/inventory-items?fields=id,sku,*location_levels",
      "inventory_items"
    )

    const stockFor = (sku?: string | null): number => {
      if (sku === "VFLOW-SETUP") return 999
      return /^VFLOW-I[35]-/.test(sku ?? "") ? 12 : 40
    }

    let set = 0
    for (const item of items) {
      if (!item.sku?.startsWith("VFLOW-")) {
        continue
      }
      if ((item.location_levels ?? []).length) {
        continue
      }
      await api(`/admin/inventory-items/${item.id}/location-levels`, {
        method: "POST",
        body: {
          location_id: stockLocationId,
          stocked_quantity: stockFor(item.sku),
        },
      })
      set++
    }
    if (set) {
      console.log(`  set stock levels on ${set} inventory items`)
    }
  }

  console.log("Done.")
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
