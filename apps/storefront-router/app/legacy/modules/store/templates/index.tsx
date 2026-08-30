import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import CategoryIndex, {
  CategoryIndexFallback,
} from "@modules/store/components/category-index"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Suspense } from "react"
import BrowsePage from "./browse-page"

/**
 * Everything Valy sells, in one list: machines, the parts that go in them, and
 * the work we do to them. Most visitors arrive at a category instead; this is
 * the page for someone who wants to see the whole thing.
 */
const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  optionValueIds,
  products,
  count,
  facets,
  categories,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  products?: HttpTypes.StoreProduct[]
  count?: number
  facets?: any[]
  categories?: HttpTypes.StoreProductCategory[]
}) => (
  <BrowsePage
    title="All Products"
    description="Preconfigured servers, storage, cases, network parts, and a lot more to setup your homelab."
    sortBy={sortBy}
    page={page}
    countryCode={countryCode}
    optionValueIds={optionValueIds}
    products={products}
    count={count}
    facets={facets}
    categories={categories}
    titleTestId="store-page-title"
    hideCategoryRail
  >
    {/*
     * The table of contents. Streamed, because it needs the catalogue and the
     * heading above it does not.
     */}
    <Suspense fallback={<CategoryIndexFallback />}>
      <CategoryIndex />
    </Suspense>
  </BrowsePage>
)

export default StoreTemplate
