# Cashfree payments

Cards and UPI, taken on our own checkout page.

## Why this shape

Cashfree offers three levels of integration. This is the middle one, on purpose:

| | UI control | Card data touches us |
|---|---|---|
| Hosted checkout / Drop-in | none — their page, their type | no |
| **Elements (this)** | **everything except the inside of four inputs** | **no** |
| Direct payment API | total | yes, and with it PCI DSS SAQ-D |

The card number, name, expiry and CVV are Cashfree iframes, styled from
`fields.tsx` to match the site's own inputs. Everything else — the method
chooser, the labels, the layout, the button, the error copy — is ours. No card
number reaches our servers or our logs, so the storefront stays out of PCI
scope, and the customer never leaves our page.

## How the pieces fit

```
storefront                     backend                        Cashfree
──────────                     ───────                        ────────
select Cashfree
  └─ initiatePaymentSession ──▶ initiatePayment ────────────▶ POST /pg/orders
                                                              ◀── payment_session_id
  ◀── session.data ────────────┘
mount card / UPI elements
press "Place order"
  └─ cashfree.pay(sessionId) ─────────────────────────────────▶ charges the card
                                                                (3-D Secure in a modal)
  └─ placeOrder ──────────────▶ authorizePayment ────────────▶ GET /pg/orders/{id}
                                  └─ PAID → captured           ◀── order_status
                                order created
```

The order is created against Cashfree's answer, never against the browser's
claim about it. A customer who closes the 3-D Secure modal gets an error and no
order; a payment that succeeded but whose browser never came back is picked up
by the webhook.

**The Cashfree `order_id` is the Medusa payment session id.** Medusa passes it
in as `data.session_id` when it creates the session, and using it as the order
id means every later lookup — a status poll, a refund, a webhook arriving hours
after the tab closed — maps back to one Medusa session with no table in
between.

## Configuration

| Variable | Notes |
|---|---|
| `CASHFREE_APP_ID` | `x-client-id` |
| `CASHFREE_SECRET_KEY` | `x-client-secret`, and the webhook signing key |
| `CASHFREE_MODE` | `sandbox` \| `production`. Defaults from `NODE_ENV` |
| `CASHFREE_API_VERSION` | Optional. Defaults to `2023-08-01` |
| `CASHFREE_NOTIFY_URL` | Optional. Can also be set in Cashfree's dashboard |

The provider refuses to boot on a key that does not match the mode — a test key
in production, or a live key in sandbox. That is a startup crash on deploy
rather than a store that looks like it is taking money and is not.

## Going live

1. **Keys.** Put the production app id and secret in the environment. Do not set
   `CASHFREE_MODE`; `NODE_ENV=production` selects the right one, and the key
   check will stop the boot if the pair is wrong.
2. **Enable it on the region.** Registering the provider does not make it
   selectable — a region has to link to it:
   ```
   pnpm exec medusa exec ./src/scripts/enable-cashfree.ts
   ```
   Idempotent, so it is safe on every deploy. By hand it is Admin → Settings →
   Regions → India → Payment providers.
3. **Webhook.** In Cashfree's dashboard, add
   `https://<backend>/hooks/payment/cashfree_cashfree` and subscribe to
   `PAYMENT_SUCCESS_WEBHOOK` and `PAYMENT_FAILED_WEBHOOK`. Signatures are
   verified against `CASHFREE_SECRET_KEY`; anything that does not verify is
   logged and ignored rather than treated as a failed payment.
4. **Check the return URL.** `medusa-config.ts` builds it from
   `STOREFRONT_URL`, which must be the public origin. It is only used by
   methods that force a full redirect, but those are exactly the ones on
   phones.

## What Cashfree does that Medusa does not expect

- **Orders are immutable.** The amount cannot be edited, so a changed cart total
  means a new Cashfree order. `updatePayment` creates one; the old one is left
  to expire, holding nothing.
- **Capture is automatic.** There is no separate capture step in the normal
  flow, so `capturePayment` confirms rather than acts, and refuses if the order
  is not `PAID`.
- **There is no cancel.** An unpaid order expires by itself. `cancelPayment`
  throws rather than pretend for an order that *was* paid — that needs a refund,
  and silently "cancelling" it would leave a customer charged for an order
  Medusa thinks is void.
