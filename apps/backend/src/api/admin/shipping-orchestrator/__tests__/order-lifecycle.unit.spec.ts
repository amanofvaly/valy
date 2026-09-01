import { lifecycleOf, orderMoney } from "../order-lifecycle"

/**
 * The ladder is pure, so it can be tested against the exact shapes that caused
 * trouble in production rather than against a mock of the database.
 */

const order = (overrides: Record<string, any> = {}) => ({
  id: "order_1",
  display_id: 1,
  status: "pending",
  canceled_at: null,
  total: 1000,
  currency_code: "inr",
  summary: { refunded_total: 0 },
  items: [
    {
      id: "item_1",
      requires_shipping: true,
      quantity: 1,
      detail: { quantity: 1, fulfilled_quantity: 0 },
    },
  ],
  fulfillments: [],
  payment_collections: [],
  ...overrides,
})

const paid = (captured: number, refunded = 0) => [
  {
    payments: [
      {
        id: "pay_1",
        captures: captured ? [{ amount: captured }] : [],
        refunds: refunded ? [{ amount: refunded }] : [],
      },
    ],
  },
]

const delivered = () => [
  {
    id: "ful_1",
    canceled_at: null,
    data: { shiprocket_awb_codes: "AWB1", shipment_state: "delivered" },
  },
]

describe("orderMoney", () => {
  it("reads money from captures and refunds, not from any status string", () => {
    const m = orderMoney(order({ payment_collections: paid(1000, 250) }))

    expect(m.captured).toBe(1000)
    expect(m.refunded).toBe(250)
    expect(m.held).toBe(750)
    expect(m.customerOwes).toBe(250)
  })

  it("treats everything a cancelled order still holds as owed back", () => {
    const m = orderMoney(
      order({ canceled_at: "2026-09-01", payment_collections: paid(1000) })
    )

    expect(m.refundOwed).toBe(1000)
    expect(m.customerOwes).toBe(0)
  })
})

describe("lifecycleOf", () => {
  /*
   * Production order #1: cancelled, 1672.70 captured, the ledger claiming a
   * full refund, and no refund row anywhere because the provider call failed
   * and the workflow swallowed it.
   */
  it("catches a refund the books claim and the provider never made", () => {
    const life = lifecycleOf(
      order({
        canceled_at: "2026-09-01T03:18:34.665Z",
        total: 1672.7,
        summary: { refunded_total: 1672.7 },
        payment_collections: paid(1672.7, 0),
      })
    )

    expect(life.bucket).toBe("needs_attention")
    expect(life.label).toBe("Refund not issued")
    expect(life.detail).toContain("1672.70")
  })

  it("flags a cancelled order that is simply still holding the money", () => {
    const life = lifecycleOf(
      order({ canceled_at: "2026-09-01", payment_collections: paid(1000) })
    )

    expect(life.bucket).toBe("needs_attention")
    expect(life.label).toBe("Refund owed")
  })

  it("puts a cancelled, fully refunded order to rest", () => {
    const life = lifecycleOf(
      order({
        canceled_at: "2026-09-01",
        summary: { refunded_total: 1000 },
        payment_collections: paid(1000, 1000),
      })
    )

    expect(life.bucket).toBe("completed")
    expect(life.label).toBe("Cancelled")
  })

  it("queues a paid order with unfulfilled lines to ship", () => {
    const life = lifecycleOf(order({ payment_collections: paid(1000) }))

    expect(life.bucket).toBe("to_ship")
    expect(life.label).toBe("Ready to ship")
  })

  it("separates an unpaid order from the shipping queue", () => {
    const life = lifecycleOf(order({ payment_collections: paid(0) }))

    expect(life.bucket).toBe("payment_pending")
    expect(life.label).toBe("Unpaid")
  })

  it("names a part-paid order with both numbers", () => {
    const life = lifecycleOf(order({ payment_collections: paid(400) }))

    expect(life.bucket).toBe("payment_pending")
    expect(life.label).toBe("Part paid")
    expect(life.detail).toContain("400.00")
  })

  it("completes a delivered order that owes nothing", () => {
    const life = lifecycleOf(
      order({
        payment_collections: paid(1000),
        fulfillments: delivered(),
        items: [
          {
            id: "item_1",
            requires_shipping: true,
            quantity: 1,
            detail: { quantity: 1, fulfilled_quantity: 1 },
          },
        ],
      })
    )

    expect(life.bucket).toBe("completed")
    expect(life.label).toBe("Delivered")
  })

  it("raises a delivered order that was never paid for", () => {
    const life = lifecycleOf(
      order({
        payment_collections: paid(0),
        fulfillments: delivered(),
        items: [
          {
            id: "item_1",
            requires_shipping: true,
            quantity: 1,
            detail: { quantity: 1, fulfilled_quantity: 1 },
          },
        ],
      })
    )

    expect(life.bucket).toBe("needs_attention")
    expect(life.label).toBe("Delivered unpaid")
  })

  it("respects a manual completion", () => {
    const life = lifecycleOf(
      order({ status: "completed", payment_collections: paid(1000) })
    )

    expect(life.bucket).toBe("completed")
    expect(life.detail).toBe("Closed by hand")
  })

  /*
   * Production order #1 again, after a human has closed it.
   *
   * Its Cashfree order lives in the sandbox and the live gateway 404s on the
   * id, so the refund the books recorded can never be issued. No automatic
   * rule will ever agree that it is finished, which is exactly why a person
   * has to be able to say so.
   */
  it("lets a person close an order no rule will ever settle", () => {
    const life = lifecycleOf(
      order({
        canceled_at: "2026-09-01T03:18:34.665Z",
        total: 1672.7,
        summary: { refunded_total: 1672.7 },
        payment_collections: paid(1672.7, 0),
        metadata: {
          desk_completed_at: "2026-09-02T10:00:00.000Z",
          desk_completed_by: "user_1",
          desk_completed_note: "Sandbox payment, no real money",
          desk_completed_outstanding: 1672.7,
        },
      })
    )

    expect(life.bucket).toBe("completed")
    expect(life.label).toBe("Closed by hand")
    // It still says what was left, rather than reading as though it balanced.
    expect(life.detail).toContain("1672.70")
    expect(life.detail).toContain("Sandbox payment")
  })

  it("does not invent an outstanding amount when nothing was left", () => {
    const life = lifecycleOf(
      order({
        payment_collections: paid(1000),
        metadata: {
          desk_completed_at: "2026-09-02T10:00:00.000Z",
          desk_completed_note: "Paid by bank transfer",
          desk_completed_outstanding: 0,
        },
      })
    )

    expect(life.bucket).toBe("completed")
    expect(life.detail).toBe("Paid by bank transfer")
  })

  /*
   * Without the epsilon a residue like this parks the order in Refund due
   * for ever, owing four-thousandths of a rupee that can never be returned.
   */
  it("does not mistake a rounding residue for money owed", () => {
    const life = lifecycleOf(
      order({ total: 1000, payment_collections: paid(1000.004) })
    )

    expect(life.bucket).toBe("to_ship")
  })
})
