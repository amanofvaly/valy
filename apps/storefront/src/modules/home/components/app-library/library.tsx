"use client"

import { APP_SCREENS } from "@lib/data/app-screens"
import { APP_COUNT, APP_GROUPS, APPS } from "@lib/data/self-hosted-apps"
import { cn } from "@lib/util/cn"
import { AppIcon } from "@modules/common/components/app-icon"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"

import { AppScreenView } from "./screen"

/**
 * The section, composed: an orb of glass tiles and whatever it is holding up.
 *
 * Three separate problems are solved by the same object.
 *
 * A catalogue of twenty-eight is list-shaped no matter how it is drawn, and two
 * previous versions of this section proved it — six ruled grids, then a
 * launcher with the same rows inside a window frame. A sphere has no first item
 * and no last one, so the reader meets a body of software rather than an
 * inventory of it.
 *
 * The marks are the only genuinely colourful thing this brand owns, and both
 * previous versions used them at the size of favicons. Here they are the
 * object.
 *
 * And a tile arriving at the front is a better way to introduce an application
 * than a heading is, because it puts the mark and the thing the software
 * actually shows side by side in one movement.
 *
 * Everything three-dimensional is behind `next/dynamic` and an observer with
 * generous margins: three, the renderer and drei come to about half a megabyte,
 * and this page's first argument has to paint before any of that is asked for.
 * Where WebGL is missing the section falls back to the launcher in
 * `machine.tsx`, which is a complete, keyboard-driven version of the same
 * content rather than an apology.
 */

const AppOrb = dynamic(() => import("./orb"), {
  ssr: false,
  loading: () => <OrbPlaceholder />,
})

/** How long each application holds the front of the sphere. */
const DWELL = 4600

const GROUP_OF = new Map(
  APP_GROUPS.flatMap((group) => group.apps.map((app) => [app.slug, group] as const))
)

/**
 * The shape the orb will occupy, drawn while its bundle is still arriving.
 * Reserving the box matters more than what is in it: the section must not jump
 * when half a megabyte of renderer finishes loading.
 */
const OrbPlaceholder = () => (
  <div className="grid h-full w-full place-items-center">
    <div className="h-2/3 w-2/3 animate-pulse rounded-full bg-surface" />
  </div>
)

const supportsWebGL = () => {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(
      window.WebGL2RenderingContext && canvas.getContext("webgl2")
    )
  } catch {
    return false
  }
}

const AppLibraryView = () => {
  const [slug, setSlug] = useState(APPS[0].slug)
  const [auto, setAuto] = useState(true)
  const [inView, setInView] = useState(false)
  const [near, setNear] = useState(false)
  const [webgl, setWebgl] = useState<boolean | null>(null)

  const host = useRef<HTMLDivElement>(null)
  const dock = useRef<HTMLDivElement>(null)

  const group = GROUP_OF.get(slug)

  useEffect(() => setWebgl(supportsWebGL()), [])

  const takeOver = useCallback(() => setAuto(false), [])

  const settle = useCallback((next: string) => {
    setAuto(false)
    setSlug(next)
  }, [])

  /* Two thresholds: one to start fetching the renderer, one to start moving. */
  useEffect(() => {
    const node = host.current
    if (!node) return

    const loader = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      { rootMargin: "600px 0px" }
    )
    const player = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    )
    loader.observe(node)
    player.observe(node)
    return () => {
      loader.disconnect()
      player.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!auto || !inView) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      setSlug((current) => {
        const next = APPS.findIndex((item) => item.slug === current) + 1
        return APPS[next % APPS.length].slug
      })
    }, DWELL)

    return () => window.clearInterval(id)
  }, [auto, inView])

  /* Keep the active mark in the dock without dragging the page along with it. */
  useEffect(() => {
    const strip = dock.current
    if (!strip) return
    const mark = strip.querySelector<HTMLElement>(`[data-slug="${slug}"]`)
    if (!mark) return

    const stripBox = strip.getBoundingClientRect()
    const markBox = mark.getBoundingClientRect()
    strip.scrollTo({
      left:
        strip.scrollLeft +
        (markBox.left - stripBox.left) -
        (stripBox.width - markBox.width) / 2,
      behavior: "smooth",
    })
  }, [slug])

  if (webgl === false) {
    return null
  }

  return (
    <div ref={host} onPointerDown={takeOver} onKeyDown={takeOver}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)] lg:gap-12 xlarge:gap-16">
        {/*
         * The sphere. It is given a square box and a stage rather than a card:
         * a border round it would turn an object into a picture of an object.
         */}
        <div className="relative">
          <div className="relative mx-auto aspect-square w-full max-w-[40rem] lg:max-w-none">
            {/*
             * A very quiet radial ground. Glass on paper needs something under
             * it or it reads as cut out and pasted on; this is far too faint to
             * count as a dark background and dark enough to be a floor.
             */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[4%] rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgb(var(--line-strong) / 0.55) 0%, rgb(var(--line) / 0.4) 45%, rgb(var(--surface) / 0.5) 72%, transparent 100%)",
              }}
            />
            {near && webgl ? (
              <AppOrb slug={slug} onSettle={settle} drift={auto} />
            ) : (
              <OrbPlaceholder />
            )}
          </div>

          {/*
           * The sphere is a picture, so it cannot be the only control. This is
           * the same twenty-eight as buttons: reachable by keyboard, named for
           * a screen reader, and quicker than waiting for a tile to come round.
           */}
          <div
            ref={dock}
            role="tablist"
            aria-label="Applications installed on the machine"
            aria-orientation="horizontal"
            className="no-scrollbar -mx-5 mt-2 flex gap-1 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:justify-center lg:overflow-visible lg:px-0"
          >
            {APPS.map((item) => (
              <button
                key={item.slug}
                type="button"
                role="tab"
                data-slug={item.slug}
                aria-selected={item.slug === slug}
                aria-label={`${item.name} — ${item.line}`}
                tabIndex={item.slug === slug ? 0 : -1}
                onClick={() => settle(item.slug)}
                onKeyDown={(event) => {
                  const step =
                    event.key === "ArrowRight" || event.key === "ArrowDown"
                      ? 1
                      : event.key === "ArrowLeft" || event.key === "ArrowUp"
                        ? -1
                        : 0
                  if (!step) return
                  event.preventDefault()
                  const at = APPS.findIndex((a) => a.slug === slug)
                  settle(APPS[(at + step + APPS.length) % APPS.length].slug)
                }}
                className={cn(
                  "pressable grid h-9 w-9 shrink-0 place-items-center rounded-md outline-none",
                  "opacity-45 grayscale transition-[opacity,filter] duration-200",
                  "hover:opacity-100 hover:grayscale-0 focus-visible:shadow-focus",
                  item.slug === slug &&
                    "bg-surface-strong opacity-100 grayscale-0"
                )}
              >
                <AppIcon app={item} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        {/*
         * What the application actually shows. Every one of the twenty-eight is
         * in the document — all names, all lines — with the inactive ones
         * hidden, so a crawler and a reader with no JavaScript still meet the
         * whole catalogue.
         */}
        <div className="relative min-h-[26rem] lg:min-h-[34rem]">
          {APPS.map((item) => (
            <div
              key={item.slug}
              role="tabpanel"
              aria-label={item.name}
              hidden={item.slug !== slug}
              className="h-full"
            >
              <AppScreenView app={item} screen={APP_SCREENS[item.slug]} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10">
        {group && (
          <p key={group.id} className="max-w-prose animate-screen-in text-base leading-7 text-muted">
            <span className="font-semibold text-ink">{group.title}.</span>{" "}
            {group.blurb}
          </p>
        )}

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setAuto((current) => !current)}
            aria-label={
              auto
                ? "Stop turning the sphere on its own"
                : "Turn the sphere on its own"
            }
            className="pressable flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-2xs uppercase tracking-[0.12em] text-muted outline-none hover:bg-surface hover:text-ink focus-visible:shadow-focus"
          >
            <svg aria-hidden viewBox="0 0 10 10" className="h-2.5 w-2.5">
              {auto ? (
                <path d="M1.5 1h2.4v8H1.5zM6.1 1h2.4v8H6.1z" fill="currentColor" />
              ) : (
                <path d="M2 1l6.5 4L2 9z" fill="currentColor" />
              )}
            </svg>
            {auto ? "pause" : "play"}
          </button>

          <span className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.12em] text-muted">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />
            {APP_COUNT} running
          </span>
        </div>
      </div>
    </div>
  )
}

export default AppLibraryView
