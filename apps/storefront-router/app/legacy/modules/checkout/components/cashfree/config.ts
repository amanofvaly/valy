/**
 * Which half of Cashfree's SDK collects the card.
 *
 * `true`  — the drop-in. `checkout()` is handed the payment session and renders
 *           Cashfree's own form in a modal. Nothing on this page touches the
 *           card, and nothing on this page has to know whether a field is
 *           filled in.
 *
 * `false` — Elements. `CashfreeFields` builds the form out of four cross-origin
 *           iframes styled to match the site, and the pay button is enabled
 *           from `isComplete()` on each of them.
 *
 * Elements is the nicer form and the reason it is not the default is specific:
 * its readiness depends on the fields reporting their state back to this page,
 * and that reporting could not be made to work reliably. `cardHolder` in
 * particular was never observed to report itself complete — a filled name field
 * still reads back as `{ cardHolder: "", empty: true, complete: false }` with no
 * `change` event — which pins any all-fields-complete check to false for ever
 * and leaves the pay button disabled no matter what the customer types.
 *
 * The drop-in has none of that surface: it needs the session id and nothing
 * else. The Elements code is left in place rather than deleted so this is a
 * one-line switch back once that behaviour is understood or fixed upstream.
 */
export const CASHFREE_USE_DROP_IN = true
