import { model } from "@medusajs/framework/utils"

export const ShippingOrchestratorSettings = model.define("shipping_settings", {
  id: model.id().primaryKey(),
  
  // Master Switch
  active_provider: model.enum(["shiprocket", "manual_slabs", "hyperlocal"]).default("shiprocket"),
  
  // Free Shipping Threshold (e.g. 1999 means over 1999 is free). 0 means disabled.
  free_shipping_threshold: model.number().default(0),
  
  // Global Markups
  global_markup_type: model.enum(["flat", "percentage", "none"]).default("none"),
  global_markup_value: model.number().default(0),
  
  // Fallbacks & Maths
  volumetric_divisor: model.number().default(5000), // standard is 5000
  fallback_weight_grams: model.number().default(500), // if a product has no weight

  // Operational Rules
  absorb_cod_fee: model.boolean().default(false), // if true, don't pass COD charge to customer
  absorb_split_shipment_cost: model.boolean().default(true), // if true, charge only 1 shipment even if AWBs are split

})
