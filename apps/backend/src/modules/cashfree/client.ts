/**
 * A thin client for Cashfree's Payment Gateway REST API.
 *
 * Written against `fetch` rather than pulling in `cashfree-pg`: the four calls
 * this integration makes are four HTTP requests, and the SDK would add a
 * dependency whose version has to be kept in step with an API that is already
 * versioned by a header.
 *
 * That header is the important part. Cashfree pins request and response shapes
 * to `x-api-version`, so the version is set once here and can be moved with an
 * environment variable if a field this code reads is ever changed under it.
 */

export type CashfreeMode = "sandbox" | "production"

export type CashfreeOptions = {
  /** Cashfree app id. `x-client-id`. */
  appId: string
  /** Cashfree secret key. `x-client-secret`, and the webhook signing key. */
  secretKey: string
  /** Which of Cashfree's two environments to talk to. */
  mode: CashfreeMode
  /** Pinned API version. Cashfree keeps old versions working; move it on purpose. */
  apiVersion?: string
  /**
   * Where Cashfree sends the customer back after a bank page or a UPI app.
   * `{order_id}` is substituted by Cashfree itself.
   */
  returnUrl?: string
  /** Where Cashfree posts webhooks. Optional: it can also be set in their dashboard. */
  notifyUrl?: string
}

const BASE_URL: Record<CashfreeMode, string> = {
  sandbox: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
}

export type CashfreeOrder = {
  cf_order_id: string
  order_id: string
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED"
  order_amount: number
  order_currency: string
  payment_session_id?: string
  order_expiry_time?: string
  order_tags?: Record<string, string> | null
}

export type CashfreePayment = {
  cf_payment_id: string
  order_id: string
  payment_status:
    | "SUCCESS"
    | "NOT_ATTEMPTED"
    | "FAILED"
    | "USER_DROPPED"
    | "VOID"
    | "CANCELLED"
    | "PENDING"
  payment_amount: number
  payment_currency: string
  payment_group?: string
  payment_method?: Record<string, unknown>
  payment_time?: string
  payment_message?: string
}

export type CashfreeRefund = {
  cf_refund_id: string
  refund_id: string
  order_id: string
  refund_amount: number
  refund_status: "SUCCESS" | "PENDING" | "CANCELLED" | "ONHOLD" | "FAILED"
}

export class CashfreeApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly type?: string

  constructor(
    message: string,
    status: number,
    code?: string,
    type?: string
  ) {
    super(message)
    this.name = "CashfreeApiError"
    this.status = status
    this.code = code
    this.type = type
  }
}

export class CashfreeClient {
  readonly #options: CashfreeOptions

  constructor(options: CashfreeOptions) {
    this.#options = options
  }

  get mode(): CashfreeMode {
    return this.#options.mode
  }

  async #request<T>(
    path: string,
    init?: { method?: string; body?: unknown; idempotencyKey?: string }
  ): Promise<T> {
    const response = await fetch(`${BASE_URL[this.#options.mode]}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "x-api-version": this.#options.apiVersion ?? "2023-08-01",
        "x-client-id": this.#options.appId,
        "x-client-secret": this.#options.secretKey,
        "content-type": "application/json",
        ...(init?.idempotencyKey
          ? { "x-idempotency-key": init.idempotencyKey }
          : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : {}

    if (!response.ok) {
      /*
       * Cashfree's errors carry a machine-readable `code` and a `message`
       * written for a developer. Both are kept: the code is what a caller
       * should branch on, the message is what ends up in the log when
       * somebody is trying to work out why a payment did not go through.
       */
      throw new CashfreeApiError(
        payload?.message ?? `Cashfree request failed (${response.status})`,
        response.status,
        payload?.code,
        payload?.type
      )
    }

    return payload as T
  }

  createOrder(body: {
    order_id: string
    order_amount: number
    order_currency: string
    customer_details: {
      customer_id: string
      customer_phone: string
      customer_email?: string
      customer_name?: string
    }
    order_meta?: {
      return_url?: string
      notify_url?: string
    }
    order_tags?: Record<string, string>
    order_note?: string
  }): Promise<CashfreeOrder> {
    /*
     * The order id is the idempotency key. Medusa retries a failed checkout
     * step by calling the same provider method again with the same session,
     * and without this a customer who pressed the button twice would end up
     * with two Cashfree orders for one cart.
     */
    return this.#request<CashfreeOrder>("/orders", {
      method: "POST",
      body,
      idempotencyKey: body.order_id,
    })
  }

  getOrder(orderId: string): Promise<CashfreeOrder> {
    return this.#request<CashfreeOrder>(`/orders/${encodeURIComponent(orderId)}`)
  }

  getOrderPayments(orderId: string): Promise<CashfreePayment[]> {
    return this.#request<CashfreePayment[]>(
      `/orders/${encodeURIComponent(orderId)}/payments`
    )
  }

  refund(
    orderId: string,
    body: { refund_amount: number; refund_id: string; refund_note?: string }
  ): Promise<CashfreeRefund> {
    return this.#request<CashfreeRefund>(
      `/orders/${encodeURIComponent(orderId)}/refunds`,
      { method: "POST", body, idempotencyKey: body.refund_id }
    )
  }

  /**
   * Every refund Cashfree holds against this order.
   *
   * The one call that can answer "did the money actually leave". Creating a
   * refund is not proof: the POST usually comes back `PENDING` and settles
   * days later, and a refund that Medusa recorded can be missing here
   * entirely if the request failed and the failure was swallowed upstream.
   */
  getOrderRefunds(orderId: string): Promise<CashfreeRefund[]> {
    return this.#request<CashfreeRefund[]>(
      `/orders/${encodeURIComponent(orderId)}/refunds`
    )
  }
}
