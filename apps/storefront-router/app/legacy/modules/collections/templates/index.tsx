import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import BrowsePage from "@modules/store/templates/browse-page"

/**
 * A curated set — "Starting out", "Plex builds".
 *
 * Collections cut across the category tree: one holds a machine, the drives for
 * it and the setup service, which is the thing a category cannot express. The
 * facets are hidden here because a curated set is already a filter; offering
 * "RAM: 8GB" over a list of eleven hand-picked things is furniture.
 */

const COLLECTION_BLURB: Record<string, string> = {
  "starting-out":
    "The cheapest honest way in. A small machine, a drive that will not keep you awake, and the two jobs worth paying someone else to do the first time.",
  "plex-builds":
    "For a house where the television is the point. Hardware transcoding, enough bays for a film library that keeps growing, and the setup work that makes it play on the first evening.",
}

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
  products,
  count,
  facets,
  categories,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  products?: HttpTypes.StoreProduct[]
  count?: number
  facets?: any[]
  categories?: HttpTypes.StoreProductCategory[]
}) {
  return (
    <BrowsePage
      title={collection.title}
      description={COLLECTION_BLURB[collection.handle]}
      crumbs={[{ label: "Store", href: "/store" }]}
      sortBy={sortBy}
      page={page}
      countryCode={countryCode}
      optionValueIds={optionValueIds}
      products={products}
      count={count}
      facets={facets}
      categories={categories}
      collectionId={collection.id}
      hideOptionsPicker
      titleTestId="collection-page-title"
    />
  )
}
