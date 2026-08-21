import { productKind } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import MachineTemplate from "./machine"
import PartTemplate from "./part"
import ServiceTemplate from "./service"

/**
 * Three templates, chosen by `product.type`.
 *
 * A machine, a drive and an installation service are not the same kind of thing
 * and do not answer the same questions, so they do not share a layout. An
 * unset type falls through to the part template, which is the simplest one
 * that still shows a specification and a price.
 */
type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate = ({
  product,
  countryCode,
  images,
}: ProductTemplateProps) => {
  if (!product?.id) {
    return notFound()
  }

  switch (productKind(product)) {
    case "machine":
      return (
        <MachineTemplate
          product={product}
          countryCode={countryCode}
          images={images}
        />
      )
    case "service":
      return <ServiceTemplate product={product} />
    default:
      return (
        <PartTemplate
          product={product}
          countryCode={countryCode}
          images={images}
        />
      )
  }
}

export default ProductTemplate
