import {
  listShippingOptionsForCartWorkflow,
  listShippingOptionsForCartWithPricingWorkflow,
} from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SHIPPING_ORCHESTRATOR_MODULE } from "../modules/shipping-orchestrator"

// ====================================================================
// Supplies orchestrator settings to the shipping-options query context.
//
// Tiers that depend on a setting carry a static rule naming it (see
// TIER_CONTEXT_RULES). This hook injects the current value on every request,
// so Medusa filters those options out natively — the setting stays the single
// source of truth and is never mirrored onto the option itself.
//
// Without this, an option the merchant has switched off is still returned by
// /store/shipping-options, priced, refused, and then hidden by the storefront:
// four steps to undo something that should never have been offered.
// ====================================================================

const buildShippingOptionsContext = async (
  input: { cart?: { items?: { requires_shipping?: boolean }[] } },
  { container }: { container: any }
) => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // A delivery method is only meaningful when there is something to deliver.
  // Emptying a cart is an explicit reset, not a pause: the method that was
  // quoted for those goods must not carry over into whatever is added next.
  // Reporting "false" here removes the option from the listing, and core's own
  // refresh then drops the orphaned method from the cart.
  const hasShippableItems = (input?.cart?.items ?? []).some(
    (i) => i?.requires_shipping !== false
  )

  try {
    const svc = container.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
    const settings = await svc.getActiveSettings()

    return new StepResponse({
      // Rule values are compared as strings by Medusa's matcher.
      cart_has_shippable_items: hasShippableItems ? "true" : "false",
      hyperlocal_enabled: settings?.hyperlocal_enabled ? "true" : "false",
    })
  } catch (e: any) {
    // A missing context key fails the rule, so gated options stay hidden.
    // Offering a delivery method we cannot honour is worse than withholding
    // one we could, and this must never take checkout down with it.
    logger.error(
      `[ShippingOrchestrator] Could not build shipping options context, gated options will be hidden: ${e.message}`
    )
    return new StepResponse({
      cart_has_shippable_items: hasShippableItems ? "true" : "false",
      hyperlocal_enabled: "false",
    })
  }
}

// Both workflows must agree: the first backs GET /store/shipping-options, the
// second backs pricing and addShippingMethodToCart. If only one were hooked, an
// option could be listed and then rejected on selection.
listShippingOptionsForCartWorkflow.hooks.setShippingOptionsContext(
  buildShippingOptionsContext
)

listShippingOptionsForCartWithPricingWorkflow.hooks.setShippingOptionsContext(
  buildShippingOptionsContext
)
