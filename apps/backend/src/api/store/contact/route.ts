import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createContactMessageWorkflow } from "../../../workflows/create-contact-message"
import { PostStoreContactInput } from "./validators"

/**
 * The storefront contact form's endpoint.
 *
 * Public, so it is rate limited in `src/api/middlewares.ts` and validated
 * before it reaches here. The response deliberately carries the new message's
 * id: the storefront shows it back to the sender as a reference, and it is the
 * same id the admin detail page is addressed by.
 */
export const POST = async (
  req: MedusaRequest<PostStoreContactInput>,
  res: MedusaResponse
) => {
  const body = req.validatedBody

  // Honeypot. Answer as though it worked; write nothing.
  if (body.company?.length) {
    res.status(201).json({ message: { id: null, accepted: true } })
    return
  }

  const { result } = await createContactMessageWorkflow(req.scope).run({
    input: {
      name: body.name,
      email: body.email,
      topic: body.topic,
      order_number: body.order_number ?? null,
      message: body.message,
      source: "storefront",
    },
  })

  res.status(201).json({
    message: {
      id: result.id,
      status: result.status,
      created_at: result.created_at,
      accepted: true,
    },
  })
}
