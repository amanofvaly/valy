import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reconcileShippingOrchestratorWorkflow } from "../../../../workflows/reconcile-shipping-orchestrator"

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/reconcile
// Manually trigger the idempotent reconciliation pass. Same code
// path as the scheduled job, safe to run at any time.
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { result } = await reconcileShippingOrchestratorWorkflow(
      req.scope
    ).run({ input: {} })
    res.json({ ok: true, report: result })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message })
  }
}
