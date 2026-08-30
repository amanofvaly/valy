/**
 * The site's one style layer.
 *
 * `@medusajs/ui-preset` is gone. It supplied `ui-*` colours and a `txt-*` type
 * scale drawn for components that were removed from this codebase, so the
 * tokens outlived the things they described. Colour, type and radius are
 * declared here and nowhere else, and `theme` replaces rather than extends —
 * so `bg-zinc-900` is a build error now, not a silent fourth palette.
 */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      white: "#ffffff",
      black: "#000000",

      ink: "rgb(var(--ink) / <alpha-value>)",
      paper: "rgb(var(--paper) / <alpha-value>)",
      surface: {
        DEFAULT: "rgb(var(--surface) / <alpha-value>)",
        strong: "rgb(var(--surface-strong) / <alpha-value>)",
      },
      line: {
        DEFAULT: "rgb(var(--line) / <alpha-value>)",
        strong: "rgb(var(--line-strong) / <alpha-value>)",
      },
      muted: "rgb(var(--muted) / <alpha-value>)",
      accent: {
        DEFAULT: "rgb(var(--accent) / <alpha-value>)",
        strong: "rgb(var(--accent-strong) / <alpha-value>)",
        wash: "rgb(var(--accent-wash) / <alpha-value>)",
        /* Only on ink. See the token comment in globals.css. */
        inverse: "rgb(var(--accent-inverse) / <alpha-value>)",
      },
      /*
       * The action colour. Flat, for focus rings and small marks; the gradient
       * itself is `.action-surface` in globals.css.
       */
      action: "rgb(var(--action) / <alpha-value>)",
      signal: {
        DEFAULT: "rgb(var(--signal) / <alpha-value>)",
        wash: "rgb(var(--signal-wash) / <alpha-value>)",
      },
      warn: {
        DEFAULT: "rgb(var(--warn) / <alpha-value>)",
        wash: "rgb(var(--warn-wash) / <alpha-value>)",
      },
      danger: {
        DEFAULT: "rgb(var(--danger) / <alpha-value>)",
        wash: "rgb(var(--danger-wash) / <alpha-value>)",
      },
    },

    /**
     * One modular scale, replacing the preset's `txt-*` and globals.css's
     * `text-*-regular` sets. Sizes are in px because this is interface type,
     * not an article, and it should not resize with the user's root font in a
     * way that breaks a spec table's alignment.
     */
    fontSize: {
      "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      xs: ["0.75rem", { lineHeight: "1.125rem" }],
      sm: ["0.8125rem", { lineHeight: "1.25rem" }],
      base: ["0.9375rem", { lineHeight: "1.5rem" }],
      lg: ["1.0625rem", { lineHeight: "1.625rem" }],
      xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
      "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
      "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],
      "4xl": ["2.375rem", { lineHeight: "2.625rem", letterSpacing: "-0.022em" }],
      "5xl": ["3rem", { lineHeight: "3.25rem", letterSpacing: "-0.025em" }],
      "6xl": ["3.75rem", { lineHeight: "3.875rem", letterSpacing: "-0.028em" }],
      "7xl": ["4.5rem", { lineHeight: "4.625rem", letterSpacing: "-0.03em" }],
      /**
       * The broadsheet step. One statement per page gets it — the homepage
       * headline and the two figures in the arithmetic chapter — and nothing
       * else in the app is allowed to reach for it.
       */
      "8xl": ["6rem", { lineHeight: "5.75rem", letterSpacing: "-0.035em" }],
    },

    fontFamily: {
      /**
       * Inter, loaded by `next/font` in `src/app/layout.tsx`. The preset used to
       * hardcode `font-family: Inter` inside 34 `txt-*` classes while nothing
       * ever fetched the file, so every page outside the homepage rendered in
       * the system fallback.
       */
      sans: [
        "var(--font-sans)",
        "ui-sans-serif",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "sans-serif",
      ],
      /** Data only: capacities, wattage, dB(A), prices, order numbers, SKUs. */
      mono: [
        "var(--font-mono)",
        "ui-monospace",
        "SFMono-Regular",
        "Menlo",
        "Consolas",
        "monospace",
      ],
    },

    borderRadius: {
      none: "0px",
      sm: "2px",
      DEFAULT: "4px",
      md: "6px",
      lg: "10px",
      xl: "16px",
      full: "9999px",
    },

    boxShadow: {
      none: "none",
      /** A card lifts by its border weight, not by a drop shadow. */
      sm: "0 1px 2px rgb(21 24 28 / 0.04)",
      DEFAULT: "0 1px 3px rgb(21 24 28 / 0.06), 0 1px 2px rgb(21 24 28 / 0.04)",
      md: "0 4px 12px rgb(21 24 28 / 0.07)",
      lg: "0 12px 32px rgb(21 24 28 / 0.10)",
      /** Overlays only — sheets, dropdowns, dialogs. */
      overlay: "0 16px 48px rgb(21 24 28 / 0.14)",
      focus: "var(--focus-ring)",
    },

    extend: {
      screens: {
        /**
         * The starter's own scale, where `small` means 1024px. Kept only
         * because 74 files still spell breakpoints this way; everything
         * written since the overhaul uses Tailwind's `sm`/`md`/`lg`.
         */
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1680px",
        "2xlarge": "1920px",
      },
      maxWidth: {
        page: "1280px",
        prose: "68ch",
      },
      keyframes: {
        "accordion-open": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-close": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "sheet-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "sheet-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "sheet-in-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        /** The only looping animation in the app: a pending indicator. */
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        /**
         * The homepage's one authored moment: the wall of service marks
         * assembling itself. Staggered by index at the call site, so the grid
         * fills rather than appearing, and gone entirely under reduced motion.
         */
        "app-cell-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        /**
         * The application library's screens, assembling when their panel is
         * selected. Nothing here loops: a browser restarts a CSS animation when
         * an element goes from `display: none` to visible, so selecting a tab
         * replays the entrance and selecting away resets it, with no JavaScript
         * involved and no perpetual motion behind the reader's paragraph.
         */
        "screen-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /** A bar chart growing off its baseline. `--h` is the bar's own height. */
        "screen-rise": {
          from: { transform: "scaleY(0)" },
          to: { transform: "scaleY(var(--h))" },
        },
        /** A progress rule filling to the width already set on it. */
        "screen-grow": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        /** A connection drawing itself, once, from one end to the other. */
        "screen-draw": {
          from: { strokeDashoffset: "1" },
          to: { strokeDashoffset: "0" },
        },
        /**
         * Holds a pending indicator invisible for its first 150ms. Most
         * navigations finish inside that window because the destination was
         * prefetched, and a spinner that appears and vanishes in 80ms reads as
         * a stutter rather than as feedback.
         */
        "pending-appear": {
          "0%, 50%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-open": "accordion-open 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        "accordion-close": "accordion-close 180ms cubic-bezier(0.32, 0.72, 0, 1)",
        "overlay-in": "overlay-in 150ms ease-out",
        "sheet-in-right": "sheet-in-right 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        "sheet-in-left": "sheet-in-left 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        "sheet-in-bottom": "sheet-in-bottom 260ms cubic-bezier(0.32, 0.72, 0, 1)",
        "pop-in": "pop-in 130ms cubic-bezier(0.32, 0.72, 0, 1)",
        spin: "spin 700ms linear infinite",
        "app-cell-in": "app-cell-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "pending-appear": "pending-appear 300ms ease-out both",
        "screen-in": "screen-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "screen-rise": "screen-rise 620ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "screen-grow": "screen-grow 520ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "screen-draw": "screen-draw 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [require("tailwindcss-radix")()],
}
