import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  demoteOtherPrimaries,
  listWarehouses,
  primaryWarehouse,
  storeCountryCode,
  toStockLocationInput,
  toWarehouse,
} from "../../../../modules/shipping-orchestrator"
import { provisionNativeShippingWorkflow } from "../../../../workflows/provision-native-shipping"
import { deprovisionNativeShippingWorkflow } from "../../../../workflows/deprovision-native-shipping"

// ------------------------------------------------------------------
// A warehouse is a Medusa stock location. These handlers read and write
// that record directly — there is no second table to keep in step.
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator/warehouses
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({ warehouses: await listWarehouses(req.scope) })
}

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/warehouses
// Create when there is no id, update when there is.
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION) as any
  const body = req.body as any

  const input = toStockLocationInput(body, await storeCountryCode(req.scope))
  const isExisting = body.id && !String(body.id).startsWith("new_")

  const location = isExisting
    ? await stockLocationService.updateStockLocations(body.id, input)
    : await stockLocationService.createStockLocations(input)

  if (location?.id && body.is_primary) {
    await demoteOtherPrimaries(req.scope, location.id)
  }

  // Provision for whichever warehouse is now the origin. This is the write
  // path doing its own job, not a repair pass: everything checkout needs is
  // created here, at the moment the warehouse is saved.
  const origin = primaryWarehouse(await listWarehouses(req.scope))

  if (origin) {
    await provisionNativeShippingWorkflow(req.scope).run({
      input: { stock_location_id: origin.id, warehouse_name: origin.name },
    })
  }

  res.json({ warehouse: toWarehouse(location) })
}

// ------------------------------------------------------------------
// DELETE /admin/shipping-orchestrator/warehouses
// ------------------------------------------------------------------

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION) as any
  const body = req.body as any

  if (!body.id) {
    res.status(400).json({ error: "id is required" })
    return
  }

  // Deprovision first: the fulfillment set is found by walking the location's
  // links, and once the location is gone there is nothing left to walk, so the
  // set would be stranded in Medusa's own shipping settings.
  await deprovisionNativeShippingWorkflow(req.scope).run({
    input: { stock_location_id: body.id },
  })

  await stockLocationService.deleteStockLocations([body.id])

  // Provision for whichever warehouse is now the origin. This is the write
  // path doing its own job, not a repair pass: everything checkout needs is
  // created here, at the moment the warehouse is saved.
  const origin = primaryWarehouse(await listWarehouses(req.scope))

  if (origin) {
    await provisionNativeShippingWorkflow(req.scope).run({
      input: { stock_location_id: origin.id, warehouse_name: origin.name },
    })
  }

  res.json({ success: true })
}
