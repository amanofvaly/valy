import { MedusaContainer } from "@medusajs/framework/types"
import { reconcileShippingOrchestratorWorkflow } from "../workflows/reconcile-shipping-orchestrator"

export default async function reconcileShippingJob(
  container: MedusaContainer
) {
  await reconcileShippingOrchestratorWorkflow(container).run({ input: {} })
}

export const config = {
  name: "reconcile-shipping-orchestrator",
  // Every 15 minutes — closest thing to "on boot + keep converging"
  // that Medusa v2's cron jobs support.
  schedule: "*/15 * * * *",
}
