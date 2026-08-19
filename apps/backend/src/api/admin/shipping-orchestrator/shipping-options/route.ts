import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  SHIPPING_ORCHESTRATOR_MODULE,
  SHIPPING_ORCHESTRATOR_PROVIDER_ID,
} from "../../../../modules/shipping-orchestrator"

// ------------------------------------------------------------------
// GET /admin/shipping-orchestrator/shipping-options
// Returns native shipping options (owned by our provider) merged with
// their extension rows. Single view for the dashboard tab.
// ------------------------------------------------------------------

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: nativeOptions } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "provider_id",
      "price_type",
      "service_zone_id",
      "shipping_profile_id",
      "metadata",
      "data",
    ],
  })

  const ours = (nativeOptions || []).filter(
    (o: any) => o.provider_id === SHIPPING_ORCHESTRATOR_PROVIDER_ID
  )

  const extensions = await svc.listShippingOptionExtensions({})
  const byId = new Map(extensions.map((e: any) => [e.native_option_id, e]))

  const merged = ours.map((o: any) => ({
    native: o,
    extension: byId.get(o.id) || null,
  }))

  res.json({ options: merged })
}

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/shipping-options
// Body: { native_option_id, name?, display_name?, carrier_blacklist?,
//         surcharge_flat?, surcharge_percent? }
// Updates the native name (if provided) and upserts the extension row.
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
  const fulfillmentService = req.scope.resolve(Modules.FULFILLMENT) as any
  const body = req.body as any

  if (!body.native_option_id) {
    res.status(400).json({ error: "native_option_id is required" })
    return
  }

  // 1. Native side: name (and metadata) if provided. display_name is the
  //    customer-facing string — mirror it into the native option's name
  //    since that's what checkout renders.
  if (body.name || body.display_name) {
    const metaPatch: any = {}
    if (body.display_name) metaPatch.display_name = body.display_name

    const effectiveName = body.name || body.display_name

    await fulfillmentService.updateShippingOptions(body.native_option_id, {
      ...(effectiveName ? { name: effectiveName } : {}),
      ...(Object.keys(metaPatch).length ? { metadata: metaPatch } : {}),
    })
  }

  // 2. Extension row: upsert
  const existing = await svc.listShippingOptionExtensions({
    native_option_id: body.native_option_id,
  })

  const extPayload: any = {}
  if (body.display_name !== undefined) extPayload.display_name = body.display_name
  if (body.carrier_blacklist !== undefined)
    extPayload.carrier_blacklist = body.carrier_blacklist
  if (body.surcharge_flat !== undefined)
    extPayload.surcharge_flat = Number(body.surcharge_flat) || 0
  if (body.surcharge_percent !== undefined)
    extPayload.surcharge_percent = Number(body.surcharge_percent) || 0

  if (existing.length > 0) {
    await svc.updateShippingOptionExtensions({
      id: existing[0].id,
      ...extPayload,
    })
  } else {
    await svc.createShippingOptionExtensions({
      native_option_id: body.native_option_id,
      ...extPayload,
    })
  }

  res.json({ success: true })
}
