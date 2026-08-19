import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { reconcileShippingOrchestratorWorkflow } from "../workflows/reconcile-shipping-orchestrator"

export default async function inspectAndReconcile({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any

  logger.info("=== BEFORE RECONCILE ===")

  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "address.*", "so_warehouse.id"],
  })
  logger.info(
    `Stock locations (${locations?.length || 0}): ${JSON.stringify(
      locations?.map((l: any) => ({
        id: l.id,
        name: l.name,
        pincode: l.address?.postal_code,
        has_warehouse: Boolean(l.so_warehouse?.id),
      })),
      null,
      2
    )}`
  )

  const { data: warehouses } = await query.graph({
    entity: "so_warehouse",
    fields: ["id", "name", "pincode", "is_primary", "stock_location.id"],
  })
  logger.info(
    `Warehouses (${warehouses?.length || 0}): ${JSON.stringify(
      warehouses?.map((w: any) => ({
        id: w.id,
        name: w.name,
        pincode: w.pincode,
        is_primary: w.is_primary,
        has_location: Boolean(w.stock_location?.id),
      })),
      null,
      2
    )}`
  )

  const { data: fulfillmentSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "type", "metadata"],
  })
  logger.info(
    `Fulfillment sets (${fulfillmentSets?.length || 0}): ${JSON.stringify(
      fulfillmentSets?.map((f: any) => ({
        id: f.id,
        name: f.name,
        owned_by: f.metadata?.owned_by,
      })),
      null,
      2
    )}`
  )

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id"],
  })
  logger.info(
    `Shipping options (${options?.length || 0}): ${JSON.stringify(
      options?.map((o: any) => ({ id: o.id, name: o.name, provider: o.provider_id })),
      null,
      2
    )}`
  )

  logger.info("=== RUNNING RECONCILER ===")

  const { result } = await reconcileShippingOrchestratorWorkflow(container).run({
    input: {},
  })
  logger.info(`Reconcile report: ${JSON.stringify(result, null, 2)}`)

  logger.info("=== AFTER RECONCILE ===")

  const { data: locationsAfter } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "so_warehouse.id"],
  })
  logger.info(
    `Locations now: ${locationsAfter
      ?.map((l: any) => `${l.name}(${l.so_warehouse?.id ? "linked" : "unlinked"})`)
      .join(", ")}`
  )

  const { data: warehousesAfter } = await query.graph({
    entity: "so_warehouse",
    fields: ["id", "name", "is_primary", "stock_location.id"],
  })
  logger.info(
    `Warehouses now: ${warehousesAfter
      ?.map(
        (w: any) =>
          `${w.name}${w.is_primary ? "(primary)" : ""}${w.stock_location?.id ? "" : "(orphan)"}`
      )
      .join(", ")}`
  )

  const { data: fsAfter } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "metadata", "service_zones.id", "service_zones.name"],
  })
  logger.info(
    `Fulfillment sets now: ${fsAfter
      ?.filter((f: any) => f.metadata?.owned_by === "shipping-orchestrator")
      .map(
        (f: any) =>
          `${f.name} [zones: ${f.service_zones?.map((z: any) => z.name).join(", ")}]`
      )
      .join(" | ")}`
  )

  const { data: optionsAfter } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "provider_id"],
  })
  const ours = optionsAfter?.filter((o: any) =>
    String(o.provider_id).includes("shipping-orchestrator")
  )
  logger.info(
    `Our shipping options: ${ours?.map((o: any) => o.name).join(", ")}`
  )
}
