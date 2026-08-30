import { createFileRoute } from "@tanstack/react-router"
import { mutateOrder } from "../../app/lib/medusa.server"

export const Route = createFileRoute("/api/order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json() as Record<string, any>
        try {
          return Response.json(await mutateOrder(request, String(payload.operation), payload))
        } catch (error) {
          const message = error instanceof Response ? await error.text() : "That request could not be completed."
          return Response.json({ message }, { status: error instanceof Response ? error.status : 500 })
        }
      },
    },
  },
})
