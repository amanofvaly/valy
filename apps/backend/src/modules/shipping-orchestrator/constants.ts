// Kept in a dependency-free file so the fulfillment provider can import the
// module's registration name without pulling `Module()` (and therefore the
// whole service + model graph) into its own import chain.

// Name the module is registered under in the *application* container.
export const SHIPPING_ORCHESTRATOR_MODULE = "shipping_orchestrator"

// Fulfillment provider row id, built by Medusa as
// `<module_resolve_id>_<provider_static_identifier>`.
// Verified at runtime via listFulfillmentProviders.
export const SHIPPING_ORCHESTRATOR_PROVIDER_ID =
  "shipping-orchestrator_shipping-orchestrator"

// Tiers the orchestrator knows how to price differently. `tier` is stored on
// the native shipping option's `data` column and mirrored on the extension row.
export const SHIPPING_TIERS = ["standard", "express", "hyperlocal"] as const
export type ShippingTier = (typeof SHIPPING_TIERS)[number]

/**
 * Settings a tier depends on, expressed as a native shipping-option rule.
 *
 * The rule is a *declaration of dependency*, not a copy of the value: it is
 * written once when the option is provisioned and never changes. The live value
 * is injected into the shipping-options query context on every request by the
 * `setShippingOptionsContext` hook, so `shipping_settings` stays the single
 * source of truth and there is nothing to keep in sync.
 *
 * Medusa's rule matcher stringifies the context value and compares it to the
 * rule value, and a *missing* context key fails the rule — so if the hook ever
 * cannot read the settings, the gated option is hidden rather than offered.
 */
export type ShippingContextRule = {
  attribute: string
  value: string
  operator: "eq"
}

export const TIER_CONTEXT_RULES: Record<string, ShippingContextRule> = {
  hyperlocal: { attribute: "hyperlocal_enabled", value: "true", operator: "eq" },
}

/**
 * Rules every orchestrator option carries.
 *
 * A shipping method is priced for a specific set of goods. Empty the cart and
 * that basis is gone — the honest answer is that there is no shipping quote,
 * not that the previous one still stands. Gating on this makes the option
 * vanish from the listing, and core's own refresh then drops the now-invalid
 * method from the cart. Without it, a delivery choice made for one set of items
 * silently carries over into an unrelated new order.
 */
export const BASE_CONTEXT_RULES: ShippingContextRule[] = [
  { attribute: "cart_has_shippable_items", value: "true", operator: "eq" },
]

/** Every rule an option for `tier` should carry. */
export const rulesForTier = (tier: string): ShippingContextRule[] => [
  ...BASE_CONTEXT_RULES,
  ...(TIER_CONTEXT_RULES[tier] ? [TIER_CONTEXT_RULES[tier]] : []),
]

/** Context keys the hook must supply for the rules above to be evaluable. */
export const SHIPPING_CONTEXT_ATTRIBUTES = [
  ...BASE_CONTEXT_RULES.map((r) => r.attribute),
  ...Object.values(TIER_CONTEXT_RULES).map((r) => r.attribute),
]

/**
 * The size assumed for a variant with no dimensions recorded.
 *
 * Pricing and fulfilment both need a number here, and they have to be the same
 * number: quote a parcel at one size and declare it at another, and Shiprocket
 * reweighs on collection and bills the difference. It lived as a bare `|| 10`
 * in two places, which is exactly how those two numbers drift apart.
 *
 * It is a floor, not a default worth relying on — 10cm is smaller than most
 * things worth shipping, so an unmeasured variant is quoted cheap and invoiced
 * at the real volumetric weight. Filling in real dimensions is what fixes that;
 * this only keeps the arithmetic honest until they are.
 */
export const FALLBACK_DIMENSION_CM = 10
