import { model } from "@medusajs/framework/utils"

export const ShippingOrchestratorSettings = model.define("shipping_settings", {
  id: model.id().primaryKey(),

  // There is exactly one settings row for the store. Without a constraint,
  // "read it, create it if missing" lets two concurrent first-boot requests
  // each insert one — the admin page loads config and health together, so a
  // fresh database reliably ends up with two rows that then drift apart as
  // edits save to whichever one is read.
  //
  // Always true, unique: the database refuses the second insert regardless of
  // what the rest of the row contains.
  singleton: model.boolean().default(true),

  // --- Pillar 1: Core Engine ---
  active_provider: model
    .enum(["shiprocket", "manual_slabs", "hyperlocal"])
    .default("shiprocket"),
  volumetric_divisor: model.number().default(5000),
  fallback_weight_grams: model.number().default(500),

  // --- Pillar 1: Fallback slab ---
  // Used when the live carrier API is unreachable, and as the sole rate source
  // when active_provider is "manual_slabs". When disabled, a carrier outage
  // makes the option unavailable with a stated reason rather than silently
  // quoting a made-up price.
  fallback_enabled: model.boolean().default(true),
  fallback_rate_per_500g: model.number().default(45),

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
}).indexes([
  {
    on: ["singleton"],
    unique: true,
  },
])
