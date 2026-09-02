import { marketPath } from "./market"
import { refreshSession } from "./client-refresh"

async function cartMutation(
  operation: string,
  payload: Record<string, unknown>,
  refresh = true
) {
  const response = await fetch("/api/cart", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation, ...payload }),
  })
  if (!response.ok) throw new Error((await response.text()) || "Cart update failed")
  const result = await response.json()
  // Stands in for the `revalidateTag` these actions used to end with.
  if (refresh) {
    await refreshSession()
  }
  return result
}

export const addToCart = (payload: { variantId: string; quantity: number; countryCode: string }) => cartMutation("add", payload)
export const updateLineItem = (payload: { lineId: string; quantity: number }) => cartMutation("update", payload)
export const deleteLineItem = (lineId: string) => cartMutation("delete", { lineId })
export const removeBuildFromCart = (buildId: string) => cartMutation("delete-build", { buildId })

export const addFlowBuildToCart = (payload: {
  lines: { variantId: string; quantity: number; role: string; label: string }[]
  summary: string
  countryCode: string
}) => cartMutation("add-build", payload)

export const updateCart = (data: Record<string, unknown>) => cartMutation("update-cart", { data })
export const applyPromotions = (codes: string[]) => cartMutation("promotions", { codes })
export const setShippingMethod = (payload: Record<string, unknown>) => cartMutation("shipping", payload)
export const setAddresses = (_state: unknown, formData: FormData) => {
  const value = (key: string) => String(formData.get(key) || "")
  const countryCode = value("shipping_address.country_code").toLowerCase()
  return cartMutation("addresses", {
    email: value("email"),
    countryCode,
    address: {
      first_name: value("shipping_address.first_name"),
      last_name: value("shipping_address.last_name"),
      address_1: value("shipping_address.address_1"),
      address_2: value("shipping_address.address_2"),
      postal_code: value("shipping_address.postal_code"),
      city: value("shipping_address.city"),
      province: value("shipping_address.province"),
      country_code: countryCode,
      phone: value("shipping_address.phone"),
    },
  }).then(({ cart }) => ({ cart, countryCode }))
}
export const initiatePaymentSession = (_cart: unknown, data: unknown) => cartMutation("payment", { data })
export const placeOrder = async () => {
  /*
   * Completion clears the cart cookie. Refreshing the checkout after that
   * makes its loader render a 404 before this function can navigate to the
   * newly-created order, so completion is the one cart mutation that carries
   * its result straight into the next page without revalidating this one.
   */
  const result = await cartMutation("complete", {}, false)
  const order = result.completed?.order
  if (order?.id) {
    const country = order.shipping_address?.country_code?.toLowerCase()
    window.location.assign(marketPath(country, `/order/${order.id}/confirmed`))
  }
  return result
}
