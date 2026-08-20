import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { deleteShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Removes shipping options that can never complete a checkout.
 *
 * A store seeded for one market and then repointed at another keeps the old
 * market's options: they still show at checkout, render without a price, and
 * fail with "do not have a price" when selected. Same for options whose
 * fulfillment provider is no longer registered in medusa-config.ts.
 *
 * Deleting merchant data is not something to do behind someone's back, so this
 * reports by default and only acts when explicitly asked:
 *
 *   npx medusa exec ./src/scripts/cleanup-unusable-shipping-options.ts
 *   npx medusa exec ./src/scripts/cleanup-unusable-shipping-options.ts --apply
 *
 * The same findings appear in the admin dashboard under
 * Shipping Orchestrator -> Setup.
 */
export default async function cleanupUnusableShippingOptions({
  container,
  args,
}: {
  container: MedusaContainer
  args?: string[]
}) {
  const apply = (args ?? []).includes("--apply")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  })
  const regionCurrencies = new Set<string>(
    (regions ?? []).map((r: any) => String(r.currency_code).toLowerCase())
  )

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "provider_id",
      "prices.currency_code",
    ],
  })

  const providers = await fulfillmentService.listFulfillmentProviders({})
  const enabledProviderIds = new Set(
    providers.filter((p: any) => p.is_enabled).map((p: any) => p.id)
  )

  const unusable: Array<{ id: string; name: string; reason: string }> = []

  for (const o of options ?? []) {
    if (!enabledProviderIds.has(o.provider_id)) {
      unusable.push({
        id: o.id,
        name: o.name,
        reason: `fulfillment provider "${o.provider_id}" is not registered`,
      })
      continue
    }

    if (o.price_type !== "flat") {
      continue
    }

    const priced = new Set(
      ((o as any).prices ?? []).map((p: any) =>
        String(p.currency_code).toLowerCase()
      )
    )
    const missing = [...regionCurrencies].filter((c) => !priced.has(c))
    if (missing.length && missing.length === regionCurrencies.size) {
      // Priced in no region currency at all — unusable everywhere.
      unusable.push({
        id: o.id,
        name: o.name,
        reason: `no price in any store currency (has ${
          [...priced].join(", ") || "none"
        }, needs ${[...regionCurrencies].join(", ")})`,
      })
    }
  }

  if (!unusable.length) {
    logger.info("[cleanup] No unusable shipping options found.")
    return
  }

  for (const u of unusable) {
    logger.info(`[cleanup] ${u.name} (${u.id}) — ${u.reason}`)
  }

  if (!apply) {
    logger.info(
      `[cleanup] ${unusable.length} option(s) would be deleted. Re-run with --apply to delete them.`
    )
    return
  }

  await deleteShippingOptionsWorkflow(container).run({
    input: { ids: unusable.map((u) => u.id) },
  })

  logger.info(`[cleanup] Deleted ${unusable.length} shipping option(s).`)
}
