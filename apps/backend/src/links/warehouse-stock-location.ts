import { defineLink } from "@medusajs/framework/utils"
import ShippingOrchestratorModule from "../modules/shipping-orchestrator"
import StockLocationModule from "@medusajs/medusa/stock-location"

/**
 * Bidirectional link between our Warehouse model and Medusa's
 * native Stock Locations.
 *
 * This allows:
 *   - Querying a Warehouse and expanding its linked StockLocation
 *   - Querying a StockLocation and expanding its linked Warehouse
 *   - No conflict: both systems coexist, our Warehouse adds
 *     shipping-specific fields (pincode, hyperlocal, drop-ship)
 *     on top of Medusa's location management.
 */
export default defineLink(
  ShippingOrchestratorModule.linkable.soWarehouse,
  StockLocationModule.linkable.stockLocation
)
