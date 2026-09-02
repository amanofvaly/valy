import { orderNumber } from "../order-number"

describe("orderNumber", () => {
  it("uses the stored custom display id", () => {
    expect(orderNumber({ custom_display_id: "8472051936", display_id: 6 }))
      .toBe("8472051936")
  })

  it("gives legacy orders stable non-sequential 10-digit references", () => {
    const first = orderNumber({ display_id: 1 })
    const second = orderNumber({ display_id: 2 })

    expect(first).toMatch(/^\d{10}$/)
    expect(second).toMatch(/^\d{10}$/)
    expect(first).not.toBe(second)
    expect(Number(second) - Number(first)).not.toBe(1)
    expect(orderNumber({ display_id: 1 })).toBe(first)
  })
})
