import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTACT_MODULE } from "../../../modules/contact"
import { CONTACT_STATUSES } from "./validators"

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/**
 * The inbox.
 *
 * Returns one page of messages plus a count per status, because the dashboard's
 * status tabs are useless without their numbers — the whole reason to open this
 * page is to find out whether anything is waiting.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)

  const { status, topic, q } = req.query as Record<string, string | undefined>

  const limit = Math.min(
    Number(req.query.limit) || DEFAULT_LIMIT,
    MAX_LIMIT
  )
  const offset = Number(req.query.offset) || 0

  const filters: Record<string, unknown> = {}
  if (status && status !== "all") {
    filters.status = status
  }
  if (topic && topic !== "all") {
    filters.topic = topic
  }
  if (q) {
    filters.q = q
  }

  const [messages, count] = await contactModuleService.listAndCountContactMessages(
    filters,
    {
      take: limit,
      skip: offset,
      order: { created_at: "DESC" },
    }
  )

  // One cheap count per status. The tabs are read on every page load and the
  // table is small, so four bounded counts beat loading every row to tally it.
  const counts = Object.fromEntries(
    await Promise.all(
      CONTACT_STATUSES.map(async (value) => {
        const [, total] = await contactModuleService.listAndCountContactMessages(
          { status: value },
          { take: 1, select: ["id"] }
        )
        return [value, total] as const
      })
    )
  )

  res.json({
    messages,
    count,
    limit,
    offset,
    counts,
  })
}
