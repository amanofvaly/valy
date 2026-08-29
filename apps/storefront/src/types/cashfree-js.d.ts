/**
 * Types for `@cashfreepayments/cashfree-js`, which ships none.
 *
 * Deliberately narrow: this describes the part of the SDK this storefront
 * actually uses — creating element components, mounting them, and paying with
 * one — rather than guessing at the whole surface. A wrong-but-complete
 * declaration is worse than a small true one, because the compiler would then
 * vouch for calls nobody has checked against the real thing.
 *
 * If a call is needed that is not here, add it here first, from Cashfree's
 * documentation, and let the type error be the reminder.
 */
declare module "@cashfreepayments/cashfree-js" {
  /** Element kinds this integration mounts. */
  export type CashfreeComponentName =
    | "cardNumber"
    | "cardHolder"
    | "cardExpiry"
    | "cardCvv"
    | "savePaymentInstrument"
    | "upiCollect"
    | "upiApp"
    | "upiQr"

  export type CashfreeComponentOptions = {
    values?: Record<string, unknown>
    style?: Record<string, unknown>
  }

  export type CashfreeComponentState = {
    value?: Record<string, unknown>
    complete?: boolean
    invalid?: boolean
    empty?: boolean
    ready?: boolean
    error?: { message?: string }
  }

  export type CashfreeComponent = {
    /** CSS selector of the node to render into. */
    mount: (selector: string) => void
    unmount?: () => void
    /** True once the field holds a value the SDK considers valid. */
    isComplete?: () => boolean
    /** The current value, where the component exposes one. */
    data?: () => CashfreeComponentState
    /** `change`, `ready`, `loaderror`, `focus`, `blur`. */
    on: (
      event: string,
      handler: (data: CashfreeComponentState) => void
    ) => void
    /** Used to tell the CVV field how many digits the card takes. */
    update: (options: Record<string, unknown>) => void
  }

  export type CashfreePayOptions = {
    /** The component to charge. For a card this is the `cardNumber` one. */
    paymentMethod: CashfreeComponent
    /** From the Medusa payment session's data, created by our backend. */
    paymentSessionId: string
    /** `_modal` keeps a 3-D Secure page inside the current page. */
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement
    savePaymentInstrument?: CashfreeComponent
    returnUrl?: string
  }

  export type CashfreePayResult = {
    error?: { code?: string; type?: string; message?: string }
    redirect?: boolean
    paymentDetails?: { paymentMessage?: string }
  } | null

  /**
   * Options for the drop-in, which needs only the session.
   *
   * The contrast with `CashfreePayOptions` is the point: `pay()` charges a
   * component this page built and is therefore only as good as the field state
   * it can read back out of the iframes, while `checkout()` hands the whole
   * form to Cashfree and needs nothing but the session id.
   */
  export type CashfreeCheckoutOptions = {
    /** From the Medusa payment session's data, created by our backend. */
    paymentSessionId: string
    /** `_modal` keeps Cashfree's form inside the current page. */
    redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement
    returnUrl?: string
  }

  export type CashfreeCheckoutResult = {
    error?: { code?: string; type?: string; message?: string }
    redirect?: boolean
    paymentDetails?: { paymentMessage?: string }
  } | null

  export type Cashfree = {
    create: (
      name: CashfreeComponentName,
      options?: CashfreeComponentOptions
    ) => CashfreeComponent
    pay: (options: CashfreePayOptions) => Promise<CashfreePayResult>
    checkout: (
      options: CashfreeCheckoutOptions
    ) => Promise<CashfreeCheckoutResult>
  }

  export function load(options: {
    mode: "sandbox" | "production"
  }): Promise<Cashfree>
}
