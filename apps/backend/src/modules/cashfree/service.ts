import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { createHmac, randomUUID, timingSafeEqual } from "crypto"
import {
  CashfreeApiError,
  CashfreeClient,
  CashfreeOptions,
  CashfreeOrder,
} from "./client"

type InjectedDependencies = {
  logger: Logger
}

/**
 * Cashfree Payments as a Medusa payment provider.
 *
 * The integration is deliberately "elements"-shaped rather than hosted: this
 * service only ever creates an order and reads its state back. The card, UPI
 * and netbanking inputs are Cashfree components mounted inside our own
 * checkout by the storefront, so the page the customer pays on is ours, in our
 * type, with our button — and no card number ever reaches our servers.
 *
 * Two facts drive the design:
 *
 * 1. A Cashfree order is immutable. Its amount cannot be edited, so a changed
 *    cart total means a new order, which is what `updatePayment` does.
 *
 * 2. Cashfree captures on success by default. There is no separate capture
 *    call for the normal flow, so `capturePayment` confirms rather than acts,
 *    and `authorizePayment` returning `captured` is the truth rather than an
 *    optimisation.
 *
 * The order id is the Medusa payment session id. Medusa passes it in as
 * `data.session_id` when it creates the session, and using it as Cashfree's
 * `order_id` means every later lookup — a status poll, a refund, a webhook
 * arriving hours after the tab was closed — maps back to one Medusa session
 * without a table in between.
 */
class CashfreePaymentService extends AbstractPaymentProvider<CashfreeOptions> {
  static identifier = "cashfree"

  readonly #client: CashfreeClient
  readonly #options: CashfreeOptions
  readonly #logger: Logger

  static validateOptions(options: CashfreeOptions): void {
    if (!options.appId || !options.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Cashfree needs both an app id and a secret key. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY."
      )
    }

    if (options.mode !== "sandbox" && options.mode !== "production") {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        `Cashfree mode must be "sandbox" or "production", got "${options.mode}".`
      )
    }

    /*
     * Cashfree's own key prefixes say which environment a key belongs to, and
     * a test key in production is a store that cannot take money while looking
     * like it can. Checked at boot, where it is a startup error, rather than
     * at checkout, where it is a lost order.
     */
    const isTestKey =
      options.appId.startsWith("TEST") || options.secretKey.includes("_test_")

    if (options.mode === "production" && isTestKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Cashfree is in production mode with a test key. Payments would be accepted and never settle."
      )
    }

    if (options.mode === "sandbox" && !isTestKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Cashfree is in sandbox mode with a live key. Refusing to send real cards to the test environment."
      )
    }
  }

  constructor(container: InjectedDependencies, options: CashfreeOptions) {
    super(container, options)

    this.#options = options
    this.#logger = container.logger
    this.#client = new CashfreeClient(options)
  }

  /* ---------------------------------------------------------------------- */
  /*  Helpers                                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Medusa amounts are decimals in the currency's major unit, which is also
   * what Cashfree wants — rupees, not paise. The rounding is defensive: a
   * total that arrives as 1299.0000000001 out of a tax calculation is rejected
   * by Cashfree as an invalid amount.
   */
  #toAmount(amount: unknown): number {
    const value = Number(new BigNumber(amount as never).numeric)

    if (!Number.isFinite(value) || value <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cashfree cannot charge an amount of "${String(amount)}".`
      )
    }

    return Math.round(value * 100) / 100
  }

  #orderIdFrom(data: Record<string, unknown> | undefined): string {
    const orderId = (data?.order_id ?? data?.session_id) as string | undefined

    if (!orderId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "This payment session has no Cashfree order id on it."
      )
    }

    return orderId
  }

  /**
   * Cashfree's order state, in Medusa's vocabulary.
   *
   * `ACTIVE` is the interesting one: it means the order exists and has not
   * been paid, which covers both "the customer has not started" and "the
   * customer is on their bank's page right now". Both are `pending` — the
   * difference between them is not something the order endpoint knows.
   */
  #statusOf(order: CashfreeOrder): PaymentSessionStatus {
    switch (order.order_status) {
      case "PAID":
        return PaymentSessionStatus.CAPTURED
      case "ACTIVE":
        return PaymentSessionStatus.PENDING
      case "EXPIRED":
      case "TERMINATED":
      case "TERMINATION_REQUESTED":
        return PaymentSessionStatus.CANCELED
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async #order(orderId: string): Promise<CashfreeOrder> {
    try {
      return await this.#client.getOrder(orderId)
    } catch (error) {
      if (error instanceof CashfreeApiError && error.status === 404) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Cashfree has no order "${orderId}".`
        )
      }

      throw error
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Lifecycle                                                              */
  /* ---------------------------------------------------------------------- */

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const sessionId = input.data?.session_id as string | undefined

    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Medusa did not provide a session id to key the Cashfree order on."
      )
    }

    const customer = input.context?.customer

    /*
     * Cashfree requires a phone number on every order and rejects the request
     * without one. Checkout collects it, but a cart assembled another way
     * might not have, so there is a placeholder rather than a 400 at the last
     * step of a purchase. Cashfree treats it as a contact detail, not as a
     * verification factor.
     */
    const phone =
      customer?.phone ??
      (customer?.billing_address?.phone as string | undefined) ??
      "0000000000"

    const order = await this.#client.createOrder({
      order_id: sessionId,
      order_amount: this.#toAmount(input.amount),
      order_currency: input.currency_code.toUpperCase(),
      customer_details: {
        // Cashfree wants a stable id per customer; a guest gets the session's.
        customer_id: customer?.id ?? sessionId,
        customer_phone: phone,
        customer_email: customer?.email ?? undefined,
        customer_name:
          [customer?.first_name, customer?.last_name]
            .filter(Boolean)
            .join(" ") || undefined,
      },
      order_meta: {
        return_url: this.#options.returnUrl,
        notify_url: this.#options.notifyUrl,
      },
      order_tags: {
        medusa_session_id: sessionId,
      },
    })

    return {
      id: order.order_id,
      status: PaymentSessionStatus.PENDING,
      data: {
        order_id: order.order_id,
        cf_order_id: order.cf_order_id,
        /*
         * The storefront needs this to mount Cashfree's components and call
         * `pay()`. It is short-lived and scoped to one order, so it is safe to
         * hand to the browser — it is what the SDK is designed to receive.
         */
        payment_session_id: order.payment_session_id,
        mode: this.#client.mode,
        order_status: order.order_status,
        order_amount: order.order_amount,
        order_currency: order.order_currency,
      },
    }
  }

  /**
   * A Cashfree order's amount cannot be edited, so an updated cart total gets
   * a new order. The old one is left to expire: it was never paid, and there
   * is nothing to release.
   */
  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    const existing = input.data as Record<string, unknown> | undefined
    const amount = this.#toAmount(input.amount)

    if (
      existing?.order_id &&
      existing?.order_amount === amount &&
      String(existing?.order_currency).toUpperCase() ===
        input.currency_code.toUpperCase()
    ) {
      return { data: existing }
    }

    const initiated = await this.initiatePayment({
      amount: input.amount,
      currency_code: input.currency_code,
      context: input.context,
      /*
       * A new Cashfree order needs a new id, because the old one is taken by
       * the order this is replacing. The session id stays in the tags so the
       * two are still traceable to one checkout.
       */
      data: {
        ...existing,
        session_id: `${existing?.session_id ?? randomUUID()}-${Date.now()}`,
      },
    })

    return { data: { ...initiated.data, session_id: existing?.session_id } }
  }

  /**
   * Authorising is asking Cashfree what happened.
   *
   * The storefront has already driven the payment through Cashfree's SDK by
   * the time this runs, so there is nothing to start here — only the question
   * of whether the money moved, which exactly one party is entitled to answer.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const orderId = this.#orderIdFrom(input.data)
    const order = await this.#order(orderId)

    return {
      status: this.#statusOf(order),
      data: {
        ...input.data,
        order_status: order.order_status,
        order_amount: order.order_amount,
        cf_order_id: order.cf_order_id,
      },
    }
  }

  /**
   * Cashfree captures on success, so by the time Medusa asks, the money has
   * either moved or the order was never paid. Reporting a capture for an
   * unpaid order would mark an order paid in Medusa that no bank agrees with.
   */
  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const orderId = this.#orderIdFrom(input.data)
    const order = await this.#order(orderId)

    if (order.order_status !== "PAID") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cashfree order "${orderId}" is ${order.order_status}, not PAID, so there is nothing to capture.`
      )
    }

    return {
      data: {
        ...input.data,
        order_status: order.order_status,
        captured_at: new Date().toISOString(),
      },
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const orderId = this.#orderIdFrom(input.data)
    const amount = this.#toAmount(input.amount)

    const refund = await this.#client.refund(orderId, {
      refund_amount: amount,
      // Unique per refund, and stable for a retry of the same one.
      refund_id: `${orderId}-r-${Date.now()}`,
      refund_note: "Refunded from Medusa",
    })

    return {
      data: {
        ...input.data,
        refund_id: refund.refund_id,
        cf_refund_id: refund.cf_refund_id,
        refund_status: refund.refund_status,
        refund_amount: refund.refund_amount,
      },
    }
  }

  /**
   * There is no "cancel" for a Cashfree order that was never paid: it expires
   * on its own, and an unpaid order holds nothing that needs releasing. An
   * order that *was* paid must be refunded instead, and saying otherwise here
   * would let Medusa cancel an order the customer has been charged for.
   */
  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const orderId = (input.data as Record<string, unknown> | undefined)
      ?.order_id as string | undefined

    if (!orderId) {
      return { data: input.data ?? {} }
    }

    const order = await this.#order(orderId).catch(() => null)

    if (order?.order_status === "PAID") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cashfree order "${orderId}" has been paid. Refund it rather than cancelling it.`
      )
    }

    return { data: { ...input.data, order_status: order?.order_status } }
  }

  /** Nothing to delete: an abandoned order expires by itself. */
  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const orderId = this.#orderIdFrom(input.data)
    const [order, payments] = await Promise.all([
      this.#order(orderId),
      this.#client.getOrderPayments(orderId).catch(() => []),
    ])

    return {
      data: {
        ...input.data,
        order_status: order.order_status,
        order_amount: order.order_amount,
        cf_order_id: order.cf_order_id,
        payments,
      },
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const orderId = this.#orderIdFrom(input.data)
    const order = await this.#order(orderId)

    return {
      status: this.#statusOf(order),
      data: { ...input.data, order_status: order.order_status },
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Webhooks                                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * Cashfree signs `timestamp + rawBody` with the merchant secret, HMAC-SHA256,
   * base64. The raw body matters: re-serialising the parsed JSON produces a
   * different string and every signature fails.
   */
  #signatureIsValid(payload: ProviderWebhookPayload["payload"]): boolean {
    const headers = payload.headers as Record<string, string | undefined>
    const signature = headers?.["x-webhook-signature"]
    const timestamp = headers?.["x-webhook-timestamp"]

    if (!signature || !timestamp) {
      return false
    }

    const raw =
      typeof payload.rawData === "string"
        ? payload.rawData
        : Buffer.from(payload.rawData as Uint8Array).toString("utf8")

    const expected = createHmac("sha256", this.#options.secretKey)
      .update(`${timestamp}${raw}`)
      .digest("base64")

    const received = Buffer.from(signature)
    const computed = Buffer.from(expected)

    // Lengths differ on a malformed header, and timingSafeEqual throws on that.
    return (
      received.length === computed.length &&
      timingSafeEqual(received, computed)
    )
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const ignored: WebhookActionResult = {
      action: "not_supported",
      data: { session_id: "", amount: new BigNumber(0) },
    }

    if (!this.#signatureIsValid(payload)) {
      /*
       * Unsigned or wrongly signed: treated as noise, not as a failure. A
       * "failed" here would mark a real payment session failed on the word of
       * whoever posted to the endpoint.
       */
      this.#logger.warn(
        "[cashfree] Rejected a webhook whose signature did not verify."
      )
      return ignored
    }

    const body = payload.data as {
      type?: string
      data?: {
        order?: { order_id?: string; order_amount?: number }
        payment?: { payment_status?: string; payment_amount?: number }
      }
    }

    const orderId = body?.data?.order?.order_id
    const amount =
      body?.data?.payment?.payment_amount ?? body?.data?.order?.order_amount

    if (!orderId || amount === undefined) {
      return ignored
    }

    // The Cashfree order id *is* the Medusa payment session id. See the class
    // comment: that is why it was set that way at initiation.
    const data = { session_id: orderId, amount: new BigNumber(amount) }

    switch (body.type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        return { action: "captured", data }
      case "PAYMENT_FAILED_WEBHOOK":
        return { action: "failed", data }
      case "PAYMENT_USER_DROPPED_WEBHOOK":
        // Not a failure of the payment — the customer walked away and may come
        // back to the same session.
        return { action: "not_supported", data }
      default:
        return { action: "not_supported", data }
    }
  }
}

export default CashfreePaymentService
