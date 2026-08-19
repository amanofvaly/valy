import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  SHIPPING_ORCHESTRATOR_MODULE,
  SHIPPING_ORCHESTRATOR_PROVIDER_ID,
} from "../modules/shipping-orchestrator"

// ====================================================================
// Types
// ====================================================================

export type MirrorShippingOptionInput = {
  native_option_id: string
}

export type DeleteMirrorShippingOptionInput = {
  native_option_id: string
}

// ====================================================================
// Upsert mirror row for a native shipping option, iff it belongs to us
// ====================================================================

const upsertMirrorStep = createStep(
  "upsert-mirror",
  async (input: MirrorShippingOptionInput, { container }) => {
    const svc = container.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const { data } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "name", "provider_id", "metadata", "data"],
      filters: { id: input.native_option_id },
    })

    const option = data?.[0]
    if (!option) {
      return new StepResponse({ skipped: true, reason: "option not found" })
    }

    if (option.provider_id !== SHIPPING_ORCHESTRATOR_PROVIDER_ID) {
      return new StepResponse({ skipped: true, reason: "not our provider" })
    }

    const existing = await svc.listShippingOptionExtensions({
      native_option_id: input.native_option_id,
    })

    const tier = option.metadata?.tier || option.data?.tier || ""
    const displayName = option.metadata?.display_name || option.name || ""

    if (existing.length > 0) {
      await svc.updateShippingOptionExtensions({
        id: existing[0].id,
        tier,
        display_name: displayName,
      })
    } else {
      await svc.createShippingOptionExtensions({
        native_option_id: input.native_option_id,
        tier,
        display_name: displayName,
      })
    }

    return new StepResponse({ skipped: false })
  }
)

const deleteMirrorStep = createStep(
  "delete-mirror",
  async (input: DeleteMirrorShippingOptionInput, { container }) => {
    const svc = container.resolve(SHIPPING_ORCHESTRATOR_MODULE) as any

    const existing = await svc.listShippingOptionExtensions({
      native_option_id: input.native_option_id,
    })

    if (existing.length > 0) {
      await svc.deleteShippingOptionExtensions(existing.map((e: any) => e.id))
    }

    return new StepResponse({ deleted: existing.length })
  }
)

// ====================================================================
// Workflows
// ====================================================================

export const mirrorShippingOptionWorkflow = createWorkflow(
  "mirror-shipping-option",
  (input: MirrorShippingOptionInput) => {
    const result = upsertMirrorStep(input)
    return new WorkflowResponse(result)
  }
)

export const deleteMirrorShippingOptionWorkflow = createWorkflow(
  "delete-mirror-shipping-option",
  (input: DeleteMirrorShippingOptionInput) => {
    const result = deleteMirrorStep(input)
    return new WorkflowResponse(result)
  }
)
