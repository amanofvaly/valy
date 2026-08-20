import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// ------------------------------------------------------------------
// Tell the storefront its catalogue cache is stale.
//
// The storefront caches product, collection and category responses and serves
// prebuilt pages. Nothing in the admin reaches that cache, so a published
// product or an edited price stayed invisible until the frontend was rebuilt.
// This closes that gap: the change happens here, so the notification comes from
// here.
//
// Never throws. A storefront that is down, slow or misconfigured must not make
// saving a product fail in the admin.
// ------------------------------------------------------------------

const TAG_BY_EVENT_PREFIX: Record<string, string> = {
  product: "products",
  "product-variant": "variants",
  "product-option": "products",
  "product-collection": "collections",
  "product-category": "categories",
}

const tagForEvent = (eventName: string): string | undefined => {
  const prefix = eventName.split(".")[0]
  return TAG_BY_EVENT_PREFIX[prefix]
}

export default async function storefrontRevalidateSubscriber({
  event,
  container,
}: SubscriberArgs<unknown>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any

  const storefrontUrl = process.env.STOREFRONT_URL
  const secret = process.env.REVALIDATE_SECRET

  // Absent config means this deployment has no storefront to notify — a local
  // backend, say. Staying quiet is correct; warning on every save is not.
  if (!storefrontUrl || !secret) {
    return
  }

  const tag = tagForEvent(event.name)

  if (!tag) {
    return
  }

  // A variant price change has to clear the product cache too: prices are
  // served inside the product payload, so refreshing only `variants` would
  // leave the visible price stale.
  const tags = tag === "variants" ? ["variants", "products"] : [tag]

  for (const t of tags) {
    const url = `${storefrontUrl.replace(/\/$/, "")}/api/revalidate` +
      `?tag=${encodeURIComponent(t)}&secret=${encodeURIComponent(secret)}`

    try {
      const res = await fetch(url, { method: "POST" })

      if (!res.ok) {
        logger.warn(
          `[revalidate] ${event.name} -> ${t}: storefront returned ${res.status}`
        )
      }
    } catch (e: any) {
      logger.warn(
        `[revalidate] ${event.name} -> ${t}: ${e?.message ?? "request failed"}`
      )
    }
  }
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "product-option.created",
    "product-option.updated",
    "product-option.deleted",
    "product-collection.created",
    "product-collection.updated",
    "product-collection.deleted",
    "product-category.created",
    "product-category.updated",
    "product-category.deleted",
  ],
}
