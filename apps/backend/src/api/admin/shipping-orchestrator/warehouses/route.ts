import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../../../../modules/shipping-orchestrator"
import { syncWarehouseWithStockLocationWorkflow } from "../../../../workflows/sync-warehouse-with-stock-location"
import { deleteWarehouseWithStockLocationWorkflow } from "../../../../workflows/delete-warehouse-with-stock-location"
import { reconcileShippingOrchestratorWorkflow } from "../../../../workflows/reconcile-shipping-orchestrator"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator/warehouses
// Returns warehouses joined with their linked stock locations via
// the module link (source of truth).
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: warehouses } = await query.graph({
    entity: "so_warehouse",
    fields: [
      "id",
      "name",
      "pincode",
      "city",
      "state",
      "is_primary",
      "is_drop_ship",
      "vendor_webhook_url",
      "stock_location.id",
      "stock_location.name",
      "stock_location.address.*",
    ],
  })

  const enriched = (warehouses || []).map((wh: any) => ({
    ...wh,
    stock_location: wh.stock_location || null,
    stock_location_id: wh.stock_location?.id || null,
  }))

  res.json({ warehouses: enriched })
}

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/warehouses
// Create or update. Body: warehouse fields. The workflow guarantees
// a matching Medusa StockLocation exists and is linked bi-directionally.
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as any

  const { result } = await syncWarehouseWithStockLocationWorkflow(
    req.scope
  ).run({
    input: {
      origin: "orchestrator",
      warehouse: {
        id: body.id,
        name: body.name,
        pincode: body.pincode,
        city: body.city,
        state: body.state,
        is_primary: body.is_primary,
        is_drop_ship: body.is_drop_ship,
        vendor_webhook_url: body.vendor_webhook_url,
      },
    },
  })

  // Reconcile once so native fulfillment set / zone / options track the
  // (possibly new) primary warehouse.
  await reconcileShippingOrchestratorWorkflow(req.scope).run({ input: {} })

  // Return the fresh row with link join, so the UI sees the same shape as GET
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const { data } = await query.graph({
    entity: "so_warehouse",
    fields: [
      "id",
      "name",
      "pincode",
      "city",
      "state",
      "is_primary",
      "is_drop_ship",
      "vendor_webhook_url",
      "stock_location.id",
      "stock_location.name",
      "stock_location.address.*",
    ],
    filters: { id: result.warehouse_id },
  })

  res.json({ warehouse: data?.[0] || null })
}

// ------------------------------------------------------------------
// DELETE /admin/shipping-orchestrator/warehouses
// ------------------------------------------------------------------

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as any

  if (!body.id) {
    res.status(400).json({ error: "id is required" })
    return
  }

  await deleteWarehouseWithStockLocationWorkflow(req.scope).run({
    input: {
      origin: "orchestrator",
      warehouse_id: body.id,
    },
  })

  await reconcileShippingOrchestratorWorkflow(req.scope).run({ input: {} })

  res.json({ success: true })
}
