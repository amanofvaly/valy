import { APPS } from "@lib/data/self-hosted-apps"
import { AppIcon, AppIconSprite } from "@modules/common/components/app-icon"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

/**
 * The argument, stated once, at the size it deserves.
 *
 * The picture is the software. Real marks, each project's own colour, no
 * photograph of a datacentre and no render of a box. The wall is the product
 * argument: this much is possible, none of it is ours, and the machine is the
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
 * One word is red. It is the word the whole page is about.
 */

/**
 * The six most people will recognise, named in the caption. The caption is
 * also the wall's accessible text — twenty-eight logos read out one after
 * another is a worse experience than a sentence, and the library two sections
 * down gives every one of them a proper name and a description.
 */
const FAMILIAR = [
  "Immich",
  "Jellyfin",
  "Home Assistant",
  "Pi-hole",
  "Frigate",
  "Proxmox",
]

const Hero = () => (
  <section className="bg-paper">
    <AppIconSprite />

    <div className="container-page pb-10 pt-12 sm:pb-14 sm:pt-20 lg:pb-16 lg:pt-24">
      <h1 className="max-w-[13ch] text-balance text-5xl font-semibold leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-7xl xl:text-8xl">
        All of this is <span className="text-accent">free</span>. The machine is
        the only part you buy.
      </h1>
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
        {FAMILIAR.join(", ")} and twenty-two more, installed and configured
        before it ships.{" "}
        <a
          href="#apps"
          className="font-medium text-accent underline decoration-accent/35 underline-offset-4 transition-colors hover:decoration-accent"
        >
          What each one does
        </a>
      </p>
    </div>

    {/*
     * The action sits in the left margin and the argument runs beside it in two
     * columns. On a phone the same source order puts the buttons above the
     * prose, which is where they belong when the reader has already seen the
     * wall.
     */}
    <div className="container-page grid grid-cols-1 gap-x-12 gap-y-8 py-12 lg:grid-cols-12 lg:py-16">
      <div className="flex flex-col gap-3 lg:col-span-4 lg:pr-6">
        <Button asChild size="large" block>
          <LocalizedClientLink href="/categories/machines">
            See the five machines
          </LocalizedClientLink>
        </Button>
        <Button asChild variant="secondary" size="large" block>
          <LocalizedClientLink href="/getting-started">
            Never done this before
          </LocalizedClientLink>
        </Button>
      </div>

      <div className="flex flex-col gap-6 text-base leading-7 text-muted md:grid md:grid-cols-2 md:gap-10 lg:col-span-8">
        <p>
          Immich holds a phone camera roll better than Google Photos does.
          Jellyfin plays your films on every television in the house. Pi-hole
          takes the advertising out of the whole network, Frigate watches the
          front door without a subscription, and Home Assistant runs the lights.
          All of it is open source, all of it costs nothing, and none of it is
          ours.
        </p>
        <p>
          The catch has always been that somebody has to choose the parts, build
          the array, install twenty-eight applications and be there when a drive
          dies. That is the part we sell. A Valy machine arrives with the
          operating system installed, the storage built and the apps already
          running, so the first evening is spent copying photographs across
          rather than reading forum posts.
        </p>
      </div>
    </div>
  </section>
)

export default Hero
