import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { CONTACT_MODULE } from "../modules/contact"

export type ContactStatus = "new" | "open" | "answered" | "archived"

export type UpdateContactMessageInput = {
  id: string
  status?: ContactStatus
  note?: string | null
}

const updateContactMessageStep = createStep(
  "update-contact-message",
  async (input: UpdateContactMessageInput, { container }) => {
    const contactModuleService = container.resolve(CONTACT_MODULE)

    const existing = await contactModuleService
      .retrieveContactMessage(input.id)
      .catch(() => null)

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No contact message with id ${input.id}`
      )
    }

    const updated = await contactModuleService.updateContactMessages({
      id: input.id,
      ...(input.status !== undefined && { status: input.status }),
      ...(input.note !== undefined && { note: input.note }),
    })

    // Compensation carries the previous values, so a failure further along the
    // workflow puts the row back rather than leaving it half-changed.
    return new StepResponse(updated, {
      id: existing.id,
      status: existing.status,
      note: existing.note,
    })
  },
  async (previous: UpdateContactMessageInput | undefined, { container }) => {
    if (!previous) {
      return
    }

    const contactModuleService = container.resolve(CONTACT_MODULE)
    await contactModuleService.updateContactMessages(previous)
  }
)

export const updateContactMessageWorkflow = createWorkflow(
  "update-contact-message",
  (input: UpdateContactMessageInput) => {
    const message = updateContactMessageStep(input)

    return new WorkflowResponse(message)
  }
)
