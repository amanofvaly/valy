import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import BrowsePage, { Crumb } from "@modules/store/templates/browse-page"
import { notFound } from "next/navigation"

/**
 * A category. The Machines category is the lineup — Flow, Hike, Summit — which
 * is why there is no separate lineup collection duplicating it.
 */
export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  if (!category || !countryCode) {
    notFound()
  }

  const crumbs: Crumb[] = [{ label: "Store", href: "/store" }]
  const ancestors: HttpTypes.StoreProductCategory[] = []

  let cursor = category.parent_category
  while (cursor) {
    ancestors.unshift(cursor)
    cursor = cursor.parent_category
  }

  ancestors.forEach((ancestor) =>
    crumbs.push({
      label: ancestor.name,
      href: `/categories/${ancestor.handle}`,
    })
  )

  return (
    <BrowsePage
      title={category.name}
      description={category.description}
      crumbs={crumbs}
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
      optionValueIds={optionValueIds}
      categoryId={category.id}
      categoryHandle={category.handle}
      titleTestId="category-page-title"
    />
  )
}
