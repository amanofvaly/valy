import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  SHIPPING_ORCHESTRATOR_MODULE,
  demoteOtherPrimaries,
  listWarehouses,
  primaryWarehouse,
  storeCountryCode,
  toStockLocationInput,
} from "../../../modules/shipping-orchestrator"
import { provisionNativeShippingWorkflow } from "../../../workflows/provision-native-shipping"
import { deprovisionNativeShippingWorkflow } from "../../../workflows/deprovision-native-shipping"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator
// Returns all config: settings, rules, warehouses, boxes, rto pincodes
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any

  const settings = await svc.getSettingsForAdmin()
  const rules = await svc.listShippingRules()
  const boxConfigs = await svc.listBoxConfigs()
  const rtoPincodes = await svc.listRtoRiskPincodes()

  res.json({
    settings,
    rules,
    warehouses: await listWarehouses(req.scope),
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

  // --- Warehouses (Medusa stock locations) ---
  if (body.warehouses && Array.isArray(body.warehouses)) {
    const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION) as any
    const savedIds = new Set<string>()
    const fallbackCountry = await storeCountryCode(req.scope)

    for (const wh of body.warehouses) {
      const input = toStockLocationInput(wh, fallbackCountry)
      const isExisting = wh.id && !String(wh.id).startsWith("new_")

      const location = isExisting
        ? await stockLocationService.updateStockLocations(wh.id, input)
        : await stockLocationService.createStockLocations(input)

      if (location?.id) {
        savedIds.add(location.id)

        if (wh.is_primary) {
          await demoteOtherPrimaries(req.scope, location.id)
        }
      }
    }

    // Delete the warehouses removed on the client. This deletes everything the
    // save loop did not account for, so it only runs when every submitted
    // warehouse came back with an id — one silent miss would otherwise take
    // out locations the merchant never touched.
    if (savedIds.size === body.warehouses.length) {
      const existing = await listWarehouses(req.scope)
      const toDelete = existing
        .filter((w) => !savedIds.has(w.id))
        .map((w) => w.id)

      for (const id of toDelete) {
        // Before the location goes, so its fulfillment set can still be found.
        await deprovisionNativeShippingWorkflow(req.scope).run({
          input: { stock_location_id: id },
        })
      }

      if (toDelete.length) {
        await stockLocationService.deleteStockLocations(toDelete)
      }
    }

    // Provision for whichever warehouse is now the origin. The write path
    // does its own job here; there is no repair pass behind it.
    const origin = primaryWarehouse(await listWarehouses(req.scope))

    if (origin) {
      await provisionNativeShippingWorkflow(req.scope).run({
        input: { stock_location_id: origin.id, warehouse_name: origin.name },
      })
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
