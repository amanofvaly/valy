import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  listWarehouses,
  primaryWarehouse,
  SHIPPING_ORCHESTRATOR_MODULE,
} from "../../../../../../modules/shipping-orchestrator"

/**
 * GET /admin/shipping-orchestrator/orders/:id/ship-preview
 *
 * What shipping this order would book, and what it would cost, without booking
 * anything.
 *
 * Serviceability is a read, so this is free — which is the point. Ship spends
 * money the moment it is pressed, and it should not be the one action on this
 * screen that goes ahead without showing its consequences first.
 *
 * The margin is the number worth looking at: the customer paid a shipping
 * price fixed at checkout, and the carrier's rate has moved since. Nothing
 * stops a negative one, so it is put in front of a person instead.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any

  const { data: orders } = await query.graph({
    entity: "order",
    filters: { id },
    fields: [
      "id",
      "display_id",
      "currency_code",
      "shipping_total",
      "shipping_subtotal",
      "shipping_methods.name",
      "shipping_methods.data",
      "shipping_methods.amount",
      "shipping_address.postal_code",
      "items.quantity",
      "items.requires_shipping",
      "items.detail.quantity",
      "items.variant_id",
      "fulfillments.data",
      "fulfillments.canceled_at",
    ],
  })

  const order = orders?.[0]

  if (!order) {
    return res.status(404).json({ message: `No order ${id}` })
  }

  const settings = await svc.getActiveSettings()
  const warehouse = primaryWarehouse(await listWarehouses(req.scope))
  const method = (order.shipping_methods ?? []).at(-1)
  const quotedCourier = method?.data?.courier_name ?? null
  /*
   * What the customer was actually charged for shipping, as it appears on their
   * order. Not a net-of-tax derivation: GST here is calculated on the order
   * total, so a shipping-only "ex GST" figure is an apportionment that exists
   * nowhere in the books and was only ever confusing to look at.
   */
  const charged = Number(method?.amount ?? order.shipping_total ?? 0)

  const live = (order.fulfillments ?? []).filter((f: any) => !f.canceled_at)
  const alreadyBooked = live.find((f: any) => f.data?.shiprocket_awb_codes)

  if (alreadyBooked) {
    return res.json({
      order_id: id,
      display_id: order.display_id,
      blocked: `Already booked on AWB ${alreadyBooked.data.shiprocket_awb_codes}`,
    })
  }

  /*
   * The weight the parcel will actually be declared at. Taken from the
   * fulfilment when one exists, because that is the figure already sent to
   * Shiprocket; estimated from the variants otherwise, the same way the
   * fulfilment will estimate it.
   */
  let weight = Number(live[0]?.data?.chargeable_weight_kg) || 0

  if (!weight) {
    const variantIds = (order.items ?? [])
      .filter((i: any) => i.requires_shipping !== false)
      .map((i: any) => i.variant_id)
      .filter(Boolean)

    let grams = 0

    if (variantIds.length > 0) {
      const { data: variants } = await query.graph({
        entity: "product_variant",
        filters: { id: variantIds },
        fields: ["id", "weight"],
      })

      const byId = new Map((variants ?? []).map((v: any) => [v.id, v]))

      for (const item of order.items ?? []) {
        if (item.requires_shipping === false) continue
        const qty = item.detail?.quantity ?? item.quantity ?? 1
        const each =
          (byId.get(item.variant_id) as any)?.weight ||
          settings.fallback_weight_grams
        grams += each * qty
      }
    }

    weight = Math.max(grams / 1000, 0.5)
  }

  try {
    const serviceability = await svc.shiprocketApi.checkServiceability(
      {
        pickup_postcode: warehouse?.pincode ?? "",
        delivery_postcode: order.shipping_address?.postal_code ?? "",
        weight,
        cod: 0,
      },
      settings
    )

    const available = await svc.filterCouriers(
      serviceability?.data?.available_courier_companies ?? [],
      (settings.carrier_blacklist as string[]) || []
    )

    const chosen = await svc.resolveCourier(available, quotedCourier)

    if (!chosen) {
      return res.json({
        order_id: id,
        display_id: order.display_id,
        blocked: `No courier serviceable for ${order.shipping_address?.postal_code}`,
      })
    }

    return res.json({
      order_id: id,
      display_id: order.display_id,
      currency_code: order.currency_code,
      quoted_courier: quotedCourier,
      booked_courier: chosen.courier.courier_name,
      match: chosen.match,
      rate: chosen.courier.rate,
      charged,
      margin: Number((charged - chosen.courier.rate).toFixed(2)),
      weight,
      already_in_shiprocket: live.length > 0,
    })
  } catch (e: any) {
    return res.json({
      order_id: id,
      display_id: order.display_id,
      blocked: e.message,
    })
  }
}
