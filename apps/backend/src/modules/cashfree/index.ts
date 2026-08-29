import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import CashfreePaymentService from "./service"

/**
 * Registered from `medusa-config.ts` under the payment module. The resulting
 * provider id is `pp_cashfree_cashfree` — `pp_{identifier}_{id}` — which is
 * what the storefront matches on and what a region has to enable.
 */
export default ModuleProvider(Modules.PAYMENT, {
  services: [CashfreePaymentService],
})
