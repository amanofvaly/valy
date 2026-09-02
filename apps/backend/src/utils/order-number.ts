type OrderNumberSource = {
  custom_display_id?: string | null
  display_id: string | number
}

/** The customer-visible reference used by the order desk as well. */
export function orderNumber(order: OrderNumberSource): string {
  if (order.custom_display_id) {
    return order.custom_display_id
  }

  const sequence = BigInt(order.display_id)
  const scrambled = (sequence * 2_654_435_763n + 1_739_284_051n) % 9_000_000_000n
  return String(scrambled + 1_000_000_000n)
}
