import { z } from "@medusajs/framework/zod"

export const CONTACT_STATUSES = [
  "new",
  "open",
  "answered",
  "archived",
] as const

export const PostAdminContactMessageSchema = z.object({
  status: z.enum(CONTACT_STATUSES).optional(),
  note: z.string().max(4000).nullish(),
})

export type PostAdminContactMessageInput = z.infer<
  typeof PostAdminContactMessageSchema
>
