import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTACT_MODULE } from "../modules/contact"

export type ContactTopic = "sales" | "order" | "warranty" | "parts" | "other"

export type CreateContactMessageInput = {
  name: string
  email: string
  topic: ContactTopic
  order_number?: string | null
  message: string
  source?: string
}

/** The two topics where an order number is worth keeping. */
const TOPICS_WITH_ORDER = new Set<ContactTopic>(["order", "warranty"])

const createContactMessageStep = createStep(
  "create-contact-message",
  async (input: CreateContactMessageInput, { container }) => {
    const contactModuleService = container.resolve(CONTACT_MODULE)

    /*
     * Normalising here rather than in the route means every caller gets it:
     * the address is lowercased so two messages from the same person sort
     * together, and an order number typed under a topic that has no order
     * field is dropped rather than stored where nobody will look for it.
     */
    const orderNumber = TOPICS_WITH_ORDER.has(input.topic)
      ? input.order_number?.trim() || null
      : null

    const message = await contactModuleService.createContactMessages({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      topic: input.topic,
      order_number: orderNumber,
      message: input.message.trim(),
      source: input.source ?? "storefront",
    })

    return new StepResponse(message, message.id)
  },
  async (id: string | undefined, { container }) => {
    if (!id) {
      return
    }

    const contactModuleService = container.resolve(CONTACT_MODULE)
    await contactModuleService.deleteContactMessages(id)
  }
)

export const createContactMessageWorkflow = createWorkflow(
  "create-contact-message",
  (input: CreateContactMessageInput) => {
    const message = createContactMessageStep(input)

    return new WorkflowResponse(message)
  }
)
