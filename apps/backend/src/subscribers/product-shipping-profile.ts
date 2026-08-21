import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ensureProductShippingProfileWorkflow } from "../workflows/ensure-product-shipping-profile"

// ------------------------------------------------------------------
// Every product needs a shipping profile to be shippable, and Medusa
// assigns none on create. Close that gap as products appear, whether they
// come from the admin, the API, or an import.
// ------------------------------------------------------------------

export default async function productShippingProfileSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const id = event.data.id
  if (!id) return

  await ensureProductShippingProfileWorkflow(container).run({
    input: { product_id: id },
  })
}

export const config: SubscriberConfig = {
  event: "product.created",
}
