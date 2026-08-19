import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../../../../modules/shipping-orchestrator"

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/test-serviceability
// Test Shiprocket serviceability without creating an order
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = req.body as any

  const { pickup_postcode, delivery_postcode, weight_kg } = body

  if (!pickup_postcode || !delivery_postcode) {
    res.status(400).json({
      error: "pickup_postcode and delivery_postcode are required",
    })
    return
  }

  try {
    const shippingModule = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE)
    const settings = await (shippingModule as any).getActiveSettings()
    
    const result = await (shippingModule as any).shiprocketApi.checkServiceability({
      pickup_postcode,
      delivery_postcode,
      weight: weight_kg || 0.5,
      cod: 0,
    }, settings)

    const couriers =
      result?.data?.available_courier_companies?.map((c: any) => ({
        courier_name: c.courier_name,
        rate: c.rate,
        etd: c.etd,
        cod: c.cod,
      })) || []

    res.json({
      serviceable: couriers.length > 0,
      courier_count: couriers.length,
      couriers,
    })
  } catch (e: any) {
    res.status(500).json({
      serviceable: false,
      error: e.message,
    })
  }
}
