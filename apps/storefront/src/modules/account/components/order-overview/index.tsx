"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import OrderCard from "../order-card"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <ul className="flex w-full flex-col divide-y divide-line border-y border-line">
        {orders.map((order) => (
          <li key={order.id} className="py-6 first:pt-0 last:pb-0">
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-line-strong p-8"
      data-testid="no-orders-container"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-ink">No orders yet</h2>
        <p className="max-w-prose text-sm leading-6 text-muted">
          When you buy something, the invoice and the machine&apos;s test sheet
          both live here.
        </p>
      </div>
      <Button asChild variant="secondary">
        <LocalizedClientLink
          href="/categories/machines"
          data-testid="continue-shopping-button"
        >
          See the machines
        </LocalizedClientLink>
      </Button>
    </div>
  )
}

export default OrderOverview
