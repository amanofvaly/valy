import type { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

export function ProductGrid({ products, count }: { products: HttpTypes.StoreProduct[]; count: number }) {
  return (
    <>
      <p className="mb-5 font-mono text-2xs tabular text-muted">{count} {count === 1 ? "product" : "products"}</p>
      {products.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4" data-testid="products-list">
          {products.map((product, index) => <li key={product.id} className="flex"><ProductPreview product={product} priority={index < 4} /></li>)}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong px-6 py-16 text-center">
          <p className="text-base font-medium text-ink">Nothing matches that.</p>
          <p className="mt-1 text-sm text-muted">Try another category or browse everything we sell.</p>
        </div>
      )}
    </>
  )
}
