import { HttpTypes } from "@medusajs/types"

/**
 * The product's prose.
 *
 * Medusa stores it as plain text with blank lines between paragraphs, so it is
 * split rather than rendered with `whitespace-pre-line` — a wall of preformatted
 * text sets at the wrong measure and cannot be given paragraph spacing.
 */
const ProductDescription = ({
  product,
  className,
}: {
  product: HttpTypes.StoreProduct
  className?: string
}) => {
  const paragraphs = (product.description ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (!paragraphs.length) {
    return null
  }

  return (
    <div
      className={className}
      data-testid="product-description"
    >
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="max-w-prose text-base leading-7 text-muted">
          {paragraph}
        </p>
      ))}
    </div>
  )
}

export default ProductDescription
