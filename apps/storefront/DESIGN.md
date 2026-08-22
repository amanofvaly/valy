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

**The Two Registers Rule.** Swiss red behaves differently on the homepage than everywhere else, and the split is deliberate rather than an inconsistency.

On the homepage red is structural. It opens chapters as a 3px rule, sets the one word in the hero headline the page is actually about, carries prices and step numbers, marks the open question in the FAQ, and owns a full chapter ground of its own — the arithmetic, where the rented figure sits on `accent` and the owned figure on `accent-strong`. The homepage is the only surface arguing against something the reader is currently paying for, and it is allowed to raise its voice to do it.

Everywhere else — product, category, cart, checkout, account, order — red stays scarce: focus, selection, error, and the rare high-priority action. A catalogue page that adopted the homepage's register would be a mistake, not a continuation.

Paper on `accent` clears 6.7:1 and on `accent-strong` 6.9:1, so both grounds carry body text. Red on ink does not — it lands at 2.7:1 — so red never appears as type, a rule, or a meaningful shape on a dark ground.

**The Neutral First Rule.** Product information, specification tables, and checkout surfaces should default to paper, ink, muted text, and hairlines. Color enters only when it clarifies state or action.

**The Borrowed Color Rule.** One subject takes its color from content rather than from this palette: the self-hosted applications on the homepage, where each project supplies its own mark in its own color. It is the only place where colour comes from content, and it stays that way. Every value is precomputed in `src/lib/data/self-hosted-apps.ts` — a component must never mix a brand color itself. Borrowed color is legitimate only where the color belongs to the thing being named; it is never a way to introduce a second accent.

Three surfaces borrow it, and each uses it for a different job.

The hero wall fills each cell with `wash`, a 4%-saturation trace of the mark's own color: the cells are square, small and touching, so the hues chain into a mosaic and the band reads as one colored object. **A wash is only ever legitimate where it touches other washes** — a wash covering ninety-nine percent of a wide, isolated cell averages out to white and reduces the mark it was meant to support to a bullet.

The application library's launcher is the opposite case: twenty-eight marks in a column, each on paper at full strength, with no fill behind them. A greyed-out launcher that blooms on selection reads as a smaller catalogue, which is the opposite of what the section claims.

Inside a screen the application's color is the only accent, and it does three things: it fills picture cells, it draws data — bars, progress, dots, the diagram's links and hub — and it marks a live state. **It never sets type.** `brand` is tuned to clear 3:1 as a shape, and several of the twenty-eight would fail 4.5:1 as a word, so a value, a label or a caption inside a screen is ink or muted like everything else on the site.

The mixing itself happens in the stylesheet, not in a component. `src/lib/data/self-hosted-apps.ts` precomputes `brand`, `wash` and their dark-ground pairs; `.app-mark`, `.app-fill`, `.app-cell` and `.app-tile-on` in `globals.css` do the rest from two inherited custom properties. A component passes `--app-brand` and `--app-wash` and nothing else — partly so no component has to reason about contrast, and partly because the library is a client component, where an inline `color-mix()` or hex is compared against the browser's parsed value during hydration and reliably disagrees with it.

## Typography

**Display Font:** Inter with system sans fallback.
**Body Font:** Inter with system sans fallback.
**Label/Mono Font:** IBM Plex Mono for measurements, prices, capacities, order numbers, SKUs, and small section labels.

**Character:** Inter carries the Apple-like calm: precise, familiar, and neutral. IBM Plex Mono is used only where aligned numerals and technical data matter, so the site does not perform "technical" through costume typography.

### Hierarchy

- **Broadsheet** (600, 6rem, 0.96): the homepage headline and the two arithmetic figures. Nothing else in the app reaches for it, and it steps down to 3rem on a phone.
- **Display** (600, 3.75rem, 1.03): home hero and rare first-viewport statements only.
- **Headline** (600, 2.375rem, 1.11): major section headings and high-level product story.
- **Title** (600, 1.5rem, 1.33): cards, product sections, account panels, and checkout sections.
- **Body** (400, 0.9375rem, 1.6): primary explanatory text. Keep prose near 65 to 75 characters where possible.
- **Label** (500, 0.6875rem, uppercase, 0.12em tracking): compact metadata, section labels, and technical annotations.

### Named Rules

**The Data Mono Rule.** Use the mono font for values that are scanned or compared, not for mood — and not above about 20px. IBM Plex Mono gives every glyph the same advance, so at heading scale a thousands comma, a decimal point, or the space in "48 h" opens a full character of air and the figure comes apart. Above that size, set figures in Inter with `tabular` instead: they still align down a column, and they hold together as a number. Mono keeps the specification blocks, the small prices, the SKUs, and the padded step counters.

**The Quiet Heading Rule.** Headings rely on weight, scale, and breathing room. Avoid decorative display treatments, gradient text, and exaggerated tracking.

**The No Eyebrow Rule.** A section heading carries its own label. The homepage used to open every chapter with a monospace kicker directly above a heading that said the same thing better — "The range" over "Three sizes, named after how far you have got." The kickers are gone and the headings grew into the space. Where a section needs marking, it gets the red rule across its top edge, not a word.

## Layout

The storefront uses a centered page container with a 1280px maximum width, 20px mobile gutters, and 32px tablet/desktop gutters. Section rhythm is generous: 56px vertical padding on mobile, 80px on tablet, and 96px on desktop.

The homepage is the one surface that composes its grounds rather than alternating them. Its chapters run paper, ink, paper, red, paper, surface, paper, surface, ink, paper: the two dark chapters and the red one are the three places the argument raises its voice — what the machine ships with, what renting costs, and what happens when it breaks — and every chapter between them is quiet on purpose so those three land. Colour chapters are full-bleed; their inner content still sits in the page container.

Two homepage chapters leave the container deliberately. The hero's wall of application marks runs edge to edge with no gutter at all, so the catalogue reads as something that continues past the frame. The application library uses `container-wide` (1680px) rather than the 1280px page, so a section whose claim is possibility physically outgrows the paragraphs around it. Nothing outside the homepage uses either.

Inside that container the library is not a grid at all but a machine: one framed window with its own title bar, a launcher of twenty-eight applications down the left edge, and whichever one is selected filling the rest at a fixed 36rem. The six chapters survive as the launcher's headings and as the caption under the frame. On a phone the launcher becomes a scroll-snapping strip above the screen and the frame's height goes back to being whatever its content needs.

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
- **Inverse / Inverse Secondary:** for the ink and red chapters, where an ink pill either disappears into the ground or fights it. The filled button flips to a paper block with an ink label; the secondary is transparent with a paper hairline.
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

### Application Screens

The homepage's application library draws each of the twenty-eight as the interface it actually is. There are no screenshots to ship and no honest way to fake one, so a screen is a drawing of software in this system's own hairlines, ink and paper, with the application's borrowed color as the only accent inside its frame.

Six shapes cover all twenty-eight, because the software really does fall into six shapes: a wall of pictures, a list of things, one figure that matters with its history under it, a board of live states, a diagram of connections, and a conversation. Adding an application means picking one of the six and writing its content in `src/lib/data/app-screens.ts` — never inventing a seventh for one application.

Two rules keep them from becoming decoration. **Every screen fills its frame:** a list that stops two-thirds down or a shelf of five blank rectangles reads as a loading state, which is precisely the failure this section exists to undo. And **every label is real content** — a filename, a temperature, a peer, a due date. A gray bar standing in for a word is the same lie as a fake screenshot, told smaller.

Illustrative figures are allowed inside a frame and nowhere else. `4,812 photographs` and `18,431 requests dropped today` describe the shape of what the software shows; they are not measurements of a Valy machine and must never be lifted out of a screen and into a claim.

## Do's and Don'ts

### Do:

- **Do** keep most screens neutral, flat, and bordered.
- **Do** use Swiss red for focus, selection, and rare high-priority actions.
- **Do** preserve immediate active states on touch and pointer controls.
- **Do** align product-card baselines and reserve room for dynamic catalogue data.
- **Do** explain homelab value through concrete apps, compatibility, capacity, and service facts.

### Don't:

- **Don't** use blue as the brand accent.
- **Don't** carry the homepage's red register onto catalogue, cart, or checkout surfaces.
- **Don't** use red as a decorative wash anywhere, or as type or a rule on a dark ground.
- **Don't** put a monospace kicker above a heading, on any surface.
- **Don't** use location as a brand proof point.
- **Don't** add heavy card shadows to ordinary commerce surfaces.
- **Don't** use vague launch language when a concrete product or app outcome can be named.
- **Don't** introduce a self-hosted application by its logo and a caption where its screen would say more.
- **Don't** let a borrowed brand color set type; it is tuned to carry a shape, not a word.
