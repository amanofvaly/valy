# Storefront Architecture

This document is the source of truth for the replacement Valy storefront.
Architecture changes require an explicit decision; they must not be inferred
from an agent summary or from the structure of the Medusa starter.

## Stack

- TanStack Start
- TanStack Router using file-based routes
- TanStack Query for Medusa storefront data
- React and Vite
- Medusa Store API and the existing Valy backend integrations

TanStack Start provides server rendering, server functions, request cookies,
and the production server. TanStack Router owns route matching and navigation.
TanStack Query owns asynchronous Medusa data and its cache.

## Navigation

A navigation must become visible immediately after an internal link is
activated. Destination routes render their own pending UI while Medusa data is
loading; the previous page must not appear frozen until destination data has
finished loading.

This behavior is infrastructure, not a per-link patch:

- Internal links use TanStack Router's `Link`.
- Route components do not block activation on catalogue queries.
- Each data-backed route has a route-level pending state.
- TanStack Query supplies and caches destination data.
- Intent preloading may reduce or eliminate the pending interval, but correct
  navigation must not depend on a preload completing.

## Market URLs

India is the default market and has no URL prefix:

- `/`
- `/products/valy-flow`
- `/cart`

Every other country enabled by a Medusa region uses its ISO two-letter country
code as the first path segment, for example `/us` or `/ae`. Country codes are
not hardcoded into the route catalogue.

`/in` and `/in/...` redirect once to the equivalent prefix-free canonical URL.
Unknown or disabled country codes return 404. There is no middleware rewrite
that adds the default market back internally.

## Route Scope

Catalogue records do not create frontend route files. One dynamic route handles
each resource type:

- `/products/$handle`
- `/categories/$handle`
- `/collections/$handle`

The same patterns exist beneath a non-default market prefix. A genuinely new
standalone page normally adds one route file. CMS-driven pages may later use a
single slug route if that becomes a product requirement.

## Server Boundaries

Secrets, HttpOnly cart and authentication cookies, and privileged payment
operations stay in TanStack Start server functions or server routes. Browser
components do not receive backend secrets. Cashfree and Shiprocket continue to
use the existing backend contracts; the router must not reimplement their
business logic.

## Non-goals

- Reproducing Medusa starter middleware or its country-code rewrite scheme
- Creating a custom navigation protocol
- Adding per-product routes or manually repairing individual links
- Changing catalogue, cart, checkout, account, payment, or shipping behavior as
  part of the router migration
