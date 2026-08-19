import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../../../../modules/shipping-orchestrator"
import { Modules } from "@medusajs/framework/utils"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator/warehouses
// Returns warehouses merged with Medusa stock locations
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION) as any

  const warehouses = await svc.listWarehouses()

  // Enrich with Medusa stock location data
  let stockLocations: any[] = []
  try {
    stockLocations = await stockLocationService.listStockLocations()
  } catch {
    // Stock location module may not be fully configured
  }

  const enriched = warehouses.map((wh: any) => {
    const linked = stockLocations.find(
      (sl: any) => sl.id === wh.stock_location_id
    )
    return {
      ...wh,
      stock_location: linked || null,
    }
  })

  // Also include unlinked stock locations so the admin can link them
  const linkedIds = new Set(
    warehouses
      .map((wh: any) => wh.stock_location_id)
      .filter(Boolean)
  )
  const unlinked = stockLocations.filter(
    (sl: any) => !linkedIds.has(sl.id)
  )

  res.json({
    warehouses: enriched,
    unlinked_stock_locations: unlinked,
  })
}

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/warehouses
// Create or update a warehouse, optionally linking to a stock location
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION) as any
  const body = req.body as any

  let warehouse: any

  if (body.id) {
    // Update existing
    const { created_at, updated_at, deleted_at, stock_location, ...clean } = body
    warehouse = await svc.updateWarehouses(clean)
  } else {
    // Create new
    const { stock_location, ...newData } = body

    // If no stock_location_id provided, also create a Medusa stock location
    if (!newData.stock_location_id && newData.name) {
      try {
        const created = await stockLocationService.createStockLocations({
          name: newData.name,
          address: {
            address_1: "",
            city: newData.city || "",
            province: newData.state || "",
            postal_code: newData.pincode || "",
            country_code: "in",
          },
        })
        newData.stock_location_id = created.id
      } catch (e: any) {
        // Non-fatal: warehouse can exist without stock location link
      }
    }

    warehouse = await svc.createWarehouses(newData)
  }

  res.json({ warehouse })
}

// ------------------------------------------------------------------
// DELETE /admin/shipping-orchestrator/warehouses
// ------------------------------------------------------------------

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const body = req.body as any

  if (body.id) {
    await svc.deleteWarehouses([body.id])
  }

  res.json({ success: true })
}
