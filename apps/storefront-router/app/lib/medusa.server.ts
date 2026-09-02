import type { HttpTypes } from "@medusajs/types"

const backendUrl = import.meta.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const publishableKey = import.meta.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const productFields = "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,*options,*options.values,+metadata,*type,*tags,*collection,*categories,*images"
const cartFields = "*items,*region,*items.product,*items.product.type,*items.variant,*items.thumbnail,*items.metadata,+items.total,+items.is_tax_inclusive,*promotions,+shipping_methods.name,+shipping_methods.data"

export function readCookie(request: Request, name: string) {
  const value = request.headers.get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1]
  return value ? decodeURIComponent(value) : undefined
}

function headers(request?: Request) {
  const token = request ? readCookie(request, "_medusa_jwt") : undefined
  return {
    "content-type": "application/json",
    "x-publishable-api-key": publishableKey,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

async function medusa<T>(path: string, init: RequestInit = {}, request?: Request): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: { ...headers(request), ...init.headers },
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Response(detail || response.statusText, { status: response.status })
  }
  return response.json() as Promise<T>
}

export async function getRegion(countryCode: string) {
  const { regions } = await medusa<{ regions: HttpTypes.StoreRegion[] }>("/store/regions")
  return regions.find((region) => region.countries?.some((country) => country.iso_2?.toLowerCase() === countryCode.toLowerCase())) ?? null
}

export async function listProducts(countryCode: string, query: URLSearchParams) {
  const region = await getRegion(countryCode)
  if (!region) return { products: [], count: 0, region: null }
  const params = new URLSearchParams(query)
  params.set("region_id", region.id)
  params.set("fields", productFields)
  params.set("limit", params.get("limit") || "12")
  const data = await medusa<{ products: HttpTypes.StoreProduct[]; count: number }>(`/store/products?${params}`)
  return { ...data, region }
}

export async function getProduct(countryCode: string, handle: string) {
  const query = new URLSearchParams({ handle, limit: "1" })
  const { products, region } = await listProducts(countryCode, query)
  return { product: products[0] ?? null, region }
}

export async function getCategory(handle: string) {
  const query = new URLSearchParams({ handle, fields: "*category_children,*parent_category" })
  return medusa<{ product_categories: HttpTypes.StoreProductCategory[] }>(`/store/product-categories?${query}`)
    .then(({ product_categories }) => product_categories[0] ?? null)
}

export async function listCategories() {
  return medusa<{ product_categories: HttpTypes.StoreProductCategory[] }>(
    "/store/product-categories?fields=*category_children,*parent_category&limit=100"
  ).then(({ product_categories }) => product_categories)
}

export async function getCollection(handle: string) {
  const query = new URLSearchParams({ handle })
  return medusa<{ collections: HttpTypes.StoreCollection[] }>(`/store/collections?${query}`)
    .then(({ collections }) => collections[0] ?? null)
}

export async function listCollections() {
  return medusa<{ collections: HttpTypes.StoreCollection[] }>(
    "/store/collections?limit=100"
  ).then(({ collections }) => collections)
}

export async function listRegions() {
  return medusa<{ regions: HttpTypes.StoreRegion[] }>("/store/regions")
    .then(({ regions }) => regions)
}

export async function retrieveCart(request: Request) {
  const id = readCookie(request, "_medusa_cart_id")
  if (!id) return null
  return medusa<{ cart: HttpTypes.StoreCart }>(`/store/carts/${id}?fields=${encodeURIComponent(cartFields)}`, {}, request)
    .then(({ cart }) => cart)
    .catch(() => null)
}

export async function retrieveCustomer(request: Request) {
  if (!readCookie(request, "_medusa_jwt")) return null
  return medusa<{ customer: HttpTypes.StoreCustomer }>("/store/customers/me", {}, request)
    .then(({ customer }) => customer)
    .catch(() => null)
}

export async function listShippingOptions(request: Request, cartId: string) {
  return medusa<{ shipping_options: HttpTypes.StoreCartShippingOption[] }>(`/store/shipping-options?cart_id=${encodeURIComponent(cartId)}`, {}, request)
    .then(({ shipping_options }) => shipping_options)
    .catch(() => [])
}

export async function listPaymentProviders(request: Request, regionId: string) {
  return medusa<{ payment_providers: HttpTypes.StorePaymentProvider[] }>(`/store/payment-providers?region_id=${encodeURIComponent(regionId)}`, {}, request)
    .then(({ payment_providers }) => payment_providers)
    .catch(() => [])
}

export async function calculateShippingOption(request: Request, optionId: string, cartId: string) {
  return medusa<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
    `/store/shipping-options/${encodeURIComponent(optionId)}/calculate`,
    { method: "POST", body: JSON.stringify({ cart_id: cartId }) },
    request
  ).then(({ shipping_option }) => shipping_option)
}

export async function authenticateCustomer(email: string, password: string) {
  return medusa<{ token?: string; verification_required?: boolean; verification?: unknown }>("/auth/customer/emailpass", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function registerCustomer(data: { email: string; password: string; first_name: string; last_name: string; phone: string }) {
  const registration = await medusa<{ token: string }>("/auth/customer/emailpass/register", {
    method: "POST",
    body: JSON.stringify({ email: data.email, password: data.password }),
  })
  await medusa("/store/customers", {
    method: "POST",
    headers: { authorization: `Bearer ${registration.token}` },
    body: JSON.stringify({ email: data.email, first_name: data.first_name, last_name: data.last_name, phone: data.phone }),
  })
  return authenticateCustomer(data.email, data.password)
}

export async function submitContactMessage(request: Request, data: Record<string, unknown>) {
  return medusa<{ message: { id: string | null } }>(
    "/store/contact",
    { method: "POST", body: JSON.stringify(data) },
    request
  )
}

export async function listOrders(request: Request) {
  if (!readCookie(request, "_medusa_jwt")) return []
  return medusa<{ orders: HttpTypes.StoreOrder[] }>(
    `/store/orders?limit=100&order=-created_at&fields=${encodeURIComponent("+custom_display_id")}`,
    {},
    request
  )
    .then(({ orders }) => orders)
    .catch(() => [])
}

export async function retrieveOrder(request: Request, id: string) {
  const fields = "+custom_display_id,*payment_collections.payments,*items,*items.metadata,+items.is_tax_inclusive,*items.variant,*items.product,*items.product.type,*shipping_methods,*fulfillments"
  return medusa<{ order: HttpTypes.StoreOrder }>(`/store/orders/${id}?fields=${encodeURIComponent(fields)}`, {}, request)
    .then(({ order }) => order)
}

export async function mutateCart(request: Request, operation: string, payload: Record<string, unknown>) {
  let cartId = readCookie(request, "_medusa_cart_id")
  let created = false

  if (!cartId) {
    const countryCode = String(payload.countryCode || "in")
    const region = await getRegion(countryCode)
    if (!region) throw new Response("Region not found", { status: 404 })
    const { cart } = await medusa<{ cart: HttpTypes.StoreCart }>("/store/carts", {
      method: "POST",
      body: JSON.stringify({ region_id: region.id }),
    }, request)
    cartId = cart.id
    created = true
  }

  if (operation === "add") {
    await medusa(`/store/carts/${cartId}/line-items`, {
      method: "POST",
      body: JSON.stringify({ variant_id: payload.variantId, quantity: payload.quantity }),
    }, request)
  } else if (operation === "add-build") {
    const lines = payload.lines as {
      variantId: string
      quantity: number
      role: string
      label: string
    }[]

    if (!lines.length) {
      throw new Response("Cannot add an empty build", { status: 400 })
    }

    const buildId = `bld_${crypto.randomUUID()}`

    for (const line of lines) {
      await medusa(`/store/carts/${cartId}/line-items`, {
        method: "POST",
        body: JSON.stringify({
          variant_id: line.variantId,
          quantity: line.quantity,
          metadata: {
            build_id: buildId,
            build_role: line.role,
            build_label: line.label,
            ...(line.role === "kit" ? { build_summary: payload.summary } : {}),
          },
        }),
      }, request)
    }
  } else if (operation === "update") {
    await medusa(`/store/carts/${cartId}/line-items/${payload.lineId}`, {
      method: "POST",
      body: JSON.stringify({ quantity: payload.quantity }),
    }, request)
  } else if (operation === "delete") {
    await medusa(`/store/carts/${cartId}/line-items/${payload.lineId}`, { method: "DELETE" }, request)
  } else if (operation === "delete-build") {
    const current = await medusa<{ cart: HttpTypes.StoreCart }>(
      `/store/carts/${cartId}?fields=${encodeURIComponent("id,*items,*items.metadata")}`,
      {},
      request
    )
    const lineIds = (current.cart.items ?? [])
      .filter((item) => item.metadata?.build_id === payload.buildId)
      .map((item) => item.id)

    for (const lineId of lineIds) {
      await medusa(`/store/carts/${cartId}/line-items/${lineId}`, { method: "DELETE" }, request)
    }
  } else if (operation === "update-cart") {
    await medusa(`/store/carts/${cartId}`, { method: "POST", body: JSON.stringify(payload.data) }, request)
  } else if (operation === "addresses") {
    await medusa(`/store/carts/${cartId}`, {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        shipping_address: payload.address,
        billing_address: payload.address,
      }),
    }, request)
  } else if (operation === "shipping") {
    await medusa(`/store/carts/${cartId}/shipping-methods`, {
      method: "POST",
      body: JSON.stringify({ option_id: payload.shippingMethodId }),
    }, request)
  } else if (operation === "promotions") {
    await medusa(`/store/carts/${cartId}`, { method: "POST", body: JSON.stringify({ promo_codes: payload.codes }) }, request)
  } else if (operation === "payment") {
    const current = await medusa<{ cart: HttpTypes.StoreCart }>(`/store/carts/${cartId}`, {}, request)
    let collectionId = current.cart.payment_collection?.id
    if (!collectionId) {
      const created = await medusa<{ payment_collection: { id: string } }>("/store/payment-collections", {
        method: "POST",
        body: JSON.stringify({ cart_id: cartId }),
      }, request)
      collectionId = created.payment_collection.id
    }
    await medusa(`/store/payment-collections/${collectionId}/payment-sessions`, {
      method: "POST",
      body: JSON.stringify(payload.data),
    }, request)
  } else if (operation === "complete") {
    const completed = await medusa<{ type: "order" | "cart"; order?: { id: string; shipping_address?: { country_code?: string } }; cart?: HttpTypes.StoreCart; error?: unknown }>(`/store/carts/${cartId}/complete`, { method: "POST" }, request)
    return { cart: completed.cart ?? null, cartId, created, completed }
  } else {
    throw new Response("Unsupported cart operation", { status: 400 })
  }

  const cart = await medusa<{ cart: HttpTypes.StoreCart }>(`/store/carts/${cartId}?fields=${encodeURIComponent(cartFields)}`, {}, request)
  return { cart: cart.cart, cartId, created, completed: null }
}

const flowHandles = [
  "valy-flow",
  "flow-boot-media",
  "flow-memory",
  "flow-storage-drive",
  "flow-network",
  "flow-graphics",
  "flow-setup",
]

/**
 * The hero's "Starting at" price. Read here rather than in the component so the
 * browser never talks to Medusa directly for it.
 */
export async function getFlowPrice(countryCode: string) {
  return computeFlowPrice(countryCode).catch((error) => {
    /*
     * The hero must still render if Medusa is unreachable: the button falls
     * back to its generic copy rather than taking the whole page down.
     */
    console.error("flow price unavailable:", error)
    return { amount: 0, currencyCode: "inr" }
  })
}

export async function listFlowProducts(countryCode: string) {
  const region = await getRegion(countryCode)
  if (!region) return {} as Record<string, HttpTypes.StoreProduct>

  const params = new URLSearchParams({
    limit: String(flowHandles.length),
    region_id: region.id,
    fields: productFields,
  })
  for (const handle of flowHandles) params.append("handle", handle)

  const { products } = await medusa<{ products: HttpTypes.StoreProduct[] }>(
    `/store/products?${params}`
  )
  return Object.fromEntries(
    products.map((product) => [product.handle, product])
  ) as Record<string, HttpTypes.StoreProduct>
}

async function computeFlowPrice(countryCode: string) {
  const byHandle = await listFlowProducts(countryCode)

  const amountOf = (variant: HttpTypes.StoreProductVariant) =>
    (variant.calculated_price?.calculated_amount as number) ?? 0
  const kits = byHandle["valy-flow"]?.variants ?? []
  const boot = byHandle["flow-boot-media"]?.variants ?? []
  if (!kits.length) return { amount: 0, currencyCode: "inr" }

  return {
    amount: Math.min(...kits.map(amountOf)) + (boot.length ? Math.min(...boot.map(amountOf)) : 0),
    currencyCode: kits[0].calculated_price?.currency_code ?? "inr",
  }
}


const SORT_SCAN_PAGE = 100

async function listProductTypes(): Promise<Record<string, string>> {
  return medusa<{ product_types?: { id: string; value: string }[] }>(
    "/store/product-types?limit=50"
  )
    .then((r) => Object.fromEntries((r.product_types ?? []).map((t) => [t.value, t.id])))
    .catch(() => ({}))
}

export async function listProductsOfType(
  type: "machine" | "part" | "service",
  countryCode: string,
  limit = 12
) {
  const typeId = (await listProductTypes())[type]
  if (!typeId) return []
  const query = new URLSearchParams({ limit: String(limit) })
  query.append("type_id", typeId)
  const { products } = await listProducts(countryCode, query)
  return products
}

export async function listCompatibleParts(machineHandle: string, countryCode: string) {
  const query = new URLSearchParams({ limit: String(SORT_SCAN_PAGE) })
  const { products } = await listProducts(countryCode, query)
  return products.filter((p) => {
    if (p.type?.value !== "part") return false
    const fits = p.metadata?.["fits"]
    return typeof fits === "string" && fits.split(",").some((h) => h.trim() === machineHandle)
  })
}

export async function listCategoryProducts(categoryId: string, countryCode: string, limit = 8) {
  const query = new URLSearchParams({ limit: String(limit) })
  query.append("category_id", categoryId)
  const { products } = await listProducts(countryCode, query)
  return products
}

/**
 * Everything a product template needs beyond the product itself.
 *
 * These used to be `async` components inside the page. React has no way to
 * await a component outside RSC, so each render restarted the fetch and the
 * browser hammered Medusa in a loop. Reading them here means one server call.
 */
export async function getProductExtras(countryCode: string, handle: string) {
  const empty = {
    flowProducts: {} as Record<string, HttpTypes.StoreProduct>,
    services: [] as HttpTypes.StoreProduct[],
    compatibleParts: [] as HttpTypes.StoreProduct[],
    machines: [] as HttpTypes.StoreProduct[],
    sameCategory: [] as HttpTypes.StoreProduct[],
  }
  try {
    const { product } = await getProduct(countryCode, handle)
    if (!product) return empty
    const kind = product.type?.value
    const isFlow = product.metadata?.["configurator"] === "flow"
    const categoryId = product.categories?.find((c) => c.handle !== "parts")?.id

    const [flowProducts, services, compatibleParts, machines, sameCategory] = await Promise.all([
      isFlow ? listFlowProducts(countryCode) : Promise.resolve(empty.flowProducts),
      kind === "machine" ? listProductsOfType("service", countryCode, 6) : Promise.resolve([]),
      kind === "machine" && product.handle
        ? listCompatibleParts(product.handle, countryCode)
        : Promise.resolve([]),
      kind === "part" ? listProductsOfType("machine", countryCode, 20) : Promise.resolve([]),
      kind === "part" && categoryId
        ? listCategoryProducts(categoryId, countryCode, 8)
        : Promise.resolve([]),
    ])
    return { flowProducts, services, compatibleParts, machines, sameCategory }
  } catch (error) {
    console.error("product extras unavailable:", error)
    return empty
  }
}


/**
 * Customer writes, kept on the server.
 *
 * These were `"use server"` actions in the old store. Running them from the
 * browser would put the auth token and publishable key in the client bundle,
 * so they go through `/api/customer` instead.
 */
export async function mutateCustomer(
  request: Request,
  operation: string,
  payload: Record<string, any>
) {
  if (operation === "update") {
    return medusa<{ customer: HttpTypes.StoreCustomer }>("/store/customers/me", {
      method: "POST",
      body: JSON.stringify(payload.body),
    }, request)
  }
  if (operation === "address-add") {
    return medusa<{ customer: HttpTypes.StoreCustomer }>("/store/customers/me/addresses", {
      method: "POST",
      body: JSON.stringify(payload.address),
    }, request)
  }
  if (operation === "address-update") {
    return medusa<{ customer: HttpTypes.StoreCustomer }>(
      `/store/customers/me/addresses/${encodeURIComponent(payload.addressId)}`,
      { method: "POST", body: JSON.stringify(payload.address) },
      request
    )
  }
  if (operation === "address-delete") {
    return medusa<{ customer: HttpTypes.StoreCustomer }>(
      `/store/customers/me/addresses/${encodeURIComponent(payload.addressId)}`,
      { method: "DELETE" },
      request
    )
  }
  throw new Response("Unknown customer operation", { status: 400 })
}


/** Order transfer, which needs the customer's token and so stays server-side. */
export async function mutateOrder(
  request: Request,
  operation: string,
  payload: Record<string, any>
) {
  const id = encodeURIComponent(String(payload.id))
  if (operation === "transfer-request") {
    return medusa<{ order: HttpTypes.StoreOrder }>(
      `/store/orders/${id}/transfer?fields=${encodeURIComponent("id, email")}`,
      { method: "POST", body: JSON.stringify({}) },
      request
    )
  }
  if (operation === "transfer-accept") {
    return medusa<{ order: HttpTypes.StoreOrder }>(
      `/store/orders/${id}/transfer/accept`,
      { method: "POST", body: JSON.stringify({ token: payload.token }) },
      request
    )
  }
  if (operation === "transfer-decline") {
    return medusa<{ order: HttpTypes.StoreOrder }>(
      `/store/orders/${id}/transfer/decline`,
      { method: "POST", body: JSON.stringify({ token: payload.token }) },
      request
    )
  }
  throw new Response("Unknown order operation", { status: 400 })
}
