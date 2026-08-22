import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CONTACT_MODULE } from "../../../../modules/contact"
import { deleteContactMessageWorkflow } from "../../../../workflows/delete-contact-message"
import { updateContactMessageWorkflow } from "../../../../workflows/update-contact-message"
import { PostAdminContactMessageInput } from "../validators"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)

  const message = await contactModuleService
    .retrieveContactMessage(req.params.id)
    .catch(() => null)

  if (!message) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No contact message with id ${req.params.id}`
    )
  }

  res.json({ message })
}

export const POST = async (
  req: MedusaRequest<PostAdminContactMessageInput>,
  res: MedusaResponse
) => {
  const { status, note } = req.validatedBody

  const { result } = await updateContactMessageWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...(status !== undefined && { status }),
      ...(note !== undefined && { note: note ?? null }),
    },
  })

  res.json({ message: result })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  await deleteContactMessageWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ id: req.params.id, object: "contact_message", deleted: true })
}
