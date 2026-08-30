import { APPS } from "@lib/data/self-hosted-apps"
import { AppIcon, AppIconSprite } from "@modules/common/components/app-icon"
import BuyFlow from "@modules/home/components/hero/buy-flow"
import Image from "next/image"

/**
 * The argument, stated once, at the size it deserves.
 *
 * The picture is the software. Real marks, each project's own colour, no
 * photograph of a datacentre and no render of a box. The wall is the product
 * argument: this much is possible, none of it is proprietory, and the machine is the
 * only part with a price on it.
 *
 * What changed is the scale and the edges. The wall used to be a rounded card
 * in the right-hand column of a two-column hero, roughly 500px wide — twenty-
 * eight logos rendered at the size of favicons, which argued the opposite of
 * what the sentence above it said. Now the headline gets the full measure and
 * the wall gets the full window: it runs off both edges of the screen, so the
 * catalogue reads as something that continues past the frame rather than
 * something that fits inside a box.
 *
 * One word carries the accent. It is the word the whole page is about, and the
 * accent is now the same blue the buy button is made of, so the emphasis in
 * the sentence and the thing it is asking for are visibly one colour.
 *
 * A first-time visitor used to reach a sentence, a wall of logos, a paragraph
 * and then two buttons offering a search and a definition — nowhere in the
 * first screen was there a product or a price. The machine, what it starts at,
 * and the button that buys it now sit directly under the headline on every
 * screen, on the same left margin, so the eye finishes the sentence and lands
 * on the button without crossing the picture.
 *
 * The paragraph that used to close the chapter is gone. "As more of life moves
 * online, owning your data has never been more important" was the weak version
 * of the sentence the ink band under this one now says properly, set three
 * inches before it in grey. The hero ends on the plate caption and hands
 * straight over.
 */

const Hero = ({ countryCode }: { countryCode: string }) => (
  <section className="bg-paper">
    <AppIconSprite />

    {/*
     * The headline sits on the room rather than on paper.
     *
     * The crop does half the work: `object-left` on a phone keeps the pale wall
     * — the only part of the frame a headline can sit on — behind the type, and
     * only from `sm` does the whole room come into view. But the wall is not
     * uniform, and a window, a lampshade or a pale book spine drifting under a
     * letterform is enough to cost a word its edge.
     *
     * So the left of the frame is washed back to paper. Not a scrim across the
     * whole picture, which would turn a lit room into a grey one: the wash is
     * full strength at the left margin, three-quarters under the headline, and
     * gone by the time the shelves start, so the room is still a photograph
     * everywhere the eye actually looks at it.
     */}
    <div className="relative isolate overflow-hidden">
      <Image
        src="/home/hero-room.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-left sm:object-center"
      />

      {/*
       * `paper/0` rather than `transparent` for the last stop. Tailwind's
       * `transparent` is the CSS keyword, which is transparent *black*, and a
       * white-to-that ramp fades through grey in any engine that interpolates
       * un-premultiplied — a dirty smear across the middle of the room. Fading
       * white to zero-alpha white can only ever be white.
       *
       * The wash runs further right on a phone, where the headline spans most
       * of the frame, and pulls back from `sm` once the type has a column of
       * its own.
       */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-paper via-paper/75 via-45% to-paper/0 to-92% sm:via-40% sm:to-70%"
      />

      {/*
       * One column, not two. The buy block used to take a fixed 20rem column to
       * the right of the headline, which on a wide screen put it out over the
       * middle of the photograph and left the headline's own margin ending in
       * nothing. Stacked, both start on the page gutter: the headline sets the
       * left edge and the button and its price hang off it.
       *
       * `items-start` rather than a width — the block is as wide as the button,
       * wherever the button lands.
       */}
      <div className="container-page relative flex flex-col items-start gap-8 pb-10 pt-10 sm:pb-14 sm:pt-16 lg:min-h-[30rem] lg:justify-center lg:gap-10 lg:pb-16 lg:pt-24">
        <div className="relative z-10 flex flex-col items-start gap-8 lg:gap-10">
          <h1 className="max-w-[13ch] text-balance text-[2.75rem] font-semibold leading-[0.98] tracking-tight text-ink xsmall:text-5xl sm:text-6xl lg:text-7xl">
            A Private Home For Your{" "}
            <span className="text-accent [text-shadow:0_0_8px_rgba(255,255,255,0.95),0_0_18px_rgba(255,255,255,0.85)] sm:[text-shadow:none]">
              Digital Life
            </span>
          </h1>

          <BuyFlow countryCode={countryCode} />
        </div>

        {/*
         * Server overlay, clipped at the base.
         * Pushed down slightly via translate-y to ground the feet and correct
         * the floating effect caused by the photograph's perspective.
         */}
        <div className="pointer-events-none absolute bottom-0 right-4 z-0 w-1/2 max-w-[200px] translate-y-12   sm:right-8 sm:max-w-[260px] sm:translate-y-8 lg:right-12 lg:w-full lg:max-w-[320px] lg:translate-y-8 xl:max-w-[360px] xl:translate-y-8">
          <Image
            src="/home/hero-valy-cabinet-trimmed.png"
            alt="Valy Server"
            width={1068}
            height={1291}
            className="block h-auto w-full object-contain object-bottom"
            priority
          />
        </div>
      </div>
    </div>

    {/*
     * Twenty-eight divides exactly two ways that are worth looking at: seven
     * across and four down on a phone, fourteen across and two down on a wide
     * screen. Both fill the last row, so the band always has a straight bottom
     * edge and never a run of empty cells.
     */}
    <ul
      aria-hidden="true"
      className="grid grid-cols-7 gap-px border-y border-line bg-line lg:grid-cols-[repeat(14,minmax(0,1fr))]"
    >
      {APPS.map((app, index) => (
        <li
          key={app.slug}
          className="flex aspect-square animate-app-cell-in items-center justify-center"
          style={{
            backgroundColor: app.wash,
            animationDelay: `${index * 16}ms`,
          }}
        >
          <AppIcon
            app={app}
            className="h-6 w-6 xsmall:h-8 xsmall:w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11"
          />
        </li>
      ))}
    </ul>

    {/*
     * A plate caption: the same width as the page, hard against the band above
     * it, naming what is in the picture.
     */}
    <div className="border-b border-line">
      <p className="container-page py-4 text-sm leading-6 text-muted">
        Automatically back up every device, stream your media anywhere, share
        files securely, and access your data from anywhere, all from one compact
        server.{" "}
        <a
          href="#apps"
          className="font-medium text-accent underline decoration-accent/35 underline-offset-4 transition-colors hover:decoration-accent"
        >
          Most popular apps
        </a>
      </p>
    </div>
  </section>
)

export default Hero
