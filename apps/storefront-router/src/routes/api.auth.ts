import { createFileRoute } from "@tanstack/react-router"
import { authenticateCustomer, registerCustomer } from "../../app/lib/medusa.server"

export const Route = createFileRoute("/api/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const data = await request.json() as Record<string, string>
        const headers = new Headers({ "content-type": "application/json" })
        if (data.operation === "logout") {
          headers.append("set-cookie", "_medusa_jwt=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict")
          return new Response(JSON.stringify({ success: true }), { headers })
        }
        const result = data.operation === "register"
          ? await registerCustomer({ email: data.email, password: data.password, first_name: data.first_name, last_name: data.last_name, phone: data.phone })
          : await authenticateCustomer(data.email, data.password)
        if (result.verification_required || !result.token) return Response.json({ verificationRequired: true }, { status: 202 })
        const secure = new URL(request.url).protocol === "https:" ? "; Secure" : ""
        headers.append("set-cookie", `_medusa_jwt=${encodeURIComponent(result.token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Strict${secure}`)
        return new Response(JSON.stringify({ success: true }), { headers })
      },
    },
  },
})
