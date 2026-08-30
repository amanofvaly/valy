/**
 * The loading state every page in this group falls back to.
 *
 * Its job is not to be pretty. Without a `loading.tsx` on a segment, the App
 * Router will not commit a navigation until the server component has finished
 * every `await` in it — so a click on a nav link leaves the reader on the page
 * they were already on, with nothing on screen having changed, until the
 * payload lands. A plain `<a href>` between two static files behaves better
 * than that, because the browser at least starts a navigation you can see.
 *
 * This file is what buys that behaviour back. With it present the router
 * commits immediately: the header and footer stay (they are the layout), the
 * URL changes, and this fills the content slot until the real page streams in.
 *
 * It sits on the group rather than on each route on purpose. Every segment
 * under `(main)` inherits it, including routes that do not exist yet — a new
 * page, or the ten-thousandth product under `products/[handle]`, is covered the
 * moment it is added and needs no work of its own.
 *
 * So it is deliberately shape-neutral: a heading block and a few lines of prose,
 * which is how most pages in this group open. A skeleton that promises a card
 * grid to a page that turns out to be a policy document is a layout shift
 * wearing a courtesy's clothes. Where a route's real shape is worth drawing —
 * the store grid, the product page — that route gets its own `loading.tsx`
 * beside its `page.tsx`, and the closer file wins.
 */
const Loading = () => (
  <div className="container-page py-10 sm:py-14">
    <span role="status" className="sr-only">
      Loading
    </span>

    <div aria-hidden className="animate-pulse">
      {/* The heading and its lede, at the measurements the pages here use. */}
      <div className="flex flex-col gap-4">
        <div className="h-8 w-3/4 max-w-[24rem] rounded bg-surface sm:h-11 sm:max-w-[32rem]" />
        <div className="h-4 w-full max-w-prose rounded bg-surface" />
        <div className="h-4 w-4/5 max-w-prose rounded bg-surface" />
      </div>

      {/*
       * A rule and a few more lines under it. Enough that the slot is not an
       * empty screen, little enough that it does not describe a layout the
       * arriving page may not have.
       */}
      <div className="mt-12 border-t border-line pt-10">
        <div className="flex max-w-prose flex-col gap-3">
          <div className="h-4 w-full rounded bg-surface" />
          <div className="h-4 w-11/12 rounded bg-surface" />
          <div className="h-4 w-2/3 rounded bg-surface" />
        </div>
      </div>
    </div>
  </div>
)

export default Loading
