import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import AccountPageHeader from "@modules/account/components/page-header"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      {/* The old copy offered "returns or exchanges" here. There is no exchange
          flow, and a return is a seven-day window handled by email — so it says
          that instead of pointing at a button that does not exist. */}
      <AccountPageHeader
        title="Orders"
        description="Every order, its invoice and the test sheet for the machine. To return something inside the seven-day window, email support@valy.in."
      />

      <div className="flex flex-col gap-10">
        <OrderOverview orders={orders} />
        <div className="border-t border-line pt-8">
          <TransferRequestForm />
        </div>
      </div>
    </div>
  )
}
