import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { marketPath } from "../../app/lib/market"

export const Route = createFileRoute("/payments/cashfree/return")({
  head: () => ({
    meta: [
      { title: "Confirming payment · Valy" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CashfreeReturn,
})

type ReturnState = "checking" | "framed" | "error"

async function completeOrder() {
  const response = await fetch("/api/cart", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "complete" }),
  })

  if (!response.ok) {
    throw new Error("Order completion failed")
  }

  const result = await response.json() as {
    completed?: {
      order?: {
        id?: string
        shipping_address?: { country_code?: string }
      }
    }
  }
  const order = result.completed?.order

  if (!order?.id) {
    throw new Error("Payment is not ready to complete")
  }

  const countryCode = order.shipping_address?.country_code?.toLowerCase()
  window.location.assign(marketPath(countryCode, `/order/${order.id}/confirmed`))
}

function CashfreeReturn() {
  const [state, setState] = useState<ReturnState>("checking")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    /*
     * Cashfree also loads return_url inside its drop-in modal. The checkout
     * behind that modal is still alive and completes the cart after the SDK
     * resolves, so doing it here as well would race two completion requests.
     */
    if (window.self !== window.top) {
      setState("framed")
      return
    }

    let cancelled = false
    setState("checking")

    completeOrder()
      .catch(() => {
        if (!cancelled) {
          setState("error")
        }
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const waiting = state !== "error"

  return (
    <main
      id="content"
      className="container-prose flex min-h-screen flex-col justify-center py-20"
      aria-busy={waiting}
    >
      <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-strong">
        {waiting && (
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
        )}
      </div>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        {state === "error" ? "We could not confirm your order" : "Confirming your payment"}
      </h1>

      <p className="mt-4 max-w-prose text-base leading-7 text-muted" aria-live="polite">
        {state === "framed"
          ? "Payment received. This window will close automatically."
          : state === "error"
            ? "Your payment may still have succeeded. Try again, or return to checkout without making another payment."
            : "Please keep this page open while we prepare your order confirmation."}
      </p>

      {state === "error" && (
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="button"
            className="action-surface pressable rounded px-5 py-3 text-base font-medium text-paper focus-visible:outline-none"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
          <a
            href="/checkout?step=payment"
            className="pressable rounded px-5 py-3 text-base font-medium text-accent underline decoration-line-strong underline-offset-4 hover:text-accent-strong"
          >
            Return to checkout
          </a>
        </div>
      )}
    </main>
  )
}
