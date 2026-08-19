import { model } from "@medusajs/framework/utils"

export const ShippingOrchestratorSettings = model.define("shipping_settings", {
  id: model.id().primaryKey(),

  // --- Pillar 1: Core Engine ---
  active_provider: model
    .enum(["shiprocket", "manual_slabs", "hyperlocal"])
    .default("shiprocket"),
  volumetric_divisor: model.number().default(5000),
  fallback_weight_grams: model.number().default(500),

  // --- Pillar 2: Multi-Warehouse ---
  absorb_split_shipment_cost: model.boolean().default(true),

  // --- Pillar 2.2: Hyperlocal ---
  hyperlocal_enabled: model.boolean().default(false),
  hyperlocal_radius_km: model.number().default(10),
  hyperlocal_flat_rate: model.number().default(0),

  // --- Pillar 3: Cart & Promo Logic ---
  free_shipping_threshold: model.number().default(0),

  // --- Pillar 3 & 4: Global Markups ---
  global_markup_type: model
    .enum(["flat", "percentage", "none"])
    .default("none"),
  global_markup_value: model.number().default(0),

  // --- Pillar 4: Dynamic Surcharges ---
  surcharge_enabled: model.boolean().default(false),
  surcharge_type: model.enum(["flat", "percentage"]).default("flat"),
  surcharge_value: model.number().default(0),
  surcharge_label: model.text().default(""),

  // --- Pillar 4: Carrier Controls ---
  carrier_blacklist: model.json().default([] as unknown as Record<string, unknown>),
  courier_display_map: model.json().default({} as Record<string, unknown>),

  // --- Pillar 5: COD & RTO ---
  absorb_cod_fee: model.boolean().default(false),
  cod_premium_enabled: model.boolean().default(false),
  cod_premium_value: model.number().default(0),

  // --- Pillar 5: Reverse Pickup ---
  reverse_pickup_fee: model.number().default(0),

  // --- API Settings ---
  api_settings: model.json().default({} as Record<string, unknown>),
})
