import { Module } from "@medusajs/framework/utils"
import ShippingOrchestratorService from "./service"

export const SHIPPING_ORCHESTRATOR_MODULE = "shipping_orchestrator"

// Fulfillment provider row id, built by Medusa as
// `<module_resolve_id>_<provider_static_identifier>`.
// Verified at runtime via listFulfillmentProviders.
export const SHIPPING_ORCHESTRATOR_PROVIDER_ID =
  "shipping-orchestrator_shipping-orchestrator"

export default Module(SHIPPING_ORCHESTRATOR_MODULE, {
  service: ShippingOrchestratorService,
})
