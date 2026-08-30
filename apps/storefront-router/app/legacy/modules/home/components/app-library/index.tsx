import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Section, SectionHeading } from "@modules/home/components/section"

import AppMachine from "./machine"

/**
 * What the machine is actually for.
 *
 * This section has been a list twice. First as six ruled grids, each cell a
 * wash of the project's colour; then as one wall of twenty-eight marks with a
 * name and a caption under each. The second was a better-looking list than the
 * first, which is all it was — the reader still met twenty-eight pieces of
 * software as twenty-eight words, and a homepage arguing that self-hosting is
 * within reach cannot make that argument out of a bibliography.
 *
 * Everyone else selling a home server worked this out already. Umbrel, Start9
 * and CasaOS all lead with the screen: a photo library that is visibly a photo
 * library, a camera view with a rectangle drawn round the person at the door, a
 * counter reading eighteen thousand requests dropped today. The screen is the
 * product. A logo is a receipt for one.
 *
 * So the section is the machine now: a frame with a launcher down one side and
 * whichever application is selected filling the rest, walking itself through
 * all twenty-eight while it is on screen. There are no screenshots to ship and
 * no honest way to fake one, so each screen is a drawing of an interface in
 * this site's own hairlines and ink, with the application's colour as the only
 * accent inside its frame — clearly a rendering, and clearly the software.
 *
 * The three things the old version did well are kept. Every application still
 * carries its own mark in its own colour, which is still the one place on this
 * site where colour comes from content. All twenty-eight are still named, with
 * their line, in the document rather than behind an interaction. And the six
 * chapters still exist — as the launcher's headings and as the caption under
 * the frame, which changes with what is on the screen.
 *
 * The container stays wide. A section whose claim is that this much is possible
 * should physically outgrow the paragraphs around it.
 */

const AppLibrary = () => (
  <Section id="apps" rule="accent" bleed className="pb-0 sm:pb-0 lg:pb-0">
    <div className="container-page">
      <SectionHeading
        title={`Start simple. Grow when you're ready.`}
        lede="Whether you're backing up family photos, building a media library, running AI locally, hosting a website, or simply replacing cloud subscriptions, it adapts to your needs without becoming complicated."
        action={
          <Button asChild variant="secondary" size="large">
            <LocalizedClientLink href="/products/valy-flow">
              Configure your first homelab
            </LocalizedClientLink>
          </Button>
        }
      />

      <div className="mt-10 lg:mt-12">
        <AppMachine />
      </div>
    </div>
  </Section>
)

export default AppLibrary
