import { getProductPrice } from "@lib/util/get-product-price"
import { headlineSpecs, productKind } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SpecInline } from "@modules/common/components/spec-block"
import { Badge } from "@modules/common/components/ui"
import Thumbnail from "../thumbnail"
import CardPending from "./card-pending"
import PreviewPrice from "./price"

/**
 * One product in a grid.
 *
 * Every card in a row is the same height and every element sits on the same
 * baseline as its neighbour: the image cannot shrink, the title is clamped to
 * two lines and reserves both, the description to one, and the price is pushed
 * to the bottom. Before this the four cards in a row had four different image
 * heights and four different title baselines, which reads as broken however
 * good the individual pieces are.
 */

const KIND_LABEL = {
  machine: "Machine",
  part: "Part",
  service: "Service",
} as const

export default function ProductPreview({
  product,
  isFeatured,
  priority,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  priority?: boolean
  region?: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const kind = productKind(product)
  const specs = headlineSpecs(product.metadata, 3)

  // "From" only when the variants are actually priced differently — saying it
  // on a single-price part is noise, and saying it nowhere hides that a
  // machine's price depends on how it is configured.
  const prices = (product.variants ?? [])
    .map(
      (v) =>
        (
          v as HttpTypes.StoreProductVariant & {
            calculated_price?: { calculated_amount?: number }
          }
        ).calculated_price?.calculated_amount
    )
    .filter((n): n is number => typeof n === "number")
  const spansRange =
    prices.length > 1 && Math.min(...prices) !== Math.max(...prices)

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      /*
       * `w-full` is load-bearing. The grid cell is `display: flex` and this
       * anchor is its flex item, so without an explicit width it sizes to its
       * own content — which made every card in a row a different width, and
       * therefore (via `aspect-square`) a different height. That was the ragged
       * grid, not the image component.
       */
      className="group flex h-full w-full flex-col gap-3 rounded-lg focus-visible:outline-none"
      data-testid="product-wrapper"
    >
      <div className="relative shrink-0">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          title={product.title}
          metadata={product.metadata}
          isFeatured={isFeatured}
          priority={priority}
          className="ring-1 ring-inset ring-line transition-shadow group-hover:ring-line-strong group-active:ring-ink"
        />
        {kind !== "part" && (
          <Badge
            color={kind === "machine" ? "ink" : "blue"}
            className="absolute left-3 top-3"
          >
            {KIND_LABEL[kind]}
          </Badge>
        )}
        {/* The pending state sits on the card that was clicked, not on the page. */}
        <CardPending />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {/*
         * Both lines reserve their height whether or not they are filled, so
         * the price below them lands on the same baseline across the row.
         */}
        <h3
          className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-ink group-hover:text-accent"
          data-testid="product-title"
        >
          {product.title}
        </h3>

        <p className="line-clamp-1 min-h-[1.125rem] text-xs text-muted">
          {product.subtitle}
        </p>

        <SpecInline rows={specs} className="line-clamp-1 min-h-[1rem]" />

        <div className="mt-auto flex items-baseline gap-1.5 pt-2">
          {spansRange && <span className="text-2xs text-muted">from</span>}
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
