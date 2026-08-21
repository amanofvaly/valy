import { specRows } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SpecBlock from "@modules/common/components/spec-block"
import { Heading } from "@modules/common/components/ui"
import ProductActions from "@modules/products/components/product-actions"
import ProductDescription from "@modules/products/templates/description"
import ProductInfo from "@modules/products/templates/product-info"

/**
 * A service. The simplest of the three: there is nothing to photograph and
 * nothing to configure, only work to describe and a price.
 *
 * Narrower measure than the other two templates, because this page is read
 * rather than scanned.
 */
export default function ServiceTemplate({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const rows = specRows(product.metadata)

  return (
    <div className="container-page py-8 lg:py-12" data-testid="product-container">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-14">
        <div className="flex flex-col gap-8">
          <ProductInfo product={product} />
          <ProductDescription product={product} className="flex flex-col gap-4" />

          <section aria-labelledby="whats-included">
            <Heading level="h2" id="whats-included" className="mb-3 text-lg">
              What it involves
            </Heading>
            <SpecBlock rows={rows} />
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <ProductActions product={product} />

          <p className="rounded-lg border border-line bg-surface p-4 text-xs leading-5 text-muted">
            Buying this on its own? It applies to hardware you already have, done
            over a remote session. Bought alongside a machine, the work is done
            before it ships and you receive it finished.{" "}
            <LocalizedClientLink
              href="/categories/machines"
              className="text-accent hover:text-accent-strong"
            >
              See the machines
            </LocalizedClientLink>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
