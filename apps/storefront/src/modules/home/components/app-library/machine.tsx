"use client"

import * as Tabs from "@radix-ui/react-tabs"
import { APP_SCREENS } from "@lib/data/app-screens"
import { APP_COUNT, APP_GROUPS, APPS } from "@lib/data/self-hosted-apps"
import { cn } from "@lib/util/cn"
import { AppIcon } from "@modules/common/components/app-icon"
import { useCallback, useEffect, useRef, useState } from "react"

import { AppScreenView } from "./screen"

/**
 * The machine, with its own screen on the page.
 *
 * The section it replaced named twenty-eight applications and showed none of
 * them. This shows all twenty-eight, one at a time, in a frame that is plainly
 * the software rather than a photograph of a box.
 *
 * Three decisions carry it.
 *
 * **It runs on its own.** Almost nobody clicks a tab strip on a homepage, and a
 * launcher that has to be operated before it says anything is a list with extra
 * steps. So it walks itself through the catalogue while it is on screen, and
 * stops the moment anyone presses, types or focuses inside it — permanently,
 * not until the next tick. Off screen it stops too, under
 * `prefers-reduced-motion` it never starts, and the switch in the title bar
 * stops and restarts it deliberately, because content that changes on its own
 * owes the reader a control that says so.
 *
 * **Every screen is in the document.** The panels are force-mounted, so all
 * twenty-eight names, lines and captions are in the HTML for a crawler and for
 * a reader who never selects anything. Radix reads `forceMount` as "present"
 * and so stops setting `hidden` itself — the panels hide on `data-state`
 * instead, which is the same `display: none` and gives the entry animation for
 * free: a browser restarts CSS animations when an element becomes visible, so
 * nothing here needs a key, an observer, or a re-render to replay.
 *
 * **Radix owns the keyboard.** This is a tablist; arrow keys, Home, End, focus
 * management and the `aria-controls` wiring are behaviour we would otherwise
 * hand-roll badly.
 */

/** How long each application holds the screen before the next one takes it. */
const DWELL = 4200

const GROUP_OF = new Map(
  APP_GROUPS.flatMap((group) => group.apps.map((app) => [app.slug, group] as const))
)

const AppMachine = () => {
  const [slug, setSlug] = useState(APPS[0].slug)
  const [auto, setAuto] = useState(true)
  const [seen, setSeen] = useState(false)

  const frameRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const group = GROUP_OF.get(slug)

  /**
   * Any deliberate act ends the tour — a press, an arrow key, or focus landing
   * inside the frame. Only the switch in the title bar starts it again.
   */
  const takeOver = useCallback(() => setAuto(false), [])

  /* Only run while the frame is actually being looked at. */
  useEffect(() => {
    const node = frameRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => setSeen(entry.isIntersecting),
      { threshold: 0.35 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!auto || !seen) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return
      setSlug((current) => {
        const next = APPS.findIndex((app) => app.slug === current) + 1
        return APPS[next % APPS.length].slug
      })
    }, DWELL)

    return () => window.clearInterval(id)
  }, [auto, seen])

  /*
   * Keep the selected row in view inside the rail without touching the page
   * scroll — `scrollIntoView` would drag the window along with it, which on a
   * phone means the homepage moves on its own every four seconds.
   */
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const row = rail.querySelector<HTMLElement>(`[data-slug="${slug}"]`)
    if (!row) return

    /*
     * Measured, not `offsetTop`: the rail is a scroll container but not a
     * positioned one, so `offsetParent` is some ancestor and the offsets are
     * against the wrong origin — which centred the wrong row by roughly the
     * height of everything above the frame.
     */
    const railBox = rail.getBoundingClientRect()
    const rowBox = row.getBoundingClientRect()

    if (rail.scrollHeight > rail.clientHeight + 1) {
      const top =
        rail.scrollTop +
        (rowBox.top - railBox.top) -
        (railBox.height - rowBox.height) / 2
      rail.scrollTo({ top, behavior: "smooth" })
    } else {
      const left =
        rail.scrollLeft +
        (rowBox.left - railBox.left) -
        (railBox.width - rowBox.width) / 2
      rail.scrollTo({ left, behavior: "smooth" })
    }
  }, [slug])

  return (
    <div>
      <div
        ref={frameRef}
        onPointerDown={takeOver}
        onKeyDown={takeOver}
        onFocus={takeOver}
        className="overflow-hidden rounded-xl border border-line-strong bg-paper"
      >
        {/*
         * The machine's own bar, not the application's. It says the same thing
         * the section says, in the register of a device: this is one box, on
         * your network, with everything already running on it.
         */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 sm:px-5">
          <span className="font-mono text-2xs uppercase tracking-[0.12em] text-muted">
            valy.local
          </span>

          <div className="flex items-center gap-3 sm:gap-5">
            {/*
             * The tour, with a switch on it. Content that changes on its own
             * needs a way to stop it that is not "guess that touching the page
             * works", and the switch belongs in the machine's own bar rather
             * than under the frame as a caption.
             *
             * `pointerdown` is swallowed here because the frame uses it to end
             * the tour: without this the wrapper would set `auto` false and the
             * click would immediately toggle it back true, so pausing would
             * resume.
             */}
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setAuto((current) => !current)}
              aria-label={
                auto
                  ? "Stop moving through the applications on its own"
                  : "Move through the applications on its own"
              }
              className="pressable flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-2xs uppercase tracking-[0.12em] text-muted outline-none hover:bg-surface-strong hover:text-ink focus-visible:shadow-focus"
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

        <Tabs.Root
          value={slug}
          onValueChange={(next) => {
            setAuto(false)
            setSlug(next)
          }}
          orientation="vertical"
          activationMode="automatic"
          className="lg:grid lg:h-[36rem] lg:grid-cols-[16rem_1fr] xlarge:h-[38rem] xlarge:grid-cols-[18rem_1fr]"
        >
          {/*
           * The launcher. A column of twenty-eight on a desktop, a thumb-driven
           * strip on a phone. Every mark keeps its own colour at rest — a
           * greyed-out launcher that blooms on selection tests well and reads
           * as a smaller catalogue, which is the opposite of the claim.
           */}
          <Tabs.List
            ref={railRef}
            aria-label="Applications installed on the machine"
            className={cn(
              "no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto border-b border-line p-2",
              "lg:snap-none lg:flex-col lg:gap-0 lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r lg:p-2.5"
            )}
          >
            {APP_GROUPS.map((appGroup) => (
              <div key={appGroup.id} role="presentation" className="contents">
                <p
                  role="presentation"
                  className="hidden px-2.5 pb-1.5 pt-4 font-mono text-2xs uppercase tracking-[0.12em] text-muted first:pt-1.5 lg:block"
                >
                  {appGroup.title}
                </p>
                {appGroup.apps.map((app) => (
                  <Tabs.Trigger
                    key={app.slug}
                    value={app.slug}
                    data-slug={app.slug}
                    className={cn(
                      "pressable flex shrink-0 snap-start items-center gap-2.5 rounded-md px-2.5 py-2 text-left",
                      "text-sm text-muted outline-none",
                      "hover:bg-surface hover:text-ink",
                      "focus-visible:shadow-focus",
                      "radix-state-active:bg-surface-strong radix-state-active:font-medium radix-state-active:text-ink",
                      "lg:w-full lg:text-[0.9375rem]"
                    )}
                  >
                    <AppIcon app={app} className="h-5 w-5 lg:h-[1.375rem] lg:w-[1.375rem]" />
                    <span className="whitespace-nowrap lg:truncate">{app.name}</span>
                  </Tabs.Trigger>
                ))}
              </div>
            ))}
          </Tabs.List>

          <div className="min-w-0">
            {APPS.map((app) => (
              <Tabs.Content
                key={app.slug}
                value={app.slug}
                forceMount
                className="hidden h-full outline-none radix-state-active:block focus-visible:shadow-focus"
              >
                <AppScreenView app={app} screen={APP_SCREENS[app.slug]} />
              </Tabs.Content>
            ))}
          </div>
        </Tabs.Root>
      </div>

      {/*
       * The six chapters survived the redraw as the captions under the frame —
       * the sentence explaining why this handful of applications belongs
       * together, changing with what is on the screen.
       */}
      {group && (
        <div
          key={group.id}
          className="mt-7 flex animate-screen-in flex-col gap-2 lg:mt-8 lg:flex-row lg:items-baseline lg:gap-10"
        >
          <h3 className="shrink-0 text-lg font-semibold tracking-tight text-ink lg:w-[16rem] xlarge:w-[18rem]">
            {group.title}
          </h3>
          <p className="max-w-prose text-base leading-7 text-muted">
            {group.blurb}
          </p>
        </div>
      )}
    </div>
  )
}

export default AppMachine
