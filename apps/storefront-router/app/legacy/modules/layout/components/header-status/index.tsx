"use client"

import { useSyncExternalStore } from "react"

/**
 * What the header says when a page has taken it over.
 *
 * One page needs the header to stop being the site's header and become its
 * own: the Flow configurator, on a phone. It is seven decisions long, and the
 * only two fixed strips a 375px screen has were being spent on a wordmark and
 * a cart link — a name the reader already knows and a way out of the page they
 * are in the middle of — while the thing they are actually assembling appeared
 * nowhere until they scrolled to the bottom.
 *
 * So the configurator publishes what it is building and the header renders it:
 * the wordmark becomes the machine's name, and the cart's slot becomes the
 * running specification. One row, no second bar under it.
 *
 * This is a module-level store rather than a context because the header and
 * the page are siblings under the layout, not parent and child. Wrapping the
 * whole app in a provider so that one route can pass a string upward is a lot
 * of tree for one string. `useSyncExternalStore` is what React gives for
 * exactly this: an external value, read safely during concurrent renders,
 * with a server snapshot for the pass where there is no page state yet.
 */
export type HeaderStatus = {
  /** Replaces the wordmark. Keep it to two or three words. */
  title: string
  /** The running detail line. Truncated, so put the changeable part first. */
  detail: string
}

let status: HeaderStatus | null = null
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => status

/*
 * Always null on the server. The status is client state by definition — it
 * describes a selection made after hydration — and returning anything else
 * would render a header the first client pass immediately contradicts.
 */
const getServerSnapshot = () => null

/**
 * Hand the header over, or give it back with `null`.
 *
 * Call it from an effect and return the `null` call as the cleanup, so the
 * header is released when the page unmounts. A page that sets this and does
 * not clear it leaves its own title on top of the next route.
 */
export const setHeaderStatus = (next: HeaderStatus | null) => {
  status = next
  listeners.forEach((listener) => listener())
}

export const useHeaderStatus = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

/**
 * The wordmark's text.
 *
 * Both versions are rendered and one is hidden, rather than switching on the
 * breakpoint in JavaScript: the header has no idea how wide it is at render
 * time, and a `matchMedia` here would flash the wrong word on load. From `lg`
 * the page has its own summary bar under the header and the wordmark stays
 * the wordmark.
 */
export const HeaderWordmark = () => {
  const current = useHeaderStatus()

  if (!current) {
    return <>Valy</>
  }

  return (
    <>
      <span className="lg:hidden">{current.title}</span>
      <span className="hidden lg:inline">Valy</span>
    </>
  )
}

/**
 * The detail line, in the header's right-hand slot.
 *
 * `min-w-0` and `truncate` because the specification outgrows a phone almost
 * immediately — four parts and it is past 40 characters. It is the tail that
 * gets cut, which is why `buildSummary` puts the machine first: the part that
 * changes least is the part worth losing.
 */
export const HeaderStatusDetail = () => {
  const current = useHeaderStatus()

  if (!current) {
    return null
  }

  return (
    <p className="min-w-0 truncate text-right text-xs leading-5 text-muted lg:hidden">
      {current.detail}
    </p>
  )
}
