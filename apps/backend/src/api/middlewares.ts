import { defineMiddlewares } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { reconcileShippingOrchestratorWorkflow } from "../workflows/reconcile-shipping-orchestrator"

// Medusa v2 module loaders can only see their own container, so an
// on-boot reconciler that spans stock_location + fulfillment + our
// module isn't possible via loaders. This middleware fires the
// reconciler exactly once, on the first admin request after boot —
// giving us the "on boot" semantics we actually want.

let reconcileTriggered = false

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/*",
      middlewares: [
        async (req, _res, next) => {
          if (!reconcileTriggered) {
            reconcileTriggered = true
            // Fire-and-forget — never block the request path
            reconcileShippingOrchestratorWorkflow(req.scope)
              .run({ input: {} })
              .catch((e) => {
                const logger = req.scope.resolve(
                  ContainerRegistrationKeys.LOGGER
                ) as any
                logger.warn(
                  `[ShippingOrchestrator] boot reconcile failed: ${e.message}`
                )
                // Allow a retry on next request
                reconcileTriggered = false
              })
          }
          next()
        },
      ],
    },
  ],
})
