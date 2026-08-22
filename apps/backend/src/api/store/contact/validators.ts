import { z } from "@medusajs/framework/zod"

export const CONTACT_TOPICS = [
  "sales",
  "order",
  "warranty",
  "parts",
  "other",
] as const

/**
 * The contact form's wire shape.
 *
 * `company` is the honeypot. It is accepted rather than rejected so a bot that
 * fills every field it finds gets an ordinary success response and stops
 * retrying; the route drops the submission without writing a row.
 */
export const PostStoreContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().min(3).max(200).email(),
  topic: z.enum(CONTACT_TOPICS),
  order_number: z.string().trim().max(64).nullish(),
  message: z.string().trim().min(10).max(4000),
  company: z.string().max(200).optional(),
})

export type PostStoreContactInput = z.infer<typeof PostStoreContactSchema>
