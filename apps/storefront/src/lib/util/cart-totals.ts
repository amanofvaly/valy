/**
 * Totals helpers shared by the mini cart, the cart page and checkout.
 *
 * Medusa exposes the same cart in two bases at once, and picking the wrong
 * field silently changes what a number means:
 *
 *   item_total          items INCLUDING tax   (₹1000 — the MRP on the product page)
 *   item_subtotal       items with tax REMOVED (₹847.46)
 *   subtotal            item_subtotal + shipping_subtotal, both net of tax
 *
 * When prices are tax-inclusive — which they must be in India, where MRP is
 * legally inclusive of all taxes — only the gross figures mean anything to a
 * customer. A "subtotal" that quietly strips GST out of a ₹1000 price, or folds
 * shipping in, is not a number anyone asked to see.
 */

type TotalsLike = {
  items?: { is_tax_inclusive?: boolean | null }[] | null
  item_total?: number | null
  item_subtotal?: number | null
  shipping_total?: number | null
  discount_total?: number | null
  tax_total?: number | null
  total?: number | null
  currency_code: string
}

/**
 * Whether this cart's prices already contain tax.
 *
 * Read off the line items rather than hardcoded, so a store selling into a
 * tax-exclusive region still renders correctly.
 */
export const isTaxInclusiveCart = (cart?: TotalsLike | null): boolean =>
  !!cart?.items?.some((i) => i.is_tax_inclusive)

/**
 * The value of the goods, in the same basis the customer saw on the product
 * page and on the line item. Never includes shipping.
 */
export const goodsTotal = (cart?: TotalsLike | null): number =>
  (isTaxInclusiveCart(cart) ? cart?.item_total : cart?.item_subtotal) ?? 0

/**
 * Shipping in the same basis as the goods, so the rows in one table can be
 * added up by eye. `shipping_total` includes tax; `shipping_subtotal` does not.
 */
export const shippingTotal = (cart?: TotalsLike | null): number =>
  cart?.shipping_total ?? 0

/**
 * True once the cart carries enough information for shipping and tax to be
 * real numbers. Before an address and a delivery method exist they are not
 * zero — they are unknown, and rendering them as ₹0.00 states something false.
 */
export const hasDeliveryDetails = (
  cart?: (TotalsLike & {
    shipping_methods?: unknown[] | null
    shipping_address?: unknown | null
  }) | null
): boolean =>
  !!cart?.shipping_address && !!cart?.shipping_methods?.length

export type { TotalsLike }
