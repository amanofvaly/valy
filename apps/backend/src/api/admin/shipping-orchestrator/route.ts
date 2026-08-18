import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../../../modules/shipping-orchestrator"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const orchestratorModuleService = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE)

  let [settings] = await orchestratorModuleService.listShippingOrchestratorSettings()
  
  if (!settings) {
    settings = await orchestratorModuleService.createShippingOrchestratorSettings({
      active_provider: "shiprocket",
      volumetric_divisor: 5000,
      fallback_weight_grams: 500,
      free_shipping_threshold: 0,
      global_markup_type: "none",
      global_markup_value: 0
    })
  }
  
  const rules = await orchestratorModuleService.listShippingRules()

  const uiRules = rules.map((r: any) => ({
    id: r.id,
    value: r.target_id,
    action_type: r.value?.action_type || "flat_rate",
    action_value: r.value?.action_value || 0
  }))

  res.json({
    settings,
    rules: uiRules
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const orchestratorModuleService = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE)

  const { settings, rules } = req.body as any

  if (settings) {
    const { id, created_at, updated_at, deleted_at, ...cleanSettings } = settings
    await orchestratorModuleService.updateShippingOrchestratorSettings({ id, ...cleanSettings })
  }

  if (rules && Array.isArray(rules)) {
    // For rules, the easiest is to delete all and recreate them since it's a simple mapping.
    // Or we can upsert if we pass ids.
    const existingRules = await orchestratorModuleService.listShippingRules()
    if (existingRules.length > 0) {
       await orchestratorModuleService.deleteShippingRules(existingRules.map((r: any) => r.id))
    }
    
    // Create new ones
    if (rules.length > 0) {
      await orchestratorModuleService.createShippingRules(
        rules.map((r: any) => ({
          target_type: "category",
          target_id: r.value, // This is the category ID from the UI
          rule_type: r.action_type === "flat_rate" ? "force_flat_rate" : "block_service", 
          value: { action_value: r.action_value, action_type: r.action_type }
        }))
      )
    }
  }

  res.json({ success: true })
}
