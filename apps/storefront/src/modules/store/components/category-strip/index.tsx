import { listCategories } from "@lib/data/categories"
import { cn } from "@lib/util/cn"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Sideways category navigation on a phone.
 *
 * The rail is a desktop device — below `lg` it is hidden, which left a phone
 * with no way to reach a sibling category at all. This is the row of scrollable
 * chips every mobile shop uses for the same job: where you are, what sits
 * beside it, and what is inside it.
 *
 * Shown only below `lg`, because above it the rail already does this better.
 */
export default async function CategoryStrip({
  activeHandle,
}: {
  activeHandle?: string
}) {
  const categories = await listCategories({ limit: 200 })
  const active = categories.find((c) => c.handle === activeHandle)

  if (!active) {
    return null
  }

  const parentId = active.parent_category_id
  const siblings = categories.filter((c) =>
    parentId ? c.parent_category_id === parentId : !c.parent_category_id
  )
  const children = active.category_children ?? []

  // Its own children are the more useful next step; failing that, its peers.
  const chips = children.length ? children : siblings

  if (chips.length < 2) {
    return null
  }

  return (
    <nav
      aria-label="Related categories"
      className="-mx-5 mb-2 lg:hidden"
    >
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-5">
        {parentId && (
          <li className="shrink-0">
            <LocalizedClientLink
              href={`/categories/${
                categories.find((c) => c.id === parentId)?.handle ?? ""
              }`}
              className="pressable inline-flex rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-muted active:bg-surface"
            >
              All
            </LocalizedClientLink>
          </li>
        )}

        {chips.map((chip) => {
          const isActive = chip.handle === activeHandle

          return (
            <li key={chip.id} className="shrink-0">
              <LocalizedClientLink
                href={`/categories/${chip.handle}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "pressable inline-flex rounded-full border px-3 py-1.5 text-sm",
                  isActive
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-muted active:bg-surface"
                )}
              >
                {chip.name}
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
