# Shipping Orchestrator: Ultimate Architecture & Agent Instructions

> **CRITICAL INSTRUCTION FOR ALL FUTURE AI AGENTS:**
> This document is the ultimate source of truth for the Shipping Orchestrator module. 
> DO NOT build this in phases. DO NOT build an MVP. DO NOT strip away features or simplify the scope.
> You must strictly adhere to the massive, 5-pillar architecture described below. If you are asked to work on shipping, you MUST implement these features exactly as described without narrowing the scope.

## The Vision
This is a "God Mode" Shipping Engine. It completely overrides Medusa's native checkout to process a strict hierarchy of business rules, control exact pricing, and handle complex physical box routing (split shipments, hyperlocal bypass, etc.). It acts as a single, unified control panel.

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
**TO ANY AGENT READING THIS:** If you modify this system, refer exclusively to this document. Do not attempt to deliver an MVP. Implement the rules precisely.
