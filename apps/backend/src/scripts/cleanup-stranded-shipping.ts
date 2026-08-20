import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// ====================================================================
// One-off cleanup. Run once per environment, then delete this file.
//
// A fulfillment set is a separate record from the stock location it hangs
// off, so deleting a location leaves the set behind with a dangling link.
// Deletes now deprovision properly, but installs that predate that fix
// still show delivery areas belonging to warehouses that no longer exist
// ("so-India Warehouse-zone" and friends).
//
// A fulfillment set with no live stock location can never serve an order,
// so every one of them is removed along with its zones and options.
//
//   pnpm exec medusa exec ./src/scripts/cleanup-stranded-shipping.ts
// ====================================================================

export default async function cleanupStrandedShipping({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any
  const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any

  // Every set reachable from a live location is one to keep.
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "fulfillment_sets.id"],
  })

  const reachable = new Set<string>(
    (locations ?? []).flatMap((loc: any) =>
      (loc?.fulfillment_sets ?? [])
        .filter((fs: any) => fs?.id)
        .map((fs: any) => fs.id)
    )
  )

  logger.info(
    `[cleanup] ${locations?.length ?? 0} live location(s), ` +
      `${reachable.size} fulfillment set(s) still attached to one`
  )

  const allSets = await fulfillmentService.listFulfillmentSets({})
  const stranded = (allSets ?? []).filter((s: any) => !reachable.has(s.id))

  if (!stranded.length) {
    logger.info("[cleanup] Nothing stranded. No changes made.")
    return
  }

  for (const set of stranded) {
    const zones = await fulfillmentService.listServiceZones({
      fulfillment_set_id: set.id,
    })

    const optionCounts: number[] = []
    for (const zone of zones ?? []) {
      const options = await fulfillmentService.listShippingOptions({
        service_zone_id: zone.id,
      })
      optionCounts.push(options?.length ?? 0)
    }

    logger.info(
      `[cleanup] Removing "${set.name}" (${set.id}) — ` +
        `${zones?.length ?? 0} zone(s), ` +
        `${optionCounts.reduce((a, b) => a + b, 0)} option(s)`
    )

    // Deleting the set cascades to its zones and their options.
    await fulfillmentService.deleteFulfillmentSets([set.id])
  }

  logger.info(`[cleanup] Removed ${stranded.length} stranded fulfillment set(s).`)
}
