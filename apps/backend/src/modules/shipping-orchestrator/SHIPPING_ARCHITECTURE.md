# Shipping Orchestrator: Ultimate Architecture & Agent Instructions

> **CRITICAL INSTRUCTION FOR ALL FUTURE AI AGENTS:**
> This document is the ultimate source of truth for the Shipping Orchestrator module. 
> DO NOT build this in phases. DO NOT build an MVP. DO NOT strip away features or simplify the scope.
> You must strictly adhere to the 5-pillar architecture described below. If you are asked to work on shipping, you MUST implement these features exactly as described without narrowing the scope.

## The Vision
This is a comprehensive Shipping Engine. It completely extends Medusa's native checkout to process a strict hierarchy of business rules, control exact pricing, and handle complex physical box routing (split shipments, hyperlocal bypass, etc.). It acts as a single, unified control panel. So both Medusa native and our custom module deal with same exact tables and functions, but out custom module does a lot more. And there should be no ambiguity about checkout process. 

---

## Pillar 1: Complex Product & Category Rules

### 1.1 "Ships Separately" Flag
Some items (e.g., a vase, heavy machinery) are too large or fragile to be packed with anything else.
*   **Data Model:** Relies on `metadata.ships_separately: true` on the Product/Variant.
*   **Calculation Engine:** Must instantly isolate this item's weight from the main cart's volumetric calculation.
*   **Fulfillment Engine:** Must generate a completely separate, standalone Shiprocket AWB for this exact item.

### 1.2 Advanced Volumetric Boxing Algorithm
Do not simply sum weights.
*   The module must know the exact `length`, `width`, and `height` of the products.
*   Instead of a simple `(totalVolume / Divisor)` formula, it must calculate if multiple items can physically fit into your configured "Standard Box A" or "Standard Box B".
*   It then calculates volumetric weight for the *entire box*, not just the sum of the items.

### 1.3 Pincode Blacklisting per Category
*   **Data Model:** `ShippingRule` table must support `target_type: "category"` and `rule_type: "block_pincode"`, storing arrays of blocked pincodes.
*   **Checkout Engine:** If the customer's delivery pincode matches the blocked list for any item's category (e.g., Perishable goods cannot ship to 1100XX), the system must explicitly fail the checkout and display a warning.

---

## Pillar 2: Multi-Warehouse & Split Routing

### 2.1 Split Shipments (The Amazon Problem)
*   **Inventory Check:** The engine must query Medusa's `IInventoryService` to determine stock locations.
*   **Routing Logic:** If a cart requires Item A from the Delhi warehouse and Item B from the Mumbai warehouse, the engine must automatically route the order to two different fulfillment locations.
*   **API Costing:** It must hit Shiprocket twice (once for Delhi origin, once for Mumbai origin) to calculate the true shipping cost.
*   **Absorption Toggle:** The dashboard must have a setting (`absorb_split_shipment_cost: boolean`) to decide whether to pass both shipping charges to the customer, or absorb the secondary charge.

### 2.2 Hyperlocal vs. National
*   If the customer's delivery pincode is the exact same as the origin warehouse pincode (or within a defined radial distance), the engine must completely bypass the Shiprocket API.
*   Instead, it pushes the order to a hyperlocal provider (Dunzo, Porter) or returns a fixed "Local Delivery" rate set in the dashboard.

### 2.3 Drop-shipping Integration
*   If a product belongs to a 3rd-party vendor, the origin pincode must dynamically switch to the vendor's registered pincode, and an automated alert/webhook must be dispatched to the vendor upon fulfillment.

---

## Pillar 3: Cart, Customer, & Promotional Logic

### 3.1 Conditional Free Shipping (Exceptions)
*   The global `free_shipping_threshold` (e.g., Free over ₹1,999) must support exclusions based on `ShippingRule` configurations. 
*   *Example:* Cart > ₹1999 gets free shipping *unless* the cart contains an item from the "Heavy Furniture" category, in which case the flat heavy fee is still applied.

### 3.2 B2B / Wholesale Customer Groups
*   The engine must inspect the cart's `customer_id` and map it to Medusa Customer Groups.
*   If the user is in a B2B group, standard Shiprocket Air rates are bypassed. The engine automatically defaults to LTL Freight pricing, or provides a zero-cost "Use Own Courier Account / Pay on Delivery" option.

### 3.3 Pre-orders & Backorders
*   If the cart contains a mix of in-stock and pre-order items, the checkout UI / Engine must pause and provide two distinct calculated options:
    1.  "Ship together when all items arrive" (Calculated as one shipment).
    2.  "Ship available items now" (Calculated as two separate shipments).

---

## Pillar 4: Advanced Courier & Aggregator Controls

### 4.1 Smart Carrier Blacklisting & Filtering
*   The dashboard must allow configuring a comma-separated list of blacklisted couriers (e.g., "Xpressbees, Delhivery Surface").
* Need to find a way for admin users to know the exact values since they wont know which words to use to block a service provider.
*   When the engine pings the Shiprocket `/courier/serviceability/` API, it must actively strip out any returned couriers that match the blacklist before selecting the cheapest/fastest rate.

### 4.2 Courier Masking
*   Never expose internal API courier names to the frontend. The engine must intercept "Shiprocket - Bluedart" and rename it to a white-labeled string like "Standard Delivery (3-5 days)".

### 4.3 Dynamic Surcharges
*   The engine must support calculating Fuel or Festive surcharges (e.g., adding +5% to the final API rate dynamically during Diwali) controlled via the dashboard toggle.

---

## Pillar 5: Return & RTO Logistics

### 5.1 RTO (Return to Origin) Mitigation
*   If the order's payment status is Cash on Delivery (COD), the engine must scrutinize the address/pincode.
*   If the pincode is flagged as high-risk for RTOs, the system must either block COD for that transaction or apply a steep "COD Premium" fee to mitigate risk.

### 5.2 Reverse Pickup Pricing
*   The module must handle return logistics costing, defining whether the customer gets a free return AWB or if a flat ₹100 deduction is applied to their refund.

---

## Auto-Initialization (Single Control Panel Mandate)
*   **NO NATIVE SETTINGS:** The user must *never* be instructed to visit Medusa's native Settings -> Locations to map the provider. 
*   Our custom dashboard at `/app/shipping-orchestrator` is the sole source of truth.
*   The "Save Settings" API route must automatically inject and wire `shipping-orchestrator` into the store's `IFulfillmentModuleService`, fully bridging the gap seamlessly.

***
**TO ANY AGENT READING THIS:** If you modify this system, refer exclusively to this document. Do not attempt to deliver an MVP. Implement the rules precisely. And bi-directional is a strict requirement. This module will not fight with native medusa in any way or will not confuse the checkut process in any way. The only purpose of this document is to enable more control, automate price calculation, manage granual control over categories and products.


Guiding principle

  Medusa native = source of truth for the shared objects (Stock Location, Fulfillment Set, Service
  Zone, Shipping Option, Shipping Profile). Our module = extension. Edits from either surface reflect
  in the other. Our dashboard is the single control panel — it also renders and drives the native rows
  so admin never has to open native Settings.

  Phase 1 — Fix Warehouse ↔ Stock Location bi-directionally

  Model & link
  - Drop the raw stock_location_id text column on so_warehouse (models/warehouse.ts:17). It's a shadow
  FK bypassing the link.
  - Keep the defineLink in src/links/warehouse-stock-location.ts — but actually use it via remoteQuery
  / remoteLink (Modules.LINK) instead of the text FK.
  - Migration: read existing stock_location_id values → create link rows → drop column.
  
  Writes go through one workflow, both directions
  - New workflow syncWarehouseWithStockLocationWorkflow:
    - Given a warehouse payload, upsert the Medusa StockLocation (name, address, pincode) and
  upsert/refresh the module link.
    - Given a stock-location payload, upsert the matching so_warehouse (pincode/city/state come from
  the location address) and upsert the link.
  - Replace the ad-hoc create-a-location code in
  api/admin/shipping-orchestrator/warehouses/route.ts:71-88 with this workflow.

  Subscribers (reverse direction)
  - subscribers/stock-location-sync.ts on stock_location.created, stock_location.updated,
  stock_location.deleted → run the same workflow so native admin edits flow into so_warehouse.
  - Guard against sync loops with an origin: "native" | "orchestrator" flag on the workflow input so
  the subscriber is a no-op when we're the source.
  
  Dashboard
  - warehouses/route.ts GET returns the merged view via the link (no manual matching by string ID).
  - No more "unlinked stock locations" list — every native location auto-materialises as a warehouse
  row (with empty custom fields) so both sides always agree.
  
  Phase 2 — Auto-provision native fulfillment objects ("No Native Settings" mandate)

  This is the core of what's missing today.

  On warehouse create/update, the workflow above also ensures:
  1. A FulfillmentSet named e.g. so-<warehouse.name> exists.
  2. One ServiceZone per warehouse (default zone = all IN pincodes; per-warehouse overrides layer on
  top).
  3. Three ShippingOptions per zone — Standard, Express, Hyperlocal — all with provider_id = 
  shipping-orchestrator and linked to the default ShippingProfile.
  4. Prices are $0 rows (real price comes from calculatePrice in our provider — this is fine and how
  calculated options work).
  
  On warehouse delete: cascade-delete the fulfillment set + zone + options we provisioned (tag them
  with metadata.owned_by = "shipping-orchestrator" so we never touch admin-created options).

  Save Settings route (api/admin/shipping-orchestrator/route.ts POST) kicks the ensure-workflow after
  any warehouse change, so hitting "Save All Settings" reconciles native objects — exactly what the doc
   mandates.

  Phase 3 — Reverse-sync native shipping options

  - subscribers/shipping-option-sync.ts on shipping_option.created/updated/deleted → if provider_id ===
   "shipping-orchestrator", upsert a mirror row in a new so_shipping_option model that stores our
  extension fields (masked display name, blacklist overrides, tier, etc.). Native admin edits to
  name/price/zone show up in our dashboard; our dashboard edits write via the workflow (which is what
  native subscribes to). Single spine, two editors.
  - Dashboard grows a "Shipping Options" tab that lists these mirror rows and lets admin edit both the
  native side (name/price/zone) and the extension side (blacklist, masking, surcharges) from one form.

  Phase 4 — Credentials (Shiprocket)

  Keep the setting where it is (shipping_settings.api_settings.shiprocket_email / shiprocket_password)
  but harden it:
  - GET /admin/shipping-orchestrator returns api_settings: { shiprocket_email, has_shiprocket_password:
   true|false } — never the plaintext password.
  - POST handles the password with a "leave blank to keep existing" rule: if shiprocket_password is
  missing/empty in the payload, we fetch the current value from the DB row and preserve it. If present,
   we overwrite.
  - Remove the console.log that prints email + password at provider/shiprocket-api.ts:44 (security
  bug).
  - ShiprocketAPI invalidates its cached token when settings change (add a settings_updated_at check).
  - New POST /admin/shipping-orchestrator/test-connection reads the password from DB, hits /auth/login,
   returns success/error. That gives admin a way to verify without ever needing to re-type the
  password.
  
  You mentioned you don't have the password stored outside the DB — that's fine, the plan is exactly to
   read it from the DB on demand. Nothing here asks you to hand it over.

  Phase 5 — One-time reconciliation

  On boot (via a loader) run an idempotent reconcile:
  - For every so_warehouse without a linked stock location → create+link one.
  - For every stock location without a warehouse → create+link a warehouse.
  - For every warehouse → ensure fulfillment set + zone + 3 options exist.

  This cleans up the drift already in your DB from the current disconnected build.

  Order of implementation

  1. Fix credentials handling + kill the console.log (fast, safety win).
  2. Model-link migration for warehouses.
  3. syncWarehouseWithStockLocationWorkflow + rewire warehouses route.
  4. Stock-location subscribers.
  5. Auto-provision fulfillment set / zone / options.
  6. Shipping-option mirror model + subscribers + dashboard tab.
  7. Boot-time reconcile loader.