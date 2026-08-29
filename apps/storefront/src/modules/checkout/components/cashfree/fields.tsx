"use client"

import { cn } from "@lib/util/cn"
import { placeOrder } from "@lib/data/cart-actions"
import { Button } from "@modules/common/components/ui"
import { useCallback, useEffect, useRef, useState } from "react"
import ErrorMessage from "../error-message"
import { CashfreeMethod, useCashfree } from "./context"

/**
 * The payment form, in our type.
 *
 * Cashfree's card inputs are their iframes — they have to be, or the card
 * number would touch our page and drag the whole storefront into PCI scope —
 * but everything around them is ours: the method chooser, the labels, the
 * layout, the ground the fields sit on. The `style` object below is how the
 * inside of each iframe is made to match: the same 16px, the same border, the
 * same radius, the same focus ring as every other input on the site.
 *
 * The 16px is not a preference. iOS Safari zooms the page when a field with
 * type smaller than 16px is focused, and a checkout that zooms on the card
 * number is a checkout that loses the rest of the form off the side of the
 * screen.
 */

/*
 * Literals, not tokens, and unavoidably so: this object is serialised and sent
 * into a cross-origin iframe, which cannot read the stylesheet's custom
 * properties. Each value is the hex of the token it stands for, and they have
 * to be updated together:
 *
 *   #15181c  --ink            #cbcfd4  --line-strong
 *   #666c75  --muted          #da291c  --accent
 *   #9b2226  --danger         #ffffff  --paper
 */
const ELEMENT_STYLE = {
  base: {
    fontSize: "16px",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    color: "#15181c",
    backgroundColor: "#ffffff",
    border: "1px solid #cbcfd4",
    borderRadius: "6px",
    padding: "12px",
    ":focus": {
      border: "1px solid #da291c",
    },
    "::placeholder": {
      color: "#666c75",
    },
  },
  invalid: {
    color: "#9b2226",
    border: "1px solid #9b2226",
  },
}

const METHODS: { id: CashfreeMethod; label: string; hint: string }[] = [
  { id: "card", label: "Card", hint: "Credit or debit" },
  { id: "upi", label: "UPI", hint: "Any UPI app" },
]

/**
 * The four UPI apps worth naming, plus the drawer for everything else.
 *
 * `default` opens the phone's own intent chooser, which is what someone using
 * BHIM, Amazon Pay, Cred or their bank's app needs — naming three and leaving
 * the rest to a fourth tile is how every Indian checkout does it, because the
 * top three cover most people and the drawer covers everyone.
 */
const UPI_APPS = [
  { id: "gpay", label: "Google Pay" },
  { id: "phonepe", label: "PhonePe" },
  { id: "paytm", label: "Paytm" },
  { id: "default", label: "Other apps" },
]

const QR_TTL_SECONDS = 10 * 60

const CashfreeFields = ({
  showMethodChooser = true,
  autoStartQr = false,
  showUpiCollectFallback = true,
}: {
  showMethodChooser?: boolean
  autoStartQr?: boolean
  showUpiCollectFallback?: boolean
}) => {
  const cashfree = useCashfree()
  const mounted = useRef(false)
  const autoQrStarted = useRef(false)

  /*
   * `upiApp` is mobile-only — Cashfree's component throws into `loaderror` if
   * it is mounted on a desktop, because there is no app to hand off to. So the
   * two halves of UPI are split by input device rather than by preference: a
   * phone gets the app buttons, a desktop gets a QR code to point a phone at.
   *
   * Read once, in an effect, because it is a browser fact and this component
   * is server-rendered first.
   */
  const [isTouch, setIsTouch] = useState<boolean | null>(null)
  const [upiApp, setUpiApp] = useState("gpay")
  const [showCollect, setShowCollect] = useState(false)
  const [showingQr, setShowingQr] = useState(false)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_TTL_SECONDS)
  const [qrError, setQrError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches)
  }, [])

  const sdk = cashfree?.sdk
  const method = cashfree?.method
  const register = cashfree?.register
  const setReady = cashfree?.setReady
  const setUsesInlineQrAction = cashfree?.setUsesInlineQrAction

  useEffect(() => {
    setUsesInlineQrAction?.(
      method === "upi" && isTouch === false && !showCollect
    )

    return () => setUsesInlineQrAction?.(false)
  }, [setUsesInlineQrAction, method, isTouch, showCollect])

  useEffect(() => {
    if (!showingQr || qrSecondsLeft === 0) {
      return
    }

    const timer = window.setInterval(() => {
      setQrSecondsLeft((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [showingQr, qrSecondsLeft])

  useEffect(() => {
    if (!sdk || !method || !register || !setReady) {
      return
    }

    /*
     * React 18's development double-invoke would mount two sets of iframes
     * into the same nodes. The guard is on the effect rather than on the
     * elements because the SDK has no "already mounted" state to ask about.
     */
    if (mounted.current) {
      return
    }
    mounted.current = true

    const created: { unmount?: () => void }[] = []
    let readinessTimer: number | undefined

    if (method === "card") {
      const number = sdk.create("cardNumber", {
        values: { placeholder: "1234 5678 9012 3456" },
        style: ELEMENT_STYLE,
      })
      const holder = sdk.create("cardHolder", {
        values: { placeholder: "Name on the card" },
        style: ELEMENT_STYLE,
      })
      const expiry = sdk.create("cardExpiry", { style: ELEMENT_STYLE })
      const cvv = sdk.create("cardCvv", { style: ELEMENT_STYLE })

      number.mount("#cf-card-number")
      holder.mount("#cf-card-holder")
      expiry.mount("#cf-card-expiry")
      cvv.mount("#cf-card-cvv")

      number.on("change", (data) => {
        const value = data.value as
          | { brand?: string; cvvLength?: number }
          | undefined
        // Amex takes a four-digit code; the CVV field has to be told.
        if (value?.cvvLength) {
          cvv.update({ cvvLength: value.cvvLength })
        }
        setCardBrand(value?.brand ?? null)
      })

      register("card", number as never)
      const refreshReadiness = () => {
        setReady(
          Boolean(
            number.isComplete?.() &&
              holder.isComplete?.() &&
              expiry.isComplete?.() &&
              cvv.isComplete?.()
          )
        )
      }

      // Cashfree updates iframe validation state asynchronously. Polling its
      // documented isComplete() API avoids reading the previous value inside
      // a change callback while still keeping an empty or invalid form locked.
      readinessTimer = window.setInterval(refreshReadiness, 200)
      refreshReadiness()
      created.push(number, holder, expiry, cvv)
    }

    if (method === "upi") {
      if (showCollect) {
        // The fallback: a typed UPI id. Kept, because it is the only thing
        // that works when someone is paying from a desktop with no phone to
        // hand, or from an app none of the tiles name.
        const collect = sdk.create("upiCollect", {
          values: { placeholder: "yourname@bank" },
          style: ELEMENT_STYLE,
        })

        collect.mount("#cf-upi-collect")
        collect.on("change", () => setReady(Boolean(collect.isComplete?.())))

        register("upi", collect as never)
        created.push(collect)
      } else if (isTouch) {
        // One component at a time, recreated when the choice changes, so
        // exactly one app is ever registered to pay with.
        const app = sdk.create("upiApp", {
          values: { upiApp, buttonIcon: true },
          style: ELEMENT_STYLE,
        })

        app.on("loaderror", () => setReady(false))
        app.mount("#cf-upi-app")
        app.on("ready", () => setReady(true))

        register("upi", app as never)
        created.push(app)
      } else {
        const qr = sdk.create("upiQr", { values: { size: "240px" } })

        qr.mount("#cf-upi-qr")
        // A QR has nothing to complete: it is ready as soon as it is drawn.
        qr.on("ready", () => setReady(true))

        register("upi", qr as never)
        created.push(qr)
      }
    }

    return () => {
      mounted.current = false
      if (readinessTimer) {
        window.clearInterval(readinessTimer)
      }
      register(method, null)
      created.forEach((component) => component.unmount?.())
    }
  }, [sdk, method, register, setReady, isTouch, upiApp, showCollect])

  const setReadySafely = () => cashfree?.setReady(false)

  const handleShowQr = useCallback(async () => {
    const paymentSessionId = cashfree?.paymentSessionId

    if (!paymentSessionId) {
      setQrError("The payment session is not ready yet. Refresh and try again.")
      return
    }

    setQrError(null)
    setQrSecondsLeft(QR_TTL_SECONDS)
    setShowingQr(true)

    const result = await cashfree?.pay(paymentSessionId)

    if (!result?.ok) {
      setQrError(result?.message ?? "The payment could not be started.")
      setShowingQr(false)
      return
    }

    if (!mounted.current) {
      return
    }

    await placeOrder().catch((error: Error) => {
      setQrError(error.message)
      setShowingQr(false)
    })
  }, [cashfree])

  useEffect(() => {
    if (
      !autoStartQr ||
      autoQrStarted.current ||
      method !== "upi" ||
      isTouch !== false ||
      !cashfree?.ready
    ) {
      return
    }

    autoQrStarted.current = true
    void handleShowQr()
  }, [autoStartQr, cashfree?.ready, handleShowQr, isTouch, method])

  if (!cashfree) {
    return null
  }

  if (cashfree.loadError) {
    return (
      <p role="alert" className="text-sm leading-6 text-danger">
        {cashfree.loadError} Reload the page to try again.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {showMethodChooser && (
        <div role="tablist" aria-label="Payment method" className="flex gap-2">
          {METHODS.map((option) => (
            <button
              key={option.id}
              role="tab"
              type="button"
              aria-selected={cashfree.method === option.id}
              onClick={() => cashfree.setMethod(option.id)}
              className={cn(
                "flex-1 rounded-lg border px-4 py-3 text-left transition-colors",
                cashfree.method === option.id
                  ? "border-accent bg-accent-wash"
                  : "border-line bg-paper hover:border-line-strong"
              )}
              data-testid={`cashfree-method-${option.id}`}
            >
              <span className="block text-sm font-medium text-ink">
                {option.label}
              </span>
              <span className="block text-xs leading-5 text-muted">
                {option.hint}
              </span>
            </button>
          ))}
        </div>
      )}

      {/*
       * The mount points. They keep their own height so the layout does not
       * jump when the iframes arrive, and they are always rendered for the
       * active method — an element cannot be mounted into a node that is not
       * in the document.
       */}
      {cashfree.method === "card" ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-4 text-sm font-medium text-ink">
              <span>Card number</span>
              {cardBrand && (
                <span className="font-normal capitalize text-signal">
                  {cardBrand} detected
                </span>
              )}
            </span>
            <div id="cf-card-number" className="min-h-[46px]" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Name on card</span>
            <div id="cf-card-holder" className="min-h-[46px]" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Expiry</span>
              <div id="cf-card-expiry" className="min-h-[46px]" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">CVV</span>
              <div id="cf-card-cvv" className="min-h-[46px]" />
            </label>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {showCollect ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">UPI ID</span>
              <div id="cf-upi-collect" className="min-h-[46px]" />
              <span className="text-xs leading-5 text-muted">
                A request goes to your UPI app. Approve it there, then come back
                to this page.
              </span>
            </label>
          ) : isTouch ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {UPI_APPS.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    aria-pressed={upiApp === app.id}
                    onClick={() => setUpiApp(app.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                      upiApp === app.id
                        ? "border-accent bg-accent-wash text-ink"
                        : "border-line bg-paper text-muted hover:border-line-strong"
                    )}
                    data-testid={`cashfree-upi-${app.id}`}
                  >
                    {app.label}
                  </button>
                ))}
              </div>
              <div id="cf-upi-app" className="min-h-[46px]" />
              <p className="text-xs leading-5 text-muted">
                Placing the order opens{" "}
                {UPI_APPS.find((a) => a.id === upiApp)?.label}. Approve the
                request there and you will come back here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-line bg-surface p-4">
              <div className="relative h-[240px] w-[240px]">
                <div id="cf-upi-qr" className="h-[240px] w-[240px]" />
                {!showingQr && !autoStartQr && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      variant="action"
                      size="large"
                      onClick={handleShowQr}
                      disabled={!cashfree.ready}
                      data-testid="cashfree-show-qr"
                    >
                      Show QR
                    </Button>
                  </div>
                )}
              </div>
              <p className="max-w-[34ch] text-center text-xs leading-5 text-muted">
                {showingQr
                  ? "Scan with any UPI app. This page will finish the order after payment."
                  : "Select Show QR when you are ready to scan and pay."}
              </p>
              {showingQr && (
                <p
                  className={cn(
                    "font-mono text-xs tabular-nums",
                    qrSecondsLeft === 0 ? "text-danger" : "text-muted"
                  )}
                  role={qrSecondsLeft === 0 ? "alert" : undefined}
                  aria-live="polite"
                >
                  {qrSecondsLeft === 0
                    ? "QR expired"
                    : `Expires in ${String(
                        Math.floor(qrSecondsLeft / 60)
                      ).padStart(2, "0")}:${String(
                        qrSecondsLeft % 60
                      ).padStart(2, "0")}`}
                </p>
              )}
              <ErrorMessage
                error={qrError}
                data-testid="cashfree-qr-error"
              />
            </div>
          )}

          {/*
           * The typed-address route, demoted to what it is: the thing you fall
           * back to when the tiles or the code cannot work. It used to be the
           * only UPI option here, which put the least-used method in front of
           * everyone.
           */}
          {showUpiCollectFallback && (
          <button
            type="button"
            onClick={() => {
              setReadySafely()
              setShowCollect((v) => !v)
            }}
            className="pressable-tint self-start rounded text-xs text-muted underline underline-offset-4 hover:text-ink"
            data-testid="cashfree-upi-toggle-collect"
          >
            {showCollect
              ? isTouch
                ? "Pay with a UPI app instead"
                : "Show the QR code instead"
              : "Pay to a UPI ID instead"}
          </button>
          )}
        </div>
      )}

      {!sdk && (
        <p className="text-sm leading-6 text-muted">
          Loading the payment form…
        </p>
      )}
    </div>
  )
}

export default CashfreeFields
