import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../modules/shipping-orchestrator"
import { deprovisionNativeShippingWorkflow } from "./deprovision-native-shipping"

// ====================================================================
// Input Type
// ====================================================================

export type DeleteWarehouseInput = {
  origin: "orchestrator" | "native"
  warehouse_id?: string
  stock_location_id?: string
}

// ====================================================================
// Step: dismiss link, then delete both sides
// ====================================================================

const deleteStep = createStep(
  "delete",
  async (input: DeleteWarehouseInput, { container }) => {
    const svc = container.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
    const stockLocationService = container.resolve(Modules.STOCK_LOCATION) as any
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    let warehouseId = input.warehouse_id
    let stockLocationId = input.stock_location_id

    // Resolve the missing side via query.graph
    if (warehouseId && !stockLocationId) {
      const { data } = await query.graph({
        entity: "so_warehouse",
        fields: ["id", "stock_location.id"],
        filters: { id: warehouseId },
      })
      stockLocationId = data?.[0]?.stock_location?.id || undefined
    } else if (stockLocationId && !warehouseId) {
      const { data } = await query.graph({
        entity: "stock_location",
        fields: ["id", "so_warehouse.id"],
        filters: { id: stockLocationId },
      })
      warehouseId = data?.[0]?.so_warehouse?.id || undefined
    }

    // Dismiss the link if both sides known
    if (warehouseId && stockLocationId) {
      try {
        await link.dismiss({
          [SHIPPING_ORCHESTRATOR_MODULE]: {
            so_warehouse_id: warehouseId,
          },
          [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocationId,
          },
        })
      } catch {
        // Link may already be gone
      }
    }

    // Delete the warehouse
    if (warehouseId) {
      try {
        await svc.deleteSoWarehouses([warehouseId])
      } catch {
        // Already gone
      }
    }

    // Delete the stock location only when the orchestrator side
    // triggered the delete; otherwise Medusa itself is deleting it
    if (input.origin === "orchestrator" && stockLocationId) {
      try {
        await stockLocationService.deleteStockLocations([stockLocationId])
      } catch {
        // Already gone
      }
    }

    return new StepResponse({ warehouse_id: warehouseId, stock_location_id: stockLocationId })
  }
)

// ====================================================================
// Workflow
// ====================================================================

export const deleteWarehouseWithStockLocationWorkflow = createWorkflow(
  "delete-warehouse-with-stock-location",
  (input: DeleteWarehouseInput) => {
    const result = deleteStep(input)

    deprovisionNativeShippingWorkflow.runAsStep({
      input: {
        stock_location_id: result.stock_location_id as string,
      },
    })

    return new WorkflowResponse(result)
  }
)
