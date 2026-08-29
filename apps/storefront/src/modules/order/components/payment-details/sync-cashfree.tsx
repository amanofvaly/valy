"use client"

import { sdk } from "@lib/config"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function SyncCashfreePayment({
  orderId,
  hasPaymentDetails,
}: {
  orderId: string
  hasPaymentDetails: boolean
}) {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!hasPaymentDetails && !isSyncing) {
      setIsSyncing(true)
      sdk.client
        .fetch(`/store/orders/${orderId}/sync-cashfree`, {
          method: "POST",
        })
        .then(() => {
          router.refresh()
        })
        .catch((e) => {
          console.error("Failed to sync Cashfree payment", e)
          setIsSyncing(false)
        })
    }
  }, [orderId, hasPaymentDetails, isSyncing, router])

  return null
}
