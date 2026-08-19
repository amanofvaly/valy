import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator/service-zones
// Returns the service zones owned by us (metadata.owned_by=
// shipping-orchestrator), joined with their fulfillment set + geo zones.
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT) as any

  const zones = await fulfillmentService.listServiceZones(
    {},
    { relations: ["geo_zones", "fulfillment_set"] }
  )

  const ours = zones.filter(
    (z: any) => z.metadata?.owned_by === "shipping-orchestrator"
  )

  res.json({ service_zones: ours })
}

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/service-zones
// Body: { id, name?, geo_zones: [{ type, country_code, province_code?,
//   city?, postal_expression? }] }
// Replaces geo_zones on the zone. Preserves owned_by metadata.
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT) as any
  const body = req.body as any

  if (!body.id) {
    res.status(400).json({ error: "id is required" })
    return
  }

  const patch: any = {
    id: body.id,
  }
  if (body.name) patch.name = body.name
  if (Array.isArray(body.geo_zones)) patch.geo_zones = body.geo_zones

  await fulfillmentService.updateServiceZones(patch)

  res.json({ success: true })
}
