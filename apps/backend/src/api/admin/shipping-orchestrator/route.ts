import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../../../modules/shipping-orchestrator"
import { syncWarehouseWithStockLocationWorkflow } from "../../../workflows/sync-warehouse-with-stock-location"
import { deleteWarehouseWithStockLocationWorkflow } from "../../../workflows/delete-warehouse-with-stock-location"
import { reconcileShippingOrchestratorWorkflow } from "../../../workflows/reconcile-shipping-orchestrator"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator
// Returns all config: settings, rules, warehouses, boxes, rto pincodes
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const settings = await svc.getSettingsForAdmin()
  const rules = await svc.listShippingRules()
  const boxConfigs = await svc.listBoxConfigs()
  const rtoPincodes = await svc.listRtoRiskPincodes()

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

  res.json({
    settings,
    rules,
    warehouses: warehouses || [],
    box_configs: boxConfigs,
    rto_pincodes: rtoPincodes,
  })
}

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator
// Saves all config sections in one call
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const body = req.body as any

  // --- Settings (merge-preserve secrets) ---
  if (body.settings) {
    await svc.persistSettings(body.settings)
  }

  // --- Rules (delete-and-recreate strategy) ---
  if (body.rules && Array.isArray(body.rules)) {
    const existingRules = await svc.listShippingRules()
    if (existingRules.length > 0) {
      await svc.deleteShippingRules(existingRules.map((r: any) => r.id))
    }

    if (body.rules.length > 0) {
      await svc.createShippingRules(body.rules)
    }
  }

  // --- Warehouses (delegate to sync workflow so link + native side stay in sync) ---
  if (body.warehouses && Array.isArray(body.warehouses)) {
    for (const wh of body.warehouses) {
      const isExisting = wh.id && !String(wh.id).startsWith("new_")
      await syncWarehouseWithStockLocationWorkflow(req.scope).run({
        input: {
          origin: "orchestrator",
          warehouse: {
            id: isExisting ? wh.id : undefined,
            name: wh.name,
            pincode: wh.pincode,
            city: wh.city,
            state: wh.state,
            is_primary: wh.is_primary,
            is_drop_ship: wh.is_drop_ship,
            vendor_webhook_url: wh.vendor_webhook_url,
          },
        },
      })
    }

    // Delete warehouses that were removed on the client
    const existingIds = new Set(
      body.warehouses.filter((w: any) => w.id && !String(w.id).startsWith("new_")).map((w: any) => w.id)
    )
    const currentWarehouses = await svc.listSoWarehouses()
    const toDelete = currentWarehouses
      .filter((w: any) => !existingIds.has(w.id))
      .map((w: any) => w.id)

    for (const id of toDelete) {
      await deleteWarehouseWithStockLocationWorkflow(req.scope).run({
        input: { origin: "orchestrator", warehouse_id: id },
      })
    }

    await reconcileShippingOrchestratorWorkflow(req.scope).run({ input: {} })
  }

  // --- Box Configs (delete-and-recreate) ---
  if (body.box_configs && Array.isArray(body.box_configs)) {
    const existingBoxes = await svc.listBoxConfigs()
    if (existingBoxes.length > 0) {
      await svc.deleteBoxConfigs(existingBoxes.map((b: any) => b.id))
    }

    if (body.box_configs.length > 0) {
      await svc.createBoxConfigs(body.box_configs.map((b: any) => {
        const { id, created_at, updated_at, deleted_at, ...clean } = b
        return clean
      }))
    }
  }

  // --- RTO Pincodes (delete-and-recreate) ---
  if (body.rto_pincodes && Array.isArray(body.rto_pincodes)) {
    const existing = await svc.listRtoRiskPincodes()
    if (existing.length > 0) {
      await svc.deleteRtoRiskPincodes(existing.map((r: any) => r.id))
    }

    if (body.rto_pincodes.length > 0) {
      await svc.createRtoRiskPincodes(body.rto_pincodes.map((r: any) => {
        const { id, created_at, updated_at, deleted_at, ...clean } = r
        return clean
      }))
    }
  }

  res.json({ success: true })
}
