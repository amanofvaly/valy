import { model } from "@medusajs/framework/utils"

// Mirrors a native Medusa ShippingOption owned by the shipping-orchestrator
// fulfillment provider. Holds the extension fields the dashboard exposes
// on top of the native option (which owns name, price, service zone).
export const ShippingOptionExtension = model.define("so_shipping_option", {
  id: model.id().primaryKey(),

  // Native fulfillment_shipping_option.id — the shared spine
  native_option_id: model.text().unique(),

  // Tier lets us render 3 known kinds consistently. Free-form for future tiers.
  tier: model.text().default(""),

  // Courier masking (Pillar 4.2): shown to customer, hides the raw courier name.
  display_name: model.text().default(""),

  // Optional per-option carrier blacklist that layers on top of the global one.
  carrier_blacklist: model
    .json()
    .default([] as unknown as Record<string, unknown>),

  // Optional per-option surcharge added on top of provider-calculated price.
  surcharge_flat: model.number().default(0),
  surcharge_percent: model.number().default(0),
})
