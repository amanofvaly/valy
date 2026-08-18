import { model } from "@medusajs/framework/utils"

export const ShippingRule = model.define("shipping_rule", {
  id: model.id().primaryKey(),
  
  target_type: model.enum(["category", "pincode_zone", "customer_group"]),
  target_id: model.text(), // ID of the category/group, or value of pincode zone
  
  rule_type: model.enum(["block_service", "force_flat_rate", "force_surface_only", "hyperlocal_bypass"]),
  
  value: model.json().nullable(), // Store numeric rates or config details

})
