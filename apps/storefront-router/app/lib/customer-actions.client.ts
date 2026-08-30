import type { HttpTypes } from "@medusajs/types"
import { refreshSession } from "./client-refresh"

/*
 * Browser-side twin of `@lib/data/customer-actions`.
 *
 * Same signatures the account components already call, so nothing in those
 * components changes. The write goes through `/api/customer`, which keeps the
 * auth cookie and publishable key on the server, and each success ends in the
 * refresh that `revalidateTag` used to do.
 */
async function customerMutation(operation: string, payload: Record<string, unknown> = {}) {
  const response = await fetch("/api/customer", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation, ...payload }),
  })
  if (!response.ok) throw new Error((await response.text()) || "That change could not be saved.")
  const result = await response.json()
  await refreshSession()
  return result
}

const addressFrom = (formData: FormData) => ({
  first_name: formData.get("first_name") as string,
  last_name: formData.get("last_name") as string,
  company: formData.get("company") as string,
  address_1: formData.get("address_1") as string,
  address_2: formData.get("address_2") as string,
  city: formData.get("city") as string,
  postal_code: formData.get("postal_code") as string,
  province: formData.get("province") as string,
  country_code: formData.get("country_code") as string,
  phone: formData.get("phone") as string,
})

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) =>
  customerMutation("update", { body }).then((r) => r.customer)

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> =>
  customerMutation("address-add", {
    address: {
      ...addressFrom(formData),
      is_default_billing: (currentState.isDefaultBilling as boolean) || false,
      is_default_shipping: (currentState.isDefaultShipping as boolean) || false,
    },
  })
    .then(() => ({ success: true, error: null }))
    .catch((error) => ({ success: false, error: String(error) }))

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)
  if (!addressId) return { success: false, error: "No address to update." }
  return customerMutation("address-update", { addressId, address: addressFrom(formData) })
    .then(() => ({ success: true, error: null }))
    .catch((error) => ({ success: false, error: String(error) }))
}

export const deleteCustomerAddress = async (addressId: string): Promise<void> => {
  await customerMutation("address-delete", { addressId }).catch(() => undefined)
}

export async function signout(_countryCode?: string) {
  await fetch("/api/auth", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "logout" }),
  })
  await refreshSession()
}

export type CustomerAuthState =
  | { state: "error"; error: string }
  | { state: "verification_required"; email: string }
  | { state: "success" }
  | null

async function auth(payload: Record<string, string>): Promise<CustomerAuthState> {
  const response = await fetch("/api/auth", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (response.status === 202) {
    return { state: "verification_required", email: payload.email }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { message?: string })
    return { state: "error", error: body?.message || "Those details were not accepted." }
  }
  await refreshSession()
  return { state: "success" }
}

/*
 * Only a path on this site: a value that does not start with a single slash is
 * ignored, so the field cannot be used to bounce someone off to another host
 * after they have typed their password.
 */
function safeRedirect(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : ""
  return /^\/(?!\/)/.test(path) ? path : null
}

export async function login(_state: unknown, formData: FormData): Promise<CustomerAuthState> {
  const result = await auth({
    operation: "login",
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  })
  if (result?.state === "success") {
    window.location.assign(safeRedirect(formData.get("redirect")) || "/account")
  }
  return result
}

export async function signup(_state: unknown, formData: FormData): Promise<CustomerAuthState> {
  const result = await auth({
    operation: "register",
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
    first_name: String(formData.get("first_name") || ""),
    last_name: String(formData.get("last_name") || ""),
    phone: String(formData.get("phone") || ""),
  })
  if (result?.state === "success") {
    window.location.assign(safeRedirect(formData.get("redirect")) || "/account")
  }
  return result
}

export async function confirmEmailVerification(token: string): Promise<CustomerAuthState> {
  return auth({ operation: "verify", token })
}

export async function transferCart() {
  await fetch("/api/cart", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "transfer" }),
  }).catch(() => undefined)
  await refreshSession()
}
