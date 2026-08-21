---
name: "Valy Storefront"
description: "A calm technical retail system for practical homelab commerce."
colors:
  ink: "#15181c"
  paper: "#ffffff"
  surface: "#f5f6f7"
  surface-strong: "#eceef0"
  line: "#e2e4e7"
  line-strong: "#cbcfd4"
  muted: "#666c75"
  swiss-red: "#da291c"
  swiss-red-strong: "#b01f15"
  swiss-red-wash: "#fdefee"
  signal: "#0f7a52"
  signal-wash: "#eaf5f0"
  warn: "#8a5a00"
  warn-wash: "#fdf5e6"
  danger: "#9b2226"
  danger-wash: "#fbefef"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 600
    lineHeight: 1.03
    letterSpacing: "-0.028em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 600
    lineHeight: 1.11
    letterSpacing: "-0.022em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  sm: "2px"
  md: "6px"
  lg: "10px"
  xl: "16px"
  full: "9999px"
spacing:
  page-x-mobile: "20px"
  page-x-desktop: "32px"
  section-y-mobile: "56px"
  section-y-tablet: "80px"
  section-y-desktop: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-accent:
    backgroundColor: "{colors.swiss-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
---

# Design System: Valy Storefront

## Overview

**Creative North Star: "The Quiet Utility Room"**

Valy's storefront should feel like reliable home infrastructure: organized, plain-spoken, and calm enough to make technical buying feel manageable. The Apple-like reference is restraint and precision, not theatrical minimalism. Surfaces are clean, typography is exact, and interactions respond immediately without trying to entertain.

The system is a calm technical retail interface. It has enough product density for machines, parts, compatibility, and checkout, but it avoids enterprise coldness and gadget-store noise. The visual center is a white and cool-neutral field, with Swiss red used sparingly for action, focus, and brand signal.

**Key Characteristics:**

- Light, neutral, and flat.
- Precise and quiet controls.
- Technical detail made readable through tables, specs, and stable grids.
- Red as a rare brand/action accent, never as decoration.
- Immediate pressed states on every interactive surface.

## Colors

The palette is mostly white, ink, cool grays, and thin borders, with Swiss red reserved for important action and brand moments.

### Primary

- **Swiss Red** (#da291c): the accent for selected states, accent buttons, active controls, focus, and sparse brand emphasis.
- **Swiss Red Strong** (#b01f15): hover and pressed accent states where red needs more weight.
- **Swiss Red Wash** (#fdefee): quiet red-tinted backgrounds for selection, focus-adjacent states, or light alerts.

### Neutral

- **Ink** (#15181c): primary text, primary button background, and the strongest card-active ring.
- **Paper** (#ffffff): the main page and component surface.
- **Soft Surface** (#f5f6f7): section bands, disabled fields, and subtle grouped regions.
- **Pressed Surface** (#eceef0): active neutral controls and stronger surface contrast.
- **Hairline** (#e2e4e7): default borders, dividers, table rules, and card outlines.
- **Strong Hairline** (#cbcfd4): hover borders and controls that need clearer boundaries.
- **Muted Text** (#666c75): secondary copy, labels, captions, and non-primary navigation.

### Functional

- **Signal Green** (#0f7a52): positive status and availability.
- **Warning Amber** (#8a5a00): warnings that are not destructive.
- **Danger Red** (#9b2226): destructive actions and errors. Keep it distinct from Swiss Red by using it only for problems.

### Named Rules

**The Red Rarity Rule.** Swiss red is most effective when it is scarce. Do not tint whole layouts red or use it to decorate ordinary cards.

**The Neutral First Rule.** Product information, specification tables, and checkout surfaces should default to paper, ink, muted text, and hairlines. Color enters only when it clarifies state or action.

## Typography

**Display Font:** Inter with system sans fallback.
**Body Font:** Inter with system sans fallback.
**Label/Mono Font:** IBM Plex Mono for measurements, prices, capacities, order numbers, SKUs, and small section labels.

**Character:** Inter carries the Apple-like calm: precise, familiar, and neutral. IBM Plex Mono is used only where aligned numerals and technical data matter, so the site does not perform "technical" through costume typography.

### Hierarchy

- **Display** (600, 3.75rem, 1.03): home hero and rare first-viewport statements only.
- **Headline** (600, 2.375rem, 1.11): major section headings and high-level product story.
- **Title** (600, 1.5rem, 1.33): cards, product sections, account panels, and checkout sections.
- **Body** (400, 0.9375rem, 1.6): primary explanatory text. Keep prose near 65 to 75 characters where possible.
- **Label** (500, 0.6875rem, uppercase, 0.12em tracking): compact metadata, section labels, and technical annotations.

### Named Rules

**The Data Mono Rule.** Use the mono font for values that are scanned or compared, not for mood.

**The Quiet Heading Rule.** Headings rely on weight, scale, and breathing room. Avoid decorative display treatments, gradient text, and exaggerated tracking.

## Layout

The storefront uses a centered page container with a 1280px maximum width, 20px mobile gutters, and 32px tablet/desktop gutters. Section rhythm is generous: 56px vertical padding on mobile, 80px on tablet, and 96px on desktop.

Commerce layouts are structured and stable. Product grids hold equal card heights, image areas do not collapse, title and subtitle lines reserve space, and price baselines align across a row. Product pages use a two-column desktop composition where the buy/configuration column can stay sticky while the visitor reads specifications.

Responsive behavior is handled in parallel with desktop design. Mobile keeps the same content priorities but shifts controls into reachable sheets, compact grids, and persistent action areas rather than deferring mobile quality to a later pass.

## Elevation & Depth

The system is flat by default. Depth comes from surface color, hairline borders, sticky positioning, and clear spacing rather than drop shadows. Shadows are reserved for overlays such as sheets, dialogs, dropdowns, and other elements that must separate from the page because they sit above it.

### Shadow Vocabulary

- **Low Surface Shadow** (`0 1px 2px rgb(21 24 28 / 0.04)`): rare raised containers only.
- **Default Surface Shadow** (`0 1px 3px rgb(21 24 28 / 0.06), 0 1px 2px rgb(21 24 28 / 0.04)`): restrained elevation when a flat border is not enough.
- **Overlay Shadow** (`0 16px 48px rgb(21 24 28 / 0.14)`): sheets, dialogs, and floating panels.

### Named Rules

**The Flat Commerce Rule.** Product cards, specs, account panels, and checkout surfaces sit flat at rest. Use a border before a shadow.

## Shapes

Corners are precise and modest. Default controls use 4px to 6px radii, cards and framed surfaces use about 10px, and 16px is reserved for larger sheet corners or surfaces that need a softer mobile edge. Pills are only for small controls, counters, and compact badges.

Borders are one-pixel hairlines. Dense tables use rules aligned to the device pixel grid. Avoid thick accent borders, especially vertical red bars on cards or callouts.

## Components

### Buttons

- **Shape:** compact rounded rectangles, usually 4px to 6px.
- **Primary:** ink background with paper text for the most common decisive action.
- **Accent:** Swiss red background with paper text for rare brand or high-priority action.
- **Secondary:** paper background, ink text, and an inset strong hairline.
- **Ghost:** transparent background with neutral hover and pressed surface fills.
- **States:** every button has a touch-first active transform and pressed color change. Loading keeps the label width in place and centers a spinner over it.

### Chips and Badges

- **Style:** small, flat, and compact, using surface fills or functional wash colors.
- **State:** selected and active states may use Swiss red or ink; informational badges stay muted unless they communicate product type or status.

### Cards and Containers

- **Corner Style:** 10px radius for repeated product cards and framed containers.
- **Background:** paper on page or surface bands.
- **Shadow Strategy:** flat at rest; hover changes border or ring strength, not height.
- **Border:** one-pixel hairline by default.
- **Internal Padding:** 20px to 24px for containers; product cards keep stable image, title, subtitle, spec, and price zones.

### Inputs and Fields

- **Style:** paper background, 44px height, 1px hairline border, 16px mobile text floor to prevent iOS zoom.
- **Focus:** border changes to Swiss red and the global focus ring uses paper plus Swiss red.
- **Error / Disabled:** danger border or text for errors; surface fill and muted text for disabled fields.

### Navigation

Navigation is sticky, light, and compact. The wordmark is text-first. Links use muted text at rest, ink on hover, and an immediate neutral pressed state. Mobile navigation lives in an accessible sheet with streamed region and language controls.

### Sheets and Dialogs

Sheets use Radix behavior, paper background, hairline edges, overlay dimming, and the overlay shadow. Right and left sheets are full height, bottom sheets use a rounded top edge for thumb reach, and centered dialogs use a restrained pop-in.

### Product Cards

Product cards are anchors with stable geometry. Images reserve a fixed square region, titles reserve two lines, subtitles reserve one line, specs reserve one line, and price sits at the bottom. Pending navigation feedback appears on the clicked card.

### Specification Blocks

Specifications are content, not decoration. Use tabular numbers, compact rows, clear labels, and hairline separation so storage, RAM, NICs, wattage, noise, and compatibility can be compared quickly.

## Do's and Don'ts

### Do:

- **Do** keep most screens neutral, flat, and bordered.
- **Do** use Swiss red for focus, selection, and rare high-priority actions.
- **Do** preserve immediate active states on touch and pointer controls.
- **Do** align product-card baselines and reserve room for dynamic catalogue data.
- **Do** explain homelab value through concrete apps, compatibility, capacity, and service facts.

### Don't:

- **Don't** use blue as the brand accent.
- **Don't** make red a page-wide theme or decorative wash.
- **Don't** use location as a brand proof point.
- **Don't** add heavy card shadows to ordinary commerce surfaces.
- **Don't** use vague launch language when a concrete product or app outcome can be named.
