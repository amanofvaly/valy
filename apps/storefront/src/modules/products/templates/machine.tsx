import { listCompatibleParts } from "@lib/data/products"
import { specRows } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SpecBlock from "@modules/common/components/spec-block"
import { Heading } from "@modules/common/components/ui"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductPreview from "@modules/products/components/product-preview"
import ProductInfo from "@modules/products/templates/product-info"
import ProductDescription from "@modules/products/templates/description"
import ServiceAddons from "@modules/products/components/service-addons"
import { Suspense } from "react"

/**
 * A machine.
 *
 * The longest of the three templates, because it is the only one where a
 * decision is being made rather than a part being replaced. Narrative first,
 * then the configurator, then the full specification, then what else fits it.
 *
 * The buy column is sticky on a wide screen so the price and the button stay
 * reachable while the specification is being read — which is the whole reason
 * someone scrolls this page.
 */
export default function MachineTemplate({
  product,
  countryCode,
  images,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}) {
  const rows = specRows(product.metadata)

  return (
    <div className="container-page py-8 lg:py-12" data-testid="product-container">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div className="flex flex-col gap-8">
          <ProductInfo product={product} />
          <ImageGallery
            images={images}
            title={product.title}
            metadata={product.metadata}
          />
          <ProductDescription product={product} className="flex flex-col gap-4" />
        </div>

        <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          <ProductActions product={product}>
            {/*
             * The services step. The plan is explicit that this is where the
             * install work actually sells: at the moment someone is deciding
             * what the machine should arrive doing, not on a separate page they
             * will never visit.
             */}
            <Suspense fallback={null}>
              <ServiceAddons countryCode={countryCode} />
            </Suspense>
          </ProductActions>

          <section aria-labelledby="specification">
            <Heading level="h2" id="specification" className="mb-3 text-lg">
              Specification
            </Heading>
            <SpecBlock rows={rows} />
          </section>
        </div>
      </div>

      <Suspense fallback={null}>
        <CompatibleParts product={product} countryCode={countryCode} />
      </Suspense>
    </div>
  )
}

/**
 * What can go in this machine, read from the parts catalogue rather than
 * maintained as a second list that would drift.
 */
async function CompatibleParts({
  product,
  countryCode,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  const parts = await listCompatibleParts(product.handle!, countryCode)

  if (!parts.length) {
    return null
  }

  return (
    <section
      className="mt-16 border-t border-line pt-10 lg:mt-24"
      aria-labelledby="what-fits"
      data-testid="related-products-container"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
            What fits it
          </p>
          <Heading level="h2" id="what-fits">
            Everything that goes in a {product.title}
          </Heading>
        </div>
        <LocalizedClientLink
          href="/compatibility"
          className="text-sm text-accent hover:text-accent-strong"
        >
          The whole compatibility list
        </LocalizedClientLink>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4">
        {parts.slice(0, 8).map((part) => (
          <li key={part.id} className="flex">
            <ProductPreview product={part} />
          </li>
        ))}
      </ul>
    </section>
  )
}
