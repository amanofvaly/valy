import { fitsHandles, specRows } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SpecBlock from "@modules/common/components/spec-block"
import { Heading } from "@modules/common/components/ui"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductPreview from "@modules/products/components/product-preview"
import ProductDescription from "@modules/products/templates/description"
import ProductInfo from "@modules/products/templates/product-info"
import { Suspense } from "react"

/**
 * A part. Compact by design: specification, price, what it fits, buy.
 *
 * Someone on this page usually already knows what they want and is checking one
 * thing — that it goes in their machine. So "what it fits" is a first-class
 * section rather than a footnote, and it is read from the same `fits` metadata
 * that drives "what can I add" on the machine pages, so the two can never
 * disagree.
 */
export default function PartTemplate({
  product,
  countryCode,
  images,
  machines,
  sameCategory,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  machines?: HttpTypes.StoreProduct[]
  sameCategory?: HttpTypes.StoreProduct[]
}) {
  const rows = specRows(product.metadata)
  const fits = fitsHandles(product.metadata)

  return (
    <div className="container-page py-8 lg:py-12" data-testid="product-container">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        {/*
         * Image and buy action together, and they stay put: a part page is
         * mostly description and specification, and the price and the button
         * used to scroll away with the photograph, so buying meant scrolling
         * back up.
         */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
          <ImageGallery
            images={images}
            title={product.title}
            metadata={product.metadata}
          />
          <ProductActions product={product} />
        </div>

        <div className="flex flex-col gap-8">
          <ProductInfo product={product} />
          <ProductDescription product={product} className="flex flex-col gap-4" />

          <section aria-labelledby="specification">
            <Heading level="h2" id="specification" className="mb-3 text-lg">
              Specification
            </Heading>
            <SpecBlock rows={rows} />
          </section>

          {!!fits.length && (
            <Suspense fallback={null}>
              <FitsList handles={fits} products={machines} />
            </Suspense>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <SameCategory product={product} products={sameCategory} />
      </Suspense>
    </div>
  )
}

/** The machines this part is tested in, named and linked. */
function FitsList({
  handles,
  products = [],
}: {
  handles: string[]
  products?: HttpTypes.StoreProduct[]
}) {

  const machines = handles
    .map((handle) => products.find((p) => p.handle === handle))
    .filter(Boolean) as HttpTypes.StoreProduct[]

  if (!machines.length) {
    return null
  }

  return (
    <section aria-labelledby="fits">
      <Heading level="h2" id="fits" className="mb-3 text-lg">
        What it fits
      </Heading>
      <ul className="flex flex-wrap gap-2">
        {machines.map((machine) => (
          <li key={machine.id}>
            <LocalizedClientLink
              href={`/products/${machine.handle}`}
              className="pressable inline-flex rounded border border-line bg-paper px-3 py-1.5 text-sm text-ink hover:border-line-strong active:bg-surface"
            >
              {machine.title}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Tested in these. It will work in anything else with the same interface —
        nothing here is locked to an approved list.
      </p>
    </section>
  )
}

/** Alternatives in the same category, which is what someone actually wants next. */
function SameCategory({
  product,
  products = [],
}: {
  product: HttpTypes.StoreProduct
  products?: HttpTypes.StoreProduct[]
}) {
  const others = products.filter((p) => p.id !== product.id).slice(0, 4)

  if (!others.length) {
    return null
  }

  return (
    <section
      className="mt-16 border-t border-line pt-10 lg:mt-24"
      data-testid="related-products-container"
    >
      <Heading level="h2" className="mb-6">
        Other options
      </Heading>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 xl:grid-cols-4">
        {others.map((other) => (
          <li key={other.id} className="flex">
            <ProductPreview product={other} />
          </li>
        ))}
      </ul>
    </section>
  )
}
