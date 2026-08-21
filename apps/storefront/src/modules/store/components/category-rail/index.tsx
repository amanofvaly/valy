import { listCategories } from "@lib/data/categories"
import { cn } from "@lib/util/cn"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The catalogue's own navigation, in the browse sidebar.
 *
 * Without it the only routes into a category were five hardcoded links in the
 * header, and once you were inside one there was no way to reach a sibling or
 * get back to the full catalogue except the browser's back button. That does
 * not survive a catalogue of any size.
 *
 * The tree is rendered one level deep with the current branch expanded, rather
 * than every child of every parent — a hundred categories in a rail is a wall,
 * not navigation.
 */

/** Admin's own ordering, with name as the tiebreak. */
const byRank = (
  a: HttpTypes.StoreProductCategory,
  b: HttpTypes.StoreProductCategory
) => (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name)

type CategoryRailProps = {
  /** Handle of the category being viewed, if any. */
  activeHandle?: string
}

export default async function CategoryRail({
  activeHandle,
}: CategoryRailProps) {
  const categories = await listCategories({ limit: 200 })

  if (!categories.length) {
    return null
  }

  const roots = categories.filter((c) => !c.parent_category_id).sort(byRank)

  // Which branch to open: the active category, or its parent when the active
  // category is itself a child.
  const active = categories.find((c) => c.handle === activeHandle)
  const openRootId = active?.parent_category_id ?? active?.id

  return (
    <nav aria-label="Catalogue" className="flex flex-col gap-2">
      <p className="text-xs font-medium text-ink">Browse</p>

      <ul className="flex flex-col">
        <li>
          <LocalizedClientLink
            href="/store"
            aria-current={!activeHandle ? "page" : undefined}
            className={cn(
              "pressable-tint block rounded px-2 py-1.5 text-sm",
              !activeHandle
                ? "bg-surface font-medium text-ink"
                : "text-muted hover:text-ink"
            )}
          >
            Everything
          </LocalizedClientLink>
        </li>

        {roots.map((root) => {
          // The store API only ever returns active categories, so there is
          // nothing further to filter here.
          const children = [...(root.category_children ?? [])].sort(byRank)
          const isOpen = root.id === openRootId
          const isActive = root.handle === activeHandle

          return (
            <li key={root.id}>
              <LocalizedClientLink
                href={`/categories/${root.handle}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "pressable-tint flex items-baseline justify-between gap-2 rounded px-2 py-1.5 text-sm",
                  isActive
                    ? "bg-surface font-medium text-ink"
                    : "text-muted hover:text-ink"
                )}
              >
                {root.name}
                {!!children.length && (
                  <span className="font-mono text-2xs tabular text-muted">
                    {children.length}
                  </span>
                )}
              </LocalizedClientLink>

              {isOpen && !!children.length && (
                <ul className="mb-1 ml-2 flex flex-col border-l border-line pl-2">
                  {children.map((child) => {
                    const childActive = child.handle === activeHandle

                    return (
                      <li key={child.id}>
                        <LocalizedClientLink
                          href={`/categories/${child.handle}`}
                          aria-current={childActive ? "page" : undefined}
                          className={cn(
                            "pressable-tint block rounded px-2 py-1.5 text-sm",
                            childActive
                              ? "bg-surface font-medium text-ink"
                              : "text-muted hover:text-ink"
                          )}
                        >
                          {child.name}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** The rail's shape while it loads, so the sidebar does not jump. */
export const CategoryRailFallback = () => (
  <div className="flex animate-pulse flex-col gap-2" aria-hidden="true">
    <div className="h-3 w-14 rounded bg-surface" />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="h-7 w-full rounded bg-surface" />
    ))}
  </div>
)
