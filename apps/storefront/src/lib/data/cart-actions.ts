"use server"

import { sdk } from "@lib/config"
import compareAddresses from "@lib/util/compare-addresses"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { retrieveCart } from "./cart"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { retrieveCustomer } from "./customer"
import { getLocale } from "./locale-actions"
import { getRegion } from "./regions"

/**
 * Cart mutations. These are the only exports that need to be server actions,
 * which is why they are in their own file: `"use server"` on the reads file
 * published every read as a POST endpoint too.
 *
 * None of them call `revalidateTag`. There is no data cache to invalidate any
 * more — the 28 calls that used to be spread through here named per-visitor
 * tags that no read had ever registered, six of them naming a `fulfillment-*`
 * tag that never existed, and several able to fire as `revalidateTag("")`.
 * `revalidatePath` is used where a mutation must refresh what is on screen,
 * because that clears the Next router cache the visitor actually has.
 */

const CART_PATHS = ["/[countryCode]/cart", "/[countryCode]/checkout"]

/**
 * A text field out of a form.
 *
 * `FormData.get` returns `FormDataEntryValue`, which is a string *or a File*.
 * Every address field below is a text input, so the File case cannot occur —
 * but saying so once here is better than thirty casts, and it means an
 * unexpected File becomes an empty string rather than something the backend has
 * to reject.
 */
const text = (formData: FormData, key: string): string => {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

/** Refresh the surfaces that show cart state after a mutation. */
const refreshCartSurfaces = () => {
  // The layout renders the cart badge on every page, so the whole tree.
  revalidatePath("/[countryCode]", "layout")
  CART_PATHS.forEach((path) => revalidatePath(path))
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")
  const headers = { ...(await getAuthHeaders()) }

  if (!cart) {
    const locale = await getLocale()
    const { cart: created } = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = created
    await setCartId(cart.id)
  }

  if (cart && cart.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  return sdk.store.cart
    .update(cartId, data, {}, { ...(await getAuthHeaders()) })
    .then(({ cart }) => {
      refreshCartSurfaces()
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      { variant_id: variantId, quantity },
      {},
      { ...(await getAuthHeaders()) }
    )
    .then(refreshCartSurfaces)
    .catch(medusaError)
}

/**
 * Adds a configured Valy Flow to the cart as a group of line items.
 *
 * The machine, its memory, its drives and its setup are separate products —
 * see the note at the top of `valy-flow-catalogue.ts` for why a variant matrix
 * was not an option — so a build is several lines rather than one. What holds
 * them together is `build_id`: a single random id written into every line's
 * metadata, which the cart and the checkout summary group on so the visitor
 * sees one machine with its specification under it rather than six unrelated
 * products that happen to be in the basket together.
 *
 * The lines are created in sequence, not in parallel. Medusa recalculates cart
 * totals, tax and promotions on every line item write, and firing six of those
 * concurrently at one cart is how you get lost updates.
 */
export async function addFlowBuildToCart({
  lines,
  summary,
  countryCode,
}: {
  lines: { variantId: string; quantity: number; role: string; label: string }[]
  summary: string
  countryCode: string
}) {
  if (!lines.length) {
    throw new Error("Cannot add an empty build to the cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const buildId = `bld_${crypto.randomUUID()}`
  const headers = { ...(await getAuthHeaders()) }

  try {
    for (const line of lines) {
      await sdk.store.cart.createLineItem(
        cart.id,
        {
          variant_id: line.variantId,
          quantity: line.quantity,
          metadata: {
            build_id: buildId,
            build_role: line.role,
            build_label: line.label,
            // Only the machine carries the summary, so a template reading it
            // off the group's lead line gets exactly one answer.
            ...(line.role === "kit" ? { build_summary: summary } : {}),
          },
        },
        {},
        headers
      )
    }
  } catch (error) {
    return medusaError(error)
  }

  refreshCartSurfaces()
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, { ...(await getAuthHeaders()) })
    .then(refreshCartSurfaces)
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, { ...(await getAuthHeaders()) })
    .then(refreshCartSurfaces)
    .catch(medusaError)
}

/**
 * Removes a whole configured build.
 *
 * The lines of a build are not independently meaningful — a Flow without its
 * boot drive is not a cheaper Flow, it is an incomplete one — so a build has no
 * per-line quantity control and is removed as a unit. Someone who wants two
 * machines configures twice, which is also the only way to have them differ.
 *
 * Deletes run in sequence for the same reason the adds do: every line item
 * write recalculates the cart, and concurrent writes to one cart lose updates.
 */
export async function removeBuildFromCart(buildId: string) {
  if (!buildId) {
    throw new Error("Missing build ID when removing a build")
  }

  const cart = await retrieveCart(undefined, "id,*items,*items.metadata")

  if (!cart) {
    throw new Error("No cart to remove a build from")
  }

  const lineIds = (cart.items ?? [])
    .filter((item) => item.metadata?.["build_id"] === buildId)
    .map((item) => item.id)

  if (!lineIds.length) {
    return
  }

  const headers = { ...(await getAuthHeaders()) }

  try {
    for (const lineId of lineIds) {
      await sdk.store.cart.deleteLineItem(cart.id, lineId, {}, headers)
    }
  } catch (error) {
    return medusaError(error)
  }

  refreshCartSurfaces()
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  return sdk.store.cart
    .addShippingMethod(
      cartId,
      { option_id: shippingMethodId },
      {},
      { ...(await getAuthHeaders()) }
    )
    .then(refreshCartSurfaces)
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, { ...(await getAuthHeaders()) })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, { ...(await getAuthHeaders()) })
    .then(refreshCartSurfaces)
    .catch(medusaError)
}

export async function submitPromotionForm(
  _currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string

  try {
    await applyPromotions([code])
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

/**
 * Writes the checkout address onto the cart, and the GSTIN into
 * `cart.metadata`.
 *
 * Two inputs collapse into one value here — billing wins, because that is the
 * entity the invoice is raised against. The backend validates the format in
 * `workflows/cart-validate.ts` and derives `is_b2b` in
 * `subscribers/order-placed.ts`.
 */
export async function setAddresses(_currentState: unknown, formData: FormData) {
  let updatedCart: HttpTypes.StoreCart
  let countryCode: string

  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }

    const cartId = await getCartId()

    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    countryCode = text(
      formData,
      "shipping_address.country_code"
    ).toLowerCase()

    if (!countryCode) {
      throw new Error("Please select a delivery country")
    }

    const shippingAddress = {
      first_name: text(formData, "shipping_address.first_name"),
      last_name: text(formData, "shipping_address.last_name"),
      address_1: text(formData, "shipping_address.address_1"),
      address_2: "",
      company: text(formData, "shipping_address.company"),
      postal_code: text(formData, "shipping_address.postal_code"),
      city: text(formData, "shipping_address.city"),
      country_code: countryCode,
      province: text(formData, "shipping_address.province"),
      phone: text(formData, "shipping_address.phone"),
    }

    const sameAsBilling = formData.get("same_as_billing") === "on"

    const data: HttpTypes.StoreUpdateCart = {
      shipping_address: shippingAddress,
      billing_address: sameAsBilling
        ? shippingAddress
        : {
            first_name: text(formData, "billing_address.first_name"),
            last_name: text(formData, "billing_address.last_name"),
            address_1: text(formData, "billing_address.address_1"),
            address_2: "",
            company: text(formData, "billing_address.company"),
            postal_code: text(formData, "billing_address.postal_code"),
            city: text(formData, "billing_address.city"),
            country_code: text(formData, "billing_address.country_code"),
            province: text(formData, "billing_address.province"),
            phone: text(formData, "billing_address.phone"),
          },
      email: text(formData, "email"),
      metadata: {
        // Billing wins: that is the entity the invoice is raised against, and
        // the backend derives `is_b2b` from it.
        gstin:
          text(formData, "billing_address.gstin") ||
          text(formData, "shipping_address.gstin") ||
          null,
      },
    }

    updatedCart = await updateCart(data)

    if (formData.get("save_address") === "on") {
      await saveCheckoutAddressToAccount(shippingAddress)
    }
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }

  return {
    cart: updatedCart,
    countryCode,
  }
}

/**
 * Copies the address just used at checkout into the customer's address book.
 *
 * Checkout writes to the cart, which is a different record from the account's
 * address list — so without this an address entered at checkout is never
 * offered again on the next order.
 *
 * Saving is best-effort on purpose: a customer who ticked a convenience box
 * should never have their checkout fail because the address book write did.
 */
async function saveCheckoutAddressToAccount(
  address: Record<string, unknown>
): Promise<void> {
  try {
    const customer = await retrieveCustomer()

    if (!customer) {
      return
    }

    // Do not accumulate duplicates when the customer checks out repeatedly
    // with the same address.
    const alreadySaved = (customer.addresses ?? []).some((saved) =>
      compareAddresses(saved, address)
    )

    if (alreadySaved) {
      return
    }

    await sdk.store.customer.createAddress(
      {
        first_name: (address.first_name as string) || "",
        last_name: (address.last_name as string) || "",
        company: (address.company as string) || "",
        address_1: (address.address_1 as string) || "",
        address_2: (address.address_2 as string) || "",
        city: (address.city as string) || "",
        postal_code: (address.postal_code as string) || "",
        province: (address.province as string) || "",
        country_code: (address.country_code as string) || "",
        phone: (address.phone as string) || "",
        // First saved address becomes the default so it is preselected next time.
        is_default_shipping: (customer.addresses ?? []).length === 0,
      },
      {},
      { ...(await getAuthHeaders()) }
    )
  } catch {
    // Swallowed deliberately — see the note above.
  }
}

export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, { ...(await getAuthHeaders()) })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    await removeCartId()
    refreshCartSurfaces()

    redirect(`/${countryCode}/order/${cartRes.order.id}/confirmed`)
  }

  return cartRes.cart
}

/** Move the cart to a different region, then land on the same page there. */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
  }

  redirect(`/${countryCode}${currentPath}`)
}
