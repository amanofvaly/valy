import { APPS, type SelfHostedApp } from "@lib/data/self-hosted-apps"
import { cn } from "@lib/util/cn"

/**
 * The service marks, drawn once and referenced everywhere.
 *
 * Two places on the homepage draw all twenty-eight logos — the hero wall and
 * the library — and inlining the path data twice would put roughly 100KB of
 * `<path d>` in the document for a page whose entire argument is that it should
 * be on screen immediately. So the geometry ships once as a sheet of
 * `<symbol>`s and every instance is a four-attribute `<use>`.
 *
 * `fill="currentColor"` inside the symbol resolves against the referencing
 * element, which is what lets one shared definition render in twenty-eight
 * different brand colours.
 */

/** Render once per page, before the first `AppIcon`. */
export const AppIconSprite = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="absolute h-0 w-0 overflow-hidden"
  >
    {APPS.map((app) => (
      <symbol key={app.slug} id={`si-${app.slug}`} viewBox="0 0 24 24">
        <path d={app.path} fill="currentColor" />
      </symbol>
    ))}
  </svg>
)

/**
 * Decorative by default: every place this is used names the application in
 * adjacent text, so a second announcement would only add noise.
 */
export const AppIcon = ({
  app,
  className,
}: {
  app: SelfHostedApp
  className?: string
}) => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    style={{ color: app.brand }}
    className={cn("shrink-0", className)}
  >
    <use href={`#si-${app.slug}`} />
  </svg>
)
