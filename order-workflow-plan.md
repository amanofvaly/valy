Make the fulfillment screen an actual order-management screen

     Context

     The custom screen at src/admin/routes/fulfillment/ was built to
     answer one question:                   
     "which parcels do I need to send today?" Its API
     (src/api/admin/shipping-orchestrator/shipments/route.ts)
     says so in its own header comment — the unit is an order, but only
     ever as shipping work.

     Cancel was later bolted onto it. Nothing else about an order's
     life was, and the
     seams now show. Concretely, observed on production this session:

     - Order #1 was cancelled and stayed in "To ship" forever.
       bucketOf() never
       looked at canceled_at, so a dead order kept its unfulfilled
       lines, stayed
       outstanding, and kept inflating the tab count. (Patched locally
       this session,
       uncommitted — see "Existing local changes".)
     - Its payment reads partially_captured when ₹1,672.70 was captured
       in full.
       That is Medusa's getLastPaymentStatus arithmetic: cancelling the
       order cancels
       the payment collection, which is then subtracted from the
       denominator
       (totalPaymentExceptCanceled = 1 - 1 = 0), so captured === 0 is
       false and it
       falls to the "partially" branch. The label is an artifact, not a
       description of
       the money.
     - The books say the money was refunded. It never was. See below —
       this is the
       most serious defect found, and it is a money-losing bug, not a
       UI one.
     - There is no home for a completed order. Tabs are To ship /
       Awaiting pickup /
       In transit / Delivered / All. Delivered is a shipping state; an
       order that was
       refunded, or delivered and paid for and done, has no resting
       place.

     The user's summary, which is correct: "nothing is easy to
     understand about orders,
     payments, shipping, refunds, cancellations, deliveries." The
     screen is a shipping
     queue wearing the name of an order manager.

     The phantom refund (highest priority — verified on production)

     Cancelling an order from the shipping screen calls
     cancelOrderWorkflow, which
     already chains into refundCapturedPaymentsWorkflow →
     refundPaymentsWorkflow.
     That workflow's step catches provider errors, logs them, and
     filters to the
     successes — so the endpoint returns {ok: true} whether or not any
     money moved.

     Measured on order #1 (order_01M16ZB2CJTRC4MFQSMQSEBXNH):

     ┌──────────────────────────────────┬─────────────────────────────┐
     │             Evidence             │            Value            │
     ├──────────────────────────────────┼─────────────────────────────┤
     │ Refund order-transaction         │ ordtrx_01M1DFKJ…, −1672.70, │
     │                                  │  written 03:18:34.410Z      │
     ├──────────────────────────────────┼─────────────────────────────┤
     │ canceled_at                      │ 03:18:34.665Z — 255 ms      │
     │                                  │ later, same operation       │
     ├──────────────────────────────────┼─────────────────────────────┤
     │ summary.refunded_total           │ 1672.70                     │
     ├──────────────────────────────────┼─────────────────────────────┤
     │ refund rows on the payment       │ none — refunds: []          │
     ├──────────────────────────────────┼─────────────────────────────┤
     │ Payment data.refund_id /         │ all null                    │
     │ cf_refund_id / refund_status     │                             │
     ├──────────────────────────────────┼─────────────────────────────┤
     │ Cashfree GET                     │ [] (HTTP 200)               │
     │ /pg/orders/…/refunds             │                             │
     └──────────────────────────────────┴─────────────────────────────┘

     Medusa's ledger says fully refunded. Cashfree issued no refund.
     The customer's
     money never moved. On a live order this would be a customer who
     was charged,
     told they were refunded, and never paid back — with the admin
     agreeing they had
     been. Nothing in the UI would ever reveal it.

     Exact mechanism (read from core source, not inferred)

     refundPaymentsWorkflow
     (core-flows/dist/payment/workflows/refund-payments.js)
     does two things in sequence:

     1. refundPaymentsStep(input) — and that step is
        paymentModule.refundPayment(...).catch(e => logger.error(...)),
        then filters
        to the successes. A provider throw becomes a log line.
     2. addOrderTransactionStep(orderTransactionData) — where
        orderTransactionData
        is transformed from input, the intended refunds, and never from
        refundedPayments, the ones that actually worked.

     So the −₹1,672.70 ledger row was written from intent, with no
     reference to whether
     Cashfree did anything. cancelOrderWorkflow →
     refundCapturedPaymentsWorkflow
     chains straight into this. This is core Medusa behaviour, not a
     defect this
     project introduced — but calling cancelOrderWorkflow from our own
     cancel
     endpoint is what exposes us to it.

     The fix follows directly

     The singular refundPaymentWorkflow behaves correctly. Its
     refundPaymentStep is a bare await
     paymentModule.refundPayment(input) with no
     catch (and deliberately no compensation — "the actual funds have
     already been
     sent"), and its addOrderTransactionStep runs after that step
     succeeds. A
     provider failure therefore throws and writes no ledger row.

     So: stop relying on cancelOrderWorkflow's implicit plural refund.
     The cancel
     endpoint should explicitly run refundPaymentWorkflow per captured
     payment first,
     surfacing any provider error to the operator, and only then cancel
     the order — by
     which point the implicit path finds capturedAmount -
     refundedAmount <= 0 and
     correctly does nothing.

     Two further consequences for the design:

     1. A refund is not "done" because a workflow returned.
        Reconciliation against the
        provider is the only source of truth, and the queue must show
        refunds that were
        claimed but not confirmed.
     2. The obvious refund-owed signal does not catch this case. The
        stock dashboard
        treats summary.pending_difference < 0 as "a refund is owed".
        Order #1 reports
        pending_difference: +1672.70. So a "needs refund" bucket built
        on that field
        alone would miss exactly the order that most needs it.
        Bucketing has to compare
        captured-minus-actually-refunded at the payment level, not
        trust the summary.

     Second money bug: a retried refund pays twice

     src/modules/cashfree/service.ts:367-372 builds the Cashfree refund
     id as
     `${orderId}-r-${Date.now()}`, with a comment claiming it is
     "stable for a
     retry of the same one". Date.now() makes it the opposite of
     stable, and
     client.ts:192 passes it as the x-idempotency-key.

     Medusa already hands the provider a genuinely stable key —
     payment-module.js:512-519 passes context: { idempotency_key:
     refund.id },
     the Medusa refund row id — and refundPayment never reads
     input.context.

     So retrying a refund issues a second real refund. Directly
     relevant, because
     this plan involves retrying order #1's refund and adding a retry
     action to the UI.
     Fix: use input.context.idempotency_key as refund_id (format fits —
     Cashfree
     allows alphanumeric/underscore/hyphen and a Medusa ref_01M… id is
     ~30 chars).

     Related, lower severity, same file:
     - Refunds are asynchronous (refund_status ∈
       SUCCESS|PENDING|CANCELLED|ONHOLD|FAILED),
       the POST typically returns PENDING, and nothing ever polls.
       client.ts has no
       getRefund. A refund that later fails at Cashfree is invisible.
     - getWebhookActionAndData ignores REFUND_STATUS_WEBHOOK.
     - It throws raw CashfreeApiError, not MedusaError, so the admin
       gets a bare 500
       with none of Cashfree's message. Providers added later should
       not repeat this.

     Also found (decide in/out of scope)

     src/api/store/orders/[id]/sync-cashfree/route.ts has no caller
     anywhere in the
     repo and no authentication — it sits under /store/, and Medusa's
     core store
     middlewares do not authenticate /store/orders/:id/*. Anyone
     holding the
     publishable key, which ships in the storefront bundle, can POST an
     arbitrary order
     id and make the backend write to that payment's data. Recommend
     deleting it.

     Intended outcome

     One screen that shows the true state of every order across
     payment, shipping and
     refund, with the actions that move an order between those states,
     and a resting
     place for orders that are finished. Refunds must work through the
     payment
     provider abstraction, not against Cashfree directly — three more
     providers are
     planned.

     Already shipped this session (commit 376f70b)

     The cancelled-order bug is fixed, committed and pushed to main (so
     it is either
     deployed or on its way via Actions + Watchtower). This plan builds
     on top of it:

     - src/api/admin/shipping-orchestrator/shipments/route.ts — added a
       "canceled"
       bucket, canceled_at to the query.graph fields, and
       HIDDEN_BUCKETS
       (["no_shipping", "canceled"]) applied to both the row filter and
       the counts.
     - src/admin/components/shipments-view.tsx — cancelEffect() returns
       {allowed: false, reason: "Already cancelled"} for that bucket;
       the status badge
       renders a grey "Cancelled" instead of the raw bucket string.

     Lint and tsc --noEmit both pass with these in place. Note the
     deliberate gap:
     there is still no "Cancelled" tab, so cancelled orders are
     reachable only under
     "All". Whether that stays is a question for this plan.

     ---

     (Remainder of plan pending codebase exploration.)