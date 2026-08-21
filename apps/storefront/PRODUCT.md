# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Valy serves Indian buyers who want a practical homelab without assembling, configuring, and supporting one from scratch.

The primary audience is a mix of home users new to self-hosting, technical homelab buyers, and small-office customers. They are trying to run useful private services at home or work while keeping files, media, backups, and network tools on hardware they control.

## Product Purpose

Valy sells preconfigured homelab servers, compatible parts, and setup services. The storefront needs to help customers understand what a homelab makes possible, choose a machine or part, configure it, and complete checkout with confidence.

The durable argument is data ownership and practical self-hosting: a Valy machine should make services such as photo libraries, media streaming, DNS filtering, private networking, file storage, and backups feel reachable without turning the purchase into a research project.

Success means a customer can move from "I want my own cloud or media server" to an appropriate configured machine, parts, or service purchase without needing to decode enterprise NAS naming or piece together compatibility alone.

## Positioning

Valy's difference is the combination of preconfigured hardware, open parts compatibility, India-focused commerce, and self-hosted app possibilities. The product is not only the machine; it is the path to running useful homelab services on owned hardware.

Future work should position the parts catalogue as proof of openness rather than as incidental accessories. Compatibility is a positive claim: customers should be able to understand what fits, what can be upgraded, and what software use cases each configuration supports.

## Operating Context

Customers evaluate the storefront through real use cases: hosting Immich, Plex, Jellyfin, Pi-hole, Tailscale, file storage, backups, private media libraries, home services, and other homelab applications.

Three purchase modes coexist:

- Buy a prebuilt machine.
- Configure a machine.
- Buy compatible parts or services separately.

The catalogue uses Medusa categories, collections, tags, product types, variants, and metadata. The product range includes Flow, Hike, and Summit machines, with roughly five configured units plus storage, RAM, cases, GPUs, networking parts, and service products.

## Capabilities and Constraints

The storefront is a Next.js web app backed by a self-hosted Medusa backend. It runs on Vercel and reads catalogue, price, stock, category, collection, cart, checkout, account, and order data from Medusa.

Important storefront capabilities include product browsing, category and collection pages, filters, sorting, pagination, product detail templates, machine configuration, cart, checkout, customer account, order history, order transfer, terms, privacy, and educational pages.

Product pages use product type to choose the right treatment:

- `machine`: narrative, configurator, spec block, compatibility, and purchase flow.
- `part`: compact specs, price, fit, and buy flow.
- `service`: setup or installation offer, including use as an add-on inside machine configuration.

The storefront must acknowledge interaction immediately. Navigation should not hold the old page, blank the new one, or hide feedback behind slow data requests. Fresh database reads are preferred over a stale catalogue cache.

Location is not part of Valy's durable positioning. Do not introduce Bengaluru as a brand proof point or recurring copy claim.

## Brand Commitments

The product name is Valy. The voice should stay literal and concrete, avoiding vague language such as "empowering," "cutting-edge," or "new era" when the phrase does not name a real product benefit.

Confirmed product commitments include:

- Data ownership as the central argument.
- Homelab app possibilities as a primary way to explain value.
- Flow, Hike, and Summit as the machine range names.
- Machines, parts, and services as first-class catalogue areas.
- Open compatibility as a strategic claim.

## Evidence on Hand

Existing product and implementation evidence:

- [storefront-overhaul-plan.md](../storefront-overhaul-plan.md)
- [package.json](package.json)
- [src/app/layout.tsx](src/app/layout.tsx)
- [src/styles/globals.css](src/styles/globals.css)
- [src/modules/home/components/hero/index.tsx](src/modules/home/components/hero/index.tsx)
- [src/modules/home/components/the-range/index.tsx](src/modules/home/components/the-range/index.tsx)

The repo contains some committed copy claims such as 48-hour burn-in, three-year warranty, seven-day return, and GST invoices. Treat those as existing evidence to verify before expanding, repeating, or making them central to a new surface.

No confirmed customer testimonials, press, benchmark studies, production photography, or final brand asset set were found during init. Future work must not fabricate them.

## Product Principles

Make self-hosting legible through the apps and outcomes people recognize.

Treat compatibility and parts as proof of openness, not as a secondary catalogue drawer.

React immediately to every interaction, even when live commerce data is still streaming.

Explain technical choices with concrete consequences: storage capacity, app fit, noise, power, upgrades, service, and failure modes.

Keep product claims specific enough that they can be checked against catalogue data, service policy, or real support practice.
