import { model } from "@medusajs/framework/utils"

export const ShippingRule = model.define("shipping_rule", {
  id: model.id().primaryKey(),

  // What this rule targets
  target_type: model.enum([
    "category",
    "product",
    "pincode",
    "customer_group",
  ]),
  target_id: model.text(),

  // What the rule does
  rule_type: model.enum([
    "block_pincode",
    "block_service",
    "force_flat_rate",
    "force_surface_only",
    "hyperlocal_bypass",
    "free_shipping_exclusion",
    "cod_block",
    "cod_premium",
    "b2b_override",
  ]),

  // Configuration payload (rate amounts, pincode arrays, etc.)
  value: model.json().nullable(),
})
