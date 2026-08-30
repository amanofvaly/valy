"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath } from "next/cache"
import { getAuthHeaders } from "./cookies"

/** Order transfer: moving a guest order onto an account, and the accept and
 * decline links in the email that follows. */

type TransferResult = {
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}

export const createTransferRequest = async (
  _state: TransferResult,
  formData: FormData
): Promise<TransferResult> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  return sdk.store.order
    .requestTransfer(id, {}, { fields: "id, email" }, await getAuthHeaders())
    .then(({ order }) => {
      revalidatePath("/[countryCode]/account/orders", "page")
      return { success: true, error: null, order }
    })
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) =>
  sdk.store.order
    .acceptTransfer(id, { token }, {}, await getAuthHeaders())
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))

export const declineTransferRequest = async (id: string, token: string) =>
  sdk.store.order
    .declineTransfer(id, { token }, {}, await getAuthHeaders())
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
