import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Badge } from "@modules/common/components/ui"

/**
 * The heading block, shared by all three product templates: where this thing
 * sits in the catalogue, what it is called, and the one sentence explaining why
 * it exists.
 */
const ProductInfo = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const category = product.categories?.[0]

  return (
    <div className="flex flex-col gap-3" id="product-info">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <LocalizedClientLink href="/store" className="hover:text-ink">
              Store
            </LocalizedClientLink>
            <span aria-hidden="true">/</span>
          </li>
          {category && (
            <li className="flex items-center gap-1.5">
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                className="hover:text-ink"
              >
                {category.name}
              </LocalizedClientLink>
              <span aria-hidden="true">/</span>
            </li>
          )}
          <li aria-current="page">{product.title}</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        {product.collection && (
          <LocalizedClientLink href={`/collections/${product.collection.handle}`}>
            <Badge color="accent">{product.collection.title}</Badge>
          </LocalizedClientLink>
        )}
        {(product.tags ?? []).slice(0, 3).map((tag) => (
          <Badge key={tag.id}>{tag.value}</Badge>
        ))}
      </div>

      <h1
        className="text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        data-testid="product-title"
      >
        {product.title}
      </h1>

      {product.subtitle && (
        <p className="max-w-prose text-lg leading-7 text-muted">
          {product.subtitle}
        </p>
      )}
    </div>
  )
}

export default ProductInfo
