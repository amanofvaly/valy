"use client"

import { transferCart } from "@lib/data/customer-actions"
import { ExclamationCircleSolid } from "@medusajs/icons"
import { StoreCart, StoreCustomer } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useState } from "react"
function CartMismatchBanner(props: {
  customer: StoreCustomer
  cart: StoreCart
}) {
  const { customer, cart } = props
  const [isPending, setIsPending] = useState(false)
  const [actionText, setActionText] = useState("Run transfer again")

  if (!customer || !!cart.customer_id) {
    return
  }

  const handleSubmit = async () => {
    try {
      setIsPending(true)
      setActionText("Transferring..")

      await transferCart()
    } catch {
      setActionText("Run transfer again")
      setIsPending(false)
    }
  }

  return (
    // `bg-warn` on `text-warn` was the same colour on itself, so this banner was
    // a solid brown bar with invisible text in it.
    <div
      role="status"
      className="border-b border-warn/25 bg-warn-wash"
    >
      <div className="container-page flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2.5 text-center text-sm text-warn">
        <span className="flex items-center gap-1.5">
          <ExclamationCircleSolid className="inline shrink-0" />
          We could not move your cart onto your account.
        </span>

        <Button
          variant="link"
          size="small"
          className="text-warn hover:text-warn"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {actionText}
        </Button>
      </div>
    </div>
  )
}

export default CartMismatchBanner
