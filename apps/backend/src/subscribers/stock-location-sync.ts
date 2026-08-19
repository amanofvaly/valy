import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncWarehouseWithStockLocationWorkflow } from "../workflows/sync-warehouse-with-stock-location"
import { deleteWarehouseWithStockLocationWorkflow } from "../workflows/delete-warehouse-with-stock-location"

// Reverse-sync native stock location events into our warehouse table.
// origin: "native" prevents the workflow from writing back to the location
// and causing a loop; the workflow additionally short-circuits when the
// mirror warehouse fields already match the incoming payload.

export default async function stockLocationSyncSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const id = event.data?.id
  if (!id) return

  if (event.name === "stock-location.deleted") {
    await deleteWarehouseWithStockLocationWorkflow(container).run({
      input: { origin: "native", stock_location_id: id },
    })
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "address.*"],
    filters: { id },
  })

  const location = locations?.[0]
  if (!location) return

  await syncWarehouseWithStockLocationWorkflow(container).run({
    input: {
      origin: "native",
      stock_location: {
        id: location.id,
        name: location.name,
        address: location.address || null,
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: [
    "stock-location.created",
    "stock-location.updated",
    "stock-location.deleted",
  ],
}
