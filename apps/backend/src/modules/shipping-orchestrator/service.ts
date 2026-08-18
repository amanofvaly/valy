import { MedusaService } from "@medusajs/framework/utils"
import { ShippingOrchestratorSettings, ShippingRule } from "./models"

class ShippingOrchestratorService extends MedusaService({
  ShippingOrchestratorSettings,
  ShippingRule,
}) {
  // We can add custom orchestration logic here if needed
}

export default ShippingOrchestratorService
