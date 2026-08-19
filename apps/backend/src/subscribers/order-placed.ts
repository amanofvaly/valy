import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderService = container.resolve(Modules.ORDER)
  
  const order = await orderService.retrieveOrder(data.id, {
    relations: ["shipping_address"]
  })

  const gstSummary = {
    is_b2b: !!order.metadata?.gstin,
    gstin: order.metadata?.gstin || null,
    place_of_supply: order.shipping_address?.province || null,
    // Add additional summarized tax fields here for your specific ERP requirements
  }

  await orderService.updateOrders(order.id, {
    metadata: {
      ...order.metadata,
      gst_summary: gstSummary
    }
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
