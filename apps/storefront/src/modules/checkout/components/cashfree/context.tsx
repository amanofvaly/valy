"use client"

import { load } from "@cashfreepayments/cashfree-js"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

/**
 * The Cashfree SDK, shared between the step that collects the payment details
 * and the button that submits them.
 *
 * Those are two different components in two different steps of the checkout —
 * the fields live under "Payment", the button lives under "Review" — and
 * Cashfree's `pay()` needs both at once: the component the customer filled in,
 * and the click that submits it. Rather than hoist the whole payment form into
 * the review step, or duplicate the button, the mounted component is registered
 * here and the button asks for it.
 *
 * This is also why the SDK is loaded once at this level. `load()` injects a
 * script; calling it per component would mount several copies of it on one
 * page, and the components created by one instance cannot be paid with
 * another.
 */

type CashfreeSdk = Awaited<ReturnType<typeof load>>

/** A component that can be handed to `pay()` as the `paymentMethod`. */
export type PayableComponent = {
  isComplete?: () => boolean
} & Record<string, unknown>

export type CashfreeMethod = "card" | "upi"

type PayResult = { ok: true } | { ok: false; message: string }

type CashfreeContextValue = {
  /** Null until the script has loaded, or forever if it failed to. */
  sdk: CashfreeSdk | null
  loadError: string | null
  /** Which method the customer is filling in. */
  method: CashfreeMethod
  setMethod: (method: CashfreeMethod) => void
  /** The mounted component for the current method, and whether it is fillable. */
  register: (method: CashfreeMethod, component: PayableComponent | null) => void
  ready: boolean
  setReady: (ready: boolean) => void
  /** Desktop QR starts payment from its own preview, not the footer action. */
  usesInlineQrAction: boolean
  setUsesInlineQrAction: (usesInlineQrAction: boolean) => void
  paymentSessionId: string | null
  /** Runs the payment. Resolves only once Cashfree has an outcome. */
  pay: (paymentSessionId: string) => Promise<PayResult>
}

const CashfreeContext = createContext<CashfreeContextValue | null>(null)

export const useCashfree = () => useContext(CashfreeContext)

export const CashfreeProvider = ({
  mode,
  paymentSessionId,
  initialMethod = "card",
  children,
}: {
  mode: "sandbox" | "production"
  paymentSessionId: string | null
  initialMethod?: CashfreeMethod
  children: React.ReactNode
}) => {
  const [sdk, setSdk] = useState<CashfreeSdk | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [method, setMethod] = useState<CashfreeMethod>(initialMethod)
  const [ready, setReady] = useState(false)
  const [usesInlineQrAction, setUsesInlineQrAction] = useState(false)

  /*
   * A ref, not state: the component is an imperative handle from the SDK, it
   * is not rendered, and re-rendering the tree every time a field is mounted
   * would remount the fields.
   */
  const components = useRef<Partial<Record<CashfreeMethod, PayableComponent>>>(
    {}
  )

  useEffect(() => {
    let cancelled = false

    load({ mode })
      .then((instance) => {
        if (!cancelled) {
          setSdk(instance)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load the payment form."
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [mode])

  const register = useCallback(
    (forMethod: CashfreeMethod, component: PayableComponent | null) => {
      if (component) {
        components.current[forMethod] = component
      } else {
        delete components.current[forMethod]
      }
    },
    []
  )

  const pay = useCallback(
    async (paymentSessionId: string): Promise<PayResult> => {
      const component = components.current[method]

      if (!sdk || !component) {
        return { ok: false, message: "The payment form is not ready yet." }
      }

      try {
        /*
         * `_modal` keeps the bank's 3-D Secure page inside this page rather
         * than navigating away from a checkout that has not been completed in
         * Medusa yet. Where a method insists on a full redirect — a UPI intent
         * handing off to an app on a phone — Cashfree falls back to the order's
         * `return_url`, which points at this step, and the review step
         * finishes the order when the customer lands back on it.
         */
        const result = await sdk.pay({
          paymentMethod: component as never,
          paymentSessionId,
          redirectTarget: "_modal",
        } as never)

        const error = (result as { error?: { message?: string } })?.error

        if (error) {
          return {
            ok: false,
            message: error.message ?? "The payment was not completed.",
          }
        }

        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "The payment could not be completed.",
        }
      }
    },
    [method, sdk]
  )

  const value = useMemo(
    () => ({
      sdk,
      loadError,
      method,
      setMethod: (next: CashfreeMethod) => {
        setReady(false)
        setMethod(next)
      },
      register,
      ready,
      setReady,
      usesInlineQrAction,
      setUsesInlineQrAction,
      paymentSessionId,
      pay,
    }),
    [
      sdk,
      loadError,
      method,
      register,
      ready,
      usesInlineQrAction,
      paymentSessionId,
      pay,
    ]
  )

  return (
    <CashfreeContext.Provider value={value}>
      {children}
    </CashfreeContext.Provider>
  )
}
