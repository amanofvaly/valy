import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PostAdminContactMessageSchema } from "./admin/contact/validators"
import { PostStoreContactSchema } from "./store/contact/validators"

/**
 * A small in-process rate limit for the one public write endpoint on this
 * backend.
 *
 * It is per instance, not shared, so behind more than one container the real
 * ceiling is this number times the instance count. That is deliberate: the job
 * here is to stop a script hammering one box, not to be an exact quota, and a
 * Redis round trip on every contact submission buys precision nobody needs.
 * The honeypot in the route catches the other half of the problem.
 */
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const MAX_TRACKED_CLIENTS = 5000

const recentSubmissions = new Map<string, number[]>()

const rateLimitContactForm = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const client =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"

  const now = Date.now()
  const within = (recentSubmissions.get(client) ?? []).filter(
    (at) => now - at < WINDOW_MS
  )

  if (within.length >= MAX_PER_WINDOW) {
    res.status(429).json({
      message:
        "That is a lot of messages in a short time. Try again in a few minutes, or write to support@valy.in.",
    })
    return
  }

  within.push(now)
  recentSubmissions.set(client, within)

  // Sweep expired clients rather than growing the map forever. Only runs once
  // the map is already large, so the ordinary request pays nothing for it.
  if (recentSubmissions.size > MAX_TRACKED_CLIENTS) {
    for (const [key, times] of recentSubmissions) {
      if (!times.some((at) => now - at < WINDOW_MS)) {
        recentSubmissions.delete(key)
      }
    }
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/contact",
      method: "POST",
      middlewares: [
        rateLimitContactForm,
        validateAndTransformBody(PostStoreContactSchema),
      ],
    },
    {
      matcher: "/admin/contact/:id",
      method: "POST",
      middlewares: [
        validateAndTransformBody(PostAdminContactMessageSchema),
      ],
    },
  ],
})
