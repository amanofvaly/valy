import type { HttpTypes } from "@medusajs/types"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import {
  listOrders,
  listRegions,
  listPaymentProviders,
  listShippingOptions,
  retrieveCart,
  retrieveCustomer,
  retrieveOrder,
  mutateOrder,
} from "../../app/lib/medusa.server"

const fetchCart = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest()
  const [cart, customer] = await Promise.all([retrieveCart(request), retrieveCustomer(request)])
  return JSON.parse(JSON.stringify({ cart, customer })) as any
})

export const cartQuery = () => queryOptions({
  queryKey: ["session", "cart"],
  queryFn: () => fetchCart() as Promise<{
    cart: HttpTypes.StoreCart | null
    customer: HttpTypes.StoreCustomer | null
  }>,
  staleTime: 0,
})

const fetchAccount = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest()
  const customer = await retrieveCustomer(request)
  const [orders, regions] = await Promise.all([
    customer ? listOrders(request) : Promise.resolve([]),
    listRegions().catch(() => []),
  ])
  return JSON.parse(JSON.stringify({ customer, orders, regions })) as any
})

export const accountQuery = () => queryOptions({
  queryKey: ["session", "account"],
  queryFn: () => fetchAccount() as Promise<{
    customer: HttpTypes.StoreCustomer | null
    orders: HttpTypes.StoreOrder[]
    regions: HttpTypes.StoreRegion[]
  }>,
  staleTime: 0,
})

const fetchCheckout = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest()
  const cart = await retrieveCart(request)
  if (!cart?.items?.length) return null
  const [customer, shippingOptions, paymentProviders] = await Promise.all([
    retrieveCustomer(request),
    cart.shipping_address ? listShippingOptions(request, cart.id) : Promise.resolve([]),
    cart.region_id ? listPaymentProviders(request, cart.region_id) : Promise.resolve([]),
  ])
  return JSON.parse(JSON.stringify({ cart, customer, shippingOptions, paymentProviders })) as any
})

export const checkoutQuery = () => queryOptions({
  queryKey: ["session", "checkout"],
  queryFn: () => fetchCheckout() as Promise<null | {
    cart: HttpTypes.StoreCart
    customer: HttpTypes.StoreCustomer | null
    shippingOptions: HttpTypes.StoreCartShippingOption[]
    paymentProviders: HttpTypes.StorePaymentProvider[]
  }>,
  staleTime: 0,
})

const fetchOrder = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data }) => {
    const order = await retrieveOrder(getRequest(), data).catch(() => null)
    return JSON.parse(JSON.stringify(order)) as any
  })

export const orderQuery = (id: string) => queryOptions({
  queryKey: ["order", id],
  queryFn: () => fetchOrder({ data: id }) as Promise<HttpTypes.StoreOrder | null>,
})


/**
 * Accepting or declining an order transfer.
 *
 * Runs on the server because the decision needs the customer's session cookie;
 * the token alone is not enough. The route's loader awaits this, so the page
 * renders as the receipt for whatever happened.
 */
const runTransferDecision = createServerFn({ method: "POST" })
  .validator((data: { operation: "transfer-accept" | "transfer-decline"; id: string; token: string }) => data)
  .handler(async ({ data }) => {
    try {
      const result = await mutateOrder(getRequest(), data.operation, data)
      return { success: true, error: null as string | null, order: (result as any)?.order ?? null }
    } catch (error) {
      const message = error instanceof Response ? await error.text() : "That request could not be completed."
      return { success: false, error: message, order: null }
    }
  })

export const acceptTransfer = (id: string, token: string) =>
  runTransferDecision({ data: { operation: "transfer-accept", id, token } })

export const declineTransfer = (id: string, token: string) =>
  runTransferDecision({ data: { operation: "transfer-decline", id, token } })
