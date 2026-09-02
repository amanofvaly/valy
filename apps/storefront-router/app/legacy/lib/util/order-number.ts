type OrderNumberSource = {
  custom_display_id?: string | null
  display_id?: string | number
}

/** The one order reference shown to customers and support staff. */
export function orderNumber(order: OrderNumberSource): string {
  if (order.custom_display_id) {
    return order.custom_display_id
  }

  if (order.display_id === undefined) {
    return ""
  }

  /* Stable, one-to-one scrambling for orders created before custom IDs. */
  const sequence = BigInt(order.display_id)
  const scrambled = (sequence * 2_654_435_763n + 1_739_284_051n) % 9_000_000_000n
  return String(scrambled + 1_000_000_000n)
}
