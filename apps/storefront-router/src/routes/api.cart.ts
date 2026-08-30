import { createFileRoute } from "@tanstack/react-router"
import { calculateShippingOption, listShippingOptions, mutateCart, retrieveCart } from "../../app/lib/medusa.server"

export const Route = createFileRoute("/api/cart")({
  server: {
    handlers: {
      GET: async ({ request }) => Response.json({ cart: await retrieveCart(request) }),
      POST: async ({ request }) => {
        const payload = await request.json() as Record<string, unknown>
        if (payload.operation === "calculate-shipping") {
          try {
            const shippingOption = await calculateShippingOption(request, String(payload.optionId), String(payload.cartId))
            return Response.json({ shippingOption })
          } catch (error) {
            /*
             * Pass the backend's own `code` through untouched. The shopper-facing
             * wording is chosen from it by `reasonFromCode`, so flattening this to
             * one generic string loses every specific reason.
             */
            if (!(error instanceof Response)) {
              return Response.json({ code: undefined }, { status: 503 })
            }
            const text = await error.text()
            let body: Record<string, unknown> = {}
            try { body = JSON.parse(text) as Record<string, unknown> } catch { body = { message: text } }
            return Response.json(body, { status: error.status })
          }
        }
        const result = await mutateCart(request, String(payload.operation), payload)
        const headers = new Headers({ "content-type": "application/json" })
        if (result.created) {
          const secure = new URL(request.url).protocol === "https:" ? "; Secure" : ""
          headers.append("set-cookie", `_medusa_cart_id=${encodeURIComponent(result.cartId)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Strict${secure}`)
        }
        if (result.completed?.type === "order") {
          headers.append("set-cookie", "_medusa_cart_id=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict")
        }
        const shippingOptions = result.cart?.shipping_address ? await listShippingOptions(request, result.cartId) : []
        return new Response(JSON.stringify({ cart: result.cart, completed: result.completed, shippingOptions }), { headers })
      },
    },
  },
})
