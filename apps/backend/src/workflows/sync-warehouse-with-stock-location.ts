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

// ====================================================================
// Input Type
// ====================================================================

export type SyncWarehouseInput = {
  // Where the change originated. Subscribers pass "native" so the sync
  // is a no-op if that side already matches (loop guard).
  origin: "orchestrator" | "native"

  // Provide either warehouse (from our dashboard) or stock_location
  // (from Medusa admin / native API). The workflow ensures both exist
  // and are linked.
  warehouse?: {
    id?: string
    name: string
    pincode: string
    city?: string
    state?: string
    is_primary?: boolean
    is_drop_ship?: boolean
    vendor_webhook_url?: string | null
  }
  stock_location?: {
    id: string
    name: string
    address?: {
      address_1?: string
      city?: string
      province?: string
      postal_code?: string
      country_code?: string
    } | null
  }
}

export type SyncWarehouseOutput = {
  warehouse_id: string
  stock_location_id: string
}

// ====================================================================
// Step: ensure warehouse + stock location + link all exist
// ====================================================================

const syncStep = createStep(
  "sync",
  async (input: SyncWarehouseInput, { container }) => {
    const svc = container.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
    const stockLocationService = container.resolve(Modules.STOCK_LOCATION) as any
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    // ------------------------------------------------------------------
    // 1. Resolve the pair (warehouse_row, stock_location_row)
    // ------------------------------------------------------------------

    let warehouseRow: any
    let stockLocationRow: any

    if (input.warehouse && input.warehouse.id) {
      // Update path: find existing warehouse and its linked location
      const [existing] = await svc.listSoWarehouses({ id: input.warehouse.id })
      warehouseRow = existing

      const { data: linked } = await query.graph({
        entity: "so_warehouse",
        fields: ["id", "stock_location.*"],
        filters: { id: input.warehouse.id },
      })
      stockLocationRow = linked?.[0]?.stock_location || null
    } else if (input.stock_location) {
      // Reverse sync from native: find warehouse by link
      stockLocationRow = input.stock_location

      const { data: linked } = await query.graph({
        entity: "stock_location",
        fields: ["id", "so_warehouse.*"],
        filters: { id: input.stock_location.id },
      })
      warehouseRow = linked?.[0]?.so_warehouse || null
    }

    // ------------------------------------------------------------------
    // 2. Upsert the warehouse row (source of extension fields)
    // ------------------------------------------------------------------

    const warehousePayload = {
      name:
        input.warehouse?.name ||
        input.stock_location?.name ||
        "Unnamed warehouse",
      pincode:
        input.warehouse?.pincode ||
        input.stock_location?.address?.postal_code ||
        "",
      city:
        input.warehouse?.city ||
        input.stock_location?.address?.city ||
        "",
      state:
        input.warehouse?.state ||
        input.stock_location?.address?.province ||
        "",
      is_primary: input.warehouse?.is_primary ?? false,
      is_drop_ship: input.warehouse?.is_drop_ship ?? false,
      vendor_webhook_url: input.warehouse?.vendor_webhook_url ?? null,
    }

    // Loop-guard: when the reverse sync fires from a native event we
    // just triggered ourselves, the warehouse fields already match. Skip
    // the update entirely to avoid a wasted round-trip.
    const warehouseFieldsMatch =
      warehouseRow &&
      warehouseRow.name === warehousePayload.name &&
      warehouseRow.pincode === warehousePayload.pincode &&
      warehouseRow.city === warehousePayload.city &&
      warehouseRow.state === warehousePayload.state &&
      warehouseRow.is_primary === warehousePayload.is_primary &&
      warehouseRow.is_drop_ship === warehousePayload.is_drop_ship &&
      warehouseRow.vendor_webhook_url === warehousePayload.vendor_webhook_url

    if (warehouseRow) {
      if (!warehouseFieldsMatch) {
        warehouseRow = await svc.updateSoWarehouses({
          id: warehouseRow.id,
          ...warehousePayload,
        })
      }
    } else {
      warehouseRow = await svc.createSoWarehouses(warehousePayload)
    }

    // ------------------------------------------------------------------
    // 3. Upsert the stock location (source of the shared address/name)
    // ------------------------------------------------------------------

    const locationPayload = {
      name: warehousePayload.name,
      address: {
        address_1: input.stock_location?.address?.address_1 || "",
        city: warehousePayload.city,
        province: warehousePayload.state,
        postal_code: warehousePayload.pincode,
        country_code:
          input.stock_location?.address?.country_code || "in",
      },
    }

    const locationFieldsMatch =
      stockLocationRow &&
      stockLocationRow.name === locationPayload.name &&
      stockLocationRow.address?.address_1 ===
        locationPayload.address.address_1 &&
      stockLocationRow.address?.city === locationPayload.address.city &&
      stockLocationRow.address?.province ===
        locationPayload.address.province &&
      stockLocationRow.address?.postal_code ===
        locationPayload.address.postal_code &&
      stockLocationRow.address?.country_code ===
        locationPayload.address.country_code

    if (stockLocationRow) {
      // Only update from orchestrator side to avoid overwriting native
      // edits from within a native-triggered sync. Also skip if fields
      // already match — this is the tightest loop-guard.
      if (input.origin === "orchestrator" && !locationFieldsMatch) {
        stockLocationRow = await stockLocationService.updateStockLocations(
          stockLocationRow.id,
          locationPayload
        )
      }
    } else {
      stockLocationRow = await stockLocationService.createStockLocations(
        locationPayload
      )
    }

    // ------------------------------------------------------------------
    // 4. Ensure the module link exists
    // ------------------------------------------------------------------

    const { data: existingLinks } = await query.graph({
      entity: "so_warehouse",
      fields: ["id", "stock_location.id"],
      filters: { id: warehouseRow.id },
    })
    const existingLinkedLocationId =
      existingLinks?.[0]?.stock_location?.id || null

    if (existingLinkedLocationId !== stockLocationRow.id) {
      if (existingLinkedLocationId) {
        await link.dismiss({
          [SHIPPING_ORCHESTRATOR_MODULE]: {
            so_warehouse_id: warehouseRow.id,
          },
          [Modules.STOCK_LOCATION]: {
            stock_location_id: existingLinkedLocationId,
          },
        })
      }

      await link.create({
        [SHIPPING_ORCHESTRATOR_MODULE]: {
          so_warehouse_id: warehouseRow.id,
        },
        [Modules.STOCK_LOCATION]: {
          stock_location_id: stockLocationRow.id,
        },
      })
    }

    return new StepResponse({
      warehouse_id: warehouseRow.id,
      stock_location_id: stockLocationRow.id,
    })
  }
)

// ====================================================================
// Workflow
// ====================================================================

export const syncWarehouseWithStockLocationWorkflow = createWorkflow(
  "sync-warehouse-with-stock-location",
  (input: SyncWarehouseInput) => {
    // Provisioning of native fulfillment set / zone / options is handled
    // by the reconciler workflow (once per system, tied to the primary
    // warehouse) — not per-warehouse here, which would produce duplicate
    // checkout rate rows.
    const result = syncStep(input)
    return new WorkflowResponse(result)
  }
)
