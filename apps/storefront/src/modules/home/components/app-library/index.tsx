import { APP_COUNT_WORD, APP_GROUPS } from "@lib/data/self-hosted-apps"
import { AppIcon } from "@modules/common/components/app-icon"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { Aside, Section, SectionHeading } from "@modules/home/components/section"

/**
 * What the machine is actually for.
 *
 * Each project's own mark, in each project's own colour, tinting its own cell.
 * It is the only place on the site where colour comes from the content, and it
 * is saturated because the software is, not because a homepage wanted colour.
 *
 * This is the one chapter that does not obey the page. Every other section
 * lives inside the 1280px container; this one runs to 1680px and drops the
 * rounded card entirely, so the catalogue is a wall of ruled cells that grows
 * past the frame the rest of the page keeps to. The density is the claim, and
 * a claim about density should not be made inside a smaller box than the
 * paragraph above it.
 *
 * The rules are drawn per cell rather than by a background sheet showing
 * through one-pixel gaps: two of the six groups hold an odd number, and at
 * three columns most of them do, so a sheet would leave a grey hole wherever
 * the last row came up short.
 *
 * The sprite these reference is emitted by the hero. Both live on the same
 * page and the hero renders first.
 */
const AppLibrary = () => (
  <Section id="apps" rule="accent" bleed>
    <div className="container-wide">
      <SectionHeading
        title={`${APP_COUNT_WORD[0].toUpperCase()}${APP_COUNT_WORD.slice(1)} applications, and not one of them is ours.`}
        lede="Free, open source, and installed before the machine leaves the bench. There is no Valy subscription underneath any of this and no account to keep paying for — if we disappeared tomorrow every one of these would carry on running, because nothing in the box depends on us."
        action={
          <Button asChild variant="secondary" size="large">
            <LocalizedClientLink href="/categories/services">
              Have us set them up
            </LocalizedClientLink>
          </Button>
        }
      />

      <div className="mt-14 flex flex-col gap-14 lg:gap-20">
        {APP_GROUPS.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`apps-${group.id}`}
            className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-12"
          >
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h3
                id={`apps-${group.id}`}
                className="max-w-[16ch] text-balance text-2xl font-semibold leading-tight tracking-tight text-ink"
              >
                {group.title}
              </h3>
              <p className="mt-3 max-w-prose text-base leading-7 text-muted">
                {group.blurb}
              </p>
            </div>

            <ul className="grid grid-cols-1 border-l border-t border-line sm:grid-cols-2 xl:grid-cols-3">
              {group.apps.map((app) => (
                <li
                  key={app.slug}
                  style={{ backgroundColor: app.wash }}
                  className="flex items-start gap-4 border-b border-r border-line p-5"
                >
                  <AppIcon app={app} className="mt-0.5 h-7 w-7" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-base font-semibold tracking-tight text-ink">
                      {app.name}
                    </p>
                    <p className="text-sm leading-6 text-muted">{app.line}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/*
       * The limit, said out loud. A wall of twenty-eight logos implies a machine
       * that runs all of them at once, and the smallest one does not.
       */}
      <Aside className="mt-14">
        Not all at once, and not all on the smallest machine. A Flow will hold a
        photo library, a film library and the network services without
        complaining; transcoding four streams while a language model runs is what
        the Hike and the Summit are for. Tell us what you want it to do and we
        will size it for that, which is cheaper than sizing it for everything.
      </Aside>
    </div>
  </Section>
)

export default AppLibrary
