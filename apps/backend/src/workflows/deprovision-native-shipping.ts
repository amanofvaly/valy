import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// ====================================================================
// Input
// ====================================================================

export type DeprovisionNativeShippingInput = {
  stock_location_id: string
}

const OWNED_BY = "shipping-orchestrator"

// ====================================================================
// Step
// ====================================================================

const deprovisionStep = createStep(
  "deprovision",
  async (input: DeprovisionNativeShippingInput, { container }) => {
    if (!input.stock_location_id) {
      return new StepResponse({ deleted_sets: 0 })
    }

    const fulfillmentService = container.resolve(Modules.FULFILLMENT) as any
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const { data: linked } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id", "fulfillment_sets.metadata"],
      filters: { id: input.stock_location_id },
    })

    const ownedSetIds: string[] = (linked?.[0]?.fulfillment_sets || [])
      .filter((s: any) => s.metadata?.owned_by === OWNED_BY)
      .map((s: any) => s.id)

    for (const setId of ownedSetIds) {
      try {
        await link.dismiss({
          [Modules.STOCK_LOCATION]: {
            stock_location_id: input.stock_location_id,
          },
          [Modules.FULFILLMENT]: {
            fulfillment_set_id: setId,
          },
        })
      } catch {
        // Link may already be gone
      }

      try {
        await fulfillmentService.deleteFulfillmentSets([setId])
      } catch {
        // Already gone
      }
    }

    return new StepResponse({ deleted_sets: ownedSetIds.length })
  }
)

// ====================================================================
// Workflow
// ====================================================================

export const deprovisionNativeShippingWorkflow = createWorkflow(
  "deprovision-native-shipping",
  (input: DeprovisionNativeShippingInput) => {
    const result = deprovisionStep(input)
    return new WorkflowResponse(result)
  }
)
