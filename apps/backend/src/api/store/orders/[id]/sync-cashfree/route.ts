import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { CashfreeClient } from "../../../../../modules/cashfree/client"

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
    return res.json({ message: "Cashfree payment details already synced", payment: cashfreePayment })
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

    const updatedPayment = await (paymentModule as any).updatePayments({
        id: cashfreePayment.id,
        data: {
          ...cashfreePayment.data,
          payments
        }
    })

    return res.json({ message: "Cashfree payment details synced successfully", payment: updatedPayment })
  } catch (error: any) {
    const logger = req.scope.resolve("logger")
    logger.error(`Failed to sync cashfree payment for order ${id}: ${error.message}`)
    return res.status(500).json({ message: "Failed to sync payment details" })
  }
}
