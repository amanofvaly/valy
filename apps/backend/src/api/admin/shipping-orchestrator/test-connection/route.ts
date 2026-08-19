import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../../../../modules/shipping-orchestrator"

// ------------------------------------------------------------------
// POST /admin/shipping-orchestrator/test-connection
// Verify stored Shiprocket credentials without ever exposing the
// password. Reads the current password from the DB.
// ------------------------------------------------------------------

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const svc = req.scope.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any

  try {
    const settings = await svc.getActiveSettings()
    const email = settings?.api_settings?.shiprocket_email
    const password = settings?.api_settings?.shiprocket_password

    if (!email || !password) {
      res.status(400).json({
        ok: false,
        error: "Shiprocket email/password are not configured.",
      })
      return
    }

    const token = await svc.shiprocketApi.getToken(settings)
    res.json({
      ok: true,
      email,
      token_preview: token ? `${String(token).slice(0, 12)}...` : null,
    })
  } catch (e: any) {
    res.status(500).json({
      ok: false,
      error: e.message,
    })
  }
}
