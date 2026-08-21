# Valy storefront overhaul plan

## Context

Valy sells preconfigured homelab servers into India — machines that make owning your own data easy.
Data ownership is the argument; the machine is what's sold. The range is **Flow** (starter),
**Hike** (mid) and **Summit** — roughly five configured units, each with configuration options —
plus a real parts catalogue (storage, RAM, cases, GPUs, networking) and services (OS and app
installation) that are themselves Medusa products. Three purchase modes coexist: buy a prebuilt,
configure one, or buy a part on its own.

Recreate all needed pages with new content, new design. No meaningless language like (empowering, cuttingedge, new era - if it has no literal meaning then it should never be used)

Redesign all important pages:
Home
Category
Product
Cart
Checkout
Account
Terms
Privacy Policy

All of these pages need new content and design. Do not try to improve what exists and apply patches. We need new content. 
Design for mobile will go hand in hand with main desktop version. We willnot "come back" to mobile, we will do it now in parallel.

Then go through all the following points:

`apps/storefront` is the stock Medusa Next.js DTC starter (Next 15.5, React 19, Tailwind 3) on
Vercel, talking to a self-hosted Medusa backend on TrueNAS through a Cloudflare tunnel at
`api.valy.in`. Three things are wrong with it.

### 1. The site never acknowledges a click

The reported complaint, and the one that matters most. The rule the site must obey:

> **Navigate immediately, always. Never hold the old page. Never blank the new one.**
> Time-to-first-reaction is the metric, not time-to-full-page. A page that lands in one second with
> a frozen UI for that second is worse than a slower page that responds instantly, because the user
> cannot tell their click registered. Ten milliseconds of dead air is a defect.

Measured production latency: **~90–100ms per Medusa request** through the tunnel (~25ms TLS, ~70ms
to the origin; a real priced-product query will be more). Locally the same API answers in 6–11ms,
which is why the code comment claims "the API answers in milliseconds" — it does, but not in
production.

One query is cheap. The site does **nine of them in a row before rendering anything**:
`(main)/layout.tsx:17,18,22` awaits `retrieveCustomer` → `retrieveCart` → `listCartOptions`
serially and un-suspended, then renders an un-suspended `<Nav>` (3 more) and `<Footer>` (2 more).
That is roughly **900ms of nothing** on a cold load — and then a skeleton appears, because
`(main)/loading.tsx` sits at **route-group level**, which makes "the segment that changed" mean the
entire page body. So every navigation blanks everything below the nav.

The fetch is not the cost. The serialization is, and the whole-page skeleton is.

Nothing anywhere has an `:active` state either — buttons carry only `hover:`, which does nothing on
a phone, so on mobile there is literally no response to a press.

### 2. Data freshness was solved by turning caching off entirely

Every catalogue read is `cache: "no-store"`. That followed a real failure: `getCacheTag()`
(`cookies.ts:21-30`) appends `_medusa_cache_id`, a UUID the middleware mints **per browser**, so the
tag was `products-3f9a…` for one visitor and `products-c81e…` for the next. No webhook could name a
tag it couldn't know, entries never expired, and Vercel restored them across deploys. `7e810df`
built a revalidation route and `591d355` removed it because it could never work.

The residue is still in the tree: 28 `revalidateTag` calls of which only 9 do anything, 6 targeting
a `fulfillment-*` tag no read ever registers, several able to fire as `revalidateTag("")` because
`getCacheTag` returns `""` when the cookie is missing. Meanwhile `force-cache` is applied to
per-shopper reads (`customer.ts:65`, `cart.ts:542`, `orders.ts`, `payment.ts`) — the exact data that
should never be cached — and two module-level `Map`s (`regions.ts:35`, `middleware.ts:8`) hold
region data for the life of the process with nothing able to invalidate them.

### 3. Four competing style layers, and the body font never loads

`@medusajs/ui-preset` supplies `ui-*` colors and `txt-*` typography (262 + 100 occurrences across 76
files). `@medusajs/ui` itself was removed and hand-replaced by `common/components/ui/index.tsx`,
imported by 78 files — so the tokens survive but not the components they were drawn for, and that
file's stock `bg-black`/`gray-*` is where the real button and card look comes from. `globals.css`
adds a fourth type scale (146 occurrences, 60 files). `modules/home/` alone carries a dark
industrial language — zinc/amber, Archivo variable width, faceplate motifs — used nowhere else.

**Inter is never loaded.** All 34 preset `txt-*` classes hardcode `font-family: Inter`, no
`font-sans` class appears anywhere, and only Archivo and IBM Plex Mono are fetched. Every page
outside the homepage renders in the system fallback. Seven further class names are typos or
non-existent tokens that silently do nothing (`txt-compact-plus`, `txt-ui-fg-base` ×3,
`text-ui-fg-medium-plus`, `shadow-borders-interactive`, `shadow-borders-strong-with-shadow`,
`text-grey-700`, `text-violet-60`, `inter-base-regular`).

**Intended outcome:** a site that reacts the instant it is touched, reads live data from the
database, and presents one coherent clean, neutral visual system across machines, parts and
editorial.

---

## Settled constraints

- **Data comes from the database.** Product data, prices, stock, categories and collections are read
  live from Medusa on the request that needs them. No data cache sits between the storefront and the
  database. Caching applies only to things that were never database-backed — the app shell, static
  assets, fonts, JS, and editorial pages with no Medusa dependency.
- **Medusa's taxonomy stays.** Categories, collections and tags are the right model and the existing
  routes stay. What gets replaced is the stock starter presentation.
- One combined overhaul, done in one pass. No phasing.
- Clean and neutral design direction. Full token reset — `@medusajs/ui-preset` goes.
- Deployed on Vercel.

---

## Responsiveness

The contract, in rungs. Every one must be filled.

| When | What happens |
| --- | --- |
| **0ms** | The control reacts to touch — CSS `:active` / pressed state. No JS, no network. Absent everywhere today; cheapest and most-missing fix in the codebase. |
| **first frame** | Navigation has happened. URL changed, layout persisted, and the destination's **real structure** paints — heading, breadcrumb, filter rail, product frame, grid cells, spec-table labels. Not a grey rectangle. |
| **~100ms** | Values stream into that structure, region by region, behind scoped `<Suspense>`. |
| **if it stalls** | `useLinkStatus` puts a pending indicator **on the element that was clicked**, not elsewhere on screen. |

**Stop serializing.** The layout's nine sequential round trips become one wave — ~900ms → ~150ms.
Free, and changes nothing about freshness.

**Stop fetching the same thing twice in one request.** `generateMetadata` and the page body each
fetch the product separately — 200ms for one page view, identical data. `React.cache` collapses them
to one *within that request*. Nothing persists between requests; every visitor still reads fresh.
Same fix for the duplicate fetches in the collection, category and order-detail routes.

**Loading boundaries move down, not away.** Delete `(main)/loading.tsx` — it blankets pages that
should never show it. Keep scoped loading UI where a route genuinely waits on data; Next's docs are
explicit that for dynamic routes a loading file is what enables partial prefetch and immediate
feedback. Surviving skeletons are redrawn to match the real layout, so the transition is a fill, not
a swap.

**Mutations are optimistic** (`useOptimistic` / `useTransition`):
- Add to cart → badge increments and the button flips to "Added" before the server replies.
- Filter or sort change → the chip activates instantly and the **old grid stays visible and
  readable** while the new one loads. Never a skeleton swap.
- Quantity change → the number redraws immediately.
- Configurator option change → price and spec block update from data already on the client; only
  stock state needs the server.

Reconciliation must be visible, not silent — adding an out-of-stock drive has to explain itself
rather than quietly revert.

**Prefetch** so most navigations never leave rung two.

**View transitions** via `experimental.viewTransition` + React's `unstable_ViewTransition`, so the
swap reads as motion rather than a cut. Experimental — an enhancement, removed if it misbehaves.

**`experimental.staleTimes` is kept and tuned**, not deleted. For instant back-navigation it is
doing exactly the right thing.

---

## Data and rendering

**Catalogue routes are dynamic and stream.** The shell — layout, headings, breadcrumb, filter rail,
product frame, spec-table labels — is sent first; data regions stream in behind scoped `<Suspense>`.
The visitor sees a real page at t=0 and values at ~100ms, instead of ~900ms of frozen screen.

**Editorial routes are static.** Pages with no Medusa dependency (`/getting-started`,
`/compatibility`, `/support`) prerender fully.

**Delete the dead cache machinery.** With no data cache there is nothing to invalidate, so
`getCacheTag`, `getCacheOptions` and all 28 `revalidateTag` calls go, along with the
`revalidateTag("")` hazard and the `fulfillment-*` / `shippingOptions-*` name mismatch. Remove
`force-cache` from `customer.ts:65`, `cart.ts:542`, `orders.ts`, `payment.ts`. Remove the
module-level `regionMap` (`regions.ts:35`) and `regionMapCache` (`middleware.ts:8`) — process-
lifetime caches nothing can invalidate, which means a region edited in admin stays wrong until the
instance recycles.

**Remove `generateStaticParams`** from the product, collection and category routes. It is already
dead code — the routes are dynamic regardless — and it exists only to serve prerendering.

**Leave the two former ISR blockers alone.** The `sdk.client.fetch` locale interceptor in
`config.ts` and `getAuthHeaders()` inside `listProducts` only mattered for prerendering, which is no
longer a goal.

**Tidy the data layer.**
- `"use server"` sits atop 12 files in `lib/data/`, making every exported read a public POST
  endpoint. Reads get `import "server-only"`; mutations move to a sibling `actions.ts`.
  `categories.ts` has neither directive today.
- Fix `listProductsWithSort`, whose count is computed off a single 100-item fetch and is therefore
  wrong past 100 products — which now matters, because the parts catalogue will exceed that.
- Delete dead code: `retrieveVariant`, `isSimpleProduct`, `goodsTotalBeforeDiscount`, the
  commented-out gift-card/discount stubs, `contrast-btn`, 7 unused Tailwind animations, the unused
  `transitionProperty` and `maxWidth.8xl`, `chevron-up-down.tsx`, and the onboarding scaffolding
  (`product-onboarding-cta`, `order/onboarding-cta`, `lib/data/onboarding.ts` — which hardcodes a
  `localhost:7001` redirect).

**Middleware.** `middleware.ts:39-41` throws unhandled on any non-2xx, so a backend blip 500s every
route on the site — fall back to the last known region map. `NEXT_PUBLIC_DEFAULT_REGION` is `"dk"`;
should be `"in"`. Narrow the matcher, which currently runs on RSC payload requests.

**Build correctness.** `next.config.js` sets `eslint.ignoreDuringBuilds` and
`typescript.ignoreBuildErrors`. Clear the backlog and remove both — a refactor this size without
type checking buries its own mistakes. Turn off `images.unoptimized`.

**Accepted trade-off**, stated so it is chosen rather than discovered: every page view costs a
~100ms round trip to the backend, and the storefront is unavailable whenever the backend is. If that
number starts hurting, the fix is moving Medusa off the home connection, not adding a cache.

---

## Surfaces

Medusa's routes stay. These are redesigns, not restructures.

**`/` — the argument.** Data ownership, told to someone who has never run a server without
patronising someone who has. Immich instead of Google Photos, Plex instead of a subscription, your
hosting on your hardware. Leads to the lineup.

**`/store` — the catalogue.** Machines and parts, with the existing category / collection / tag
filters redesigned. Refinement sidebar, sort and pagination stay and get a proper design. The
options-picker stays functionally as-is — its `/store/product-options?is_exclusive=false` call
correctly keeps per-product configurator options out of the global parts facets, which is exactly
right for this catalogue.

**`/categories/[...category]` and `/collections/[handle]`** — same treatment. Collections are the
natural home for the lineup ("The range") and curated sets ("Starting out", "Plex builds").

**`/products/[handle]` — three templates, chosen by `product.type`:**
- **`machine`** — narrative, photography, **configurator**, spec block, compatibility, buy. The
  `v_id` variant-image mechanism already in place is what makes the configurator show the right
  machine, so it becomes more important, not less.
- **`part`** — compact: specs, price, what it fits, buy.
- **`service`** — simplest, and also surfaced as an add-on step inside the configurator, which is
  where it will actually sell.

**`/compatibility` — the wedge.** Synology restricted third-party drives on its 2025 Plus-series
models (no storage pools, no health stats, no DSM install without approved drives), took sustained
criticism, and walked it back in DSM 7.3 in October 2025 — **but M.2 SSDs remain locked to their
list**. For Synology, "Compatibility" is top-level nav expressing a restriction; here it is the same
slot expressing freedom. This is also why the parts catalogue is strategic rather than incidental:
selling parts is the proof the machine is open.

**`/getting-started`** — the low-budget on-ramp, plus a **RAID calculator** and a capacity translator
("8TB is about 400,000 photos"). Synology's calculator is one of the genuinely good things on their
site, it suits the newcomer positioning, and it earns search traffic.

Cart, checkout, account and order keep their function and get the new design.

---

## Design system

### Thesis

The subject is **custody**. The job is to make a stranger believe that moving their photos off
Google is achievable, affordable to start, and safe with a small Bengaluru outfit for three years.
Clean and neutral as asked; the restraint is the point and the precision carries the personality.

Synology's own naming is the foil — DS923+, RS6426xs+, series called FS / HD / SA / XS+ / Plus /
Value / J, navigable only via a "NAS Selector" and an AI advisor. Flow → Hike → Summit needs no
decoder ring, and it is an ascent: starting out, growing, serious. That progression encodes the
customer's actual journey, so it earns the right to organise the lineup rather than merely label
three sizes.

### Tokens

CSS custom properties in `globals.css`, mapped into `tailwind.config.js` `theme` (not `extend`).
Note the preset also does `addBase({"*": {borderColor: "var(--border-base)"}})`, so a default border
color must be re-established or every border in the app changes.

| Token | Value | Role |
| --- | --- | --- |
| `ink` | `#15181C` | body text, primary buttons |
| `paper` | `#FFFFFF` | page ground |
| `surface` | `#F5F6F7` | cards, table stripes, inputs |
| `line` | `#E2E4E7` | hairlines and borders |
| `muted` | `#666C75` | labels, secondary text |
| `accent` | `#12508F` | links, focus rings, primary action |
| `signal` | `#0F7A52` | in stock, GST included, warranty active |

One accent, spent on action and focus only.

**Type — highest-payoff single fix in the plan.** Load **Inter** properly via `next/font` and set it
on `<body>`; it is referenced everywhere and fetched nowhere. Keep **IBM Plex Mono**, restricted to
data — capacities, wattage, dB(A), prices, order numbers. Drop **Archivo**, whose `wdth` axis exists
only for the industrial headings being retired. One modular scale replaces both the preset's `txt-*`
and the `text-*-regular` set.

### Signature: the spec block

One hairline-ruled, monospaced key/value component, used identically on the lineup comparison, the
machine page, part pages, cart line items and order confirmation. It is what a homelab buyer
actually scans, and the one element the site owns. It replaces the homepage's decorative "readout"
motif with the same device doing real work.

Proposed `product.metadata` schema (admin entry is the user's; the component degrades on missing
keys): `cpu, ram_base, bays, drive_form_factor, nic, psu_watts, idle_watts, noise_db, os_preloaded,
raid_default, warranty_years, dimensions_mm`. Parts additionally carry `fits` — a list of model
handles — driving both "what fits my Summit" on a part page and "what can I add" on a machine page.

Prices render with `tabular-nums` and their GST basis stated inline.

### The sweep

~520 class replacements across ~90 files: 262 `ui-*`, 100 `txt-*`, 14 `shadow-*`, 146 globals.css
scale, plus `content-container` (31 sites) and the hardcoded `gray-*`/`zinc-*` palette.
`common/components/ui/index.tsx` is rebuilt on the tokens keeping its export names, so its 78
importers don't churn. Shared primitives — input (11 consumers, plus the global `input:focus ~ label`
rule in `globals.css` that forces `!transform-none` at call sites), radio, modal, native-select,
divider, line-item-* — rebuilt with it. `modules/home/` rebuilt on the neutral system.

---

## Must survive intact

Custom, load-bearing, correct today. The redesign restyles their markup; it must not touch their
logic or drop their `data-testid` attributes — there is no test suite, so those are the only
contract left from upstream.

- **GST totals** — `lib/util/cart-totals.ts` (`isTaxInclusiveCart`, `goodsTotal`, `shippingTotal`,
  `hasDeliveryDetails`). Encodes that shipping and tax are *unknown* before an address exists, not
  zero, and that discounts must be quoted on the same basis as the rows above. Backend counterpart:
  `modules/india-gst`. **Also fix while here:** the cart summary renders net totals beside gross line
  items — a known bug, previously agreed and not yet applied.
- **GSTIN capture** — two inputs collapsing into `cart.metadata.gstin` in `setAddresses()`
  (`cart.ts:367`), billing winning. Backend validates format in `workflows/cart-validate.ts` and
  derives `is_b2b` in `subscribers/order-placed.ts`.
- **Shipping-option gating** — `lib/util/shipping-availability.ts` +
  `checkout/components/shipping/index.tsx`. Options render only once they have an affirmative price
  (the anti-flicker fix), backend config-gap messages never reach shoppers, and the saved step reads
  the accepted promise from `shipping_methods.data` rather than recomputing it.
- **Option facets** — `product-option-filters.ts` and the options-picker, including the
  `is_exclusive=false` scoping.
- **Locale** — `locale-actions.ts`, the `x-medusa-locale` header and the language select.
- **Variant-scoped images** — the `v_id` search param driving `getImagesForVariant`.
- **Email-verification signup** and **order transfer** flows.
- **Commercial commitments** — copy in `assurance-strip`, `faq` and `ready-to-ship` states warranty
  terms, noise figures, 48h burn-in, return window, GST invoicing and the 2 PM IST dispatch cutoff.
  Promises to customers; reused verbatim unless re-approved.

---

## Open items

1. **Product photography.** `modules/home/media.ts` is hot-linked Unsplash placeholders, flagged in
   its own comment as draft. Real photos are a launch blocker this plan cannot resolve, and the
   editorial direction leans on photography heavily.
2. **The lineup does not exist in the backend.** One unnamed fixture product today ("NAS Home server
   4-bay 222631", empty description, no SKUs, 12 Storage×RAM variants) and one category. Flow / Hike
   / Summit plus the parts catalogue is a seeding job; the site will be built against locally seeded
   sample data matching the proposed schema.
3. **Stock copy still shipping.** `checkout/components/review/index.tsx` references *"Medusa Store's
   Privacy Policy"*.

---

## Verification

**Responsiveness — the thing actually being fixed.** Throttle to Slow 3G and click through: every
control shows a pressed state on touch, every navigation changes the URL and paints real structure
in the first frame, and no navigation blanks the viewport or leaves the old page frozen. Test on a
real phone, since `hover:`-only styling has no fallback there.

**Serialization.** With `logging.fetches` on, confirm the layout's requests fire as one wave rather
than a staircase. Cold-load `/` in a fresh profile with no cookies and confirm time-to-first-paint
is a fraction of what it was.

**Freshness.** Change a price in Medusa admin and reload — correct immediately. Create a product and
open the list page — present immediately. No redeploy, no purge, no wait.

**Fonts.** View source on any non-home page and confirm the body font resolves to Inter, not a
system fallback.

**Commerce, unchanged.** Configure a machine → add to cart → GSTIN at checkout → shipping option →
payment → order confirmation. Totals read on the GST-inclusive basis at every step, the "Shipping
calculated at checkout. Prices include GST." state appears before an address is entered, and delivery
options do not flicker. Add a part alone, and a service, and confirm each behaves.

**Throughout:** `grep` that no `data-testid` was dropped. Lighthouse on `/` and a machine page, with
a baseline captured before any change.
