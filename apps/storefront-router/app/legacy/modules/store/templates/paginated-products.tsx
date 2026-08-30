import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

export default function PaginatedProducts({
  page,
  products,
  count,
}: {
  page: number
  products: HttpTypes.StoreProduct[]
  count: number
}) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong px-6 py-16 text-center">
        <p className="text-base font-medium text-ink">Nothing matches that.</p>
        <p className="mt-1 text-sm text-muted">
          Try removing a filter, or browse everything we sell.
        </p>
      </div>
    )
  }

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <p className="mb-5 font-mono text-2xs tabular text-muted">
        {count} {count === 1 ? "product" : "products"}
      </p>

      <ul
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4"
        data-testid="products-list"
      >
        {products.map((product, i) => (
          <li key={product.id} className="flex">
            {/*
             * The first row is what the visitor sees before scrolling, so those
             * images are fetched at high priority rather than lazily.
             */}
            <ProductPreview product={product} priority={i < 4} />
          </li>
        ))}
      </ul>

      <Pagination
        data-testid="product-pagination"
        page={page}
        totalPages={totalPages}
      />
    </>
  )
}
