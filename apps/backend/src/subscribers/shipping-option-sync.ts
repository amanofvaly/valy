import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  mirrorShippingOptionWorkflow,
  deleteMirrorShippingOptionWorkflow,
} from "../workflows/mirror-shipping-option"

// ------------------------------------------------------------------
// Mirror native shipping-option lifecycle into our extension table
// (idempotent; ignores options that don't belong to our provider).
// ------------------------------------------------------------------

export default async function shippingOptionSyncSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const id = event.data.id
  if (!id) return

  if (event.name === "shipping-option.deleted") {
    await deleteMirrorShippingOptionWorkflow(container).run({
      input: { native_option_id: id },
    })
    return
  }

  await mirrorShippingOptionWorkflow(container).run({
    input: { native_option_id: id },
  })
}

export const config: SubscriberConfig = {
  event: [
    "shipping-option.created",
    "shipping-option.updated",
    "shipping-option.deleted",
  ],
}
