import type { HttpTypes } from "@medusajs/types"
import { refreshSession } from "./client-refresh"

type TransferResult = {
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}

/*
 * Browser-side twin of `@lib/data/order-actions`. Same signatures; the write
 * goes through `/api/order` so the customer's token stays on the server.
 */
async function orderMutation(operation: string, payload: Record<string, unknown>): Promise<TransferResult> {
  try {
    const response = await fetch("/api/order", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation, ...payload }),
    })
    const body = await response.json().catch(() => ({}) as Record<string, any>)
    if (!response.ok) {
      return { success: false, error: body?.message || "That request could not be completed.", order: null }
    }
    await refreshSession()
    return { success: true, error: null, order: body?.order ?? null }
  } catch (error) {
    return { success: false, error: String(error), order: null }
  }
}

export const createTransferRequest = async (
  _state: TransferResult,
  formData: FormData
): Promise<TransferResult> => {
  const id = formData.get("order_id") as string
  if (!id) return { success: false, error: "Order ID is required", order: null }
  return orderMutation("transfer-request", { id })
}

export const acceptTransferRequest = (id: string, token: string) =>
  orderMutation("transfer-accept", { id, token })

export const declineTransferRequest = (id: string, token: string) =>
  orderMutation("transfer-decline", { id, token })
