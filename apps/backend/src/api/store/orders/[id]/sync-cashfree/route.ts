import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { CashfreeClient } from "../../../../../modules/cashfree/client"

/**
 * POST /store/orders/:id/sync-cashfree
 *
 * Backfills the instrument details (which UPI app, which card) onto a Cashfree
 * payment. `authorizePayment` stamps them, but an order completed by the
 * webhook instead — the customer's browser never came back — never goes
 * through that path, so the payment row has a status and no detail. The order
 * confirmation page calls this once and re-reads the order.
 *
 * It answers only `{ synced }`. This route sits under `/store/` and Medusa's
 * core middlewares do not authenticate `/store/orders/:id/*`, so anyone with
 * the publishable key — which ships in the storefront bundle — can call it for
 * any order id. Returning the payment row let them read somebody else's
 * instrument details; returning a boolean does not. The caller never used the
 * body anyway.
 */

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const paymentModule = req.scope.resolve(Modules.PAYMENT)
  
  const { data: [order] } = await query.graph({
    entity: "order",
    fields: ["id", "payment_collections.payments.*"],
    filters: { id }
  })

  if (!order) {
    return res.status(404).json({ message: "Order not found" })
  }

  const cashfreePayment = order.payment_collections?.[0]?.payments?.find(
    (p: any) => p.provider_id.includes("cashfree")
  )

  if (!cashfreePayment) {
    return res.status(400).json({ message: "No Cashfree payment found for this order" })
  }

  if (cashfreePayment.data?.payments && Array.isArray(cashfreePayment.data.payments) && cashfreePayment.data.payments.length > 0) {
    return res.json({ synced: true })
  }

  try {
    const client = new CashfreeClient({
      appId: process.env.CASHFREE_APP_ID as string,
      secretKey: process.env.CASHFREE_SECRET_KEY as string,
      mode: process.env.CASHFREE_MODE as any || (process.env.NODE_ENV === "production" ? "production" : "sandbox"),
      apiVersion: process.env.CASHFREE_API_VERSION || undefined,
    })

    const orderId = cashfreePayment.data?.order_id || cashfreePayment.data?.session_id
    if (!orderId) {
      return res.status(400).json({ message: "Cashfree order ID not found in payment data" })
    }

    const payments = await client.getOrderPayments(orderId as string).catch(() => [])

    await (paymentModule as any).updatePayments({
        id: cashfreePayment.id,
        data: {
          ...cashfreePayment.data,
          payments
        }
    })

    return res.json({ synced: true })
  } catch (error: any) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error(`Failed to sync cashfree payment for order ${id}: ${error.message}`)
    return res.status(500).json({ message: "Failed to sync payment details" })
  }
}
