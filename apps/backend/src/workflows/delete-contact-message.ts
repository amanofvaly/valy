import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTACT_MODULE } from "../modules/contact"

const deleteContactMessageStep = createStep(
  "delete-contact-message",
  async (input: { id: string }, { container }) => {
    const contactModuleService = container.resolve(CONTACT_MODULE)

    await contactModuleService.deleteContactMessages(input.id)

    return new StepResponse({ id: input.id }, input.id)
  },
  // The delete is a soft delete, so the compensation is a restore rather than
  // a re-insert, and the message comes back with its status and note intact.
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }

    const contactModuleService = container.resolve(CONTACT_MODULE)
    await contactModuleService.restoreContactMessages(id)
  }
)

export const deleteContactMessageWorkflow = createWorkflow(
  "delete-contact-message",
  (input: { id: string }) => {
    const result = deleteContactMessageStep(input)

    return new WorkflowResponse(result)
  }
)
