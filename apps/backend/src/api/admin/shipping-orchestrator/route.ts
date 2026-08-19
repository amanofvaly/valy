import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../../../modules/shipping-orchestrator"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator
// Returns all config: settings, rules, warehouses, boxes, rto pincodes
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any

  const settings = await svc.getActiveSettings()
  const rules = await svc.listShippingRules()
  const warehouses = await svc.listWarehouses()
  const boxConfigs = await svc.listBoxConfigs()
  const rtoPincodes = await svc.listRtoRiskPincodes()

  res.json({
    settings,
    rules,
    warehouses,
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

  // --- Settings ---
  if (body.settings) {
    const { id, created_at, updated_at, deleted_at, ...cleanSettings } =
      body.settings
    if (id) {
      await svc.updateShippingOrchestratorSettings({
        id,
        ...cleanSettings,
      })
    }
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

  // --- Warehouses (upsert by id) ---
  if (body.warehouses && Array.isArray(body.warehouses)) {
    for (const wh of body.warehouses) {
      if (wh.id && !wh.id.startsWith("new_")) {
        const { created_at, updated_at, deleted_at, ...cleanWh } = wh
        await svc.updateWarehouses(cleanWh)
      } else {
        const { id, ...newWh } = wh
        await svc.createWarehouses(newWh)
      }
    }
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
