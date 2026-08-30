import { createFileRoute } from "@tanstack/react-router"
import { submitContactMessage } from "../../app/lib/medusa.server"

export const Route = createFileRoute("/api/contact")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          return Response.json(await submitContactMessage(request, await request.json()))
        } catch (error) {
          if (error instanceof Response) return new Response(await error.text(), { status: error.status })
          return Response.json({ message: "The message could not be sent." }, { status: 500 })
        }
      },
    },
  },
})
