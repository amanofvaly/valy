import { Module } from "@medusajs/framework/utils"
import ShippingOrchestratorService from "./service"

export const SHIPPING_ORCHESTRATOR_MODULE = "shipping_orchestrator"

export default Module(SHIPPING_ORCHESTRATOR_MODULE, {
  service: ShippingOrchestratorService,
})
