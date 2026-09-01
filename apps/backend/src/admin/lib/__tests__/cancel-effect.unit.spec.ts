import { cancelEffect, formatMoney, Shipment } from "../orders"

const row = (overrides: Partial<Shipment> = {}): Shipment =>
  ({
    order_id: "order_1",
    display_id: 1,
    email: "a@b.com",
    city: "Bengaluru",
    postal_code: "560001",
    created_at: new Date().toISOString(),
    customer: "Pay Test",
    total: 1000,
    currency_code: "inr",
    status: "pending",
    canceled_at: null,
    bucket: "to_ship",
    label: "Ready to ship",
    detail: "Paid",
    tone: "orange",
    captured: 1000,
    refunded: 0,
    customer_owes: 0,
    refund_owed: 0,
    phantom_refund: 0,
    items: [],
    awb: null,
    quoted_courier: null,
    booked_courier: null,
    courier_match: null,
    chargeable_weight_kg: null,
    shipment_status_label: null,
    shipment_states: [],
    ...overrides,
  }) as Shipment

describe("cancelEffect", () => {
  it("refuses an order that is already cancelled", () => {
    const effect = cancelEffect(row({ canceled_at: "2026-09-01" }))

    expect(effect.allowed).toBe(false)
    expect(effect.reason).toBe("Already cancelled")
  })

  it("refuses an order that has been delivered", () => {
    const effect = cancelEffect(row({ shipment_states: ["delivered"] }))

    expect(effect.allowed).toBe(false)
    expect(effect.reason).toBe("Already delivered")
  })

  /*
   * Shiprocket can only cancel before collection. Past that the way back is an
   * RTO, and a button that looked like it worked would leave a cancelled order
   * and a parcel still travelling to the customer.
   */
  it("refuses once the courier has the parcel", () => {
    const effect = cancelEffect(
      row({
        shipment_states: ["out_for_delivery"],
        shipment_status_label: "OUT FOR DELIVERY",
      })
    )

    expect(effect.allowed).toBe(false)
    expect(effect.reason).toContain("RTO")
  })

  it("allows one still waiting for pickup, and says the freight comes back", () => {
    const effect = cancelEffect(
      row({ shipment_states: ["awaiting_pickup"], awb: "AWB1" })
    )

    expect(effect.allowed).toBe(true)
    expect(effect.where).toBe("Shiprocket + Medusa")
    expect(effect.reason).toContain("freight")
  })

  it("allows one that never reached Shiprocket at all", () => {
    const effect = cancelEffect(row())

    expect(effect.allowed).toBe(true)
    expect(effect.where).toBe("Medusa only")
  })

  it("refuses an order already closed out by hand", () => {
    const effect = cancelEffect(row({ status: "completed" }))

    expect(effect.allowed).toBe(false)
    expect(effect.reason).toBe("Already completed")
  })
})

describe("formatMoney", () => {
  it("formats rupees, because amounts arrive as decimals not paise", () => {
    expect(formatMoney(1672.7, "inr")).toContain("1,672.70")
  })

  it("falls back to INR when a row carries no currency", () => {
    expect(formatMoney(10)).toContain("10.00")
  })
})
