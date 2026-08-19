import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SHIPPING_ORCHESTRATOR_PROVIDER_ID } from "../modules/shipping-orchestrator"
import { syncWarehouseWithStockLocationWorkflow } from "./sync-warehouse-with-stock-location"
import { provisionNativeShippingWorkflow } from "./provision-native-shipping"
import { mirrorShippingOptionWorkflow } from "./mirror-shipping-option"

// ====================================================================
// Reconciliation: idempotent pass that converges the system state.
//   1. Ensure every warehouse has a linked stock location
//   2. Ensure every stock location has a mirror warehouse
//   3. Ensure a fulfillment set / zone / options exist for the primary
//      warehouse only (avoids per-warehouse duplication)
//   4. Ensure every native option owned by us has a mirror row
// ====================================================================

const reconcileStep = createStep(
  "reconcile",
  async (_input: Record<string, never>, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any

    const report = {
      created_locations_from_warehouses: 0,
      created_warehouses_from_locations: 0,
      provisioned_fulfillment_sets: 0,
      mirrored_options: 0,
    }

    // ------------------------------------------------------------------
    // 1. Warehouses without a linked stock location → create + link
    // ------------------------------------------------------------------

    const { data: warehousesJoined } = await query.graph({
      entity: "so_warehouse",
      fields: ["id", "name", "stock_location.id"],
    })

    for (const wh of warehousesJoined || []) {
      if (wh.stock_location?.id) continue

      await syncWarehouseWithStockLocationWorkflow(container).run({
        input: {
          origin: "orchestrator",
          warehouse: {
            id: wh.id,
            name: wh.name,
            pincode: wh.pincode || "",
          },
        },
      })
      report.created_locations_from_warehouses++
    }

    // ------------------------------------------------------------------
    // 3. Stock locations without a warehouse → create mirror warehouse
    // ------------------------------------------------------------------

    const { data: locationsJoined } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name", "address.*", "so_warehouse.id"],
    })

    for (const loc of locationsJoined || []) {
      if (loc.so_warehouse?.id) continue

      await syncWarehouseWithStockLocationWorkflow(container).run({
        input: {
          origin: "native",
          stock_location: {
            id: loc.id,
            name: loc.name,
            address: loc.address || null,
          },
        },
      })
      report.created_warehouses_from_locations++
    }

    // ------------------------------------------------------------------
    // 3. Provision native fulfillment set + zone + options for the
    //    PRIMARY warehouse only. Secondary warehouses are inventory
    //    sources — the provider's calculatePrice routes items across
    //    them internally. Provisioning per-warehouse would produce N
    //    duplicated rate rows at checkout.
    // ------------------------------------------------------------------

    const { data: warehousesFinal } = await query.graph({
      entity: "so_warehouse",
      fields: ["id", "name", "is_primary", "stock_location.id"],
    })

    const primary =
      warehousesFinal?.find((w: any) => w.is_primary && w.stock_location?.id) ||
      warehousesFinal?.find((w: any) => w.stock_location?.id)

    if (primary) {
      await provisionNativeShippingWorkflow(container).run({
        input: {
          stock_location_id: primary.stock_location.id,
          warehouse_name: primary.name,
        },
      })
      report.provisioned_fulfillment_sets++
    }

    // ------------------------------------------------------------------
    // 5. Mirror every native option owned by us
    // ------------------------------------------------------------------

    const { data: nativeOptions } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "provider_id"],
    })

    for (const opt of nativeOptions || []) {
      if (opt.provider_id !== SHIPPING_ORCHESTRATOR_PROVIDER_ID) {
        continue
      }
      await mirrorShippingOptionWorkflow(container).run({
        input: { native_option_id: opt.id },
      })
      report.mirrored_options++
    }

    logger.info(
      `[ShippingOrchestrator] Reconcile: ${JSON.stringify(report)}`
    )
    return new StepResponse(report)
  }
)

// ====================================================================
// Workflow
// ====================================================================

export const reconcileShippingOrchestratorWorkflow = createWorkflow(
  "reconcile-shipping-orchestrator",
  () => {
    const report = reconcileStep({})
    return new WorkflowResponse(report)
  }
)
