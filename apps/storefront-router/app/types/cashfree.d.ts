declare module "@cashfreepayments/cashfree-js" {
  type CheckoutResult = { error?: { message?: string } } | undefined
  type Cashfree = {
    checkout(options: { paymentSessionId: string; redirectTarget: "_modal" | "_self" | "_blank" }): Promise<CheckoutResult>
  }
  export function load(options: { mode: "sandbox" | "production" }): Promise<Cashfree>
}
