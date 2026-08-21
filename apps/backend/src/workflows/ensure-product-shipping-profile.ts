import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// ====================================================================
// Give a product a shipping profile when it was created without one.
//
// A product with no profile is unshippable:
// `prepare-line-item-data` stamps `requires_shipping: false` onto every line
// item added from it, which empties /store/shipping-options and leaves the
// shopper at "We cannot deliver to this address right now" 
// ====================================================================

export type EnsureProductShippingProfileInput = {
  product_id: string
}

export type EnsureProductShippingProfileResult = {
  linked: boolean
  /** Why nothing was linked, when `linked` is false. */
  reason?: string
  product_id?: string
  shipping_profile_id?: string
}

// Passed to compensation only when a link was actually created, so every
// skipped path leaves compensation with nothing to undo.
type LinkCompensation = {
  product_id: string
  shipping_profile_id: string
}

const linkDefaultShippingProfileStep = createStep(
  "link-default-shipping-profile",
  async (
    input: EnsureProductShippingProfileInput,
    { container }
  ): Promise<
    StepResponse<EnsureProductShippingProfileResult, LinkCompensation>
  > => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any

    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "title", "shipping_profile.id"],
      filters: { id: input.product_id },
    })

    const product = data?.[0]

    if (!product) {
      return new StepResponse({ linked: false, reason: "product not found" })
    }

    // A profile set explicitly wins, which also makes re-running a no-op.
    if (product.shipping_profile?.id) {
      return new StepResponse({ linked: false, reason: "already profiled" })
    }

    const profiles = await fulfillmentService.listShippingProfiles({})
    const profile =
      profiles.find((p: any) => p.type === "default") || profiles[0]

    if (!profile) {
      logger.warn(
        `[ShippingProfile] Product ${product.id} has no shipping profile and the store has none to assign. It cannot be shipped until a profile exists.`
      )
      return new StepResponse({ linked: false, reason: "no profile exists" })
    }

    await link.create({
      [Modules.PRODUCT]: { product_id: product.id },
      [Modules.FULFILLMENT]: { shipping_profile_id: profile.id },
    })

    logger.info(
      `[ShippingProfile] Linked product ${product.id} (${product.title}) to shipping profile ${profile.id}.`
    )

    return new StepResponse(
      {
        linked: true,
        product_id: product.id,
        shipping_profile_id: profile.id,
      },
      { product_id: product.id, shipping_profile_id: profile.id }
    )
  },
  async (created, { container }) => {
    if (!created) {
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK) as any

    await link.dismiss({
      [Modules.PRODUCT]: { product_id: created.product_id },
      [Modules.FULFILLMENT]: {
        shipping_profile_id: created.shipping_profile_id,
      },
    })
  }
)

export const ensureProductShippingProfileWorkflow = createWorkflow(
  "ensure-product-shipping-profile",
  (input: EnsureProductShippingProfileInput) => {
    const result = linkDefaultShippingProfileStep(input)

    return new WorkflowResponse(result)
  }
)
