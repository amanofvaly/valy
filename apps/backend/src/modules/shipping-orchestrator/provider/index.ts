import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import ShippingOrchestratorProvider from "./shipping-orchestrator-provider"

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [ShippingOrchestratorProvider],
})
