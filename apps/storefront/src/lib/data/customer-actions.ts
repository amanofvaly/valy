"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCartId,
  getPendingCustomer,
  removeAuthToken,
  removeCartId,
  removePendingCustomer,
  setAuthToken,
  setPendingCustomer,
} from "./cookies"

/**
 * Account mutations: sign-up, sign-in, profile and address book.
 *
 * The email-verification flow below is load-bearing and unchanged. Its shape is
 * dictated by the backend: the customer record does not exist until the address
 * is verified and the customer logs in, so the extra signup fields have to
 * survive the trip to their inbox in a cookie.
 */

export type CustomerAuthState =
  | { state: "error"; error: string }
  | { state: "verification_required"; email: string }
  | { state: "success" }
  | null

const refreshAccount = () => revalidatePath("/[countryCode]", "layout")

/**
 * Requests a verification email. The request must be authenticated with a token
 * tied to the auth identity — the one returned by register, or by a login that
 * reported verification was required.
 */
async function requestVerificationEmail(email: string, token: string) {
  await sdk.auth.verification.request(
    { entity_id: email, entity_type: "email" },
    { authorization: `Bearer ${token}` }
  )
}

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const updated = await sdk.store.customer
    .update(body, {}, { ...(await getAuthHeaders()) })
    .then(({ customer }) => customer)
    .catch(medusaError)

  refreshAccount()
  return updated
}

export async function signup(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerAuthState> {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password,
    })
  } catch (error) {
    const fetchError = error as FetchError
    // An existing identity (for example, an admin user with the same email) is
    // expected and handled: the customer can still log in to link a customer
    // record. Any other error is surfaced.
    if (
      fetchError.statusText !== "Unauthorized" ||
      fetchError.message !== "Identity with email already exists"
    ) {
      return { state: "error", error: String(error) }
    }
  }

  // Persist the extra signup fields. The customer record is created during
  // login, which is deferred until after email verification when the backend
  // requires it.
  await setPendingCustomer(customerForm)

  return completeLogin(customerForm.email, password)
}

export async function login(
  _currentState: unknown,
  formData: FormData
): Promise<CustomerAuthState> {
  return completeLogin(
    formData.get("email") as string,
    formData.get("password") as string
  )
}

/**
 * Logs the customer in and reconciles the customer record. Driven entirely by
 * the backend's login response, so it works whether or not email verification
 * is switched on.
 */
async function completeLogin(
  email: string,
  password: string
): Promise<CustomerAuthState> {
  let result: Awaited<ReturnType<typeof sdk.auth.login>>

  try {
    result = await sdk.auth.login("customer", "emailpass", { email, password })
  } catch (error) {
    return { state: "error", error: String(error) }
  }

  // A `location` is returned by third-party auth providers, which this flow
  // does not support.
  if (typeof result === "object" && "location" in result) {
    return {
      state: "error",
      error: "This login method isn't supported by the storefront.",
    }
  }

  // The backend requires email verification and the customer has not verified
  // yet. Send the verification email and ask them to check their inbox.
  if (
    typeof result === "object" &&
    "verification_required" in result &&
    result.verification_required
  ) {
    try {
      await requestVerificationEmail(email, result.token)
    } catch {
      // Ignore: the customer can resend from the verification page.
    }
    return { state: "verification_required", email }
  }

  if (typeof result !== "string") {
    return {
      state: "error",
      error: "Authentication requires additional steps that aren't supported.",
    }
  }

  let token = result

  // The token may not be tied to a customer record yet — right after
  // registration, or after verifying a brand-new account. Ask the backend:
  // `/store/customers/me` rejects tokens without a registered actor, so a
  // failed retrieve means we still need to create the customer, then log in
  // again to obtain a customer-bound token.
  const customerExists = await sdk.store.customer
    .retrieve({}, { authorization: `Bearer ${token}` })
    .then(() => true)
    .catch(() => false)

  if (!customerExists) {
    const pending = await getPendingCustomer()

    try {
      await sdk.store.customer.create(
        {
          email,
          first_name: pending?.first_name,
          last_name: pending?.last_name,
          phone: pending?.phone,
        },
        {},
        { authorization: `Bearer ${token}` }
      )

      token = (await sdk.auth.login("customer", "emailpass", {
        email,
        password,
      })) as string
    } catch (error) {
      return { state: "error", error: String(error) }
    }

    await removePendingCustomer()
  }

  await setAuthToken(token)

  try {
    await transferCart()
  } catch (error) {
    return { state: "error", error: String(error) }
  }

  refreshAccount()
  return { state: "success" }
}

/**
 * Confirms a customer's email using the token from the verification link.
 *
 * The confirm route does not require authentication, so this works even when
 * the customer opens the link on a different device than they signed up on.
 */
export async function confirmEmailVerification(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sdk.auth.verification.confirm({ code: token })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()
  await removeAuthToken()
  await removeCartId()

  refreshAccount()
  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  await sdk.store.cart.transferCart(cartId, {}, await getAuthHeaders())
  refreshAccount()
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> =>
  sdk.store.customer
    .createAddress(
      {
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
        is_default_billing: (currentState.isDefaultBilling as boolean) || false,
        is_default_shipping:
          (currentState.isDefaultShipping as boolean) || false,
      },
      {},
      { ...(await getAuthHeaders()) }
    )
    .then(() => {
      refreshAccount()
      return { success: true, error: null }
    })
    .catch((err) => ({ success: false, error: err.toString() }))

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  await sdk.store.customer
    .deleteAddress(addressId, { ...(await getAuthHeaders()) })
    .then(refreshAccount)
    .catch(() => undefined)
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string
  if (phone) {
    address.phone = phone
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, { ...(await getAuthHeaders()) })
    .then(() => {
      refreshAccount()
      return { success: true, error: null }
    })
    .catch((err) => ({ success: false, error: err.toString() }))
}
