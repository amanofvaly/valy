import { createFileRoute } from "@tanstack/react-router"
import { mutateCustomer } from "../../app/lib/medusa.server"

export const Route = createFileRoute("/api/customer")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json() as Record<string, any>
        try {
          return Response.json(await mutateCustomer(request, String(payload.operation), payload))
        } catch (error) {
          if (error instanceof Response) {
            return new Response(await error.text(), { status: error.status })
          }
          return Response.json({ message: "That change could not be saved." }, { status: 500 })
        }
      },
    },
  },
})
