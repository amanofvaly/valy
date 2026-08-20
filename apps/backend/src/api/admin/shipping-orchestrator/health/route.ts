import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  SHIPPING_ORCHESTRATOR_MODULE,
  SHIPPING_ORCHESTRATOR_PROVIDER_ID,
} from "../../../../modules/shipping-orchestrator"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator/health
//
// A first deploy has an empty database. That is *missing*, not *broken*, and
// the difference has to be visible: this endpoint enumerates every gap that
// would stop a real customer from checking out, says which screen fixes it,
// and separates "you have not set this up yet" from "this is misconfigured and
// will fail".
// ------------------------------------------------------------------

type Level = "error" | "warning" | "ok"

type Check = {
  id: string
  level: Level
  title: string
  detail: string
  /** What the admin should actually do next. */
  action?: string
  /** Tab on the Shipping Orchestrator screen that fixes it. */
  tab?: string
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT) as any

  const checks: Check[] = []
  const add = (c: Check) => checks.push(c)

  // ----------------------------------------------------------------
  // Settings + warehouses
  // ----------------------------------------------------------------
  const settings = await svc.getActiveSettings()
  const warehouses = await svc.listSoWarehouses()
  const boxConfigs = await svc.listBoxConfigs()

  if (!warehouses.length) {
    add({
      id: "warehouse.missing",
      level: "error",
      title: "No pickup warehouse",
      detail:
        "Rates are quoted from a pickup pincode. Without a warehouse every calculated shipping option is unavailable at checkout.",
      action: "Add a warehouse with its pincode.",
      tab: "warehouses",
    })
  } else {
    const noPincode = warehouses.filter((w: any) => !w.pincode)
    if (noPincode.length) {
      add({
        id: "warehouse.no_pincode",
        level: "error",
        title: "Warehouse missing a pincode",
        detail: `${noPincode
          .map((w: any) => w.name)
          .join(", ")} has no pincode, so no rate can be requested for it.`,
        action: "Set the pincode on each warehouse.",
        tab: "warehouses",
      })
    }

    const primaries = warehouses.filter((w: any) => w.is_primary)
    if (primaries.length === 0) {
      add({
        id: "warehouse.no_primary",
        level: "warning",
        title: "No primary warehouse",
        detail:
          "Orders will ship from whichever warehouse was created first, which may not be the one you intend.",
        action: "Mark one warehouse as primary.",
        tab: "warehouses",
      })
    } else if (primaries.length > 1) {
      add({
        id: "warehouse.multiple_primary",
        level: "warning",
        title: "More than one primary warehouse",
        detail: `${primaries.length} warehouses are marked primary; only the first is used as the origin.`,
        action: "Keep exactly one primary warehouse.",
        tab: "warehouses",
      })
    }
  }

  // ----------------------------------------------------------------
  // Carrier credentials / fallback
  // ----------------------------------------------------------------
  // `getActiveSettings` returns the raw row (real password); the admin-facing
  // `getSettingsForAdmin` swaps it for a boolean flag. Accept either shape so
  // this check does not depend on which one it was handed.
  const api = (settings.api_settings as Record<string, any>) || {}
  const hasCreds = Boolean(
    api.shiprocket_email &&
      (api.shiprocket_password || api.has_shiprocket_password)
  )
  const fallbackOn =
    settings.fallback_enabled !== false &&
    Number(settings.fallback_rate_per_500g) > 0

  if (settings.active_provider === "shiprocket" && !hasCreds) {
    add({
      id: "carrier.no_credentials",
      level: fallbackOn ? "warning" : "error",
      title: "Shiprocket account not connected",
      detail: fallbackOn
        ? `Live rates are unavailable, so every quote falls back to the slab rate of ${settings.fallback_rate_per_500g} per 500g.`
        : "Live rates are unavailable and no fallback slab is configured, so calculated shipping options will not price at all.",
      action: fallbackOn
        ? "Connect Shiprocket to quote real carrier rates."
        : "Connect Shiprocket, or enable the fallback slab rate.",
      tab: "engine",
    })
  }

  if (!fallbackOn) {
    add({
      id: "carrier.no_fallback",
      level: "warning",
      title: "No fallback rate configured",
      detail:
        "If the carrier API is unreachable, shipping options become unavailable rather than falling back to a slab rate.",
      action:
        "Set a fallback rate per 500g so a carrier outage does not block checkout.",
      tab: "engine",
    })
  }

  if (!boxConfigs.length) {
    add({
      id: "boxes.missing",
      level: "warning",
      title: "No box sizes configured",
      detail:
        "Volumetric weight is estimated from raw item dimensions instead of real cartons, which usually under-quotes bulky orders.",
      action: "Add the carton sizes you actually ship in.",
      tab: "engine",
    })
  }

  // ----------------------------------------------------------------
  // Product weights — the single biggest source of wrong rates
  // ----------------------------------------------------------------
  // Carriers bill on chargeable weight. A variant with no weight silently
  // falls back to `fallback_weight_grams`, so the quote is priced for an
  // invented parcel. Nothing errors; the merchant simply over- or under-pays
  // on every order until real weights are entered.
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "weight", "product.title", "product.status"],
  })

  const liveVariants = (variants ?? []).filter(
    (v: any) => v.product?.status === "published"
  )
  const weightless = liveVariants.filter((v: any) => !v.weight)

  if (liveVariants.length && weightless.length) {
    const sample = weightless
      .slice(0, 3)
      .map((v: any) => `${v.product?.title} / ${v.title}`)
      .join(", ")

    add({
      id: "products.no_weight",
      level: weightless.length === liveVariants.length ? "error" : "warning",
      title: "Products have no shipping weight",
      detail:
        `${weightless.length} of ${liveVariants.length} live variants have no weight, ` +
        `so they are quoted at the ${settings.fallback_weight_grams}g fallback instead of what they actually weigh ` +
        `(${sample}${weightless.length > 3 ? ", …" : ""}).`,
      action:
        "Set a weight on each variant. Until then every shipping quote is priced for a parcel that does not exist.",
    })
  }

  // ----------------------------------------------------------------
  // Regions and currencies
  // ----------------------------------------------------------------
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.iso_2"],
  })

  const regionCurrencies = new Set<string>(
    (regions ?? []).map((r: any) => String(r.currency_code).toLowerCase())
  )

  // ----------------------------------------------------------------
  // Shipping options
  // ----------------------------------------------------------------
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "provider_id",
      "data",
      "prices.currency_code",
      "prices.amount",
      "service_zone.id",
      "service_zone.name",
      "service_zone.geo_zones.country_code",
      "service_zone.fulfillment_set.id",
      "service_zone.fulfillment_set.name",
      "service_zone.fulfillment_set.type",
    ],
  })

  const providers = await fulfillmentService.listFulfillmentProviders({})
  const enabledProviderIds = new Set(
    providers.filter((p: any) => p.is_enabled).map((p: any) => p.id)
  )

  const extensions = await svc.listShippingOptionExtensions()
  const extensionByNativeId = new Map(
    extensions.map((e: any) => [e.native_option_id, e])
  )

  const orphanedProvider: string[] = []
  const missingPrice: string[] = []
  const missingZone: string[] = []
  const missingExtension: string[] = []
  const disabledTier: string[] = []

  for (const o of options ?? []) {
    if (!enabledProviderIds.has(o.provider_id)) {
      orphanedProvider.push(`${o.name} (${o.provider_id})`)
      continue
    }

    if (!o.service_zone?.geo_zones?.length) {
      missingZone.push(o.name)
    }

    if (o.price_type === "flat") {
      const priced = new Set(
        (o.prices ?? []).map((p: any) => String(p.currency_code).toLowerCase())
      )
      const unpriced = [...regionCurrencies].filter((c) => !priced.has(c))
      if (unpriced.length) {
        missingPrice.push(`${o.name} (no ${unpriced.join(", ").toUpperCase()} price)`)
      }
    }

    if (o.provider_id === SHIPPING_ORCHESTRATOR_PROVIDER_ID) {
      if (!extensionByNativeId.has(o.id)) {
        missingExtension.push(o.name)
      }
      const tier = (o.data as any)?.tier
      if (tier === "hyperlocal" && !settings.hyperlocal_enabled) {
        disabledTier.push(o.name)
      }
    }
  }

  if (orphanedProvider.length) {
    add({
      id: "options.disabled_provider",
      level: "error",
      title: "Shipping options belong to a disabled provider",
      detail: `${orphanedProvider.join(
        ", "
      )} still appear at checkout but their fulfillment provider is not registered in medusa-config.ts, so they can never be fulfilled.`,
      action:
        "Delete these options, or re-register their provider in medusa-config.ts.",
      tab: "shipping-options",
    })
  }

  if (missingPrice.length) {
    add({
      id: "options.missing_price",
      level: "error",
      title: "Flat-rate options have no price in your store currency",
      detail: `${missingPrice.join(
        ", "
      )}. Selecting one at checkout fails with "do not have a price".`,
      action:
        "Add a price in every region currency, or remove the option if it is left over from seed data.",
      tab: "shipping-options",
    })
  }

  if (missingZone.length) {
    add({
      id: "options.no_geo_zone",
      level: "error",
      title: "Shipping options with no delivery area",
      detail: `${missingZone.join(
        ", "
      )} belong to a service zone that covers no country, so they never appear at checkout.`,
      action: "Add at least one country to the service zone.",
      tab: "shipping-options",
    })
  }

  if (missingExtension.length) {
    add({
      id: "options.missing_extension",
      level: "warning",
      title: "Orchestrator options without settings",
      detail: `${missingExtension.join(
        ", "
      )} have no orchestrator record, so per-option surcharges and courier masking do not apply.`,
      action: 'Run "Reconcile Now" to link them.',
      tab: "shipping-options",
    })
  }

  if (disabledTier.length) {
    add({
      id: "options.hyperlocal_disabled",
      level: "warning",
      title: "Local delivery option is switched off",
      detail: `${disabledTier.join(
        ", "
      )} is offered at checkout but local delivery is disabled, so it always shows as unavailable.`,
      action: "Enable local delivery under Pricing, or remove the option.",
      tab: "pricing",
    })
  }

  // ----------------------------------------------------------------
  // Duplicate delivery areas — the cause of near-duplicate checkout rows
  // ----------------------------------------------------------------
  const countryToSets = new Map<string, Set<string>>()
  for (const o of options ?? []) {
    const setName = o.service_zone?.fulfillment_set?.name
    if (!setName) continue
    for (const gz of o.service_zone?.geo_zones ?? []) {
      const key = String(gz.country_code).toLowerCase()
      if (!countryToSets.has(key)) countryToSets.set(key, new Set())
      countryToSets.get(key)!.add(setName)
    }
  }
  const overlapping = [...countryToSets.entries()].filter(
    ([, sets]) => sets.size > 1
  )
  if (overlapping.length) {
    add({
      id: "zones.overlapping",
      level: "warning",
      title: "More than one delivery area covers the same country",
      detail: overlapping
        .map(
          ([country, sets]) =>
            `${country.toUpperCase()}: ${[...sets].join(" + ")}`
        )
        .join("; "),
      action:
        "Customers see the options from every matching area at once. Remove the area you are not using.",
      tab: "shipping-options",
    })
  }

  // ----------------------------------------------------------------
  // Every region needs at least one usable option
  // ----------------------------------------------------------------
  const coveredCountries = new Set<string>(
    (options ?? [])
      .filter((o: any) => enabledProviderIds.has(o.provider_id))
      .flatMap((o: any) =>
        (o.service_zone?.geo_zones ?? []).map((g: any) =>
          String(g.country_code).toLowerCase()
        )
      )
  )

  const uncovered = (regions ?? []).filter((r: any) =>
    (r.countries ?? []).every(
      (c: any) => !coveredCountries.has(String(c.iso_2).toLowerCase())
    )
  )

  if (uncovered.length) {
    add({
      id: "regions.uncovered",
      level: "error",
      title: "Regions with no shipping options",
      detail: `${uncovered
        .map((r: any) => r.name)
        .join(", ")} has no delivery area covering any of its countries.`,
      action: "Add a service zone that covers this region's countries.",
      tab: "shipping-options",
    })
  }

  // ----------------------------------------------------------------
  // Stock location wiring — options only surface via the sales channel
  // ----------------------------------------------------------------
  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "stock_locations.id", "stock_locations.fulfillment_sets.id"],
  })

  const reachableSets = new Set<string>(
    (salesChannels ?? []).flatMap((sc: any) =>
      (sc.stock_locations ?? []).flatMap((sl: any) =>
        (sl.fulfillment_sets ?? []).map((fs: any) => fs.id)
      )
    )
  )

  const unreachable = [
    ...new Set(
      (options ?? [])
        .filter(
          (o: any) =>
            o.service_zone?.fulfillment_set?.id &&
            !reachableSets.has(o.service_zone.fulfillment_set.id)
        )
        .map((o: any) => o.service_zone.fulfillment_set.name)
    ),
  ]

  if (unreachable.length) {
    add({
      id: "zones.unreachable",
      level: "error",
      title: "Delivery areas not reachable from any sales channel",
      detail: `${unreachable.join(
        ", "
      )} is not linked to a stock location in any sales channel, so its options never reach checkout.`,
      action:
        "Link the fulfillment set's stock location to your sales channel under Settings → Locations.",
      tab: "warehouses",
    })
  }

  const errors = checks.filter((c) => c.level === "error").length
  const warnings = checks.filter((c) => c.level === "warning").length

  res.json({
    status: errors ? "error" : warnings ? "warning" : "ok",
    summary: {
      errors,
      warnings,
      checkout_ready: errors === 0,
    },
    checks,
  })
}
