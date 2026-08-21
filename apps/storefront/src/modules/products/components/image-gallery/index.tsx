import { HttpTypes } from "@medusajs/types"
import { ProductMetadata } from "@lib/util/specs"
import { SpecPlate } from "@modules/products/components/thumbnail"
import Image from "next/image"

/**
 * The product's photographs, or the plate that stands in for them.
 *
 * Which images arrive here depends on the configured variant — the `v_id`
 * search param drives `getImagesForVariant` on the server — so the gallery
 * shows the machine that is actually being configured rather than a generic
 * one.
 */
type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title?: string
  metadata?: ProductMetadata
}

const ImageGallery = ({ images, title, metadata }: ImageGalleryProps) => {
  if (!images.length) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line">
        <SpecPlate title={title} metadata={metadata} />
      </div>
    )
  }

  const [lead, ...rest] = images

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-line bg-surface"
        id={lead.id}
      >
        {!!lead.url && (
          <Image
            src={lead.url}
            priority
            alt={title ? `${title}` : "Product photograph"}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-center"
          />
        )}
      </div>

      {rest.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {rest.map((image, index) => (
            <li key={image.id}>
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-line bg-surface">
                {!!image.url && (
                  <Image
                    src={image.url}
                    alt={`${title ?? "Product"}, view ${index + 2}`}
                    fill
                    sizes="(max-width: 1024px) 33vw, 18vw"
                    className="object-cover object-center"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ImageGallery
