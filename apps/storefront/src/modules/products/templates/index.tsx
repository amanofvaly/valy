import { productKind } from "@lib/util/specs"
import { HttpTypes } from "@medusajs/types"
import { notFound } from "next/navigation"
import FlowTemplate from "./flow"
import MachineTemplate from "./machine"
import PartTemplate from "./part"
import ServiceTemplate from "./service"

/**
 * Four templates, chosen by `product.type` — and, for one of them, by metadata.
 *
 * A machine, a drive and an installation service are not the same kind of thing
 * and do not answer the same questions, so they do not share a layout. An
 * unset type falls through to the part template, which is the simplest one
 * that still shows a specification and a price.
 *
 * A configurable machine is checked for first, before the type switch, because
 * it is a machine that happens to be sold a different way rather than a fourth
 * kind of product.
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

  /*
   * One machine is configured rather than picked from a variant list, and it
   * gets its own template. The flag is on the product in Medusa rather than on
   * its handle, so a second configurable machine is a metadata field in admin
   * and not a code change here.
   */
  if (product.metadata?.["configurator"] === "flow") {
    return <FlowTemplate product={product} countryCode={countryCode} />
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
