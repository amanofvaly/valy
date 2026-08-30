import { Module } from "@medusajs/framework/utils"
import ShippingOrchestratorService from "./service"
import { SHIPPING_ORCHESTRATOR_MODULE } from "./constants"

export {
  SHIPPING_ORCHESTRATOR_MODULE,
  SHIPPING_ORCHESTRATOR_PROVIDER_ID,
  SHIPPING_TIERS,
  TIER_CONTEXT_RULES,
  BASE_CONTEXT_RULES,
  SHIPPING_CONTEXT_ATTRIBUTES,
  rulesForTier,
} from "./constants"
export type { ShippingTier } from "./constants"

export {
  WAREHOUSE_LOCATION_FIELDS,
  toWarehouse,
  toStockLocationInput,
  listWarehouses,
  demoteOtherPrimaries,
  primaryWarehouse,
  storeCountryCode,
} from "./warehouses"
export type { Warehouse } from "./warehouses"

export { bookShipment } from "./book-shipment"
export type { BookedShipment } from "./book-shipment"

export default Module(SHIPPING_ORCHESTRATOR_MODULE, {
  service: ShippingOrchestratorService,
})
