import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The catalogue's table of contents, at the top of `/store`.
 *
 * `/store` used to open straight into a paginated grid of everything, with the
 * only route into a category being five hardcoded links in the header. That
 * works for twenty-three products and fails completely at two hundred: a
 * shopper who wants drives has no way to say so.
 *
 * Grouped by top-level category with the children listed under each, so it
 * stays one screen however many categories exist — the depth lives on the
 * category pages, not here.
 */
/** Admin's own ordering, with name as the tiebreak. */
const byRank = (
  a: HttpTypes.StoreProductCategory,
  b: HttpTypes.StoreProductCategory
) => (a.rank ?? 0) - (b.rank ?? 0) || a.name.localeCompare(b.name)

export default function CategoryIndex({
  categories = [],
}: {
  categories?: HttpTypes.StoreProductCategory[]
}) {
  const roots = categories.filter((c) => !c.parent_category_id).sort(byRank)

  if (!roots.length) {
    return null
  }

  return (
    <nav aria-labelledby="browse-catalogue" className="border-t border-line pt-8">
      

      {/*
       * Multi-column rather than grid: categories have wildly different numbers
       * of children, and a grid sizes every row to its tallest cell — which
       * left a category with no children sitting above a hole. Columns let each
       * entry take exactly its own height and flow on.
       */}
      <ul className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
        {roots.map((root) => {
          const children = [...(root.category_children ?? [])].sort(byRank)

          return (
            <li
              key={root.id}
              className="mb-6 flex break-inside-avoid flex-col gap-2"
            >
              <LocalizedClientLink
                href={`/categories/${root.handle}`}
                className="group flex items-baseline justify-between gap-3 border-b border-line pb-2"
              >
                <span className="text-base font-medium text-ink group-hover:text-accent">
                  {root.name}
                </span>
                {!!children.length && (
                  <span className="font-mono text-2xs tabular text-muted">
                    {children.length}
                  </span>
                )}
              </LocalizedClientLink>

              {!!children.length && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {children.map((child) => (
                    <li key={child.id}>
                      <LocalizedClientLink
                        href={`/categories/${child.handle}`}
                        className="text-sm text-muted hover:text-ink"
                      >
                        {child.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Reserves the index's height so the grid below it does not jump. */
export const CategoryIndexFallback = () => (
  <div className="animate-pulse border-y border-line py-8" aria-hidden="true">
    <div className="mb-5 h-3 w-14 rounded bg-surface" />
    <div className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-6 flex break-inside-avoid flex-col gap-3">
          <div className="h-6 w-full rounded bg-surface" />
          <div className="h-4 w-2/3 rounded bg-surface" />
        </div>
      ))}
    </div>
  </div>
)
